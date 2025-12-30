export type VideoMetadata = {
  id: string;
  title: string;
  description: string | null;
  published_at: string;
  thumbnail_url: string | null;
  video_type: "video" | "shorts" | "live";
  channel_id: string;
  duration_seconds?: number | null;
};