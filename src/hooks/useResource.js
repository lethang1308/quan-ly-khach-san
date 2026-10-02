import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
// The explicit key controls fetching. Abort + generation prevent stale date/role responses.
export function useResource(key, fetcher) {
  const { token } = useAuth();
  const request = useRef(fetcher);
  useEffect(() => {
    request.current = fetcher;
  });
  const identity = JSON.stringify([token, key]);
  const [result, setResult] = useState({});
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    request
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ identity, data, revision });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ identity, error, revision });
      });
    return () => controller.abort();
  }, [identity, revision]);
  const current = result.identity === identity && result.revision === revision;
  return {
    data: current ? result.data : undefined,
    error: current ? result.error : undefined,
    loading: !current,
    reload: () => setRevision((value) => value + 1),
  };
}
