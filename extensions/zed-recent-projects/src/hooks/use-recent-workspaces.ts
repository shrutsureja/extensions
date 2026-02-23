import { useState, useEffect, useCallback } from "react";
import { Alert, confirmAlert, showToast, Toast } from "@vicinae/api";
import { ZedContext, getRecentWorkspaces } from "../lib/zed";
import { Entry, getEntry } from "../lib/entry";
import { getOpenZedWindowTitles } from "../lib/utils";
import { executeOnDb } from "../lib/db";

export function useRecentWorkspaces(context: ZedContext | null) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const revalidate = useCallback(async () => {
    if (!context) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const openTitles = await getOpenZedWindowTitles();
      const workspaces = await getRecentWorkspaces(context);
      const result: Entry[] = [];
      for (const workspace of workspaces) {
        const entry = getEntry(workspace);
        if (!entry) continue;
        const isOpen = openTitles.some((title) =>
          entry.paths.some((p) => title.includes(p.split("/").pop() ?? ""))
        );
        result.push({ ...entry, isOpen });
      }
      setEntries(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  useEffect(() => {
    revalidate();
  }, [revalidate]);

  const removeEntry = useCallback(
    async (entry: Entry) => {
      if (!context) return;
      try {
        await executeOnDb(
          context.dbPath,
          `DELETE FROM workspaces WHERE workspace_id = ${entry.id};`
        );
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
        await showToast({ style: Toast.Style.Success, title: "Removed from recents" });
      } catch (err) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to remove entry",
          message: String(err),
        });
      }
    },
    [context]
  );

  const removeAllEntries = useCallback(async () => {
    if (!context) return;
    const confirmed = await confirmAlert({
      title: "Remove All Recent Projects",
      message: "This will clear all Zed recent project history. This cannot be undone.",
      primaryAction: { title: "Remove All", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    try {
      await executeOnDb(context.dbPath, `DELETE FROM workspaces;`);
      setEntries([]);
      await showToast({ style: Toast.Style.Success, title: "Cleared all recent projects" });
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to clear projects",
        message: String(err),
      });
    }
  }, [context]);

  return { entries, isLoading, error, revalidate, removeEntry, removeAllEntries };
}
