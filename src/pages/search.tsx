// pages/search.tsx
import { GetServerSideProps } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/SearchBar";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import VideoCard from "@/components/VideoCard";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const tag = (ctx.query.tag as string)?.trim();
  const keyword = (ctx.query.keyword as string)?.trim();

  const rawTag = ctx.query.tag;
  const rawKeyword = ctx.query.keyword;

  const tagList =
    typeof rawTag === "string" ? rawTag.split(",").map((s) => s.trim()) : [];
  const keywordList =
    typeof rawKeyword === "string"
      ? rawKeyword.split(",").map((s) => s.trim())
      : [];

  const where = {
    AND: [
      ...tagList.map((tag) => ({
        videoTags: {
          some: {
            tag: {
              name: { contains: tag, mode: "insensitive" },
            },
          },
        },
      })),
      ...keywordList.map((kw) => ({
        title: { contains: kw, mode: "insensitive" },
      })),
    ],
  };

  const videos = await prisma.video.findMany({
    where,
    include: {
      videoTags: {
        where: { current: true },
        include: { tag: true },
      },
    },
    orderBy: { published_at: "desc" },
    take: 48,
    select: {
      id: true,
      title: true,
      thumbnail_url: true,
      view_count: true,
      published_at: true,
      created_at: true,
      video_type: true,
      duration_seconds: true,
      videoTags: {
        where: { current: true },
        include: { tag: true },
      },
    },
  });

  return {
    props: {
      tags: tagList,
      keywords: keywordList,
      videos: videos.map((v) => ({
        ...v,
        published_at: v.published_at?.toISOString() ?? null,
        created_at: v.created_at?.toISOString() ?? null,
      })),
    },
  };
};

export default function SearchResults({
  tags,
  keywords,
  videos,
}: {
  tags: string[];
  keywords: string[];
  videos: any[];
}) {
  const router = useRouter();
  const [allVideos, setAllVideos] = useState(videos);
  const [offset, setOffset] = useState(videos.length);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<Set<string>>(
    new Set(["short", "video", "live"])
  );

  useEffect(() => {
    setAllVideos(videos);
    setOffset(videos.length);
    setHasMore(true);
  }, [videos]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (tags.length > 0) params.append("tag", tags.join(","));
    if (keywords.length > 0) params.append("keyword", keywords.join(","));
    params.append("offset", offset.toString());
    params.append("limit", "24");

    const res = await fetch(`/api/search?${params.toString()}`);
    const newVideos = await res.json();

    if (newVideos.length === 0) {
      setHasMore(false); // これ以上読み込まない
    } else {
      setAllVideos((prev) => [...prev, ...newVideos]);
      setOffset((prev) => prev + newVideos.length);
    }

    setLoading(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [offset, loading, hasMore]);

  const toggleFilter = (type: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const filteredVideos = allVideos.filter((v) => filters.has(v.video_type));

  return (
    <main style={{ padding: "2rem" }}>
      <h1>ドズル社動画検索</h1>
      <p>ファンによる、ファンのための動画検索サイト</p>

      <SearchBar
        initialTag={tags.join(" ")}
        initialKeyword={keywords.join(" ")}
      />

      <h2>検索結果：</h2>
      {tags.length > 0 && (
        <>
          <div className="tagTitle">タグ</div>
          <ul className="tagList">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </>
      )}
      {keywords.length > 0 && (
        <>
          <div className="keywordTitle">キーワード</div>
          <ul className="keywordList">
            {keywords.map((kw) => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>
        </>
      )}

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

      {allVideos.length === 0 ? (
        <p>該当する動画が見つかりませんでした。</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}

          <div ref={sentinelRef} style={{ height: "1px" }} />
          {!hasMore && (
            <p
              style={{ textAlign: "center", marginTop: "1rem", color: "#666" }}
            >
              これ以上の動画はありません。
            </p>
          )}
        </div>
      )}
    </main>
  );
}
