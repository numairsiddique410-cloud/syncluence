import { useEffect, useRef } from "react";
import { useChat } from "../context/useChat";

/**
 * Calls fetchFn whenever any of the listed socket event types fire,
 * or when the browser tab regains focus.
 * fetchFn ref is always kept current so stale closures never happen.
 */
export function useAutoRefresh(fetchFn, eventTypes = []) {
  const { onDataEvent } = useChat();
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const typesRef = useRef(eventTypes);

  useEffect(() => {
    const handler = () => fetchRef.current?.();

    const unsubscribers = typesRef.current.map((type) => onDataEvent(type, handler));

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchRef.current?.();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribers.forEach((unsub) => unsub?.());
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [onDataEvent]);
}
