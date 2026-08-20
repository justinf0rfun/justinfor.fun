import records from "./memories.json";

export interface MemoryPhoto {
  id: string;
  month: string;
  location: string;
  roll: number;
  order: number;
  src: string;
  objectKey: string;
  width: number;
  height: number;
  alt: string;
  index: number;
  ratio: number;
}

const sortedRecords = records.toSorted(
  (a, b) => b.month.localeCompare(a.month) || a.roll - b.roll || a.order - b.order,
);

export const memoryPhotos: MemoryPhoto[] = sortedRecords.map((photo, index) => ({
  ...photo,
  index,
  ratio: photo.width / photo.height,
}));

export const folderMemoryPhotos = memoryPhotos.slice(0, 5);

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const memoryMonths = [...Map.groupBy(memoryPhotos, (photo) => photo.month)].map(
  ([month, photos]) => ({
    label: monthFormatter.format(new Date(`${month}-01T00:00:00Z`)),
    dateTime: month,
    location: [...new Set(photos.map((photo) => photo.location))].join(" · "),
    rolls: [...Map.groupBy(photos, (photo) => photo.roll).values()],
  }),
);
