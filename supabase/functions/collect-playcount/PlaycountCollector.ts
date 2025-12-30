import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { fetchVideoStats } from './YoutubeAPICall.ts'
import {
  getRecentVideos,
  getMidRangeVideos,
  getOldVideosPartitioned
} from './VideoSelector.ts'

export const collectDueStats = async (mode: 'recent' | 'mid' | 'old') => {
  try {
    console.log(`🎯 Starting collectDueStats for mode=${mode}`)

    const apiKey = Deno.env.get('YOUTUBE_API_KEY')!
    const supabase = createClient(
      Deno.env.get('PUBLIC_SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    let videoList = []
    if (mode === 'recent') videoList = await getRecentVideos()
    else if (mode === 'mid') videoList = await getMidRangeVideos()
    else if (mode === 'old') videoList = await getOldVideosPartitioned()

    console.log(`📺 [${mode}] Retrieved ${videoList.length} videos`)

    // 並列で fetchVideoStats を実行
    const statsResults = await Promise.allSettled(
      videoList.map((video) => fetchVideoStats(video.id, apiKey))
    )

    const records = []
    let successCount = 0
    let failCount = 0

    statsResults.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        successCount++
        records.push({
          video_id: videoList[i].id,
          timestamp: new Date().toISOString(),
          view_count: result.value.view_count,
          like_count: result.value.like_count,
          comment_count: result.value.comment_count,
        })
      } else {
        failCount++
      }
    })

    console.log(`📊 [${mode}] fetchVideoStats: success=${successCount}, fail=${failCount}`)
    console.log(`📦 [${mode}] Prepared ${records.length} records for insertion`)

    const BATCH_SIZE = 500
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('video_stat').insert(batch)

      if (error) {
        console.error(`❌ [${mode}] Insert failed at batch ${i / BATCH_SIZE}:`, error)
      } else {
        console.log(`✅ [${mode}] Inserted batch ${i / BATCH_SIZE} (${batch.length} records)`)
      }
    }

    console.log(`🎉 Finished collectDueStats for mode=${mode}`)
  } catch (err) {
    console.error(`❌ collectDueStats error [${mode}]:`, err)
    throw err
  }
}
