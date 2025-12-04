import type { JSX } from 'react';

export default function ProcessingView(): JSX.Element {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-title"
    >
      <div className="bg-white rounded-lg p-12 shadow-2xl max-w-md mx-4">
        <div className="flex flex-col items-center space-y-6">
          {/* Spinner */}
          <div
            className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin"
            role="status"
            aria-label="Loading"
          ></div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h3 id="processing-title" className="text-2xl font-semibold text-gray-900">
              Analyzing Image...
            </h3>
            <p className="text-gray-500">
              Please wait while we analyze your photo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
