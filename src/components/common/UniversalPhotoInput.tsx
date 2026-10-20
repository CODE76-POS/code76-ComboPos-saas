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

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  // Clean up camera stream on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    stopCamera();
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this browser or device.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission denied. Please allow camera permissions in your browser.'
          : `Unable to access camera: ${err.message || 'Unknown device error'}`
      );
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front-facing camera
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    onChange(dataUrl);
    setUrlInput(dataUrl);
    stopCamera();
    setActiveTab('upload');
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
        setUrlInput(result);
      }
    };
    reader.readAsDataURL(file);
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
          {cameraError ? (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{cameraError}</span>
              <button
                type="button"
                onClick={() => startCamera()}
                className="ml-auto px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-56 flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 gap-2 text-xs">
                  <Camera className="w-6 h-6 animate-pulse text-teal-400" />
                  <span>Initializing live device camera...</span>
                </div>
              )}

              {/* Viewfinder Overlay Lines */}
              {cameraActive && (
                <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-lg flex items-center justify-center">
                  <div className="w-12 h-12 border-2 border-teal-400/60 rounded-full" />
                </div>
              )}
            </div>
          )}

          {cameraActive && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={switchCameraFacing}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip Camera ({cameraFacing === 'user' ? 'Front' : 'Back'})</span>
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>Take Snapshot Photo</span>
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs transition cursor-pointer"
                title="Turn off camera"
              >
                <VideoOff className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
