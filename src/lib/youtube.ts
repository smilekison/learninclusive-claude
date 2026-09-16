// Extract a YouTube video id from any of the common URL shapes:
// https://www.youtube.com/watch?v=<id>, https://youtu.be/<id>,
// https://www.youtube.com/embed/<id>. Returns null for anything else,
// including malformed URLs.
export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/');
      const idx = parts.indexOf('embed');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    // malformed URL — fall through to null
  }
  return null;
}
