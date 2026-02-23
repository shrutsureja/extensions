import { Cache } from "@vicinae/api";
import { Entry } from "./entry";

const PINNED_ENTRIES_V1_KEY = "pinned-entries-v1";
const PINNED_ENTRIES_V2_KEY = "pinned-entries";

export type PinnedEntries = Record<string, boolean>;

export function migratePinnedEntries(cache: Cache): void {
  const v1Raw = cache.get(PINNED_ENTRIES_V1_KEY);
  if (!v1Raw) return;

  try {
    const v1: string[] = JSON.parse(v1Raw);
    const v2: PinnedEntries = {};
    for (const uri of v1) {
      v2[uri] = true;
    }
    cache.set(PINNED_ENTRIES_V2_KEY, JSON.stringify(v2));
    cache.remove(PINNED_ENTRIES_V1_KEY);
  } catch {
    cache.remove(PINNED_ENTRIES_V1_KEY);
  }
}

export function getEntryUri(entry: Entry): string {
  return entry.uri;
}
