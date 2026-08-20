import records from "./x-bookmarks.json";

export const xBookmarks = records.toSorted((a, b) => b.savedAt.localeCompare(a.savedAt));
export const folderXBookmarks = xBookmarks.slice(0, 4);
