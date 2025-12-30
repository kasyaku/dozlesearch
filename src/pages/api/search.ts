// pages/api/search.ts
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const rawTag = req.query.tag;
  const rawKeyword = req.query.keyword;
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 20;

  const tagList = typeof rawTag === "string"
    ? rawTag.split(",").map((s) => s.trim())
    : [];
  const keywordList = typeof rawKeyword === "string"
    ? rawKeyword.split(",").map((s) => s.trim())
    : [];

  const where = {
    AND: [
      ...tagList.map((tag) => ({
        videoTags: {
          some: {
            tag: {
              is: {
                name: { contains: tag, mode: "insensitive" },
              },
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
    })),
  );
}
