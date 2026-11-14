const images = new Map<string, Promise<boolean>>();

export function prepareIntroImage(src: string): Promise<boolean> {
  const cached = images.get(src);
  if (cached) return cached;
  const image = new Image();
  image.src = src;
  const ready = image.decode().then(() => true, () => false).then(loaded => {
    if (!loaded) images.delete(src);
    return loaded;
  });
  images.set(src, ready);
  return ready;
}
