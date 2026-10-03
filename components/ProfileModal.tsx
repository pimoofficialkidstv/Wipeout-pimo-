import React, { useRef, useState, useEffect } from 'react';
import { getTranslation } from '../src/translations';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (image: string) => void;
  isMoroPlus?: boolean;
  language: string;
  username?: string;
  highScore?: number;
  onOpenAuth?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, isMoroPlus, language, username, highScore = 0, onOpenAuth }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const isPro = highScore >= 5000;

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(getTranslation('ERROR_CAMERA_NOT_SUPPORTED', language));
      return;
    }
    if (!window.isSecureContext) {
      setError(getTranslation('ERROR_CAMERA_SECURE_CONTEXT', language));
      return;
    }
    setIsCameraLoading(true);
    setError(null);
    try {
      // Try with ideal constraints first
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      setIsCameraLoading(false);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(getTranslation('ERROR_CAMERA_PERMISSION_DENIED', language));
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError(getTranslation('ERROR_CAMERA_NOT_FOUND', language));
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError(getTranslation('ERROR_CAMERA_IN_USE', language));
      } else {
        // Try one more time with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(basicStream);
          setIsCameraActive(true);
          setIsCameraLoading(false);
          return;
        } catch (retryErr) {
          setError(getTranslation('ERROR_CAMERA_GENERIC', language));
        }
      }
      setIsCameraLoading(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraActive, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Draw the video frame to the canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/png');
        onSave(imageData);
        stopCamera();
        onClose();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(getTranslation('ERROR_SELECT_IMAGE', language));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onSave(result);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-900/20 dark:border-white/20 rounded-[3rem] w-full max-w-lg p-10 relative shadow-2xl overflow-hidden">
        <button 
          onClick={() => { stopCamera(); onClose(); }} 
          className="absolute top-6 right-6 w-12 h-12 bg-slate-900/10 dark:bg-white/10 rounded-full text-slate-900 dark:text-white hover:bg-slate-900/20 dark:bg-white/20 transition-all z-10"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <h3 className="text-4xl font-fredoka text-slate-900 dark:text-white mb-2 text-center">{getTranslation('PROFILE_PHOTO', language)}</h3>
        <div className="flex items-center justify-center gap-2 mb-4">
          {username && <p className="text-center text-slate-500 font-fredoka">@{username}</p>}
          {isPro && (
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1 border border-amber-300/50 animate-pulse">
              <i className="fa-solid fa-crown text-yellow-200"></i> PRO
            </span>
          )}
        </div>

        {/* Milestone Status Card */}
        {isPro ? (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 rounded-2xl p-3 mb-6 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white shadow-md text-base shrink-0">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  PRO Tier Unlocked
                  <i className="fa-solid fa-circle-check text-amber-500 text-xs"></i>
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  Classic High Score: {highScore.toLocaleString()}m (Milestone &gt; 5,000m)
                </span>
              </div>
            </div>
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-md">
              PRO
            </span>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 mb-6 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 text-[11px]">
                <i className="fa-solid fa-trophy text-amber-500"></i> PRO Tier Milestone Progress
              </span>
              <span className="font-mono text-[10px] font-extrabold text-slate-500">{highScore.toLocaleString()} / 5,000m</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (highScore / 5000) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Score over 5,000m in Classic Map to earn the PRO Tier badge!</p>
          </div>
        )}

        <div className="relative aspect-square w-full max-w-[320px] mx-auto bg-slate-100 dark:bg-slate-800 rounded-[2rem] overflow-hidden border-4 border-slate-900/10 dark:border-white/10 mb-8 flex items-center justify-center">
          {/* Pro Tier Badge Overlay */}
          {isPro && (
            <div className="absolute top-4 left-4 z-30 bg-gradient-to-r from-amber-500 to-orange-600 border border-amber-300/50 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-xl flex items-center gap-1.5 animate-bounce">
              <i className="fa-solid fa-crown text-yellow-200"></i>
              PRO TIER
            </div>
          )}

          {isMoroPlus && (
            <div className="absolute top-4 right-4 z-30 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-2">
              <i className="fa-solid fa-plus-circle"></i>
              PLUS
            </div>
          )}
          {isCameraLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {isCameraActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              width="640"
              height="640"
              onCanPlay={() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(e => console.error("Error playing video:", e));
                }
              }}
              className="w-full h-full object-cover scale-x-[-1]" 
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <i className="fa-solid fa-camera text-6xl"></i>
              {error ? (
                <p className="text-red-400 text-center px-6 text-sm">{error}</p>
              ) : (
                <p className="font-fredoka">{getTranslation('CAMERA_OFF', language)}</p>
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex flex-col gap-4">
          {!isCameraActive ? (
            <>
              <button 
                onClick={startCamera}
                className="w-full bg-purple-600 text-slate-900 dark:text-white font-fredoka py-6 rounded-3xl text-2xl shadow-[0_8px_0_#581c87] hover:translate-y-1 active:translate-y-3 transition-all flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-power-off"></i>
                {getTranslation('TURN_ON_CAMERA', language)}
              </button>
              <button 
                onClick={triggerFileUpload}
                className="w-full bg-blue-600 text-slate-900 dark:text-white font-fredoka py-6 rounded-3xl text-2xl shadow-[0_8px_0_#1e3a8a] hover:translate-y-1 active:translate-y-3 transition-all flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-upload"></i>
                {getTranslation('UPLOAD_PHOTO', language)}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </>
          ) : (
            <button 
              onClick={capturePhoto}
              className="w-full bg-slate-900 dark:bg-white text-slate-900 font-fredoka py-6 rounded-3xl text-2xl shadow-[0_8px_0_#cbd5e1] hover:translate-y-1 active:translate-y-3 transition-all flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-camera"></i>
              {getTranslation('TAKE_PHOTO', language)}
            </button>
          )}
          
          {onOpenAuth && (
            <button 
              onClick={() => { stopCamera(); onClose(); onOpenAuth(); }}
              className="w-full bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white font-fredoka py-3 rounded-2xl text-base hover:bg-slate-900/15 dark:bg-white/15 transition-all flex items-center justify-center gap-2 border border-slate-900/10 dark:border-white/10"
            >
              <i className="fa-solid fa-right-to-bracket text-amber-500"></i>
              Log In / Switch Account (Wipeout Pimo)
            </button>
          )}

          <button 
            onClick={() => { stopCamera(); onClose(); }}
            className="w-full bg-slate-900/5 dark:bg-white/5 text-slate-900 dark:text-white font-fredoka py-4 rounded-2xl text-lg hover:bg-slate-900/10 dark:bg-white/10 transition-all"
          >
            {getTranslation('CANCEL', language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
