const fetchVideoStats = async (youtubeVideoId: string, apiKey: string) => {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${youtubeVideoId}&key=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()

  const stats = data.items?.[0]?.statistics
  if (!stats) return null

  return {
    view_count: parseInt(stats.viewCount || '0'),
    like_count: parseInt(stats.likeCount || '0'),
    comment_count: parseInt(stats.commentCount || '0'),
  }
}
