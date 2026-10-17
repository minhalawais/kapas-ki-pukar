import { notFound } from "next/navigation";

import { DemoPageClient } from "@/components/demo/DemoPageClient";

export default function DemoPage() {
  if (process.env.APP_MODE === "production" || process.env.ENABLE_DEMO_CONTROLS !== "true") {
    notFound();
  }
  return <DemoPageClient />;
}
