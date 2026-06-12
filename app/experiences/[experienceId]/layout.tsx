import ParlayBuilder from "./page";

// Whop auth intentionally disabled for local testing — re-enable before launch.
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await params;
  return <ParlayBuilder />;
}