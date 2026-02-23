import React from "react";
import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  showToast,
  Toast,
  showInFileBrowser,
  closeMainWindow,
} from "@vicinae/api";
import { Entry, getEntryPrimaryPath, isEntryMultiFolder } from "../lib/entry";
import { ZedContext, openWithZed } from "../lib/zed";
import { closeZedWindow } from "../lib/utils";
import { getGitBranch } from "../lib/git";

interface EntryItemProps {
  entry: Entry;
  context: ZedContext;
  isPinned: boolean;
  onTogglePin: (entry: Entry) => void;
  onRemove: (entry: Entry) => Promise<void>;
  onRemoveAll: () => Promise<void>;
  onRevalidate: () => Promise<void>;
}

export function EntryItem({
  entry,
  context,
  isPinned,
  onTogglePin,
  onRemove,
  onRemoveAll,
  onRevalidate,
}: EntryItemProps) {
  const primaryPath = getEntryPrimaryPath(entry);
  const isMulti = isEntryMultiFolder(entry);

  async function openEntry(paths: string[]) {
    try {
      await closeMainWindow();
      await openWithZed(context.zedPath, paths);
    } catch (err) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to open in Zed", message: String(err) });
    }
  }

  async function closeEntry() {
    try {
      await closeZedWindow(entry.title);
      await onRevalidate();
    } catch (err) {
      await showToast({ style: Toast.Style.Failure, title: "Failed to close window", message: String(err) });
    }
  }

  const accessories: List.Item.Accessory[] = [];

  if (entry.isOpen) {
    accessories.push({ icon: { source: Icon.Dot, tintColor: Color.Green }, tooltip: "Open" });
  }

  if (isPinned) {
    accessories.push({ icon: { source: Icon.Pin, tintColor: Color.Yellow }, tooltip: "Pinned" });
  }

  if (entry.type === "remote") {
    const label = entry.wsl ? `WSL: ${entry.wsl.distro}` : `SSH: ${entry.uri.split("@").pop()?.split("/")[0] ?? ""}`;
    accessories.push({ tag: { value: label, color: Color.Blue } });
  }

  return (
    <List.Item
      title={entry.title}
      subtitle={entry.subtitle}
      icon={isMulti ? Icon.AppWindowGrid3x3 : Icon.Folder}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action title="Open in Zed" icon={Icon.ArrowRight} onAction={() => openEntry(entry.paths)} />
            {entry.type === "local" && !isMulti && (
              <Action.ShowInFinder path={primaryPath} />
            )}
            {entry.type === "local" && !isMulti && (
              <Action
                title="Show in File Browser"
                icon={Icon.Finder}
                onAction={() => showInFileBrowser(primaryPath)}
              />
            )}
            {entry.isOpen && (
              <Action
                title="Close Project Window"
                icon={Icon.XMarkCircle}
                shortcut={{ modifiers: ["ctrl"], key: "x" }}
                onAction={closeEntry}
              />
            )}
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title={isPinned ? "Unpin Project" : "Pin Project"}
              icon={isPinned ? Icon.PinDisabled : Icon.Pin}
              shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
              onAction={() => onTogglePin(entry)}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            {entry.type === "local" && !isMulti && (
              <Action.CopyToClipboard
                title="Copy Path"
                content={primaryPath}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            )}
            <Action.CopyToClipboard
              title="Copy URI"
              content={entry.uri}
              shortcut={{ modifiers: ["cmd", "opt"], key: "c" }}
            />
          </ActionPanel.Section>

          <ActionPanel.Section>
            <Action
              title="Remove from Recents"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl"], key: "x" }}
              onAction={() => onRemove(entry)}
            />
            <Action
              title="Remove All from Recents"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl", "shift"], key: "x" }}
              onAction={onRemoveAll}
            />
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              onAction={onRevalidate}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
