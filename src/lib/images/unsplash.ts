/** Ajusta URLs de Unsplash para variantes más livianas en mobile (sin optimizer de Vercel). */
export function unsplashSrcForWidth(src: string, width: number) {
  if (!src.includes("images.unsplash.com")) {
    return src;
  }

  try {
    const url = new URL(src);
    const originalWidth = Number(url.searchParams.get("w")) || width;
    const originalHeight = Number(url.searchParams.get("h"));
    url.searchParams.set("w", String(width));
    url.searchParams.set("fit", "crop");
    if (Number.isFinite(originalHeight) && originalWidth > 0) {
      url.searchParams.set("h", String(Math.round((originalHeight * width) / originalWidth)));
    }
    return url.toString();
  } catch {
    return src;
  }
}
