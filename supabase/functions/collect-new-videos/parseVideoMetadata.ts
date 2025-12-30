import { VideoMetadata } from "./types.ts";

function parseISODurationToSeconds(iso: string): number | null {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const [, h, m, s] = match.map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

export function parseVideoMetadata(items: any[]): VideoMetadata[] {
  return items.map((item) => {
    const snippet = item.snippet;
    const contentDetails = item.contentDetails;
    const liveDetails = item.liveStreamingDetails;

    const thumbnails = snippet?.thumbnails ?? {};
    const thumbnail_url =
      thumbnails.maxres?.url ??
      thumbnails.standard?.url ??
      thumbnails.high?.url ??
      thumbnails.medium?.url ??
      thumbnails.default?.url ??
      null;

    const duration = contentDetails?.duration ?? "";
    const actualStart = liveDetails?.actualStartTime ?? null;
    const publishedAt = snippet?.publishedAt ?? null;

    const isShort = /^PT([0-5]?[0-9])S$/.test(duration); // 60秒以下
    const isLiveArchive = 
      actualStart && publishedAt && actualStart !== publishedAt;

    let video_type: "video" | "short" | "live" = "video";
    if (isShort || snippet.title.includes("#short")) {
      video_type = "short";
    } else if (isLiveArchive) {
      video_type = "live";
    }

    // ✅ id を常に文字列として扱う
    const videoId = typeof item.id === "string"
      ? item.id
      : item.id?.videoId ?? "";

    return {
      id: videoId,
      title: snippet.title,
      description: snippet.description ?? null,
      published_at: actualStart ?? publishedAt,
      thumbnail_url,
      video_type,
      channel_id: snippet.channelId,
      duration_seconds: parseISODurationToSeconds(duration),
    };
  });
}
