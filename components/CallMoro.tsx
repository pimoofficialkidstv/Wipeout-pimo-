import React, { useState, useEffect, useRef } from 'react';
import Moro3D from './Moro3D';
import { Character } from '../types';
import { chatWithMoro } from '../services/geminiService';
import { getMoroVoice, playAudio } from '../src/services/ttsService';

interface CallMoroProps {
  character: Character;
  onEndCall: () => void;
  playerName?: string;
}

const CallMoro: React.FC<CallMoroProps> = ({ character, onEndCall, playerName }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isTalking, setIsTalking] = useState(false);
  const [isAngry, setIsAngry] = useState(false);
  const [isUpset, setIsUpset] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [moroMessage, setMoroMessage] = useState('Hello human. I am Pimo. What do you want?');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [micNotFound, setMicNotFound] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [isErrorDismissed, setIsErrorDismissed] = useState(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendMessageRef = useRef<((text?: string) => void) | null>(null);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const handleSendMessage = async (textToProcess?: string) => {
    const message = (typeof textToProcess === 'string' ? textToProcess : inputText).trim();
    if (!message && !selectedImage) return;
    if (isProcessing) return;

    const currentImage = selectedImage;
    setInputText('');
    setSelectedImage(null);
    setIsProcessing(true);

    try {
      // Sanitize chat history to ensure no events or non-string objects are passed
      const sanitizedHistory = chatHistory.map(item => ({
        role: item.role,
        parts: item.parts.map((part: any) => {
          if (part.text) return { text: part.text };
          if (part.inlineData) return { inlineData: part.inlineData };
          return { text: '[Invalid Part]' };
        })
      }));

      const response = await chatWithMoro(message, sanitizedHistory, currentImage || undefined);
      setMoroMessage(response.text);
      setIsAngry(response.isAngry);
      setIsUpset(response.isUpset);
      
      const newUserParts: any[] = [{ text: message }];
      if (currentImage) {
        newUserParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: currentImage.split(',')[1] || currentImage
          }
        });
      }

      setChatHistory(prev => [
        ...prev, 
        { role: 'user', parts: newUserParts },
        { role: 'model', parts: [{ text: response.text }] }
      ]);

      await playMoroVoice(response.text);
    } catch (error) {
      console.error("Error chatting:", error);
      setMoroMessage("Connection error. The stars must be interfering.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  useEffect(() => {
    // Check for secure context
    if (!window.isSecureContext) {
      setIsSecure(false);
    }

    // Check for mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSpeechSupported(false);
    }

    // Check initial permission status if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as any }).then((result) => {
        setMicPermissionStatus(result.state as any);
        if (result.state === 'denied') {
          setPermissionDenied(true);
        }
        result.onchange = () => {
          setMicPermissionStatus(result.state as any);
          if (result.state === 'granted') {
            setPermissionDenied(false);
            setMicNotFound(false);
            setIsErrorDismissed(false);
          } else if (result.state === 'denied') {
            setPermissionDenied(true);
            setIsMuted(true);
          }
        };
      }).catch(err => {
        console.warn("Permissions API not supported for microphone", err);
        setMicPermissionStatus('unknown');
      });
    }

    // Check if any audio input devices exist
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const hasMic = devices.some(device => device.kind === 'audioinput');
      if (!hasMic && devices.length > 0) {
        setMicNotFound(true);
      }
    }).catch(err => console.warn("Could not enumerate devices", err));
  }, []);

  useEffect(() => {
    if (permissionDenied && !isErrorDismissed) {
      setIsUpset(true);
      playMoroVoice("Human, I can't hear you! Your browser is blocking my ears. Moro is getting lonely! Please fix it in your settings.");
    } else if (!permissionDenied) {
      setIsUpset(false);
    }
  }, [permissionDenied, isErrorDismissed]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInputText(finalTranscript);
          if (handleSendMessageRef.current) {
            handleSendMessageRef.current(finalTranscript);
          }
        } else if (interimTranscript) {
          setInputText(interimTranscript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Restart if not muted
        if (!isMutedRef.current) {
          try {
            recognition.start();
          } catch (e: any) {
            if (e.name !== 'InvalidStateError') {
              console.error("Could not restart recognition", e);
            }
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setIsMuted(true);
          setPermissionDenied(true);
        }
        if (event.error === 'no-speech') {
          // Ignore no-speech errors, they happen when it's quiet
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }

    // Start camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable", err);
        setIsCameraOn(false);
      }
    };
    startCamera();

    playMoroVoice(moroMessage);

    // Call Timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      if (!isMuted) {
        try {
          recognitionRef.current.start();
        } catch (e: any) {
          if (e.name !== 'InvalidStateError') {
            console.error("Error starting recognition", e);
          }
        }
      } else {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping recognition", e);
        }
        setIsListening(false);
      }
    }
  }, [isMuted]);

  const toggleMute = async () => {
    if (isMuted) {
      try {
        // Explicitly request microphone permission first
        // This helps trigger the browser permission prompt if SpeechRecognition fails to do so
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // We don't need to keep the stream, just get the permission
        stream.getTracks().forEach(track => track.stop());
        
        setIsMuted(false);
        setPermissionDenied(false);
        setIsErrorDismissed(false);
        
        // Ensure recognition starts
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e: any) {
            if (e.name !== 'InvalidStateError') console.error("Recognition start error", e);
          }
        }
      } catch (err: any) {
        // Only log as error if it's not a simple permission denial which we already handle in UI
        if (err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError') {
          console.error("Microphone access error:", err);
        }
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
          setMicPermissionStatus('denied');
          setIsErrorDismissed(false);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMicNotFound(true);
          setIsErrorDismissed(false);
        } else {
          setPermissionDenied(true);
          setIsErrorDismissed(false);
        }
      }
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    }
  };

  const toggleCamera = async () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (err) {
        console.warn("Camera access denied or unavailable", err);
        setIsCameraOn(false);
      }
    }
  };

  const playMoroVoice = async (text: string) => {
    setIsTalking(true);
    try {
      const audioBase64 = await getMoroVoice(text);
      if (audioBase64) {
        await playAudio(audioBase64);
      } else {
        // Fallback to Web Speech API
        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.pitch = 1.5; // Alien-like
          utterance.rate = 1.2;
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTalking(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-slate-900 dark:text-white font-fredoka text-xl">Call with Pimo</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setChatHistory([])}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm bg-slate-700/50 px-3 py-1 rounded-full transition-colors"
          >
            Clear History
          </button>
          <div className="text-slate-500 dark:text-slate-400 font-mono">{formatTime(callDuration)}</div>
        </div>
      </div>

      {/* Main Call Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Chat History Sidebar (Desktop) */}
        <div className="hidden md:flex w-80 bg-slate-800/30 border-r border-slate-700/50 flex-col">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-slate-500 dark:text-slate-400 font-fredoka uppercase text-xs tracking-widest">Chat History</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <p className="text-slate-500 text-sm text-center mt-10 italic">No messages yet...</p>
            )}
            {chatHistory.map((chat, i) => (
              <div key={i} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-sm ${
                  chat.role === 'user' ? 'bg-blue-600 text-slate-900 dark:text-white rounded-tr-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-200 rounded-tl-none'
                }`}>
                  {chat.parts.map((part: any, j: number) => (
                    <div key={j}>
                      {part.text && <p>{part.text}</p>}
                      {part.inlineData && (
                        <img 
                          src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                          alt="Uploaded" 
                          className="mt-2 rounded-lg max-w-full h-auto"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center">
          {!isErrorDismissed && (!isSecure || !isSpeechSupported || micNotFound || permissionDenied) && (
            <div className="absolute inset-0 bg-slate-900/95 z-[60] flex items-center justify-center p-6 text-center overflow-y-auto">
              <div className="max-w-md bg-slate-100 dark:bg-slate-800 p-8 rounded-3xl border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] my-auto relative">
                <button 
                  onClick={() => setIsErrorDismissed(true)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:text-white transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>

                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className={`fa-solid ${micNotFound ? 'fa-plug-circle-xmark' : 'fa-microphone-slash'} text-red-500 text-4xl`}></i>
                </div>
                
                <h2 className="text-2xl font-fredoka text-slate-900 dark:text-white mb-4">
                  {!isSecure ? 'Insecure Context' : 
                   !isSpeechSupported ? 'Browser Not Supported' :
                   micNotFound ? 'Microphone Not Found' : 'Microphone Blocked!'}
                </h2>
                
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  {!isSecure ? 'Voice features require a secure (HTTPS) connection. Please check your URL.' :
                   !isSpeechSupported ? 'Your browser does not support voice recognition. Try using Chrome or Edge.' :
                   micNotFound ? "I can't find a microphone plugged into your device. Please check your connection!" :
                   "I can't hear you because your browser is blocking the microphone. Pimo is getting lonely!"}
                </p>
                
                {(permissionDenied || micNotFound) && (
                  <div className="space-y-4 text-left bg-slate-900/50 p-4 rounded-xl mb-6">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {micNotFound ? 'Plug in a microphone or headset.' : 'Click the lock icon (🔒) in your address bar.'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {micNotFound ? 'Ensure it is selected as the default input.' : 'Set Microphone to "Allow".'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {micNotFound ? 'Refresh the page.' : 'Click "Try Again" below to re-prompt.'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setIsErrorDismissed(false);
                      setPermissionDenied(false);
                      setMicNotFound(false);
                      toggleMute();
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-xl transition-colors font-bold shadow-lg shadow-blue-500/20"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => {
                      setIsErrorDismissed(true);
                    }}
                    className="w-full py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl transition-colors font-medium"
                  >
                    Dismiss
                  </button>
                  {permissionDenied && (
                    <p className="text-[10px] text-slate-500 mt-2">
                      If "Try Again" doesn't work, you may need to reset site permissions in your browser settings.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Moro's Video Feed (Center) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
            <Moro3D 
              character={character} 
              width={400} 
              height={400} 
              isTalking={isTalking}
              isAngry={isAngry}
              isUpset={isUpset}
              idleAnimScale={1.5}
              playerName={playerName}
            />
            <div className="absolute bottom-24 bg-white/50 dark:bg-black/50 px-6 py-3 rounded-2xl max-w-[80%] text-center">
              <p className={`font-fredoka text-xl ${isAngry ? 'text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {moroMessage}
              </p>
            </div>
          </div>

          {/* User's Video Feed (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden border-2 border-slate-600 shadow-2xl z-10">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transform scale-x-[-1] ${!isCameraOn ? 'hidden' : ''}`}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <i className="fa-solid fa-video-slash text-slate-500 text-3xl"></i>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="p-4 bg-slate-800/80 border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="mb-3 flex items-center gap-2">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-blue-500">
                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-1 right-1 bg-red-500 text-slate-900 dark:text-white w-5 h-5 rounded-full flex items-center justify-center text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-sm">Image attached</span>
            </div>
          )}
          
          <div className="flex gap-2 items-center">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-600 transition-colors"
              title="Attach Photo"
            >
              <i className="fa-solid fa-image"></i>
            </button>

            {isSpeechSupported && (
              <button 
                onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  !isMuted 
                    ? 'bg-red-500 text-slate-900 dark:text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-600'
                }`}
                title={isMuted ? "Start Voice Input" : "Stop Voice Input"}
              >
                <i className={`fa-solid ${isMuted ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              </button>
            )}

            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Say something to Pimo..."
              className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-full px-6 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            
            <button 
              onClick={() => handleSendMessage()}
              disabled={isProcessing || (!inputText.trim() && !selectedImage)}
              className="bg-blue-500 text-slate-900 dark:text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900 flex justify-center items-center gap-6 md:gap-12 pb-8">
        <button 
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-colors ${
            isMuted 
              ? 'bg-red-500/20 text-red-500 border border-red-500' 
              : isListening 
                ? 'bg-green-500 text-slate-900 dark:text-white animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-600'
          }`}
        >
          <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
        </button>

        <button 
          onClick={onEndCall}
          className="w-16 h-16 rounded-full bg-red-500 text-slate-900 dark:text-white flex items-center justify-center text-2xl hover:bg-red-600 shadow-lg shadow-red-500/20"
        >
          <i className="fa-solid fa-phone-slash"></i>
        </button>

        <button 
          onClick={toggleCamera}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-colors ${
            !isCameraOn ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-600'
          }`}
        >
          <i className={`fa-solid ${!isCameraOn ? 'fa-video-slash' : 'fa-video'}`}></i>
        </button>
      </div>
    </div>
  );
};

export default CallMoro;
