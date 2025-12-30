// components/VideoCard.tsx
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import ja from "date-fns/locale/ja";

export default function VideoCard({ video }: { video: any }) {
  const publishedDate = new Date(video.published_at);
  const formattedDate = format(publishedDate, "yyyy/MM/dd", { locale: ja });
  const relativeDate = formatDistanceToNow(publishedDate, {
    addSuffix: true,
    locale: ja,
  });

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  console.log("duration_seconds:", video.duration_seconds);
  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <Link href={`/videos/${video.id}`}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <img src={video.thumbnail_url} width={320} />
          {video.duration_seconds != null && (
            <div
              style={{
                position: "absolute",
                bottom: "4px",
                right: "4px",
                background: "rgba(0,0,0,0.75)",
                color: "#fff",
                padding: "2px 6px",
                fontSize: "0.75rem",
                borderRadius: "4px",
              }}
            >
              {formatDuration(video.duration_seconds)}
            </div>
          )}
        </div>
        <h3>{video.title}</h3>
      </Link>

      {/* 再生数・投稿日時・再生時間 */}
      <div style={{ fontSize: "0.85rem", color: "#666", margin: "0.5rem 0" }}>
        <span style={{ marginRight: "1rem" }}>
          👁 {video.view_count?.toLocaleString() ?? "0"} 回視聴
        </span>
        <span style={{ marginRight: "1rem" }}>
          📅 {formattedDate}（{relativeDate}）
        </span>
      </div>

      <span
        style={{
          background: "#ddd",
          padding: "0.3rem 0.6rem",
          borderRadius: "9999px",
          fontSize: "0.85rem",
          cursor: "pointer",
        }}
      >
        {video.video_type === "short" && "ショート"}
        {video.video_type === "video" && "動画"}
        {video.video_type === "live" && "生放送"}
      </span>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {video.videoTags.map((vt) => (
          <Link
            key={vt.tag.id}
            href={`/search?tag=${encodeURIComponent(vt.tag.name)}`}
          >
            <span
              style={{
                background: "#eee",
                padding: "0.2rem 0.5rem",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              {vt.tag.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
