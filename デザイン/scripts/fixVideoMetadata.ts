import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const BATCH_SIZE = 3000;
const CHUNK_SIZE = 50;

// 手動でここを変更して分割実行（例：0〜2999, 3000〜5999, ...）
const START_INDEX = 10001;
const END_INDEX = 10200;

async function main() {
  console.log(`Fetching videos ${START_INDEX} to ${END_INDEX}...`);

  const { data: videos, error } = await supabase
    .from('video')
    .select('id')
    .order('published_at', { ascending: false })
    .range(START_INDEX, END_INDEX);

  if (error) {
    console.error('Supabase fetch error:', error);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('No videos found in this range.');
    return;
  }

  const videoIds = videos.map((v) => v.id);

  for (let i = 0; i < videoIds.length; i += CHUNK_SIZE) {
    const chunk = videoIds.slice(i, i + CHUNK_SIZE);
    const url = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${chunk.join(',')}&part=snippet,contentDetails,liveStreamingDetails`;

    const res = await fetch(url);
    const json = await res.json();

    if (!json.items) {
      console.warn('No items returned for chunk:', chunk);
      continue;
    }

    for (const video of json.items) {
      const id = video.id;
const duration = video.contentDetails?.duration ?? '';
const actualStartRaw = video.liveStreamingDetails?.actualStartTime ?? null;
const publishedAtRaw = video.snippet?.publishedAt ?? null;

const actualStart = actualStartRaw ? new Date(actualStartRaw) : null;
const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null;

let videoType = 'video';

const isShort = /^PT([0-5]?[0-9])S$/.test(duration);

const isPremiere =
  actualStart && publishedAt &&
  actualStart.getTime() === publishedAt.getTime();

const isLiveArchive =
  actualStart && publishedAt &&
  actualStart.getTime() !== publishedAt.getTime();

if (isShort) {
  videoType = 'short';
} else if (isLiveArchive) {
  videoType = 'live';
} else {
  videoType = 'video'; // 通常 or プレミア
}

      const updates: Record<string, any> = { video_type: videoType };
      if (actualStart) {
        updates.published_at = actualStart;
      }

      const { error: updateError } = await supabase
        .from('video')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error(`Failed to update video ${id}:`, updateError);
      } else {
        console.log(`Updated ${id}: type=${videoType}${actualStart ? `, published_at=${actualStart}` : ''}`);
      }
    }
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
});
