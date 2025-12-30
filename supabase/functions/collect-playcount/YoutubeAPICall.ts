type VideoStats = {
  view_count: number
  like_count: number
  comment_count: number
}

export const fetchVideoStats = async (
  youtubeVideoId: string,
  apiKey: string
): Promise<VideoStats | null> => {
  // ✅ ここで APIキーと動画ID をログ出力
  //console.log('🔑 apiKey:', apiKey)
  //console.log('🎬 youtubeVideoId:', youtubeVideoId)

  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${youtubeVideoId}&key=${apiKey}`

  try {
    const res = await fetch(url)

    if (!res.ok) {
      // ✅ エラー時にレスポンス本文を出力
      const errorText = await res.text()
      console.error(`❌ YouTube API error for video ${youtubeVideoId}: HTTP ${res.status}`)
      console.error('📩 Error response body:', errorText)
      return null
    }

    const data = await res.json()

    const stats = data.items?.[0]?.statistics
    if (!stats) {
      console.warn(`⚠️ No statistics found for video ${youtubeVideoId}`)
      return null
    }

    return {
      view_count: parseInt(stats.viewCount || '0'),
      like_count: parseInt(stats.likeCount || '0'),
      comment_count: parseInt(stats.commentCount || '0'),
    }
  } catch (err) {
    console.error(`❌ fetchVideoStats failed for video ${youtubeVideoId}:`, err)
    return null
  }
}
