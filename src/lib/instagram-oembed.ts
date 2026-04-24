type OEmbedItem = {
  thumbnailUrl: string;
  postUrl: string;
};

export function isInstagramUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "www.instagram.com" || parsed.hostname === "instagram.com") &&
      (parsed.pathname.startsWith("/p/") || parsed.pathname.startsWith("/reel/"))
    );
  } catch {
    return false;
  }
}

async function fetchOEmbedThumbnail(postUrl: string): Promise<OEmbedItem | null> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) return null;

  try {
    const accessToken = `${appId}|${appSecret}`;
    const endpoint = `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(postUrl)}&access_token=${encodeURIComponent(accessToken)}&fields=thumbnail_url`;

    const res = await fetch(endpoint, { next: { revalidate: 3600 } });

    if (!res.ok) return null;

    const data = (await res.json()) as { thumbnail_url?: string };

    if (!data.thumbnail_url) return null;

    return { thumbnailUrl: data.thumbnail_url, postUrl };
  } catch {
    return null;
  }
}

export async function fetchInstagramGallery(postUrls: string[]): Promise<OEmbedItem[]> {
  const results = await Promise.allSettled(postUrls.map(fetchOEmbedThumbnail));
  return results
    .filter(
      (r): r is PromiseFulfilledResult<OEmbedItem> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);
}
