import readingMap from "./books.json";

export const readingMapUrl = "https://github.com/nagavineerpasam/systems-to-ai-reading-map";
export const bookGroups = ["All", "Foundations", "Backend", "Infra & Ops", "AI"] as const;

export interface Book {
  id: string;
  n: number;
  group: number;
  stage: string;
  title: string;
  authors: string;
  ed: string;
  url: string;
  summary: string;
  topics: readonly { number: number; title: string }[];
  roles: string[];
  aspect: number;
  spine: string;
  short: string;
  color: string;
  ink: string;
  cover: string | null;
}

// Topic list adapted from Vineer Pasam's MIT-licensed Systems to AI reading map.
export const books: Book[] = readingMap;
export const topicCount = books.reduce((count, book) => count + book.topics.length, 0);
export const bookNumber = (book: Book) => String(book.n).padStart(2, "0");
