// ResultView.tsx (Enhanced version)
import type { JSX } from 'react';
import type { IColor } from '../types';

interface ResultViewProps {
  image: string;
  season: string | null;
  primary: IColor[];
  secondary: IColor[];
  confidence?: number;
  allProbabilities?: Record<string, number>;
  onRestart: () => void;
}

export default function ResultView({ 
  image, 
  season, 
  primary, 
  secondary, 
  confidence,
  allProbabilities,
  onRestart 
}: ResultViewProps): JSX.Element {
  return (
    <div className="w-full space-y-6">
      {/* Season Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Season: {season}
        </h1>
        {confidence !== undefined && (
          <p className="text-lg text-gray-600">
            Confidence: <span className="font-semibold text-green-600">
              {(confidence * 100).toFixed(1)}%
            </span>
          </p>
        )}
      </div>

      {/* Captured Image */}
      <div className="flex justify-center">
        <img 
          src={image} 
          alt="Captured" 
          className="w-48 h-48 rounded-full object-cover shadow-lg border-4 border-white"
        />
      </div>

      {/* All Season Probabilities */}
      {allProbabilities && Object.keys(allProbabilities).length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Season Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(allProbabilities)
              .sort(([, a], [, b]) => b - a)
              .map(([seasonName, prob]) => (
                <div key={seasonName} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{seasonName}</span>
                    <span className="text-gray-600">{(prob * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${prob * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Primary Palette */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Primary Colors</h2>
        <div className="grid grid-cols-3 gap-4">
          {primary.map((color, idx) => (
            <div key={idx} className="text-center">
              <div 
                className="w-full h-20 rounded-lg shadow-md mb-2 border border-gray-200"
                style={{ backgroundColor: color.hex }}
              />
              <p className="text-sm font-medium text-gray-700">{color.name}</p>
              <p className="text-xs text-gray-500">{color.hex}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Palette */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Secondary Colors</h2>
        <div className="grid grid-cols-3 gap-4">
          {secondary.map((color, idx) => (
            <div key={idx} className="text-center">
              <div 
                className="w-full h-20 rounded-lg shadow-md mb-2 border border-gray-200"
                style={{ backgroundColor: color.hex }}
              />
              <p className="text-sm font-medium text-gray-700">{color.name}</p>
              <p className="text-xs text-gray-500">{color.hex}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Restart Button */}
      <button
        onClick={onRestart}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
      >
        Analyze Another Image
      </button>
    </div>
  );
}
