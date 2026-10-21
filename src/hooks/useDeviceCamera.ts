import { useEffect, useRef, useState } from 'react';
import { cameraErrorText, captureVideoFrame, stopMediaStream } from '../utils/camera.ts';
export function useDeviceCamera(enabled: boolean, facing: 'user'|'environment', request = 0) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase,setPhase] = useState<'idle'|'requesting'|'ready'|'error'>('idle');
  const [error,setError] = useState('');
  const cleanup = useRef<() => void>(()=>{});
  const generation = useRef(0);
  useEffect(() => {
    if (!enabled) { setPhase('idle'); return; }
    // Effects run after the camera tab/video has mounted, unlike the old click handler.
    const run = ++generation.current;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const video = videoRef.current;
    const active = () => generation.current === run;
    const release = () => { if(timer)clearTimeout(timer); stopMediaStream(stream); if(video?.srcObject===stream)video.srcObject=null; };
    cleanup.current = () => { ++generation.current; release(); };
    setError(''); setPhase('requesting');
    const fail = (value: unknown) => { if(!active())return; release(); setError(cameraErrorText(value)); setPhase('error'); };
    const ready = () => { if(active() && video && video.videoWidth>0 && video.readyState>=2) { if(timer)clearTimeout(timer); setPhase('ready'); } };
    video?.addEventListener('loadeddata',ready); video?.addEventListener('canplay',ready);
    (async()=>{
      try {
        if (!window.isSecureContext) throw new Error('Live camera requires HTTPS (or localhost). Use the secure preview or choose a device photo.');
        const policy = (document as Document & {permissionsPolicy?:{allowsFeature:(name:string)=>boolean};featurePolicy?:{allowsFeature:(name:string)=>boolean}}).permissionsPolicy || (document as any).featurePolicy;
        if (policy?.allowsFeature('camera') === false) throw new DOMException('Embedded host denied camera','NotAllowedError');
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Live camera is unavailable in this browser. Use the device-camera/file option.');
        try { stream = await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720}}}); }
        catch (reason) { if(!active())return; if((reason as DOMException).name!=='OverconstrainedError')throw reason; stream=await navigator.mediaDevices.getUserMedia({audio:false,video:true}); }
        if (!active() || !video) { stopMediaStream(stream); return; }
        video.srcObject=stream;
        await video.play(); if(!active()) {release();return;} ready();
        timer=setTimeout(()=>{if(active() && video.readyState<2)fail(new Error('Camera opened but no image arrived. Retry or choose a device photo.'));},10_000);
      } catch(reason) { fail(reason); }
    })();
    return () => { ++generation.current; video?.removeEventListener('loadeddata',ready); video?.removeEventListener('canplay',ready); release(); };
  },[enabled,facing,request]);
  return { videoRef, phase, error, stop:()=>{cleanup.current();setPhase('idle');}, capture:()=>{if(!videoRef.current || phase!=='ready')throw new Error('Wait for the camera preview.');return captureVideoFrame(videoRef.current);} };
}
