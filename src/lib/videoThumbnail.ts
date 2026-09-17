/** Captures a frame from a video file as a JPEG blob, for use as a default
 * thumbnail when nothing else is provided. Loads the file into an offscreen
 * <video>, seeks to a representative point, and draws that frame to canvas. */
export function captureVideoFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);
    const fail = () => { cleanup(); resolve(null); };

    video.onloadedmetadata = () => {
      // A couple seconds in (or 10% for very short clips) tends to avoid
      // black frames/intro cards at time zero.
      video.currentTime = Math.min(2, video.duration * 0.1) || 0;
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) return fail();
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => { cleanup(); resolve(blob); }, 'image/jpeg', 0.8);
      } catch {
        fail();
      }
    };
    video.onerror = fail;
  });
}
