const updateDueStats = async () => {
  const now = new Date()
  const apiKey = process.env.YOUTUBE_API_KEY!

  const dueStats = await prisma.videoStat.findMany({
    where: {
      timestamp: {
        lte: now,
      },
      view_count: 0, // 未取得のものだけ
    },
    include: {
      video: true,
    },
    take: 100, // ユニット制限に応じて調整
  })

  for (const stat of dueStats) {
    const stats = await fetchVideoStats(stat.video.id, apiKey)
    if (!stats) continue

    await prisma.videoStat.update({
      where: { id: stat.id },
      data: {
        view_count: stats.view_count,
        like_count: stats.like_count,
        comment_count: stats.comment_count,
      },
    })
  }
}