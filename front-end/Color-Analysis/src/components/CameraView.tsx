import { Camera } from 'lucide-react';
import type { JSX } from 'react';
import React from 'react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  countdown: number | null;
  error: string | null;
  onCapture: () => void;
}

export default function CameraView({ videoRef, countdown, error, onCapture }: CameraViewProps): JSX.Element {
  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-center text-gray-600 mb-4 text-lg px-4">
        Position your face inside the oval
      </p>
      <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md relative border-2 border-gray-200">
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
            fill="rgba(0,0,0,0.6)"
            mask="url(#head-shoulder-mask)"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="35"
            ry="45"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>

        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
            <span className="text-white text-9xl font-bold animate-ping-once">{countdown}</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4 z-30">
            <p className="text-gray-900 text-center font-medium">{error}</p>
          </div>
        )}
      </div>

      <button
        onClick={onCapture}
        disabled={countdown !== null || !!error}
        className="mt-8 bg-black text-white rounded-full px-8 py-4 shadow-lg transition-all transform active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 flex items-center gap-3 text-lg font-medium"
      >
        <Camera size={24} />
        Capture Photo
      </button>
    </div>
  );
}
