/*
 * MediaRecorder produces WebM blobs without a Duration element in the
 * Segment > Info section, so players and upload pipelines see an unknown /
 * infinite duration. This patches the duration in-place — the standard
 * "fix-webm-duration" technique (EBML parse → set Duration as a float,
 * normalize TimecodeScale to 1ms).
 *
 * EBML ids below have their leading length-marker bit stripped, because the
 * vint reader removes it (e.g. Segment 0x18538067 reads as 0x8538067).
 */

const ID_EBML = 0xa45dfa3;
const ID_SEGMENT = 0x8538067;
const ID_INFO = 0x549a966;
const ID_TIMECODE_SCALE = 0xad7b1;
const ID_DURATION = 0x489;

const CONTAINER_IDS = new Set([ID_EBML, ID_SEGMENT, ID_INFO]);

interface Section {
  id: number;
  data: WebmBase;
}

class WebmBase {
  source?: Uint8Array;

  updateBySource(): void {}
  updateByData(): void {}

  setSource(source: Uint8Array): void {
    this.source = source;
    this.updateBySource();
  }
}

class WebmUint extends WebmBase {
  data = "";

  updateBySource(): void {
    this.data = "";
    for (let i = 0; i < this.source!.length; i++) {
      const hex = this.source![i].toString(16);
      this.data += hex.length % 2 === 1 ? "0" + hex : hex;
    }
  }

  updateByData(): void {
    const length = this.data.length / 2;
    this.source = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      this.source[i] = parseInt(this.data.slice(i * 2, i * 2 + 2), 16);
    }
  }

  setValue(value: number): void {
    let hex = value.toString(16);
    if (hex.length % 2 === 1) hex = "0" + hex;
    this.data = hex;
    this.updateByData();
  }
}

class WebmFloat extends WebmBase {
  data = 0;

  private floatArrayType(): Float32ArrayConstructor | Float64ArrayConstructor {
    return this.source && this.source.length === 4 ? Float32Array : Float64Array;
  }

  updateBySource(): void {
    const bytes = this.source!.slice().reverse();
    this.data = new (this.floatArrayType())(bytes.buffer)[0];
  }

  updateByData(): void {
    const arr = new (this.floatArrayType())([this.data]);
    this.source = new Uint8Array(arr.buffer).reverse();
  }

  setValue(value: number): void {
    this.data = value;
    this.updateByData();
  }
}

class WebmContainer extends WebmBase {
  data: Section[] = [];
  private offset = 0;

  private readByte(): number {
    return this.source![this.offset++];
  }

  /* Reads an EBML variable-length integer, stripping the marker bit. */
  private readUint(): number {
    const firstByte = this.readByte();
    const extraBytes = 8 - firstByte.toString(2).length;
    let value = firstByte - (1 << (7 - extraBytes));
    for (let i = 0; i < extraBytes; i++) {
      value *= 256;
      value += this.readByte();
    }
    return value;
  }

  updateBySource(): void {
    this.data = [];
    let end = 0;
    for (this.offset = 0; this.offset < this.source!.length; this.offset = end) {
      const id = this.readUint();
      const len = this.readUint();
      end = Math.min(this.offset + len, this.source!.length);
      const bytes = this.source!.slice(this.offset, end);
      const section: WebmBase = CONTAINER_IDS.has(id)
        ? new WebmContainer()
        : id === ID_TIMECODE_SCALE
          ? new WebmUint()
          : id === ID_DURATION
            ? new WebmFloat()
            : new WebmBase();
      section.setSource(bytes);
      this.data.push({ id, data: section });
    }
  }

  private writeUint(x: number, draft: boolean): void {
    let bytes = 1;
    let flag = 0x80;
    while (x >= flag && bytes < 8) {
      bytes++;
      flag *= 0x80;
    }
    if (!draft) {
      let value = flag + x;
      for (let i = bytes - 1; i >= 0; i--) {
        const c = value % 256;
        this.source![this.offset + i] = c;
        value = (value - c) / 256;
      }
    }
    this.offset += bytes;
  }

  private writeSections(draft: boolean): number {
    this.offset = 0;
    for (const section of this.data) {
      const content = section.data.source!;
      this.writeUint(section.id, draft);
      this.writeUint(content.length, draft);
      if (!draft) this.source!.set(content, this.offset);
      this.offset += content.length;
    }
    return this.offset;
  }

  updateByData(): void {
    const length = this.writeSections(true);
    this.source = new Uint8Array(length);
    this.writeSections(false);
  }

  getSectionById(id: number): WebmBase | null {
    return this.data.find((s) => s.id === id)?.data ?? null;
  }
}

class WebmFile extends WebmContainer {
  constructor(source: Uint8Array) {
    super();
    this.setSource(source);
  }

  fixDuration(durationMs: number): boolean {
    const segment = this.getSectionById(ID_SEGMENT);
    if (!(segment instanceof WebmContainer)) return false;
    const info = segment.getSectionById(ID_INFO);
    if (!(info instanceof WebmContainer)) return false;
    const timeScale = info.getSectionById(ID_TIMECODE_SCALE);
    if (!(timeScale instanceof WebmUint)) return false;

    const existing = info.getSectionById(ID_DURATION);
    if (existing instanceof WebmFloat) {
      if (existing.data > 0) return false; // already has a valid duration
      existing.setValue(durationMs);
    } else {
      const duration = new WebmFloat();
      duration.setValue(durationMs);
      info.data.push({ id: ID_DURATION, data: duration });
    }

    // Duration is expressed in TimecodeScale units; pin the scale to 1ms.
    timeScale.setValue(1000000);
    info.updateByData();
    segment.updateByData();
    this.updateByData();
    return true;
  }
}

/**
 * Returns a new blob with correct duration metadata, or the original blob
 * unchanged if it isn't a patchable WebM (or already has a duration).
 */
export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  try {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const file = new WebmFile(bytes);
    if (file.fixDuration(Math.max(1, Math.round(durationMs)))) {
      return new Blob([file.source!.buffer as ArrayBuffer], { type: blob.type });
    }
  } catch {
    // Malformed input — fall through and keep the original recording.
  }
  return blob;
}
