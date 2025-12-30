import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('PUBLIC_SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!
  );

  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')!;
  const CHUNK_SIZE = 20;

  // video_type = 'live' を除外して取得
  const { data: videos, error } = await supabase
    .from('video')
    .select('id, video_type')
    .neq('video_type', 'live')
    .order('published_at', { ascending: false })
    .limit(CHUNK_SIZE);

  if (error || !videos) {
    console.error('Failed to fetch videos:', error);
    return new Response('Failed to fetch videos', { status: 500 });
  }

  const videoIds = videos.map((v) => v.id);
  const url = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds.join(',')}&part=snippet,liveStreamingDetails`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.items) {
    console.warn('No items returned from YouTube API.');
    return new Response('No items returned from YouTube API', { status: 200 });
  }

  for (const video of json.items) {
    const actualStartRaw = video.liveStreamingDetails?.actualStartTime;
    const publishedAtRaw = video.snippet?.publishedAt;

    if (!actualStartRaw || !publishedAtRaw) continue;

    const actualStart = new Date(actualStartRaw);
    const publishedAt = new Date(publishedAtRaw);

    // プレミア公開の判定: actualStart === publishedAt
    const isPremiere = actualStart.getTime() === publishedAt.getTime();

    if (!isPremiere) continue;

    const { error: updateError } = await supabase
      .from('video')
      .update({ published_at: actualStart.toISOString() })
      .eq('id', video.id);

    if (updateError) {
      console.error(`Failed to update ${video.id}:`, updateError);
    }
  }

  return new Response('Published_at updated for premiere videos', { status: 200 });
});
