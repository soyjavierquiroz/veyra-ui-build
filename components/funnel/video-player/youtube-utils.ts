const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

export function isValidYouTubeVideoId(id: string): boolean {
  return YOUTUBE_VIDEO_ID_PATTERN.test(id.trim())
}

export function extractYouTubeVideoId(input: string): string | null {
  const value = input.trim()
  if (!value) return null

  if (isValidYouTubeVideoId(value)) {
    return value
  }

  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/^www\./, "").toLowerCase()

    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? ""
      return isValidYouTubeVideoId(id) ? id : null
    }

    if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
      const watchId = url.searchParams.get("v")
      if (watchId && isValidYouTubeVideoId(watchId)) {
        return watchId
      }

      const [kind, id] = url.pathname.split("/").filter(Boolean)
      if (
        ["shorts", "embed", "v"].includes(kind ?? "") &&
        id &&
        isValidYouTubeVideoId(id)
      ) {
        return id
      }
    }
  } catch {
    const match = value.match(
      /(?:shorts\/|watch\?v=|watch&v=|youtu\.be\/|embed\/|\/v\/)([A-Za-z0-9_-]{11})/,
    )
    return match && isValidYouTubeVideoId(match[1]) ? match[1] : null
  }

  return null
}
