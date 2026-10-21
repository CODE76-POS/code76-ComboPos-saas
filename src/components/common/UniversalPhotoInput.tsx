import { useDeviceCamera } from '../../hooks/useDeviceCamera.ts';
import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  HardDrive,
  Link2,
  X,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  VideoOff,
} from 'lucide-react';

interface UniversalPhotoInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  aspectRatio?: 'square' | 'wide' | 'auto';
  placeholder?: string;
  helperText?: string;
}

export const UniversalPhotoInput: React.FC<UniversalPhotoInputProps> = ({
  label = 'Photo / Image Attachment',
  value,
  onChange,
  required = false,
  aspectRatio = 'square',
  placeholder = 'https://images.unsplash.com/...',
  helperText,
}) => {
  type TabType = 'upload' | 'camera' | 'link' | 'drive';
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const [driveInput, setDriveInput] = useState('');
  const [driveError, setDriveError] = useState('');
  const alive = useRef(true);
  const fileRun = useRef(0);
  const changeRef = useRef(onChange); changeRef.current=onChange;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;++fileRun.current;};},[]);

  const [cameraEnabled,setCameraEnabled] = useState(false);
  const [cameraAttempt,setCameraAttempt] = useState(0);
  const [cameraFacing,setCameraFacing] = useState<'user'|'environment'>('user');
  const [captureError,setCaptureError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const camera = useDeviceCamera(activeTab === 'camera' && cameraEnabled,cameraFacing,cameraAttempt);
  const cameraActive = camera.phase === 'ready';
  const videoRef = camera.videoRef;
  const cameraError = captureError || camera.error;
  useEffect(() => { setUrlInput(value || ''); },[value]);
  const stopCamera = () => { camera.stop(); setCameraEnabled(false); };
  const startCamera = () => { setCaptureError(''); setCameraEnabled(true); setCameraAttempt(value=>value+1); };
  const capturePhoto = () => {
    try { const dataUrl=camera.capture(); onChange(dataUrl); setUrlInput(dataUrl); stopCamera(); setActiveTab('upload'); }
    catch(error) { setCaptureError(error instanceof Error?error.message:'Could not capture a frame.'); }
  };
  const switchCameraFacing = () => { setCaptureError(''); setCameraFacing(value=>value==='user'?'environment':'user'); setCameraEnabled(true); };

  const handleFile = async (file: File) => {
    const run=++fileRun.current;
    if(file.size>10*1024*1024){setCaptureError('Choose an image smaller than 10 MB.');return;}
    if(!file.type.startsWith('image/')){setCaptureError('Choose an image file (PNG, JPEG, WEBP, etc.).');return;}
    setCaptureError(''); const objectUrl=URL.createObjectURL(file);
    try {
      const image=new Image(); image.src=objectUrl; await image.decode();
      if(!alive.current || run!==fileRun.current)return;
      const scale=Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const context=canvas.getContext('2d');if(!context)throw new Error('Cannot read this photo.');
      context.drawImage(image,0,0,canvas.width,canvas.height);
      const result=canvas.toDataURL(file.type==='image/png'||file.type==='image/svg+xml'?'image/png':'image/jpeg',0.85);
      changeRef.current(result);setUrlInput(result);
    }catch{if(alive.current && run===fileRun.current)setCaptureError('The image could not be read. Choose another photo.');}
    finally{URL.revokeObjectURL(objectUrl);}
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Google Drive URL extractor
  const handleApplyGoogleDrive = () => {
    setDriveError('');
    if (!driveInput.trim()) {
      setDriveError('Please enter a Google Drive link or file ID');
      return;
    }

    const driveRegex = /(?:id=|\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
    const match = driveInput.match(driveRegex);
    const fileId = match ? match[1] : driveInput.trim();

    if (!fileId || fileId.length < 10) {
      setDriveError('Could not identify a valid Google Drive file ID from that link.');
      return;
    }

    // Google Drive direct export / thumbnail URL
    const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    onChange(directUrl);
    setUrlInput(directUrl);
    setDriveInput('');
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setDriveInput('');
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition font-medium"
          >
            <X className="w-3 h-3" />
            Remove Photo
          </button>
        )}
      </div>

      {/* Main Tab Bar */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setActiveTab('upload');
          }}
          className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Upload or Drag from Device"
        >
          <Upload className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Device / Drag</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('camera');
            startCamera();
          }}
          className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'camera'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Take picture with device camera"
        >
          <Camera className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
          <span className="truncate">Camera</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stopCamera();
            setActiveTab('link');
          }}
          className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'link'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Give link of photo"
        >
          <Link2 className="w-3.5 h-3.5 shrink-0 text-amber-300" />
          <span className="truncate">Photo Link</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stopCamera();
            setActiveTab('drive');
          }}
          className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'drive'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Get from Google Drive"
        >
          <HardDrive className="w-3.5 h-3.5 shrink-0 text-sky-300" />
          <span className="truncate">Google Drive</span>
        </button>
      </div>

      {/* Hidden native input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        accept="image/*"
        className="hidden"
      />

      {captureError && activeTab!=='camera' && <p role="alert" className="text-xs text-amber-300">{captureError}</p>}
      {/* Tab Panels */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-teal-400 bg-teal-500/15 scale-[1.01]'
              : 'border-slate-700 bg-slate-900/60 hover:bg-slate-900/90 hover:border-teal-500/50'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Drag & Drop photo here, or <span className="text-teal-400 underline">Browse Device</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Supports JPEG, PNG, WEBP, GIF, SVG (Up to 10MB)
            </span>
          </div>
        </div>
      )}

      {activeTab === 'camera' && (
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-64">
            <video ref={videoRef} aria-label="Live camera preview" data-camera-phase={camera.phase} autoPlay playsInline muted className={`w-full h-full object-contain ${cameraFacing==='user'?'scale-x-[-1]':''}`} />
            {!cameraActive && <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-slate-300 bg-slate-900/70" role="status">{camera.phase==='requesting'?'Waiting for camera permission and a live image…':camera.phase==='error'?'Camera is not ready. See the message below.':'Camera is off.'}</div>}
          </div>
          {cameraError && <p role="alert" className="rounded-xl border border-amber-800 p-3 text-xs text-amber-300">{cameraError}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={startCamera} className="rounded-xl border border-slate-700 px-3 py-2 text-xs">{cameraEnabled?'Retry camera':'Start camera'}</button>
            <button type="button" onClick={switchCameraFacing} className="rounded-xl border border-slate-700 px-3 py-2 text-xs">Flip Camera ({cameraFacing==='user'?'Front':'Back'})</button>
            <button type="button" onClick={capturePhoto} disabled={!cameraActive} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Take Snapshot Photo</button>
            <button type="button" onClick={stopCamera} className="rounded-xl border border-slate-700 px-3 py-2 text-xs" aria-label="Turn off camera">Stop camera</button>
          </div>
          <button type="button" onClick={()=>nativeCameraRef.current?.click()} className="text-xs text-teal-300 underline">Use device camera / choose a photo instead</button>
          <input ref={nativeCameraRef} type="file" accept="image/*" capture={cameraFacing} className="hidden" aria-label="Device camera photo" onChange={event=>{const file=event.target.files?.[0];if(file){handleFile(file);stopCamera();setActiveTab('upload');}}}/>
          <p className="text-[10px] text-slate-400">Live camera needs HTTPS, browser permission and permission from an embedding host. The app cannot override a host’s camera policy. Captures stay local until you save the entry.</p>
        </div>
      )}

      {activeTab === 'link' && (
        <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              Apply Link
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Paste any direct image URL (Unsplash, Cloudinary, AWS S3, Shopify CDN, etc.)
          </p>
        </div>
      )}

      {activeTab === 'drive' && (
        <div className="bg-sky-950/20 p-3 rounded-2xl border border-sky-500/30 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={driveInput}
              onChange={(e) => setDriveInput(e.target.value)}
              placeholder="Paste Google Drive link: https://drive.google.com/file/d/1a2b3c.../view"
              className="flex-1 bg-slate-950 border border-sky-500/40 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
            />
            <button
              type="button"
              onClick={handleApplyGoogleDrive}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              Import Drive
            </button>
          </div>
          {driveError ? (
            <p className="text-[11px] text-rose-400">{driveError}</p>
          ) : (
            <p className="text-[10px] text-sky-300">
              Automatically converts public Google Drive share links into instant direct image URLs.
            </p>
          )}
        </div>
      )}

      {/* Live Preview Box */}
      {value ? (
        <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-teal-500/30">
          <div
            className={`rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 ${
              aspectRatio === 'wide' ? 'w-24 h-14' : 'w-14 h-14'
            }`}
          >
            <img
              src={value}
              alt="Photo Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Photo Attached</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
              {value.startsWith('data:') ? 'Captured / Uploaded Image' : value}
            </p>
          </div>
        </div>
      ) : (
        helperText && <p className="text-[11px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
};
