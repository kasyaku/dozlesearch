// pages/api/videos.ts
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;

  const videos = await prisma.video.findMany({
    where: { published_at: { lte: new Date() } },
    orderBy: { published_at: "desc" },
    skip: offset,
    take: limit,
    include: {
      videoTags: {
        where: { current: true },
        include: { tag: true },
      },
    },
  });

  res.status(200).json(
    videos.map((v) => ({
      ...v,
      published_at: v.published_at?.toISOString() ?? null,
      created_at: v.created_at?.toISOString() ?? null,
    }))
  );
}
