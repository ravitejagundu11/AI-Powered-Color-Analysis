// ResultView.tsx (Final Contained Layout)
import type { JSX } from 'react';
import { useRef, useState } from 'react';
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
  onRestart
}: ResultViewProps): JSX.Element {
  const [showOutfits, setShowOutfits] = useState(false);
  const outfitsRef = useRef<HTMLDivElement | null>(null);

  // Example outfits by season (replace with your own sources/CDN)
  const outfitsBySeason: Record<string, string[]> = {
    Spring: [
      'https://images.unsplash.com/photo-1520975682031-6d0f3b4c36c3',
      'https://images.unsplash.com/photo-1520975592280-95fef0b5c015',
      'https://images.unsplash.com/photo-1520974735194-9b6a2e2a9a4d'
    ],
    Summer: [
      'https://images.unsplash.com/photo-1503342217505-b0a15cf70489',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2'
    ],
    Autumn: [
      'https://images.unsplash.com/photo-1503342452485-86ff0a6ccc72',
      'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2',
      'https://images.unsplash.com/photo-1520975682031-6d0f3b4c36c3?autumn=1'
    ],
    Winter: [
      'https://images.unsplash.com/photo-1542060748-10c28b62716b',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246'
    ]
  };

  const outfitImages =
    (season && outfitsBySeason[season]) || outfitsBySeason['Spring'];

  const handleToggleOutfits = () => {
    const next = !showOutfits;
    setShowOutfits(next);
    if (next) {
      setTimeout(() => {
        outfitsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  };

  return (
    <div className="w-full mx-auto px-4 md:px-6 space-y-8">
      {/* Header */}
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

      {/* Row: Image | Primary | Secondary */}
      {/* ✨ FINAL CHANGE: Palettes now use 1.2fr for a compact width relative to the image */}
      <div className="grid grid-cols-1 md:grid-cols-[auto,1.2fr,1.2fr] gap-8 lg:gap-10 items-start">
        {/* Image (left, auto-sized) */}
        <div className="flex md:block justify-center"> 
          <img
            src={image}
            alt="Captured"
            className="w-56 h-56 md:w-64 md:h-64 rounded-full object-cover shadow-lg border-4 border-white"
          />
        </div>

        {/* Primary Colors (Contained width, 3 swatches per row) */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Primary Colors</h2>
          {/* Swatches fixed at 3 columns for vertical stacking (two rows for 6 colors) */}
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

        {/* Secondary Colors (Contained width, 3 swatches per row) */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Secondary Colors</h2>
          {/* Swatches fixed at 3 columns for vertical stacking (two rows for 6 colors) */}
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
      </div>

      {/* Buttons under palettes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleToggleOutfits}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          aria-expanded={showOutfits}
          aria-controls="outfits-section"
        >
          {showOutfits ? 'Hide Outfits' : 'Show Recommended Outfits'}
        </button>

        <button
          onClick={onRestart}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          Analyze Another Image
        </button>
      </div>

      {/* Outfits section (inline below) */}
      <div
        id="outfits-section"
        ref={outfitsRef}
        className={showOutfits ? 'block' : 'hidden'}
      >
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Recommended Outfits {season ? `for ${season}` : ''}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Curated looks aligned with your palette and undertone. Click to open full size in a new tab.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {outfitImages.map((src, i) => (
              <button
                key={i}
                className="group relative overflow-hidden rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                onClick={() => window.open(`${src}?auto=format&fit=crop&w=1200&q=80`, '_blank', 'noopener,noreferrer')}
                aria-label={`Open outfit ${i + 1}`}
              >
                <img
                  src={`${src}?auto=format&fit=crop&w=600&q=80`}
                  alt={`Recommended outfit ${i + 1}`}
                  className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}