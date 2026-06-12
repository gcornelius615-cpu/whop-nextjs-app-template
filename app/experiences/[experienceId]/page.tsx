"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ══ TYPES ══ */
interface Leg { p:string; g:string; s:string; o:string; c:number; lock:boolean; result:string; }
interface CardColors { a:string; b:string; s:string; f:string; }
interface SnapLib { toCanvas: (el: HTMLElement, opts: object) => Promise<HTMLCanvasElement>; }

/* ══ DATA ══ */
const SPORTS: Record<string, {e:string;l:string}> = {
  nfl:{e:"🏈",l:"NFL Football"},nba:{e:"🏀",l:"NBA Basketball"},mlb:{e:"⚾",l:"MLB Baseball"},
  nhl:{e:"🏒",l:"NHL Hockey"},ncaaf:{e:"🏈",l:"College Football"},ncaab:{e:"🏀",l:"College Hoops"},
  soccer:{e:"⚽",l:"Soccer"},mma:{e:"🥊",l:"MMA / UFC"},boxing:{e:"🥊",l:"Boxing"},
  golf:{e:"⛳",l:"Golf"},tennis:{e:"🎾",l:"Tennis"},f1:{e:"🏎️",l:"F1 Racing"},
  nascar:{e:"🏁",l:"NASCAR"},rugby:{e:"🏉",l:"Rugby"},volleyball:{e:"🏐",l:"Volleyball"},
  esports:{e:"🎮",l:"Esports"},cricket:{e:"🏏",l:"Cricket"},other:{e:"🎯",l:"Other"},
};

/* tw = target export width in px. Export scale = tw / w */
const VIDEO_FMTS = [
  {id:"9x16",n:"Vertical", sz:"1080×1920",pl:"TikTok · Reels · Shorts",w:432,h:768,r:20,tw:1080},
  {id:"4x5", n:"Portrait",  sz:"1080×1350",pl:"Instagram Feed",         w:432,h:540,r:16,tw:1080},
  {id:"1x1", n:"Square",    sz:"1080×1080",pl:"Instagram · Twitter",    w:480,h:480,r:16,tw:1080},
];
const IMAGE_FMTS = [
  {id:"9x16i",n:"Vertical", sz:"1080×1920",pl:"TikTok · IG Story",              w:432,h:768,r:20,tw:1080},
  {id:"1x1i", n:"Square",   sz:"1080×1080",pl:"Instagram · Twitter · Facebook", w:480,h:480,r:16,tw:1080},
  {id:"4x5i", n:"Portrait", sz:"1080×1350",pl:"Instagram Feed",                 w:432,h:540,r:16,tw:1080},
  {id:"16x9", n:"Landscape",sz:"1280×720", pl:"YouTube · Twitter",              w:640,h:360,r:12,tw:1280},
  {id:"2x3",  n:"Pinterest",sz:"1000×1500",pl:"Pinterest Pin",                  w:360,h:540,r:14,tw:1000},
];

const THEMES = [
  {n:"PostBlue",a:"#2F64EE",b:"#06080B",s:"#0D1420"},
  {n:"Volt",    a:"#C6FF3A",b:"#06080B",s:"#141920"},
  {n:"Fire",    a:"#FF6B35",b:"#0A0500",s:"#1A0E00"},
  {n:"Ice",     a:"#38BDF8",b:"#020B14",s:"#041828"},
  {n:"Gold",    a:"#FFD700",b:"#080600",s:"#161200"},
  {n:"Purple",  a:"#A855F7",b:"#060010",s:"#120020"},
  {n:"Crimson", a:"#FF3B3B",b:"#0A0000",s:"#1A0000"},
  {n:"Teal",    a:"#2DD4BF",b:"#00100E",s:"#001A17"},
  {n:"Rose",    a:"#FB7185",b:"#0A0005",s:"#150008"},
  {n:"Amber",   a:"#FBBF24",b:"#080500",s:"#140D00"},
  {n:"Lime",    a:"#84CC16",b:"#030800",s:"#081200"},
  {n:"Cyan",    a:"#06B6D4",b:"#00080A",s:"#001418"},
  {n:"Indigo",  a:"#6366F1",b:"#03020F",s:"#080618"},
  {n:"B&W",     a:"#FFFFFF",b:"#000000",s:"#111111"},
  {n:"Night",   a:"#818CF8",b:"#020817",s:"#0A0F28"},
  {n:"Forest",  a:"#4ADE80",b:"#020A04",s:"#071408"},
  {n:"Rust",    a:"#F97316",b:"#080200",s:"#150800"},
  {n:"Sky",     a:"#7DD3FC",b:"#020810",s:"#051020"},
  {n:"Pink",    a:"#F472B6",b:"#080004",s:"#140008"},
  {n:"Neon",    a:"#00F5FF",b:"#000A10",s:"#001520"},
];

const ANIMS = [
  {id:"smooth", l:"Smooth",  hold:420, fade:380},
  {id:"fast",   l:"Fast",    hold:200, fade:180},
  {id:"cinema", l:"Cinema",  hold:700, fade:550},
  {id:"instant",l:"Instant", hold:80,  fade:60},
];

const PATS = [
  {id:"none",l:"None"},{id:"hex",l:"Hex"},{id:"dots",l:"Dots"},
  {id:"dots_lg",l:"Dots LG"},{id:"lines",l:"Lines"},{id:"lines_v",l:"Lines V"},
  {id:"carbon",l:"Carbon"},{id:"weave",l:"Weave"},{id:"zigzag",l:"Zigzag"},
  {id:"triangle",l:"Triangle"},{id:"cross",l:"Cross"},{id:"grain",l:"Grain"},
];

const BRDS = [
  {id:"",l:"None"},{id:"thin",l:"Thin"},{id:"thick",l:"Thick"},
  {id:"glow",l:"Glow"},{id:"double",l:"Double"},{id:"neon",l:"Neon"},{id:"corner",l:"Corners"},
];

const DEFS: Leg[] = [
  {p:"Chiefs -3.5",      g:"KC vs LAC · Spread",  s:"nfl",   o:"-110",c:80,lock:false,result:""},
  {p:"LeBron Over 26.5", g:"LAL vs BOS · Prop",   s:"nba",   o:"-115",c:65,lock:false,result:""},
  {p:"Ohtani HR",        g:"LAD vs SF",            s:"mlb",   o:"+280",c:55,lock:true, result:""},
  {p:"Over 220.5",       g:"MIL vs PHX · Total",  s:"nba",   o:"-108",c:70,lock:false,result:""},
  {p:"Canelo KO/Dec",    g:"Canelo vs Benavidez", s:"boxing",o:"+160",c:60,lock:false,result:""},
  {p:"Man City ML",      g:"City vs Arsenal",      s:"soccer",o:"-130",c:75,lock:false,result:""},
  {p:"Mahomes 3+ TDs",   g:"KC vs DAL",            s:"nfl",   o:"+200",c:50,lock:false,result:""},
  {p:"Nuggets -5.5",     g:"DEN vs OKC",           s:"nba",   o:"-112",c:72,lock:false,result:""},
];

/* ══ HELPERS ══ */
function toDecimal(o:string):number {
  const n=parseFloat(o); if(isNaN(n)) return 1;
  return n>0?(n/100)+1:(100/Math.abs(n))+1;
}
function fmtOdds(raw:string,fmt:string):string {
  if(fmt==="decimal") return isNaN(parseFloat(raw))?raw:toDecimal(raw).toFixed(2);
  if(fmt==="fractional"){const d=toDecimal(raw)-1;if(d<=0)return raw;const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;const n=Math.round(d*100),dn=100,g=gcd(n,dn);return`${n/g}/${dn/g}`;}
  return raw;
}
function getTodayStr():string {
  const d=new Date();
  return ["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()]+" · "+["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()]+" "+d.getDate();
}
function hexAlpha(hex:string,a:number):string {
  const h = hex.replace("#","");
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  return`rgba(${r},${g},${b},${a})`;
}
function easeOutCubic(t:number):number { return 1-Math.pow(1-t,3); }

/* ══ UI COMPONENTS ══ */
function Btn({label,active,onClick,acc}:{label:string;active:boolean;onClick:()=>void;acc:string}) {
  return (
    <button onClick={onClick} style={{
      padding:"7px 13px",
      background:active?hexAlpha(acc,0.12):"#0d0f14",
      border:`1px solid ${active?acc:"rgba(255,255,255,.07)"}`,
      borderRadius:7,color:active?acc:"#8a93a5",
      fontFamily:"Oswald,sans-serif",fontSize:10,letterSpacing:1,
      textTransform:"uppercase" as const,cursor:"pointer",transition:"all .15s",
    }}>{label}</button>
  );
}
function Fld({label,children}:{label:string;children:React.ReactNode}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <label style={{fontSize:9,color:"#8a93a5",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:3}}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle:React.CSSProperties = {
  background:"#0d0f14",border:"1px solid rgba(255,255,255,.07)",borderRadius:7,
  color:"#f0f2f0",padding:"7px 9px",fontSize:11,
  fontFamily:"Oswald,sans-serif",outline:"none",width:"100%",
};
const selStyle:React.CSSProperties = {...inputStyle};
function Sec({title,children}:{title:string;children:React.ReactNode}) {
  return (
    <div style={{background:"#15181e",border:"1px solid rgba(255,255,255,.055)",borderRadius:13,padding:"16px 18px"}}>
      <div style={{fontSize:9,letterSpacing:3,color:"#8a93a5",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
        {title}<div style={{flex:1,height:1,background:"rgba(255,255,255,.04)"}}/>
      </div>
      {children}
    </div>
  );
}

/* ══ MAIN ══ */
export default function ParlayBuilder() {
  const [outputMode, setOutputMode] = useState<"video"|"image">("video");
  const [currentFmt, setCurrentFmt] = useState(VIDEO_FMTS[0]);
  const [betType, setBetType] = useState<"parlay"|"single">("parlay");
  const [legCount, setLegCount] = useState(5);
  const [legs, setLegs] = useState<Leg[]>(DEFS.slice(0,5));
  const [animId, setAnimId] = useState("smooth");
  const [C, setC] = useState<CardColors>({a:"#2F64EE",b:"#06080B",s:"#0D1420",f:"#F4F7F2"});
  const [recentAccents, setRecentAccents] = useState<string[]>([]);
  const [currentBrdId, setCurrentBrdId] = useState("");
  const [currentPatId, setCurrentPatId] = useState("none");
  const [cleanMode, setCleanMode] = useState(false);
  const [dlMsg, setDlMsg] = useState("");
  const [dlBusy, setDlBusy] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [showConf, setShowConf] = useState(false);
  const [oddsFmt, setOddsFmt] = useState("american");
  const [payoutMode, setPayoutMode] = useState("towin");
  const [useCd, setUseCd] = useState(false);
  const [useConf, setUseConf] = useState(false);
  const [useLoop, setUseLoop] = useState(false);
  const [bgImgSrc, setBgImgSrc] = useState<string|null>(null);
  const [bgImgOp, setBgImgOp] = useState(60);
  const [brand, setBrand] = useState("@YourPage");
  const [stake, setStake] = useState(10);
  const [titleText, setTitleText] = useState("TODAY'S");
  const [accWord, setAccWord] = useState("BEST");
  const [dateText, setDateText] = useState("");
  const [subtitle, setSubtitle] = useState("AI-SELECTED · $10 STAKE");
  const [record, setRecord] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [logoSrc, setLogoSrc] = useState<string|null>(null);
  const [sbSport, setSbSport] = useState("nfl");
  const [sbPick, setSbPick] = useState("Chiefs -3.5");
  const [sbGame, setSbGame] = useState("KC vs LAC · Spread");
  const [sbOdds, setSbOdds] = useState("-110");
  const [displayOdds, setDisplayOdds] = useState("+000");
  const [displayPayout, setDisplayPayout] = useState("$0");
  const [displayStake, setDisplayStake] = useState("$10");

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loopRef   = useRef<ReturnType<typeof setTimeout>|null>(null);
  const stageRef  = useRef<HTMLDivElement>(null);

  /* ── COMPUTE ── */
  const compute = useCallback(()=>{
    if(betType==="single"){
      const dec=toDecimal(sbOdds),profit=(stake*dec)-stake,total=stake*dec;
      const payVal=payoutMode==="total"?total:profit;
      const am=dec>=2?`+${Math.round((dec-1)*100)}`:`${Math.round(-100/(dec-1))}`;
      setDisplayOdds(am);setDisplayPayout(`$${payVal.toFixed(0)}`);setDisplayStake(`$${stake}`);return;
    }
    let dec=1; legs.forEach(l=>{dec*=toDecimal(l.o);});
    const profit=(stake*dec)-stake,total=stake*dec;
    const payVal=payoutMode==="total"?total:profit;
    const am=dec>=2?`+${Math.round((dec-1)*100)}`:`${Math.round(-100/(dec-1))}`;
    setDisplayOdds(am);setDisplayPayout(`$${payVal.toFixed(0)}`);setDisplayStake(`$${stake}`);
  },[betType,legs,stake,payoutMode,sbOdds]);
  useEffect(()=>{compute();},[compute]);

  /* ── THEME ── */
  const applyTheme = useCallback((colors:CardColors)=>{
    const st=stageRef.current; if(!st) return;
    // Elevated leg surface: surface color lightened toward white, slightly translucent
    const lighten=(hex:string,f:number,alpha:number)=>{
      const h=hex.replace("#","");
      const r=Math.round(parseInt(h.slice(0,2),16)+(255-parseInt(h.slice(0,2),16))*f);
      const g=Math.round(parseInt(h.slice(2,4),16)+(255-parseInt(h.slice(2,4),16))*f);
      const b=Math.round(parseInt(h.slice(4,6),16)+(255-parseInt(h.slice(4,6),16))*f);
      return`rgba(${r},${g},${b},${alpha})`;
    };
    st.style.setProperty("--acc",        colors.a);
    st.style.setProperty("--acc-soft",   hexAlpha(colors.a,0.18));
    st.style.setProperty("--acc-mid",    hexAlpha(colors.a,0.35));
    st.style.setProperty("--bg",         colors.b);
    st.style.setProperty("--card2",      colors.s);
    st.style.setProperty("--card2-soft", hexAlpha(colors.s,0.92));
    st.style.setProperty("--leg-bg",     lighten(colors.s,0.10,0.72));
    st.style.setProperty("--ink",        colors.f);
    st.style.setProperty("--muted",      "#8a93a5");
    st.style.setProperty("--line",       "rgba(255,255,255,.09)");
    const base=st.querySelector<HTMLElement>("#s-base");
    if(base&&!base.dataset.bgSrc) base.style.backgroundColor=colors.b;
  },[]);
  useEffect(()=>{applyTheme(C);},[C,applyTheme]);

  /* ── FORMAT ── */
  const applyFormat = useCallback((fmt:typeof VIDEO_FMTS[0])=>{
    setCurrentFmt(fmt);
    const st=stageRef.current; if(!st) return;
    st.style.width=`${fmt.w}px`; st.style.height=`${fmt.h}px`; st.style.borderRadius=`${fmt.r}px`;
    const frame=st.querySelector<HTMLElement>("#s-frame");
    if(frame){const pH=Math.round(fmt.h*.034),pW=Math.round(fmt.w*.051);frame.style.padding=`${pH}px ${pW}px ${Math.round(pH*.7)}px`;}
  },[]);
  useEffect(()=>{applyFormat(currentFmt);},[currentFmt,applyFormat]);

  /* ── BG IMAGE ── */
  useEffect(()=>{
    const base=stageRef.current?.querySelector<HTMLElement>("#s-base"); if(!base) return;
    if(bgImgSrc){
      base.dataset.bgSrc="1";
      base.style.backgroundColor=C.b;
      base.style.backgroundImage=`url("${bgImgSrc}")`;
      base.style.backgroundSize="cover";
      base.style.backgroundPosition="center";
      base.style.opacity=String(bgImgOp/100);
    } else {
      delete base.dataset.bgSrc;
      base.style.backgroundColor=C.b;
      base.style.backgroundImage="";
      base.style.opacity="1";
    }
  },[bgImgSrc,bgImgOp,C.b]);

  /* ── PATTERN ── */
  useEffect(()=>{
    const st=stageRef.current; if(!st) return;
    const pl=st.querySelector<HTMLElement>("#s-pat");
    const gl=st.querySelector<HTMLElement>("#s-grain");
    if(!pl||!gl) return;
    pl.style.display="none"; gl.style.display="none";
    pl.style.backgroundImage=""; pl.style.backgroundSize=""; pl.style.opacity="";
    if(currentPatId==="none") return;
    if(currentPatId==="grain"){gl.style.display="block";gl.style.opacity=".09";return;}
    pl.style.display="block";
    const cfgs:Record<string,{img:string;sz?:string;op:number}> = {
      hex:     {img:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='48'%3E%3Cpolygon points='14,2 26,9 26,23 14,30 2,23 2,9' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,sz:"28px 48px",op:.07},
      dots:    {img:"radial-gradient(circle,rgba(255,255,255,1) 1.5px,transparent 1.5px)",sz:"18px 18px",op:.09},
      dots_lg: {img:"radial-gradient(circle,rgba(255,255,255,1) 3px,transparent 3px)",sz:"32px 32px",op:.07},
      lines:   {img:"repeating-linear-gradient(45deg,rgba(255,255,255,1) 0,rgba(255,255,255,1) 1px,transparent 1px,transparent 14px)",op:.06},
      lines_v: {img:"repeating-linear-gradient(90deg,rgba(255,255,255,1) 0,rgba(255,255,255,1) 1px,transparent 1px,transparent 20px)",op:.06},
      carbon:  {img:"repeating-linear-gradient(0deg,rgba(255,255,255,.7) 0,rgba(255,255,255,.7) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(90deg,rgba(255,255,255,.7) 0,rgba(255,255,255,.7) 1px,transparent 1px,transparent 4px)",op:.07},
      weave:   {img:"repeating-linear-gradient(45deg,rgba(255,255,255,.6) 0,rgba(255,255,255,.6) 1px,transparent 1px,transparent 8px),repeating-linear-gradient(-45deg,rgba(255,255,255,.6) 0,rgba(255,255,255,.6) 1px,transparent 1px,transparent 8px)",op:.07},
      zigzag:  {img:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='10'%3E%3Cpolyline points='0,10 10,0 20,10' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,sz:"20px 10px",op:.07},
      triangle:{img:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpolygon points='12,2 22,22 2,22' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,sz:"24px 24px",op:.07},
      cross:   {img:"repeating-linear-gradient(0deg,rgba(255,255,255,1) 0,rgba(255,255,255,1) 1px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,rgba(255,255,255,1) 0,rgba(255,255,255,1) 1px,transparent 1px,transparent 20px)",op:.06},
    };
    const c=cfgs[currentPatId]; if(!c) return;
    pl.style.backgroundImage=c.img;
    if(c.sz) pl.style.backgroundSize=c.sz;
    pl.style.opacity=String(c.op);
  },[currentPatId]);

  /* ── BORDER ── */
  useEffect(()=>{
    const st=stageRef.current; if(!st) return;
    const bl=st.querySelector<HTMLElement>("#s-brd"); if(!bl) return;
    bl.style.boxShadow="";
    st.classList.remove("brd-glow-anim");
    st.style.removeProperty("--glow-color");
    const acc=C.a;
    if     (currentBrdId==="thin")   bl.style.boxShadow=`inset 0 0 0 1px ${hexAlpha(acc,.4)}`;
    else if(currentBrdId==="thick")  bl.style.boxShadow=`inset 0 0 0 3px ${hexAlpha(acc,.6)}`;
    else if(currentBrdId==="glow")   {bl.style.boxShadow=`inset 0 0 0 2px ${acc}`;st.style.setProperty("--glow-color",hexAlpha(acc,.4));st.classList.add("brd-glow-anim");}
    else if(currentBrdId==="double") bl.style.boxShadow=`inset 0 0 0 1px ${hexAlpha(acc,.7)},inset 0 0 0 5px ${hexAlpha(acc,.12)}`;
    else if(currentBrdId==="neon")   bl.style.boxShadow=`inset 0 0 0 2px ${acc}, 0 0 24px ${hexAlpha(acc,.5)}, 0 0 60px ${hexAlpha(acc,.2)}`;
    else if(currentBrdId==="corner") bl.style.boxShadow=[`inset 18px 18px 0 -15px ${acc}`,`inset -18px 18px 0 -15px ${acc}`,`inset 18px -18px 0 -15px ${acc}`,`inset -18px -18px 0 -15px ${acc}`].join(",");
  },[currentBrdId,C.a]);

  /* ── LIVE ANIMATION ── */
  const fireConfetti = useCallback(()=>{
    const layer=stageRef.current?.querySelector<HTMLElement>("#s-conf"); if(!layer) return;
    layer.innerHTML="";
    const colors=[C.a,"#fff","#FFD700","#FF6B35",C.a];
    for(let i=0;i<35;i++){
      const p=document.createElement("div");
      const x=Math.random()*currentFmt.w,sz=6+Math.random()*6;
      p.style.cssText=`position:absolute;left:${x}px;top:-10px;width:${sz}px;height:${sz}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>.5?"50%":"2px"};`;
      layer.appendChild(p);
      const dur=1.2+Math.random()*.8,endX=x+(Math.random()-.5)*120;
      p.animate([{opacity:1,transform:"translate(0,0) rotate(0deg)"},{opacity:0,transform:`translate(${endX-x}px,${currentFmt.h+50}px) rotate(${Math.random()*720}deg)`}],
        {duration:dur*1000,easing:"cubic-bezier(0.25,0.46,0.45,0.94)",fill:"forwards"});
    }
    setTimeout(()=>{if(layer)layer.innerHTML="";},2500);
  },[C.a,currentFmt]);

  const playAnim = useCallback(()=>{
    if(loopRef.current){clearTimeout(loopRef.current);loopRef.current=null;}
    timersRef.current.forEach(clearTimeout); timersRef.current=[];
    const legEls=stageRef.current?.querySelectorAll<HTMLElement>("#e-legs .leg");
    const bar=stageRef.current?.querySelector<HTMLElement>("#e-prog");
    if(!legEls||!bar) return;
    bar.style.transition="none"; bar.style.width="0%";
    legEls.forEach(l=>{l.classList.remove("vis");l.style.transition="none";});
    const cfg=ANIMS.find(a=>a.id===animId)||ANIMS[0];
    const total=150+(legEls.length*(cfg.hold))+400;
    legEls.forEach((l,i)=>{
      l.style.transition=`opacity ${cfg.fade/1000}s,transform ${cfg.fade/1000}s`;
      const t=setTimeout(()=>{
        l.classList.add("vis");
        bar.style.transition="width .4s ease";
        bar.style.width=`${((i+1)/legEls.length)*100}%`;
      },150+(i*cfg.hold));
      timersRef.current.push(t);
    });
    if(useConf) timersRef.current.push(setTimeout(()=>fireConfetti(),total));
    if(useLoop) loopRef.current=setTimeout(()=>playAnim(),total+2000);
  },[animId,useConf,useLoop,fireConfetti]);

  const runCountdown = useCallback(()=>{
    const ov=stageRef.current?.querySelector<HTMLElement>("#s-cd");
    const num=stageRef.current?.querySelector<HTMLElement>("#s-cdn");
    if(!ov||!num) return;
    ov.classList.add("active"); let n=3;
    const tick=()=>{
      num.textContent=String(n); num.classList.remove("show");
      requestAnimationFrame(()=>requestAnimationFrame(()=>num.classList.add("show")));
      if(n===0){setTimeout(()=>{ov.classList.remove("active");playAnim();},400);}
      else{n--;setTimeout(tick,800);}
    };
    tick();
  },[playAnim]);

  const startPlay = useCallback(()=>{
    if(outputMode==="image"){
      stageRef.current?.querySelectorAll<HTMLElement>("#e-legs .leg").forEach(l=>{
        l.classList.add("vis");l.style.transition="none";
      });
      const bar=stageRef.current?.querySelector<HTMLElement>("#e-prog");
      if(bar){bar.style.transition="none";bar.style.width="100%";}
      return;
    }
    if(useCd) runCountdown(); else playAnim();
  },[outputMode,useCd,runCountdown,playAnim]);

  useEffect(()=>{const t=setTimeout(()=>startPlay(),700);return()=>clearTimeout(t);},[]);// eslint-disable-line

  useEffect(()=>{
    setLegs(prev=>{
      const next=[...prev];
      while(next.length<legCount) next.push(DEFS[next.length]||{p:"",g:"",s:"nfl",o:"-110",c:50,lock:false,result:""});
      return next.slice(0,legCount);
    });
  },[legCount]);

  /* ── DENSITY: scale leg padding/gaps down as leg count grows so 8 legs fit ── */
  useEffect(()=>{
    const st=stageRef.current; if(!st) return;
    const legsWrap=st.querySelector<HTMLElement>("#e-legs");
    if(!legsWrap) return;
    const n = betType==="single" ? 1 : legCount;
    // Interpolate sizing between roomy (2 legs) and tight (8 legs)
    const t = Math.min(Math.max((n-2)/6,0),1); // 0 at 2 legs, 1 at 8 legs
    const lerp=(a:number,b:number)=>a+(b-a)*t;
    const gap=lerp(6,3);
    const padV=lerp(8,4), padH=lerp(11,9);
    const iconSz=lerp(28,22);
    const pickSz=lerp(13,10.5);
    const metaSz=lerp(9.5,8);
    const oddsSz=lerp(14,11.5);
    legsWrap.style.gap=`${gap}px`;
    legsWrap.querySelectorAll<HTMLElement>(".leg").forEach(l=>{
      l.style.padding=`${padV}px ${padH}px`;
    });
    legsWrap.querySelectorAll<HTMLElement>(".l-icon").forEach(ic=>{
      ic.style.width=`${iconSz}px`; ic.style.height=`${iconSz}px`;
      ic.style.fontSize=`${iconSz*0.54}px`; ic.style.lineHeight=`${iconSz}px`;
    });
    legsWrap.querySelectorAll<HTMLElement>(".l-pick").forEach(p=>{p.style.fontSize=`${pickSz}px`;});
    legsWrap.querySelectorAll<HTMLElement>(".l-meta").forEach(m=>{m.style.fontSize=`${metaSz}px`;});
    legsWrap.querySelectorAll<HTMLElement>(".l-odds").forEach(o=>{o.style.fontSize=`${oddsSz}px`;});
  const fit=()=>{const avail=legsWrap.clientHeight,need=legsWrap.scrollHeight;if(need>avail&&avail>0){const k=Math.max(avail/need,0.55);legsWrap.style.gap=`${gap*k}px`;legsWrap.querySelectorAll<HTMLElement>(".leg").forEach(l=>{l.style.padding=`${padV*k}px ${padH*k}px`;});legsWrap.querySelectorAll<HTMLElement>(".l-icon").forEach(ic=>{const s=iconSz*k;ic.style.width=`${s}px`;ic.style.height=`${s}px`;ic.style.fontSize=`${s*0.54}px`;ic.style.lineHeight=`${s}px`;});legsWrap.querySelectorAll<HTMLElement>(".l-pick").forEach(x=>{x.style.fontSize=`${pickSz*k}px`;});legsWrap.querySelectorAll<HTMLElement>(".l-meta").forEach(x=>{x.style.fontSize=`${metaSz*k}px`;});legsWrap.querySelectorAll<HTMLElement>(".l-odds").forEach(x=>{x.style.fontSize=`${oddsSz*k}px`;});}};const fitRaf=requestAnimationFrame(fit);return()=>cancelAnimationFrame(fitRaf);},[legCount,betType,legs,currentFmt,outputMode]);

  useEffect(()=>{setSubtitle(prev=>/\$\d+(\.\d+)?\s*STAKE/i.test(prev)?prev.replace(/\$\d+(\.\d+)?\s*STAKE/i,`$${stake} STAKE`):prev);},[stake]); const pushRecent=(c:string)=>{
    if(!c||c.length!==7) return;
    setRecentAccents(prev=>[c,...prev.filter(x=>x!==c)].slice(0,6));
  };

  /* ── SNAPSHOT LIBRARY (html-to-image: uses the browser's real renderer) ── */
  useEffect(()=>{
    if(document.querySelector('script[data-snaplib]')) return;
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js";
    s.async=true; s.dataset.snaplib="1";
    document.head.appendChild(s);
  },[]);

  const getSnapLib=():Promise<SnapLib>=>new Promise((resolve,reject)=>{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w=window as any;
    if(w.htmlToImage){resolve(w.htmlToImage);return;}
    let tries=0;
    const t=setInterval(()=>{
      tries++;
      if(w.htmlToImage){clearInterval(t);resolve(w.htmlToImage);}
      else if(tries>60){clearInterval(t);reject(new Error("snapshot library timeout"));}
    },100);
  });

  /* ── Capture stage with N legs visible — pixel-perfect via browser rendering ── */
  const captureState = async (lib:SnapLib, visibleLegs:number, scale:number):Promise<HTMLCanvasElement> => {
    const st=stageRef.current!;
    const legEls=st.querySelectorAll<HTMLElement>("#e-legs .leg");
    const bar=st.querySelector<HTMLElement>("#e-prog");
    legEls.forEach((l,i)=>{
      l.style.transition="none";
      if(i<visibleLegs){l.classList.add("vis");} else {l.classList.remove("vis");}
    });
    if(bar){bar.style.transition="none";bar.style.width=legEls.length>0?`${(visibleLegs/legEls.length)*100}%`:"100%";}
    await new Promise(r=>setTimeout(r,50));
    return lib.toCanvas(st,{
      pixelRatio: scale,
      backgroundColor: C.b,
      cacheBust: false,
    });
  };

  /* ── DOWNLOAD ── */
  const doDownload=async()=>{
    setDlBusy(true);
    setDlProgress(0);
    const scale=currentFmt.tw/currentFmt.w;

    if(outputMode==="image"){
      setDlMsg("Generating PNG...");
      try{
        const lib=await getSnapLib();
        const legEls=stageRef.current!.querySelectorAll<HTMLElement>("#e-legs .leg");
        // Warm-up render (first render embeds fonts; second is clean)
        await captureState(lib, legEls.length, scale);
        const canvas=await captureState(lib, legEls.length, scale);
        const a=document.createElement("a");
        a.download=`postlabs-picks-${currentFmt.id}.png`;
        a.href=canvas.toDataURL("image/png"); a.click();
        setDlMsg("✓ PNG downloaded!");
      }catch(e){
        setDlMsg("Error generating PNG — try again.");
        console.error(e);
      }
      setDlBusy(false);
      setTimeout(()=>setDlMsg(""),4000);
      return;
    }

    /* VIDEO: pre-render snapshots, then smooth 30fps canvas playback while recording */
    try{
      const lib=await getSnapLib();
      const legEls=stageRef.current!.querySelectorAll<HTMLElement>("#e-legs .leg");
      const nLegs=legEls.length;
      const cfg=ANIMS.find(a=>a.id===animId)||ANIMS[0];

      // Warm-up to embed fonts before real captures
      setDlMsg("Preparing...");
      await captureState(lib,0,scale);

      const frames:HTMLCanvasElement[]=[];
      for(let i=0;i<=nLegs;i++){
        setDlMsg(`Rendering frame ${i+1}/${nLegs+1}...`);
        setDlProgress(Math.round(((i+1)/(nLegs+1))*50));
        frames.push(await captureState(lib,i,scale));
      }

      legEls.forEach(l=>l.classList.add("vis"));
      const bar=stageRef.current!.querySelector<HTMLElement>("#e-prog");
      if(bar) bar.style.width="100%";

      setDlMsg("Recording video...");

      const W=frames[0].width, H=frames[0].height;
      const canvas=document.createElement("canvas");
      canvas.width=W; canvas.height=H;
      const ctx=canvas.getContext("2d")!;

      const stream=canvas.captureStream(30);
      const mp4Type=["video/mp4;codecs=avc1.640028","video/mp4"].find(t=>MediaRecorder.isTypeSupported(t));const mimeType=mp4Type||(MediaRecorder.isTypeSupported("video/webm;codecs=vp8")?"video/webm;codecs=vp8":"video/webm");const fileExt=mp4Type?"mp4":"webm";
      const rec=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:10000000});
      const chunks:Blob[]=[];
      rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
      const recorded:Promise<Blob> = new Promise(res=>{rec.onstop=()=>res(new Blob(chunks,{type:mimeType.split(";")[0]}));});
      rec.start(100);

      const acc=C.a;

      const drawCountdownFrame=(num:number,t:number)=>{
        ctx.drawImage(frames[0],0,0);
        ctx.fillStyle="rgba(0,0,0,0.75)";
        ctx.fillRect(0,0,W,H);
        const sc=1.5-(0.5*easeOutCubic(Math.min(t*3,1)));
        const alpha=Math.min(t*4,1);
        ctx.save();
        ctx.globalAlpha=alpha;
        ctx.translate(W/2,H/2);
        ctx.scale(sc,sc);
        ctx.fillStyle=acc;
        ctx.font=`${Math.round(W*0.3)}px Anton, sans-serif`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(String(num),0,0);
        ctx.restore();
      };

      interface CP { x:number;y:number;vx:number;vy:number;sz:number;color:string;rot:number;vr:number; }
      let confetti:CP[]=[];
      const initConfetti=()=>{
        const colors=[acc,"#ffffff","#FFD700","#FF6B35"];
        confetti=Array.from({length:40},()=>({
          x:Math.random()*W, y:-20-Math.random()*60,
          vx:(Math.random()-.5)*2.5, vy:2+Math.random()*4,
          sz:(6+Math.random()*8)*(W/1080),
          color:colors[Math.floor(Math.random()*colors.length)],
          rot:Math.random()*Math.PI, vr:(Math.random()-.5)*.2,
        }));
      };
      const drawConfetti=()=>{
        confetti.forEach(p=>{
          p.x+=p.vx*(W/432); p.y+=p.vy*(H/768); p.rot+=p.vr;
          ctx.save();
          ctx.translate(p.x,p.y); ctx.rotate(p.rot);
          ctx.fillStyle=p.color;
          ctx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz);
          ctx.restore();
        });
      };

      type Seg = {dur:number; draw:(t:number)=>void};
      const segs:Seg[]=[];
      if(useCd){[3,2,1].forEach(n=>{segs.push({dur:800,draw:t=>drawCountdownFrame(n,t)});});}
      segs.push({dur:300,draw:()=>{ctx.drawImage(frames[0],0,0);}});
      for(let i=0;i<nLegs;i++){
        const from=frames[i],to=frames[i+1];
        segs.push({dur:cfg.fade,draw:t=>{
          ctx.drawImage(from,0,0);
          ctx.save(); ctx.globalAlpha=easeOutCubic(t); ctx.drawImage(to,0,0); ctx.restore();
        }});
        segs.push({dur:cfg.hold,draw:()=>{ctx.drawImage(to,0,0);}});
      }
      const finalFrame=frames[nLegs];
      if(useConf){
        let confInit=false;
        segs.push({dur:1800,draw:()=>{
          if(!confInit){initConfetti();confInit=true;}
          ctx.drawImage(finalFrame,0,0);
          drawConfetti();
        }});
      }
      segs.push({dur:1200,draw:()=>{ctx.drawImage(finalFrame,0,0);}});

      const totalDur=segs.reduce((s,x)=>s+x.dur,0);

      await new Promise<void>(resolve=>{
        const t0=performance.now();let lastProg=-1;
        const frame=()=>{
          const elapsed=performance.now()-t0;
          const pg=50+Math.round((Math.min(elapsed/totalDur,1))*50);if(pg!==lastProg){lastProg=pg;if(pg%2===0)setDlProgress(pg);}
          let acc2=0, done=true;
          for(const seg of segs){
            if(elapsed<acc2+seg.dur){
              seg.draw((elapsed-acc2)/seg.dur);
              done=false; break;
            }
            acc2+=seg.dur;
          }
          if(done){resolve();return;}
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });

      rec.stop();
      const blob=await recorded;
      const a=document.createElement("a");
      a.download=`postlabs-picks-${currentFmt.id}.${fileExt}`;
      a.href=URL.createObjectURL(blob); a.click();
      setDlMsg("✓ Video downloaded!");
    }catch(e){
      setDlMsg("Video failed — try again.");
      console.error(e);
    }
    setDlBusy(false);
    setDlProgress(0);
    setTimeout(()=>setDlMsg(""),5000);
  };

  /* ── RENDER LEGS ── */
  const renderLegs=()=>{
    if(betType==="single"){
      const sp=SPORTS[sbSport]||SPORTS.other;
      return(
        <div className={`leg ${outputMode==="image"?"vis":""}`} style={{padding:"14px",borderRadius:12,gap:12,maxHeight:96}}>
          <div className="l-icon" style={{width:40,height:40,fontSize:22,lineHeight:"40px",borderRadius:10}}>{sp.e}</div>
          <div className="l-body">
            <div className="l-pick" style={{fontSize:16}}>{sbPick||"—"}</div>
            <div className="l-meta" style={{fontSize:11}}>{sbGame||"—"}</div>
          </div>
          <div className="l-odds" style={{fontSize:20}}>{fmtOdds(sbOdds,oddsFmt)}</div>
        </div>
      );
    }
    return legs.map((l,i)=>{
      const sp=SPORTS[l.s]||SPORTS.other;
      return(
        <div key={i} className={`leg ${outputMode==="image"?"vis":""} ${l.result?`res-${l.result}`:""}`}>
          <div className="l-icon">{sp.e}</div>
          <div className="l-body">
            <div className="l-pick">{l.lock?"🔒 ":""}{l.p||"—"}</div>
            <div className="l-meta">{l.g||"—"}</div>
            {showConf&&<div className="l-conf-bar"><div className="l-conf-fill" style={{width:`${l.c}%`}}/></div>}
          </div>
          <div className="l-odds">{fmtOdds(l.o,oddsFmt)}</div>
          {l.result==="win"&&<span className="l-res-badge">✅</span>}
          {l.result==="loss"&&<span className="l-res-badge">❌</span>}
          {l.result==="push"&&<span className="l-res-badge">↩</span>}
        </div>
      );
    });
  };

  const panelStyle:React.CSSProperties = {
    width:"100%",maxWidth:860,
    display:cleanMode?"none":"flex",
    flexDirection:"column",gap:14,
  };

  /* ── RENDER ── */
  return(
    <div style={{background:"#0c0e12",fontFamily:"Oswald,sans-serif",color:"#f0f2f0",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 12px 100px",gap:24}}>

      <div style={{width:"100%",maxWidth:1040,display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:12,borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        <div>
          <span style={{fontFamily:"Anton,sans-serif",fontSize:18,color:"#fff",letterSpacing:2}}>Post</span>
          <span style={{fontFamily:"Anton,sans-serif",fontSize:18,color:C.a,letterSpacing:2}}>Labs</span>
          <span style={{fontFamily:"Oswald,sans-serif",fontSize:11,color:"#8a93a5",letterSpacing:3,marginLeft:10,textTransform:"uppercase"}}>Picks</span>
        </div>
        <div style={{fontSize:9,color:"#4a5060",letterSpacing:2,textTransform:"uppercase"}}>v1.2 · PostLabs</div>
      </div>

      <div style={{display:"flex",gap:24,alignItems:"flex-start",width:"100%",maxWidth:1040,flexWrap:"wrap",justifyContent:"center"}}>

        {/* ══ STAGE ══ */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{fontSize:9,letterSpacing:3,color:"#8a93a5",textTransform:"uppercase",textAlign:"center"}}>{currentFmt.pl} — {currentFmt.sz}</div>
          <div id="stage" ref={stageRef} style={{
            width:currentFmt.w,height:currentFmt.h,borderRadius:currentFmt.r,
            boxShadow:"0 40px 100px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.05)",
          }}>
            <div id="s-base"/>
            <div id="s-over"/>
            <div id="s-pat"/>
            <div id="s-grain"/>
            <div id="s-brd"/>
            <div id="s-conf"/>
            <div id="s-cd"><div id="s-cdn">3</div></div>
            <div id="s-frame">
              <div className="cc-head">
                <span className="cc-brand">{brand}</span>
                <div className="cc-hr">
                  <span className="cc-date">{dateText||getTodayStr()}</span>
                  {record&&<span className="cc-rec">{record}</span>}
                  {logoSrc&&<img className="cc-logo" src={logoSrc} alt=""/>}
                </div>
              </div>
              <div className="cc-type">{betType==="single"?"SINGLE BET":`${legCount}-LEG PARLAY`}</div>
              <div className="cc-title">{titleText}<br/><span className="acc">{accWord}</span> CARD</div>
              <div className="cc-sub">{subtitle}</div>
              {hashtag&&<div className="cc-hash">{hashtag}</div>}
              <div className="cc-div"/>
              <div className="cc-legs" id="e-legs" style={{justifyContent:"flex-start"}}>{renderLegs()}</div>
              <div className="cc-prog-wrap"><div className="cc-prog" id="e-prog"/></div>
              <div className="cc-stats">
                <div className="cc-stat"><div className="cc-slbl">Stake</div><div className="cc-sval">{displayStake}</div></div>
                <div className="cc-stat"><div className="cc-slbl">Odds</div><div className="cc-sval hi">{displayOdds}</div></div>
                <div className="cc-stat"><div className="cc-slbl">{payoutMode==="total"?"Total Return":"To Win"}</div><div className="cc-sval hi">{displayPayout}</div></div>
              </div>
              <div className="cc-btag">
                <div className="cc-dot"/><span>Not financial advice · Bet responsibly</span><div className="cc-dot"/>
              </div>
            </div>
          </div>
        </div>

        {/* ══ PANEL ══ */}
        <div style={panelStyle}>

          <Sec title="Output Type">
            <div style={{display:"flex",background:"#0d0f14",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,overflow:"hidden",marginBottom:14}}>
              {["video","image"].map(m=>(
                <button key={m} onClick={()=>{setOutputMode(m as "video"|"image");if(m==="image")setTimeout(startPlay,50);}}
                  style={{flex:1,padding:10,fontFamily:"Oswald,sans-serif",fontSize:11,letterSpacing:2,textTransform:"uppercase",border:"none",background:outputMode===m?C.a:"transparent",color:outputMode===m?"#06080B":"#8a93a5",cursor:"pointer",transition:"all .2s"}}>
                  {m==="video"?"▶ Video":"⬜ Static Image"}
                </button>
              ))}
            </div>
            <div style={{fontSize:9,letterSpacing:3,color:"#8a93a5",textTransform:"uppercase",marginBottom:8}}>Platform & Format</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {(outputMode==="video"?VIDEO_FMTS:IMAGE_FMTS).map(f=>(
                <button key={f.id} onClick={()=>applyFormat(f)}
                  style={{background:currentFmt.id===f.id?hexAlpha(C.a,0.12):"#0d0f14",border:`1px solid ${currentFmt.id===f.id?C.a:"rgba(255,255,255,.07)"}`,borderRadius:9,padding:"9px 13px",cursor:"pointer",display:"flex",flexDirection:"column",gap:2,textAlign:"left",transition:"all .15s"}}>
                  <span style={{fontFamily:"Oswald,sans-serif",fontSize:11,letterSpacing:1,color:currentFmt.id===f.id?C.a:"#f0f2f0",textTransform:"uppercase"}}>{f.n}</span>
                  <span style={{fontSize:8,color:"#8a93a5"}}>{f.sz}</span>
                  <span style={{fontSize:7,color:"#5a6070",marginTop:1}}>{f.pl}</span>
                </button>
              ))}
            </div>
          </Sec>

          <Sec title="Colors">
            <div style={{fontSize:9,letterSpacing:3,color:"#8a93a5",textTransform:"uppercase",marginBottom:8}}>Quick Presets</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {THEMES.map(t=>(
                <div key={t.n} onClick={()=>{setC(prev=>({...prev,a:t.a,b:t.b,s:t.s}));pushRecent(t.a);}} title={t.n}
                  style={{width:32,height:32,borderRadius:7,cursor:"pointer",border:`2px solid ${C.a===t.a?"#fff":"transparent"}`,background:`linear-gradient(135deg,${t.b},${t.a})`,transition:"all .15s",flexShrink:0}}/>
              ))}
            </div>
            <div style={{fontSize:9,letterSpacing:3,color:"#8a93a5",textTransform:"uppercase",marginBottom:8}}>Custom Colors</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:9,marginBottom:10}}>
              {(["a","b","s","f"] as const).map((ch,i)=>(
                <div key={ch} style={{background:"#0d0f14",border:"1px solid rgba(255,255,255,.08)",borderRadius:9,padding:"9px 11px"}}>
                  <label style={{fontSize:8,color:"#8a93a5",letterSpacing:1.5,textTransform:"uppercase",display:"block",marginBottom:5}}>{["Accent","Background","Surface","Font"][i]}</label>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <input type="color" value={C[ch]} onChange={e=>{const v=e.target.value;setC(prev=>({...prev,[ch]:v}));if(ch==="a")pushRecent(v);}}
                      style={{width:36,height:36,borderRadius:7,border:"1px solid rgba(255,255,255,.1)",cursor:"pointer",padding:2,background:"transparent",flexShrink:0}}/>
                    <input type="text" value={C[ch].toUpperCase()} maxLength={7}
                      onChange={e=>{let v=e.target.value;if(!v.startsWith("#"))v="#"+v;if(/^#[0-9A-Fa-f]{6}$/.test(v)){setC(prev=>({...prev,[ch]:v}));if(ch==="a")pushRecent(v);}}}
                      style={{flex:1,minWidth:0,background:"#060810",border:"1px solid rgba(255,255,255,.08)",borderRadius:5,color:"#f0f2f0",padding:"5px 6px",fontSize:10,fontFamily:"monospace",outline:"none",textTransform:"uppercase"}}/>
                  </div>
                </div>
              ))}
            </div>
            {recentAccents.length>0&&(
              <div style={{display:"flex",gap:5,alignItems:"center",marginTop:8}}>
                <span style={{fontSize:8,color:"#5a6070",letterSpacing:1,textTransform:"uppercase",flexShrink:0}}>Recent:</span>
                {recentAccents.map(col=>(
                  <div key={col} onClick={()=>{setC(prev=>({...prev,a:col}));}} title={col}
                    style={{width:18,height:18,borderRadius:4,cursor:"pointer",background:col,border:"1px solid rgba(255,255,255,.1)",flexShrink:0}}/>
                ))}
              </div>
            )}
          </Sec>

          <Sec title="Background Image">
            <div style={{border:"1px dashed rgba(255,255,255,.12)",borderRadius:9,padding:12,textAlign:"center",cursor:"pointer",position:"relative",overflow:"hidden",marginBottom:10}}>
              <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setBgImgSrc(ev.target?.result as string);r.readAsDataURL(f);}}
                style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/>
              <p style={{fontSize:10,letterSpacing:2,color:"#8a93a5",textTransform:"uppercase"}}>{bgImgSrc?"Image uploaded ✓ — drop another to replace":"Drop image or click"}</p>
              <small style={{fontSize:9,color:"#5a6070"}}>JPG · PNG · WebP</small>
            </div>
            <label style={{fontSize:9,color:"#8a93a5",letterSpacing:1,textTransform:"uppercase"}}>Opacity</label>
            <input type="range" min={5} max={100} value={bgImgOp} onChange={e=>setBgImgOp(Number(e.target.value))} style={{width:"100%",marginTop:4}}/>
            {bgImgSrc&&<button onClick={()=>setBgImgSrc(null)} style={{marginTop:8,width:"100%",padding:"7px 13px",background:"#0d0f14",border:"1px solid rgba(255,255,255,.07)",borderRadius:7,color:"#8a93a5",fontFamily:"Oswald,sans-serif",fontSize:10,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"}}>✕ Remove Image</button>}
          </Sec>

          <Sec title="Pattern & Border">
            <div style={{fontSize:9,letterSpacing:3,color:"#8a93a5",textTransform:"uppercase",marginBottom:8}}>Pattern Overlay</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
              {PATS.map(p=><Btn key={p.id} label={p.l} active={currentPatId===p.id} onClick={()=>setCurrentPatId(p.id)} acc={C.a}/>)}
            </div>
            <div style={{fontSize:9,letterSpacing:3,color:"#8a93a5",textTransform:"uppercase",marginBottom:8}}>Card Border</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {BRDS.map(b=><Btn key={b.id} label={b.l} active={currentBrdId===b.id} onClick={()=>setCurrentBrdId(b.id)} acc={C.a}/>)}
            </div>
          </Sec>

          <Sec title="Brand & Identity">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
              <Fld label="Page Handle"><input style={inputStyle} value={brand} onChange={e=>setBrand(e.target.value)}/></Fld>
              <Fld label="Stake ($)"><input style={inputStyle} type="number" value={stake} min={1} onChange={e=>setStake(Number(e.target.value))}/></Fld>
              <Fld label="Card Title"><input style={inputStyle} value={titleText} maxLength={20} onChange={e=>setTitleText(e.target.value.toUpperCase())}/></Fld>
              <Fld label="Accent Word"><input style={inputStyle} value={accWord} onChange={e=>setAccWord(e.target.value)}/></Fld>
              <Fld label="Date"><input style={inputStyle} value={dateText} placeholder={getTodayStr()} onChange={e=>setDateText(e.target.value)}/></Fld>
              <Fld label="Payout Display"><select style={selStyle} value={payoutMode} onChange={e=>setPayoutMode(e.target.value)}><option value="towin">To Win</option><option value="total">Total Return</option></select></Fld>
              <Fld label="Subtitle"><input style={inputStyle} value={subtitle} onChange={e=>setSubtitle(e.target.value)}/></Fld>
              <Fld label="Season Record"><input style={inputStyle} value={record} placeholder="47-31 · 60%" onChange={e=>setRecord(e.target.value)}/></Fld>
              <Fld label="Hashtag"><input style={inputStyle} value={hashtag} placeholder="#YourTag" onChange={e=>setHashtag(e.target.value)}/></Fld>
            </div>
            <Fld label="Page Logo">
              <div style={{border:"1px dashed rgba(255,255,255,.12)",borderRadius:9,padding:12,textAlign:"center",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setLogoSrc(ev.target?.result as string);r.readAsDataURL(f);}} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/>
                <p style={{fontSize:10,letterSpacing:2,color:"#8a93a5",textTransform:"uppercase"}}>{logoSrc?"Logo uploaded ✓":"Drop logo or click"}</p>
                <small style={{fontSize:9,color:"#5a6070"}}>Transparent PNG</small>
              </div>
            </Fld>
          </Sec>

          <Sec title="Bet Type">
            <div style={{display:"flex",gap:7,marginBottom:14}}>
              <Btn label="Parlay" active={betType==="parlay"} onClick={()=>{setBetType("parlay");setTimeout(startPlay,350);}} acc={C.a}/>
              <Btn label="Single Bet" active={betType==="single"} onClick={()=>{setBetType("single");setTimeout(startPlay,350);}} acc={C.a}/>
            </div>
            {betType==="parlay"&&<>
              <div style={{fontSize:9,letterSpacing:3,color:"#8a93a5",textTransform:"uppercase",marginBottom:8}}>Legs</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>
                {[2,3,4,5,6,7,8].map(n=><Btn key={n} label={`${n} Legs`} active={legCount===n} onClick={()=>{setLegCount(n);setTimeout(startPlay,300);}} acc={C.a}/>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
                <Fld label="Confidence Bars"><select style={selStyle} value={showConf?"1":"0"} onChange={e=>setShowConf(e.target.value==="1")}><option value="0">Off</option><option value="1">On</option></select></Fld>
                <Fld label="Odds Format"><select style={selStyle} value={oddsFmt} onChange={e=>setOddsFmt(e.target.value)}><option value="american">American (+150)</option><option value="decimal">Decimal (2.50)</option><option value="fractional">Fractional (3/2)</option></select></Fld>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"155px 1fr 1fr 66px 50px 70px 68px",gap:6,marginBottom:5}}>
                {["Sport","Pick","Game / Market","Odds","Conf","Lock","Result"].map(h=>(
                  <span key={h} style={{fontSize:8,color:"#5a6070",letterSpacing:1,textTransform:"uppercase"}}>{h}</span>
                ))}
              </div>
              {legs.map((l,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"155px 1fr 1fr 66px 50px 70px 68px",gap:6,marginBottom:6,alignItems:"center"}}>
                  <select style={{...selStyle,fontSize:10,padding:"5px 7px"}} value={l.s} onChange={e=>{const nl=[...legs];nl[i]={...nl[i],s:e.target.value};setLegs(nl);}}>
                    {Object.keys(SPORTS).map(k=><option key={k} value={k}>{SPORTS[k].e} {SPORTS[k].l}</option>)}
                  </select>
                  <input style={{...inputStyle,fontSize:10,padding:"5px 7px"}} value={l.p} placeholder="Your pick" onChange={e=>{const nl=[...legs];nl[i]={...nl[i],p:e.target.value};setLegs(nl);}}/>
                  <input style={{...inputStyle,fontSize:10,padding:"5px 7px"}} value={l.g} placeholder="Game / Market" onChange={e=>{const nl=[...legs];nl[i]={...nl[i],g:e.target.value};setLegs(nl);}}/>
                  <input style={{...inputStyle,fontSize:10,padding:"5px 7px"}} value={l.o} placeholder="-110" onChange={e=>{const nl=[...legs];nl[i]={...nl[i],o:e.target.value};setLegs(nl);}}/>
                  <input style={{...inputStyle,fontSize:10,padding:"5px 7px"}} type="number" value={l.c} min={1} max={100} onChange={e=>{const nl=[...legs];nl[i]={...nl[i],c:Number(e.target.value)};setLegs(nl);}}/>
                  <select style={{...selStyle,fontSize:10,padding:"5px 7px"}} value={l.lock?"1":"0"} onChange={e=>{const nl=[...legs];nl[i]={...nl[i],lock:e.target.value==="1"};setLegs(nl);}}>
                    <option value="0">No Lock</option><option value="1">🔒 Lock</option>
                  </select>
                  <select style={{...selStyle,fontSize:10,padding:"5px 7px"}} value={l.result} onChange={e=>{const nl=[...legs];nl[i]={...nl[i],result:e.target.value};setLegs(nl);}}>
                    <option value="">—</option><option value="win">✅ Win</option><option value="loss">❌ Loss</option><option value="push">↩ Push</option>
                  </select>
                </div>
              ))}
            </>}
            {betType==="single"&&(
              <div style={{background:"#0d0f14",border:"1px solid rgba(255,255,255,.07)",borderRadius:9,padding:12}}>
                <div style={{display:"grid",gridTemplateColumns:"155px 1fr 1fr 80px",gap:8,alignItems:"end"}}>
                  <Fld label="Sport"><select style={selStyle} value={sbSport} onChange={e=>setSbSport(e.target.value)}>{Object.keys(SPORTS).map(k=><option key={k} value={k}>{SPORTS[k].e} {SPORTS[k].l}</option>)}</select></Fld>
                  <Fld label="Your Pick"><input style={selStyle} value={sbPick} onChange={e=>setSbPick(e.target.value)}/></Fld>
                  <Fld label="Game / Market"><input style={selStyle} value={sbGame} onChange={e=>setSbGame(e.target.value)}/></Fld>
                  <Fld label="Odds"><input style={selStyle} value={sbOdds} onChange={e=>setSbOdds(e.target.value)}/></Fld>
                </div>
              </div>
            )}
          </Sec>

          <Sec title="Animation (video only)">
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
              {ANIMS.map(a=><Btn key={a.id} label={a.l} active={animId===a.id} onClick={()=>setAnimId(a.id)} acc={C.a}/>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
              <Fld label="Countdown"><select style={selStyle} value={useCd?"1":"0"} onChange={e=>setUseCd(e.target.value==="1")}><option value="0">Off</option><option value="1">On</option></select></Fld>
              <Fld label="Confetti"><select style={selStyle} value={useConf?"1":"0"} onChange={e=>setUseConf(e.target.value==="1")}><option value="0">Off</option><option value="1">On</option></select></Fld>
              <Fld label="Loop"><select style={selStyle} value={useLoop?"1":"0"} onChange={e=>setUseLoop(e.target.value==="1")}><option value="0">Off</option><option value="1">On</option></select></Fld>
            </div>
          </Sec>

          <div style={{display:"flex",gap:9}}>
            <button onClick={startPlay} style={{flex:1,padding:13,background:C.a,border:"none",borderRadius:9,color:"#06080B",fontFamily:"Anton,sans-serif",fontSize:14,letterSpacing:2,cursor:"pointer",textTransform:"uppercase"}}>
              {outputMode==="image"?"⬜ Show Full Card":"▶ Play"}
            </button>
            <button onClick={()=>setLegs(DEFS.slice(0,legCount))} style={{padding:"13px 15px",background:"transparent",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#f0f2f0",fontFamily:"Anton,sans-serif",fontSize:12,letterSpacing:1,cursor:"pointer"}}>↺</button>
            <button onClick={()=>{const nx=!cleanMode;setCleanMode(nx);if(nx)setTimeout(startPlay,350);}} style={{padding:"13px 12px",background:"transparent",border:"1px solid rgba(255,255,255,.1)",borderRadius:9,color:"#f0f2f0",fontFamily:"Anton,sans-serif",fontSize:11,letterSpacing:1,cursor:"pointer"}}>⛶ Preview</button>
          </div>
          <button onClick={doDownload} disabled={dlBusy} style={{width:"100%",padding:13,background:"transparent",border:`2px solid ${C.a}`,borderRadius:9,color:C.a,fontFamily:"Anton,sans-serif",fontSize:14,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",marginTop:2,opacity:dlBusy?0.6:1}}>
            {dlBusy?`Processing... ${dlProgress}%`:`⬇ Download ${outputMode==="image"?"PNG":"Video"}`}
          </button>
          {dlMsg&&<div style={{fontSize:9,color:"#8a93a5",textAlign:"center",letterSpacing:1,textTransform:"uppercase"}}>{dlMsg}</div>}
          <p style={{fontSize:9,color:"#5a6070",textAlign:"center",letterSpacing:1,textTransform:"uppercase"}}>Preview Mode hides controls for a clean full-card view</p>

        </div>
      </div>

      {cleanMode&&(
        <button onClick={()=>setCleanMode(false)} style={{position:"fixed",bottom:20,right:20,zIndex:100,padding:"9px 16px",background:"#1a1d23",border:"1px solid rgba(255,255,255,.1)",borderRadius:28,color:"#f0f2f0",fontFamily:"Anton,sans-serif",fontSize:11,letterSpacing:1,cursor:"pointer",textTransform:"uppercase"}}>
          ✕ Exit Preview
        </button>
      )}
    </div>
  );
}
