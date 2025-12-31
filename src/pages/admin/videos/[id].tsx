//dozul-fan-search\src\pages\admin\videos\[id].tsx
export const config = {
  runtime: "nodejs",
};
import React, { useState } from "react";
import { GetServerSideProps } from "next";
import Link from "next/link";
import Image from "next/image";

import { prisma } from "@/lib/prisma";
import TagList from "@/components/TagList";
import TagEditor from "@/components/TagEditor";

import styles from "./[id].module.scss";

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

  const [previous, next, allTags] = await Promise.all([
    prisma.video.findFirst({
      where: {
        published_at: { lt: video.published_at },
        video_type: video.video_type,
      },
      orderBy: { published_at: "desc" },
    }),
    prisma.video.findFirst({
      where: {
        published_at: { gt: video.published_at },
        video_type: video.video_type,
      },
      orderBy: { published_at: "asc" },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    props: {
      video: {
        ...video,
        published_at: video.published_at?.toISOString() ?? null,
        created_at: video.created_at?.toISOString() ?? null,
      },
      previous: previous
        ? {
            ...previous,
            published_at: previous.published_at?.toISOString() ?? null,
            created_at: previous.created_at?.toISOString() ?? null,
          }
        : null,
      next: next
        ? {
            ...next,
            published_at: next.published_at?.toISOString() ?? null,
            created_at: next.created_at?.toISOString() ?? null,
          }
        : null,
      allTags,
    },
  };
};

export default function VideoTagPage({ video, previous, next, allTags }) {
  const [expanded, setExpanded] = useState(false);
  const [videoTags, setVideoTags] = useState(video.videoTags);

  const toggleDescription = () => setExpanded((prev) => !prev);

  return (
    <main id={styles.container} style={{ padding: "2rem" }}>
      <article>
        <section className={styles.videoInfo}>
          <h1 className={styles.videoInfo__title}>{video.title}</h1>
          <iframe
            width="640"
            height="360"
            src={`https://www.youtube.com/embed/${video.id}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.videoInfo__player}
          />
          <div className={styles.videoInfo__taglist}>
            <h3 className={styles.videoInfo__taglistTitle}>タグ一覧</h3>
            <TagList videoId={video.id} tags={videoTags.map((vt) => vt.tag)} />
          </div>
          <div className={styles.videoInfo__description}>
            <p
              className={styles.videoInfo__description__textbox}
              style={{ whiteSpace: "pre-line" }}
            >
              {expanded
                ? video.description
                : video.description.slice(0, 200) +
                  (video.description.length > 200 ? "..." : "")}
            </p>
            {video.description.length > 200 && (
              <button
                onClick={toggleDescription}
                className={styles.videoInfo__toggleButton}
              >
                {expanded ? "閉じる" : "もっと見る"}
              </button>
            )}
          </div>
        </section>

        <section className={styles.tagEditor}>
          <h3 className={styles.tagEditor__title}>タグを追加</h3>
          <TagEditor
            videoId={video.id}
            allTags={allTags}
            videoTags={videoTags}
            setVideoTags={setVideoTags}
          />
        </section>

        <section className={styles.videoNav}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "2rem",
            }}
          >
            {previous && (
              <Link href={`/admin/videos/${previous.id}`}>
                <div>
                  <img src={previous.thumbnail_url} width={160} />
                  <div>← 前の動画</div>
                  <div>{previous.title}</div>
                </div>
              </Link>
            )}
            {next && (
              <Link href={`/admin/videos/${next.id}`}>
                <div>
                  <img src={next.thumbnail_url} width={160} />
                  <div>次の動画 →</div>
                  <div>{next.title}</div>
                </div>
              </Link>
            )}
          </div>
        </section>
        <section className={styles.videoCard}>
          <h2 className={styles.videoCard__title}>動画一覧</h2>
        </section>
      </article>
    </main>
  );
}
