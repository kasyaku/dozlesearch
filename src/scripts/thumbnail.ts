import { prisma } from '@/lib/prisma';
import fetch from 'node-fetch';

async function getBetterThumbnailUrl(videoId: string): Promise<string | null> {
  const base = `https://i.ytimg.com/vi/${videoId}`;
  const candidates = ['maxresdefault.jpg', 'hqdefault.jpg', 'mqdefault.jpg'];

  for (const file of candidates) {
    const url = `${base}/${file}`;
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) return url;
  }

  return null;
}

async function upgradeThumbnails() {
  const videos = await prisma.video.findMany({
    where: {
      thumbnail_url: {
        contains: '/default.jpg',
      },
    },
  });

  console.log(`🎯 Found ${videos.length} videos with default thumbnails`);

  for (const video of videos) {
    const videoId = video.id;
    const betterUrl = await getBetterThumbnailUrl(videoId);

    if (betterUrl && betterUrl !== video.thumbnail_url) {
      await prisma.video.update({
        where: { id: videoId },
        data: { thumbnail_url: betterUrl },
      });
      console.log(`✅ Updated ${videoId} → ${betterUrl}`);
    } else {
      console.log(`⚠️  No better thumbnail found for ${videoId}`);
    }
  }

  console.log('🎉 Thumbnail upgrade complete');
}

upgradeThumbnails()
  .catch((err) => {
    console.error('❌ Error upgrading thumbnails:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });