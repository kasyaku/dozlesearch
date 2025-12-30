// pages/videos/[id].tsx
import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import { useState } from "react";
import Link from "next/link";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const videoId = ctx.params?.id as string;
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      videoTags: {
        where: { current: true },
        include: { tag: true },
      },
    },
  });

  if (!video) return { notFound: true };

  return {
    props: {
      video: {
        ...video,
        published_at: video.published_at?.toISOString() ?? null,
        created_at: video.created_at?.toISOString() ?? null,
      },
    },
  };
};

export default function PublicVideoPage({ video }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>{video.title}</h1>
      <iframe
        width="640"
        height="360"
        src={`https://www.youtube.com/embed/${video.id}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <p style={{ whiteSpace: "pre-line" }}>
        {expanded
          ? video.description
          : video.description.slice(0, 200) +
            (video.description.length > 200 ? "..." : "")}
      </p>
      {video.description.length > 200 && (
        <button onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? "閉じる" : "もっと見る"}
        </button>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginTop: "1rem",
        }}
      >
        {/* video_type をタグ風に表示 */}
        <Link href={`/type/${video.video_type}`}>
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
        </Link>

        {/* 通常のタグ */}
        {video.videoTags.map((vt) => (
          <Link key={vt.tag.id} href={`/tags/${vt.tag.id}`}>
            <span
              style={{
                background: "#eee",
                padding: "0.3rem 0.6rem",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              {vt.tag.name}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
