import { useEffect, useState } from 'react'
import type { NewsFeed } from '../types'

export function useNewsFeed() {
  const [feed, setFeed] = useState<NewsFeed | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('./data/news.json')
      .then((response) => {
        if (!response.ok) throw new Error('News feed unavailable')
        return response.json() as Promise<NewsFeed>
      })
      .then(setFeed)
      .catch(() => setError(true))
  }, [])

  return { feed, error }
}
