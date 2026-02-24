import { getPreferenceValues, LocalStorage } from "@vicinae/api";
import { nanoid } from "nanoid";
import { Preferences, SearchResult } from "./types";
import fetch from "node-fetch";
import iconv from "iconv-lite";

export async function getSearchHistory(): Promise<SearchResult[]> {
  const { rememberSearchHistory } = getPreferenceValues<Preferences>();
  if (!rememberSearchHistory) return [];
  const historyString = await LocalStorage.getItem<string>("history");
  if (historyString === undefined) return [];
  const items: SearchResult[] = JSON.parse(historyString);
  return items;
}

// Matches URLs with explicit scheme, bare domains with TLD, www prefix, localhost, or IP addresses.
// Does NOT match plain search terms like "how to cook pasta".
export function isUrl(text: string): boolean {
  if (!text) return false;
  // Explicit scheme
  if (/^https?:\/\//i.test(text)) return true;
  // localhost with optional port
  if (/^localhost(:\d+)?/i.test(text)) return true;
  // IP address (v4)
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?/.test(text)) return true;
  // Bare domain: must have a dot, no spaces, valid TLD (2+ chars), no spaces
  const bareDomain = /^(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/[^\s]*)?\.?$/;
  return bareDomain.test(text) && !text.includes(" ");
}

// Normalise a bare URL input to ensure it has a scheme for opening in browser.
export function normalizeUrl(text: string): string {
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
}

export function getStaticResult(searchText: string): SearchResult[] {
  if (!searchText) return [];
  const results: SearchResult[] = [];
  if (isUrl(searchText)) {
    results.push({
      id: nanoid(),
      query: searchText,
      description: `Open '${normalizeUrl(searchText)}'`,
      url: normalizeUrl(searchText),
      isNavigation: true,
    });
  }
  results.push({
    id: nanoid(),
    query: searchText,
    description: `Search Google for '${searchText}'`,
    url: `https://www.google.com/search?q=${encodeURIComponent(searchText)}`,
  });
  return results;
}

export async function getAutoSearchResults(
  searchText: string,
  signal: AbortSignal
): Promise<SearchResult[]> {
  const response = await fetch(
    `https://suggestqueries.google.com/complete/search?hl=en-us&output=chrome&q=${encodeURIComponent(searchText)}`,
    {
      method: "get",
      signal: signal as Parameters<typeof fetch>[1] extends { signal?: infer S } ? S : never,
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    }
  );

  if (!response.ok) return Promise.reject(response.statusText);

  const buffer = await response.arrayBuffer();
  const text = iconv.decode(Buffer.from(buffer), "iso-8859-1");
  const json = JSON.parse(text);
  const results: SearchResult[] = [];

  json[1].map((item: string, i: number) => {
    const type = json[4]["google:suggesttype"][i];
    const description = json[2][i];
    if (type === "NAVIGATION") {
      results.push({
        id: nanoid(),
        query: description.length > 0 ? description : item,
        description: `Open URL for '${item}'`,
        url: item,
        isNavigation: true,
      });
    } else if (type === "QUERY") {
      results.push({
        id: nanoid(),
        query: item,
        description: `Search Google for '${item}'`,
        url: `https://www.google.com/search?q=${encodeURIComponent(item)}`,
      });
    }
  });

  return results;
}
