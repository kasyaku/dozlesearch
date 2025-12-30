// pages/api/videos.ts
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;

  const videos = await prisma.video.findMany({
    where: { published_at: { lte: new Date() } },
    orderBy: { published_at: "desc" },
    skip: offset,
    take: limit,
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

  res.status(200).json(
    videos.map((v) => ({
      ...v,
      published_at: v.published_at?.toISOString() ?? null,
      created_at: v.created_at?.toISOString() ?? null,
    })),
  );
}
