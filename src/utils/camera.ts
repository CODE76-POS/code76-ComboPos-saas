export function stopMediaStream(stream?: Pick<MediaStream,'getTracks'> | null): void { stream?.getTracks().forEach(track => track.stop()); }
export function cameraErrorText(error: unknown): string {
  const name = (error as {name?:string})?.name;
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'Camera permission was denied or blocked by this embedded preview. Allow camera access for the app in your browser. If the host blocks it, use the device-camera/file option below.';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'No camera was found. Connect a camera or use the device-camera/file option.';
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'The camera is busy or unavailable. Close other apps using it, then retry.';
  if (name === 'OverconstrainedError') return 'This camera cannot provide the requested mode. Try the other camera or upload a photo.';
  return error instanceof Error ? error.message : 'The camera could not be opened. Retry or use a device photo.';
}
export function captureVideoFrame(video: Pick<HTMLVideoElement,'videoWidth'|'videoHeight'|'readyState'>, createCanvas = () => document.createElement('canvas')): string {
  if (video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) throw new Error('Wait for the live camera image before taking a photo.');
  const canvas = createCanvas();
  const scale = Math.min(1, 1024 / Math.max(video.videoWidth,video.videoHeight));
  canvas.width = Math.max(1,Math.round(video.videoWidth*scale)); canvas.height = Math.max(1,Math.round(video.videoHeight*scale));
  const context = canvas.getContext('2d'); if (!context) throw new Error('This browser could not capture an image. Use a device photo instead.');
  // Preview can be mirrored; saved product/document text remains readable.
  context.drawImage(video as HTMLVideoElement,0,0,canvas.width,canvas.height);
  const result = canvas.toDataURL('image/jpeg',0.85);
  if (!result.startsWith('data:image/jpeg;base64,') || result.length < 100) throw new Error('The camera did not return a valid photo. Please retry.');
  return result;
}
