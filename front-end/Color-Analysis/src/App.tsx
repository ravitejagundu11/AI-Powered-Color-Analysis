import { useState, useEffect, useRef, type JSX } from 'react';
import CameraView from './components/CameraView';
import Header from './components/Header';

type InputMode = 'camera' | 'upload';

export default function App(): JSX.Element {
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputMode === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [inputMode]);

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
    if (video) {
      // Photo captured successfully - could add a simple success message or animation here
      console.log('Photo captured successfully!');
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
    console.log('File uploaded successfully:', file.name);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const switchToCamera = () => {
    setInputMode('camera');
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

  // Render upload view
  const renderUploadView = () => (
    <div className="w-full space-y-6">
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

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4">

        {/* Mode Toggle */}
        <div className="w-full mb-6">
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

        {/* Main Content */}
        {inputMode === 'camera' && (
          <CameraView videoRef={videoRef} streamRef={streamRef} countdown={countdown} error={error} onCapture={handleCapture} />
        )}
        {inputMode === 'upload' && renderUploadView()}
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
