import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

const API_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNEL_ID = 'UCj4PjeVMnNTHIR5EeoNKPAw';
const TOKEN_PATH = path.join(process.cwd(), 'nextPageToken.json');
const MAX_CALLS_PER_DAY = 1;

const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY,
});

async function loadNextPageToken(): Promise<string | undefined> {
  try {
    const data = await fs.readFile(TOKEN_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.nextPageToken ?? undefined;
  } catch {
    return undefined;
  }
}

async function saveNextPageToken(token: string | undefined) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify({ nextPageToken: token ?? null }, null, 2));
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const res = await youtube.channels.list({
    part: ['contentDetails'],
    id: channelId,
  });

  const uploadsId = res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) throw new Error('Failed to retrieve uploads playlist ID');
  return uploadsId;
}

async function fetchVideosWithLimit() {
  const uploadsPlaylistId = await getUploadsPlaylistId(CHANNEL_ID);
  let nextPageToken = await loadNextPageToken();
  let totalFetched = 0;
  let callCount = 0;

  while (callCount < MAX_CALLS_PER_DAY) {
    const res = await youtube.playlistItems.list({
      part: ['snippet'],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken: nextPageToken,
    });

    const items = res.data.items ?? [];
    const videos = items
      .filter((item) => item.snippet?.resourceId?.videoId)
      .map((item) => ({
        id: item.snippet!.resourceId!.videoId!,
        title: item.snippet?.title ?? '',
        description: item.snippet?.description ?? '',
        published_at: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : new Date(),
        thumbnail_url:
          item.snippet?.thumbnails?.maxres?.url ??
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.default?.url ??      
          null,
        video_type: 'youtube',
        channel_id: CHANNEL_ID,
        created_at: new Date(),
      }));

    for (const video of videos) {
      await prisma.video.upsert({
        where: { id: video.id },
        update: {},
        create: video,
      });
    }

    totalFetched += videos.length;
    callCount += 1;
    console.log(`✅ Call ${callCount}: Fetched ${videos.length} videos (Total: ${totalFetched})`);

    nextPageToken = res.data.nextPageToken;
    await saveNextPageToken(nextPageToken);

    if (!nextPageToken) {
      console.log('🎉 All videos fetched. No more pages.');
      break;
    }
  }

  console.log(`📦 Finished. Total API calls: ${callCount}, Total videos fetched: ${totalFetched}`);
}

fetchVideosWithLimit()
  .catch((err) => {
    console.error('❌ Error fetching videos:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });