import { useState, useEffect, useRef, type JSX } from 'react';
import CameraView from './components/CameraView';
import PreviewView from './components/PreviewView';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import type { ViewState, IColor } from './types';
import Header from './components/Header';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type InputMode = 'camera' | 'upload';

export default function App(): JSX.Element {
  const [view, setView] = useState<ViewState>('camera');
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultSeason, setResultSeason] = useState<string | null>(null);
  const [primaryPalette, setPrimaryPalette] = useState<IColor[]>([]);
  const [secondaryPalette, setSecondaryPalette] = useState<IColor[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [allProbabilities, setAllProbabilities] = useState<Record<string, number>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'camera' && inputMode === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [view, inputMode]);

  const startCamera = async () => {
    setError(null);
    setCountdown(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch {
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const handleCapture = () => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        capturePhoto();
      }
    }, 1000);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const videoDisplayWidth = video.videoWidth;
      const videoDisplayHeight = video.videoHeight;

      let sx = 0;
      let sy = 0;
      let sWidth = videoDisplayWidth;
      let sHeight = videoDisplayHeight;

      if (videoDisplayWidth > videoDisplayHeight) {
        sWidth = videoDisplayHeight;
        sx = (videoDisplayWidth - sWidth) / 2;
      } else if (videoDisplayHeight > videoDisplayWidth) {
        sHeight = videoDisplayWidth;
        sy = (videoDisplayHeight - sWidth) / 2;
      }

      const squareSourceSize = Math.min(sWidth, sHeight);
      const captureRatio = 0.9;
      const captureSize = squareSourceSize * captureRatio;
      const captureOffset = squareSourceSize * (1 - captureRatio) / 2;

      const finalCropX = sx + captureOffset;
      const finalCropY = sy + captureOffset;

      canvas.width = captureSize;
      canvas.height = captureSize;

      const context = canvas.getContext('2d');
      if (!context) {
        console.error("Failed to get 2D context from canvas");
        return;
      }

      context.save();
      context.scale(-1, 1);
      context.drawImage(
        video,
        finalCropX, finalCropY,
        captureSize, captureSize,
        -canvas.width, 0, canvas.width, canvas.height
      );
      context.restore();

      const imageData = canvas.toDataURL('image/png');

      setCapturedImage(imageData);
      setView('preview');
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);

    // Read the file and create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      setView('preview');
    };
    reader.onerror = () => {
      setError('Failed to read the image file');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setView('camera');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAccept = () => setView('processing');

  const handleStartOver = () => {
    setCapturedImage(null);
    setResultSeason(null);
    setPrimaryPalette([]);
    setSecondaryPalette([]);
    setConfidence(0);
    setAllProbabilities({});
    setError(null);
    setView('camera');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const switchToCamera = () => {
    setInputMode('camera');
    setCapturedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const switchToUpload = () => {
    setInputMode('upload');
    stopCamera();
    setError(null);
  };

  // Helper function to convert dataURL to Blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // API call effect
  useEffect(() => {
    if (view === 'processing' && capturedImage) {
      const analyzeImage = async () => {
        try {
          const imageBlob = dataURLtoBlob(capturedImage);
          const formData = new FormData();
          formData.append('image', imageBlob, 'captured-image.png');

          const includeDescription = true;
          const url = `${API_BASE_URL}/analyze-color?include_description=${includeDescription}`;

          console.log('🚀 Sending image to API...');

          const response = await fetch(url, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `API error: ${response.status}`);
          }

          const apiResponse = await response.json();
          console.log('✅ API Response:', apiResponse);

          setResultSeason(apiResponse.season);
          setPrimaryPalette(apiResponse.palettes.primary.map((color: any) => ({
            name: color.name,
            hex: color.hex
          })));
          setSecondaryPalette(apiResponse.palettes.secondary.map((color: any) => ({
            name: color.name,
            hex: color.hex
          })));
          setConfidence(apiResponse.confidence);
          setAllProbabilities(apiResponse.all_probabilities);

          setView('result');

        } catch (err) {
          console.error('❌ Error analyzing image:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
          setError(errorMessage);
          setView('camera');

          alert(`Analysis Error: ${errorMessage}\n\nPlease ensure:\n- The API server is running at ${API_BASE_URL}\n- Your image is valid\n- You have internet connection`);
        }
      };

      analyzeImage();
    }
  }, [view, capturedImage]);

  // Render upload view - Wrapped in max-w-2xl
  const renderUploadView = () => (
    <div className="w-full space-y-6 max-w-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Your Photo</h2>
        <p className="text-gray-600">Choose a clear photo for color analysis</p>
      </div>

      {/* Upload area */}
      <div 
        onClick={handleUploadClick}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <svg 
          className="mx-auto h-16 w-16 text-gray-400 mb-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Click to upload an image
        </p>
        <p className="text-sm text-gray-500">
          PNG, JPG, GIF up to 5MB
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <Header />

      {/* STEP 1: Main container is WIDE to allow ResultView to stretch */}
      <main className="flex-grow flex flex-col items-center justify-center w-full mx-auto p-4">
        <canvas ref={canvasRef} className="hidden"></canvas>

        {/* Mode Toggle - Wrapped in max-w-2xl */}
        {view === 'camera' && (
          <div className="w-full mb-6 max-w-2xl"> 
            <div className="flex bg-white rounded-lg shadow-md p-1">
              <button
                onClick={switchToCamera}
                className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all duration-300 ${
                  inputMode === 'camera'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Camera
                </span>
              </button>
              <button
                onClick={switchToUpload}
                className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all duration-300 ${
                  inputMode === 'upload'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {/* STEP 2: Wrap all other views in a constrained div (except ResultView) */}
        {view === 'camera' && inputMode === 'camera' && (
          <div className="max-w-2xl w-full">
            <CameraView videoRef={videoRef} streamRef={streamRef} countdown={countdown} error={error} onCapture={handleCapture} />
          </div>
        )}
        {view === 'camera' && inputMode === 'upload' && renderUploadView()}
        {view === 'preview' && (
          <div className="max-w-2xl w-full">
            <PreviewView image={capturedImage!} onRetake={handleRetake} onAccept={handleAccept} />
          </div>
        )}
        {view === 'processing' && (
          <div className="max-w-2xl w-full">
            <ProcessingView />
          </div>
        )}
        
        {/* ResultView is NOT wrapped, allowing it to use the full width of the <main> container */}
        {view === 'result' && (
          <ResultView
            image={capturedImage!}
            season={resultSeason}
            primary={primaryPalette}
            secondary={secondaryPalette}
            onRestart={handleStartOver}
            confidence={confidence} 
            allProbabilities={allProbabilities}
          />
        )}
      </main>
      <style>{`
        @keyframes ping-once {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-once {
          animation: ping-once 1s cubic-bezier(0, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}