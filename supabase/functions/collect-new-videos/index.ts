import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { fetchYoutubeVideos } from "./fetchYoutubeVideos.ts";
import { parseVideoMetadata } from "./parseVideoMetadata.ts";
import { insertNewVideos } from "./insertNewVideos.ts";

serve(async () => {
  const rawItems = await fetchYoutubeVideos();
  const parsed = await parseVideoMetadata(rawItems);

  const filtered = parsed.filter(
    (v) => v.channel_id === "UCj4PjeVMnNTHIR5EeoNKPAw"
  );

  const insertedCount = await insertNewVideos(filtered);
  return new Response(`✅ Inserted ${insertedCount} new videos`);
});
