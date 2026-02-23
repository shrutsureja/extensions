import React from "react";
import { Icon, List } from "@vicinae/api";
import { WithZed } from "./components/with-zed";
import { EntryItem } from "./components/entry-item";
import { useRecentWorkspaces } from "./hooks/use-recent-workspaces";
import { usePinnedEntries } from "./hooks/use-pinned-entries";
import { ZedContext } from "./lib/zed";
import { Entry } from "./lib/entry";

function SearchView({ context }: { context: ZedContext }) {
  const { entries, isLoading, error, revalidate, removeEntry, removeAllEntries } =
    useRecentWorkspaces(context);
  const { isPinned, togglePin } = usePinnedEntries();

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Warning}
          title="Failed to Load Projects"
          description={error.message}
        />
      </List>
    );
  }

  const pinnedEntries = entries.filter((e) => isPinned(e));
  const recentEntries = entries.filter((e) => !isPinned(e));

  const renderItem = (entry: Entry) => (
    <EntryItem
      key={entry.id}
      entry={entry}
      context={context}
      isPinned={isPinned(entry)}
      onTogglePin={togglePin}
      onRemove={removeEntry}
      onRemoveAll={removeAllEntries}
      onRevalidate={revalidate}
    />
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search recent projects...">
      {pinnedEntries.length > 0 && (
        <List.Section title="Pinned">{pinnedEntries.map(renderItem)}</List.Section>
      )}
      <List.Section title="Recent Projects">{recentEntries.map(renderItem)}</List.Section>
      <List.EmptyView
        icon={Icon.Folder}
        title="No Recent Projects"
        description="Open a project in Zed to see it here."
      />
    </List>
  );
}

export default function Command() {
  return <WithZed>{(context) => <SearchView context={context} />}</WithZed>;
}
