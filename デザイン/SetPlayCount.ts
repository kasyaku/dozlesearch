import { prisma } from './client'
import { addDays, addHours, isBefore } from 'date-fns'

const generateSchedule = async () => {
  const videos = await prisma.video.findMany()

  for (const video of videos) {
    const start = video.published_at
    const now = new Date()

    // 初月（6時間ごと）
for (let i = 0; i < 30; i++) {
  const day = addDays(start, i)
  for (const hour of [0, 6, 12, 18]) {
    const fetchTime = new Date(day)
    fetchTime.setHours(hour, 30, 0, 0)
    if (isBefore(fetchTime, now)) {
      const exists = await prisma.videoStat.findFirst({
        where: {
          video_id: video.id,
          timestamp: fetchTime,
        },
      })

      if (!exists) {
        await prisma.videoStat.create({
          data: {
            video_id: video.id,
            timestamp: fetchTime,
            view_count: 0,
            like_count: 0,
            comment_count: 0,
          },
        })
      }
    }
  }
}


    // 1月〜1年（毎日18:30）
    for (let i = 30; i < 365; i++) {
      const fetchTime = new Date(addDays(start, i))
      fetchTime.setHours(18, 30, 0, 0)
      if (isBefore(fetchTime, now)) {
        await prisma.videoStat.create({
          data: {
            video_id: video.id,
            timestamp: fetchTime,
            view_count: 0,
            like_count: 0,
            comment_count: 0,
          },
        })
      }
    }

    // 1年以降（交互に18:30）
    for (let i = 365; i < 730; i++) {
      const fetchTime = new Date(addDays(start, i))
      fetchTime.setHours(18, 30, 0, 0)
      if (i % 2 === 0 && isBefore(fetchTime, now)) {
        await prisma.videoStat.create({
          data: {
            video_id: video.id,
            timestamp: fetchTime,
            view_count: 0,
            like_count: 0,
            comment_count: 0,
          },
        })
      }
    }
  }
}