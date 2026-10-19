export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { isSystemInitialized } from "../lib/setup-service.ts";

export default async function HomePage() {
  const status = await isSystemInitialized();
  if (!status.initialized) {
    redirect("/setup");
  }
  redirect("/quotes");
}
