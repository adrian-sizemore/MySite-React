import { useCallback, useEffect, useState } from 'react'

const normalizePath = (path) => path.replace(/^\/+|\/+$/g, '') || 'home'

export function useRoute() {
  const [route, setRoute] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path)
    setRoute(normalizePath(path))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return { route, navigate }
}
