import { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/SearchBar";
import { useEffect, useRef } from "react";
import VideoCard from "@/components/VideoCard";

export const getServerSideProps: GetServerSideProps = async () => {
  const videos = await prisma.video.findMany({
    where: { published_at: { lte: new Date() } },
    orderBy: { published_at: "desc" },
    take: 96,
    select: {
      id: true,
      title: true,
      thumbnail_url: true,
      published_at: true,
      created_at: true,
      video_type: true,
      duration_seconds: true,
      stats: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: {
          view_count: true,
        },
      },
      videoTags: {
        where: { current: true },
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    props: {
      videos: videos.map((v) => ({
        ...v,
        published_at: v.published_at?.toISOString() ?? null,
        created_at: v.created_at?.toISOString() ?? null,
      })),
    },
  };
};

export default function Home({ videos }) {
  const [filters, setFilters] = useState<Set<string>>(
    new Set(["short", "video", "live"])
  );

  const toggleFilter = (type: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const [allVideos, setAllVideos] = useState(videos);
  const [offset, setOffset] = useState(videos.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const filteredVideos = allVideos.filter((v) => filters.has(v.video_type));

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const res = await fetch(`/api/videos?offset=${offset}&limit=24`);
    const newVideos = await res.json();

    if (newVideos.length === 0) {
      setHasMore(false); // ← これで止まる！
    } else {
      setAllVideos((prev) => [...prev, ...newVideos]);
      setOffset((prev) => prev + newVideos.length);
    }

    setLoading(false);
  };

  // スクロール監視用
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sentinelRef.current, offset, loading]);

  // トグルが全オフのときに読み込みを止める
  useEffect(() => {
    if (filters.size === 0) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }
  }, [filters]);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>ドズル社動画検索</h1>
      <p>ファンによる、ファンのための動画検索サイト</p>

      <SearchBar />

      {/* トグルボタン */}
      <div style={{ margin: "1rem 0", display: "flex", gap: "1rem" }}>
        {["short", "video", "live"].map((type) => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            style={{
              padding: "0.5rem 1rem",
              background: filters.has(type) ? "#333" : "#ccc",
              color: filters.has(type) ? "#fff" : "#000",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {type === "short" && "ショート"}
            {type === "video" && "動画"}
            {type === "live" && "生放送"}
          </button>
        ))}
      </div>

      {/* 動画一覧 */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: "1px" }} />
      {!hasMore && (
        <p style={{ textAlign: "center", marginTop: "1rem", color: "#666" }}>
          これ以上の動画はありません。
        </p>
      )}
    </main>
  );
}
