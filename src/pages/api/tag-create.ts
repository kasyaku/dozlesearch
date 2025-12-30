// pages/api/tag-create.ts
import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { name, category } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // タグが存在するか確認
    let tag = await prisma.tag.findFirst({ where: { name, category } });

    // なければ作成
    if (!tag) {
      tag = await prisma.tag.create({ data: { name, category } });
    }

    res.status(200).json({ success: true, tag });
  } catch (error) {
    console.error("tag-create error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}