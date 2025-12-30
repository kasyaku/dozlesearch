import { serve } from "serve"
import { collectDueStats } from "./PlaycountCollector.ts"

serve(async (req) => {
  const bodyText = await req.text()
  console.log("📨 Raw body:", bodyText)

  let mode: "batch" | "single" | null = null
  let type: "recent" | "mid" | "old" | null = null

  try {
    const json = JSON.parse(bodyText)
    mode = json.mode
    type = json.type
  } catch (e) {
    console.error("❌ JSON parse error:", e)
  }

  if (!mode || (mode !== "batch" && mode !== "single")) {
    console.error("❌ Missing or invalid mode")
    return new Response("Missing or invalid mode", { status: 400 })
  }

  if (mode === "batch") {
    await collectDueStats("recent")
    await collectDueStats("mid")
    await collectDueStats("old")
  } else if (mode === "single") {
    if (!type || !["recent", "mid", "old"].includes(type)) {
      console.error("❌ Missing or invalid type for single mode")
      return new Response("Missing or invalid type", { status: 400 })
    }
    await collectDueStats(type)
  }

  return new Response("✅ Play count collected successfully")
})