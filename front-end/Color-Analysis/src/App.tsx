import { useState, useEffect, type JSX } from 'react';
import HomeView from './components/HomeView';
import SelectOptionsView from './components/SelectOptionsView';
import CameraView from './components/CameraView';
import PreviewView from './components/PreviewView';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import UploadView from './components/UploadView';
import type { ViewState, IColor } from './types';
import { useCamera } from './hooks/useCamera';
import { useCountdown } from './hooks/useCountdown';
import { useFileUpload } from './hooks/useFileUpload';
import { useImageAnalysis } from './hooks/useImageAnalysis';
import { API_BASE_URL } from './constants';

type InputMode = 'camera' | 'upload';

export default function App(): JSX.Element {
  const [view, setView] = useState<ViewState>('home');
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultSeason, setResultSeason] = useState<string | null>(null);
  const [primaryPalette, setPrimaryPalette] = useState<IColor[]>([]);
  const [secondaryPalette, setSecondaryPalette] = useState<IColor[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [allProbabilities, setAllProbabilities] = useState<Record<string, number>>({});

  // Custom hooks
  const { videoRef, canvasRef, startCamera, stopCamera, capturePhoto } = useCamera(setError);
  const { countdown, startCountdown } = useCountdown();
  const { fileInputRef, handleFileUpload, handleUploadClick, resetFileInput } = useFileUpload(
    (imageData) => {
      setCapturedImage(imageData);
      setView('preview');
      setError(null);
    },
    setError
  );
  const { analyzeImage } = useImageAnalysis();

  // Camera management effect
  useEffect(() => {
    if (view === 'camera' && inputMode === 'camera') {
      setError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [view, inputMode, startCamera, stopCamera]);

  // Image analysis effect
  useEffect(() => {
    if (view === 'processing' && capturedImage) {
      const performAnalysis = async () => {
        try {
          const result = await analyzeImage(capturedImage);

          setResultSeason(result.season);
          setPrimaryPalette(result.primaryPalette);
          setSecondaryPalette(result.secondaryPalette);
          setConfidence(result.confidence);
          setAllProbabilities(result.allProbabilities);
          setView('result');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
          setError(errorMessage);
          setView('camera');

          alert(`Analysis Error: ${errorMessage}\n\nPlease ensure:\n- The API server is running at ${API_BASE_URL}\n- Your image is valid\n- You have internet connection`);
        }
      };

      performAnalysis();
    }
  }, [view, capturedImage, analyzeImage]);

  // Handlers
  const handleCapture = () => {
    startCountdown(() => {
      const imageData = capturePhoto();
      if (imageData) {
        setCapturedImage(imageData);
        setView('preview');
      }
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setView('camera');
    resetFileInput();
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
    resetFileInput();
  };

  const handleGetStarted = () => {
    setView('select');
  };

  const handleSelectCamera = () => {
    setInputMode('camera');
    setView('camera');
  };

  const handleSelectUpload = () => {
    setInputMode('upload');
    setView('camera');
  };

  const handleBackToHome = () => {
    setView('home');
    setCapturedImage(null);
    setError(null);
  };

  const handleBackToSelect = () => {
    setView('select');
    setCapturedImage(null);
    setError(null);
    stopCamera();
    resetFileInput();
  };



  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
      {/* Main container */}
      <main className="flex-grow flex flex-col items-center justify-center w-full mx-auto p-4">
        <canvas ref={canvasRef} className="hidden"></canvas>

        {/* Home View */}
        {view === 'home' && (
          <HomeView onGetStarted={handleGetStarted} />
        )}

        {/* Select Options View */}
        {view === 'select' && (
          <div className="w-full max-w-2xl">
            <SelectOptionsView
              onSelectCamera={handleSelectCamera}
              onSelectUpload={handleSelectUpload}
            />
            {/* Back to Home Button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleBackToHome}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center gap-2 mx-auto"
                aria-label="Back to home"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Camera View */}
        {view === 'camera' && inputMode === 'camera' && (
          <div className="max-w-2xl w-full">
            <CameraView videoRef={videoRef} countdown={countdown} error={error} onCapture={handleCapture} />
            {/* Back to Options Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleBackToSelect}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center gap-2 mx-auto"
                aria-label="Back to options"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Options
              </button>
            </div>
          </div>
        )}

        {/* Upload View */}
        {view === 'camera' && inputMode === 'upload' && (
          <div className="w-full max-w-2xl">
            <UploadView
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              handleUploadClick={handleUploadClick}
              error={error}
            />
            {/* Back to Options Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleBackToSelect}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 flex items-center gap-2 mx-auto"
                aria-label="Back to options"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Options
              </button>
            </div>
          </div>
        )}

        {/* Preview View */}
        {view === 'preview' && (
          <div className="max-w-2xl w-full">
            <PreviewView image={capturedImage!} onRetake={handleRetake} onAccept={handleAccept} />
          </div>
        )}

        {/* Result View */}
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

      {/* Processing Modal */}
      {view === 'processing' && (
        <ProcessingView />
      )}

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