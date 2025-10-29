import { Camera } from 'lucide-react';
import type { JSX } from 'react';
import React from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamRef: React.RefObject<MediaStream | null>;
  countdown: number | null;
  error: string | null;
  onCapture: () => void;
}

export default function CameraView({ videoRef, streamRef, countdown, error, onCapture }: CameraViewProps): JSX.Element {
  return (
    <div className="w-full flex flex-col items-center">
       <p className="text-center text-gray-600 mb-2 text-lg px-4">
              Position your head inside the oval.
       </p>
      <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-inner relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transform -scale-x-100 z-10"
        ></video>
        
       {/* Head and Shoulders Overlay */}
        <svg
            className="absolute inset-0 z-20"
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <defs>
                <mask id="head-shoulder-mask">
                <rect width="100" height="100" fill="white" />
                <ellipse cx="50" cy="50" rx="35" ry="45" fill="black" /> 
                </mask>
            </defs>
            <rect
                width="100"
                height="100"
                fill="rgba(0,0,0,0.7)"
                mask="url(#head-shoulder-mask)"
            />
            <ellipse 
                cx="50" 
                cy="50" 
                rx="35" 
                ry="45" 
                fill="none" 
                stroke="rgba(255,255,255,0.8)" 
                strokeWidth="0.5" 
            />
        </svg>

        {/* Fallback for when camera isn't available */}
        {streamRef && !streamRef.current && !error && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-300">
                <Camera size={64} className="text-gray-500 mb-4" />
                <span className="text-gray-600 font-medium">Camera preview unavailable</span>
                <span className="text-gray-500 text-sm">Click the button below to simulate a capture.</span>
            </div>
        )}

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <span className="text-white text-9xl font-bold animate-ping-once">{countdown}</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 p-4">
            <p className="text-red-700 text-center font-medium">{error}</p>
          </div>
        )}
      </div>

      <button
        onClick={onCapture}
        disabled={countdown !== null || !!error}
        className="mt-6 bg-blue-600 text-white rounded-full p-4 shadow-lg transition-transform transform active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <Camera size={32} />
      </button>
    </div>
  );
}
