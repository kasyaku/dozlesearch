// pages/api/video-tag.ts
import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_USER_ID = "52c69e0e-c342-42da-bd47-05c833a0ecf8"; // Supabaseで確認したUUID

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { videoId, tagId } = req.body;
    if (!videoId || !tagId) {
      return res.status(400).json({ error: "Missing videoId or tagId" });
    }

    if (req.method === "POST") {
      await prisma.videoTag.create({
        data: {
          video_id: videoId,
          tag_id: tagId,
          current: true,
        },
      });
      
      await prisma.tagEdit.create({
        data: {
          video_id: videoId,
          tag_id: tagId,
          user_id: ADMIN_USER_ID,
          action: req.method === "POST" ? "add" : "remove",
        },
      });
      
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      await prisma.videoTag.updateMany({
        where: {
          video_id: videoId,
          tag_id: tagId,
          current: true,
        },
        data: {
          current: false,
        },
      });

      await prisma.tagEdit.create({
        data: {
          video_id: videoId,
          tag_id: tagId,
          user_id: ADMIN_USER_ID,
          action: "remove",
        },
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  } catch (error) {
    console.error("video-tag error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
