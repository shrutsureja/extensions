import { useState, useEffect, useCallback } from "react";
import { Cache } from "@vicinae/api";
import { Entry } from "../lib/entry";
import { migratePinnedEntries, PinnedEntries } from "../lib/pinned-entries-migration";

const PINNED_ENTRIES_CACHE_KEY = "pinned-entries";
const cache = new Cache();

export function usePinnedEntries() {
  const [pinnedEntries, setPinnedEntriesState] = useState<PinnedEntries>(() => {
    migratePinnedEntries(cache);
    const raw = cache.get(PINNED_ENTRIES_CACHE_KEY);
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    cache.set(PINNED_ENTRIES_CACHE_KEY, JSON.stringify(pinnedEntries));
  }, [pinnedEntries]);

  const isPinned = useCallback(
    (entry: Entry) => Boolean(pinnedEntries[entry.uri]),
    [pinnedEntries]
  );

  const pinEntry = useCallback((entry: Entry) => {
    setPinnedEntriesState((prev) => ({ ...prev, [entry.uri]: true }));
  }, []);

  const unpinEntry = useCallback((entry: Entry) => {
    setPinnedEntriesState((prev) => {
      const next = { ...prev };
      delete next[entry.uri];
      return next;
    });
  }, []);

  const togglePin = useCallback(
    (entry: Entry) => {
      if (isPinned(entry)) {
        unpinEntry(entry);
      } else {
        pinEntry(entry);
      }
    },
    [isPinned, pinEntry, unpinEntry]
  );

  return { pinnedEntries, isPinned, pinEntry, unpinEntry, togglePin };
}
