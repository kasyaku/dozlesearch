import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fetchVideoStats } from './YoutubeAPICall.ts'

const supabase = createClient(
  Deno.env.get('PUBLIC_SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
)

export const getRecentVideos = async () => {
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(now.getMonth() - 1)

  const { data, error } = await supabase
    .from('video')
    .select('id, published_at')
    .gte('published_at', oneMonthAgo.toISOString())
    .lte('published_at', now.toISOString())
    .order('published_at', { ascending: false })

  if (error) {
    console.error('❌ getRecentVideos error:', error)
    return []
  }

  return data.map((v) => ({ id: v.id }))
}

export const getMidRangeVideos = async () => {
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(now.getMonth() - 1)

  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)

  const { data, error } = await supabase
    .from('video')
    .select('id, published_at')
    .gte('published_at', oneYearAgo.toISOString())
    .lt('published_at', oneMonthAgo.toISOString())
    .order('published_at', { ascending: false })

  if (error) {
    console.error('❌ getMidRangeVideos error:', error)
    return []
  }

  return data.map((v) => ({ id: v.id }))
}

export const getOldVideosPartitioned = async () => {
  const now = new Date()
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)

  const isEvenDay = now.getDate() % 2 === 0

  const pageSize = 1000
  let from = 0
  let to = pageSize - 1
  let all: { id: string; published_at: string }[] = []

  while (true) {
    const { data, error } = await supabase
      .from('video')
      .select('id, published_at')
      .lt('published_at', oneYearAgo.toISOString())
      .order('published_at', { ascending: true })
      .range(from, to)

    if (error) {
      console.error('❌ getOldVideosPartitioned error:', error)
      break
    }

    if (!data || data.length === 0) break

    all.push(...data)
    if (data.length < pageSize) break

    from += pageSize
    to += pageSize
  }

  const midpoint = Math.floor(all.length / 2)
  const selected = isEvenDay ? all.slice(midpoint) : all.slice(0, midpoint)

  console.log(`📆 [old] Partitioned ${all.length} → selected ${selected.length} (isEvenDay=${isEvenDay})`)

  return selected.map((v) => ({ id: v.id }))
}


export const collectMissingStats = async () => {
  try {
    const now = new Date()
    const timestamp = now.toISOString()
    const apiKey = Deno.env.get('YOUTUBE_API_KEY')!

    const { data: dueStats, error } = await supabase
      .from('video_stat')
      .select("*, video:video_stat_video_id_fkey(*)")
      .lte('timestamp', timestamp)
      .eq('view_count', 0)
      .limit(100)

    if (error) throw new Error(`DB fetch error: ${error.message}`)

    for (const stat of dueStats ?? []) {
      if (!stat.video) continue

      const stats = await fetchVideoStats(stat.video.id, apiKey)
      if (!stats) continue

      const { error: insertError } = await supabase
        .from('video_stat')
        .insert([{
          video_id: stat.video.id,
          timestamp,
          view_count: stats.view_count,
          like_count: stats.like_count,
          comment_count: stats.comment_count,
        }])

      if (insertError) {
        console.error(`❌ Failed to insert stat for video ${stat.video.id}:`, insertError)
      }
    }
  } catch (err) {
    console.error('❌ updateDueStats error:', err)
    throw err
  }
}