import { useCallback, useEffect, useState } from 'react'
import { clearResourceCache, fetchResource } from '../api/resumeApi'

export function useApiResource(resourceKey) {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' })
  const [requestId, setRequestId] = useState(0)

  const retry = useCallback(() => {
    clearResourceCache(resourceKey)
    setState({ status: 'loading', data: null, error: '' })
    setRequestId((value) => value + 1)
  }, [resourceKey])

  useEffect(() => {
    const controller = new AbortController()

    fetchResource(resourceKey, controller.signal)
      .then((data) => setState({ status: 'success', data, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState({ status: 'error', data: null, error: error.message })
        }
      })

    return () => controller.abort()
  }, [resourceKey, requestId])

  return { ...state, retry }
}
