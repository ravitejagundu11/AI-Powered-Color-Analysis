import type { JSX } from 'react';
import { useMemo, useState, useEffect } from 'react';
import type { IColor } from '../types';
import { OUTFITS_BY_SEASON, OUTFIT_LOADING_DELAY_MS } from '../constants';
import { SEASON_DESCRIPTIONS, getConfidenceLevel, CONFIDENCE_DESCRIPTION } from '../constants/seasonDescriptions';

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
  const [outfitsLoading, setOutfitsLoading] = useState(true);

  // Simulate loading outfits (in real app, this would be an API call)
  useEffect(() => {
    const timer = setTimeout(() => {
      setOutfitsLoading(false);
    }, OUTFIT_LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Memoize outfit images to prevent unnecessary recalculation
  const outfitImages = useMemo(() =>
    (season && OUTFITS_BY_SEASON[season]) || OUTFITS_BY_SEASON['Spring'],
    [season]
  );

  return (
    <div className="w-full min-h-screen bg-white px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Section 1: Image and Season Details - 30/70 Split */}
        <div className="grid grid-cols-1 md:grid-cols-[30%_70%] gap-4">
          {/* Image */}
          <div className="w-full">
            <img
              src={image}
              alt="Your captured photo for color analysis"
              className="w-full aspect-[4/3] rounded-lg object-cover shadow-md"
            />
            {/* Recapture/Reupload Button */}
            <button
              onClick={onRestart}
              className="w-full mt-3 bg-black text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2"
              aria-label="Recapture or reupload photo"
            >
              <span className="text-lg" aria-hidden="true">↻</span>
              Recapture / Reupload
            </button>
          </div>

          {/* Season and Confidence */}
          <div className="bg-white p-6 flex flex-col justify-center space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Season: {season}
              </h1>
              {season && SEASON_DESCRIPTIONS[season] && (
                <p className="text-base text-gray-600 leading-relaxed mb-3">
                  {SEASON_DESCRIPTIONS[season]}
                </p>
              )}
              <p className="text-base text-gray-600 leading-relaxed">
                Use the color palettes below when shopping for clothes, accessories, and makeup to complement your natural coloring.
              </p>
            </div>

            {confidence !== undefined && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-semibold">Confidence:</span>{' '}
                  <span className="font-bold text-gray-900">
                    {(confidence * 100).toFixed(1)}%
                  </span>
                  {' '}
                  <span className="text-gray-600">
                    ({getConfidenceLevel(confidence)})
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {CONFIDENCE_DESCRIPTION}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Color Palettes - 50/50 Split with 3x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Colors */}
          <div className="bg-white p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Primary Color Palette</h2>
            <div className="grid grid-cols-6 gap-2">
              {primary.map((color, idx) => (
                <div key={`primary-${color.hex}-${idx}`} className="text-center">
                  <div
                    className="w-full aspect-square rounded-md shadow-sm mb-1"
                    style={{ backgroundColor: color.hex }}
                    role="img"
                    aria-label={`${color.name} color swatch`}
                  />
                  <p className="text-[10px] font-medium text-gray-700 truncate">{color.name}</p>
                  <p className="text-[9px] text-gray-500">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Colors */}
          <div className="bg-white p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Secondary Color Palette</h2>
            <div className="grid grid-cols-6 gap-2">
              {secondary.map((color, idx) => (
                <div key={`secondary-${color.hex}-${idx}`} className="text-center">
                  <div
                    className="w-full aspect-square rounded-md shadow-sm mb-1"
                    style={{ backgroundColor: color.hex }}
                    role="img"
                    aria-label={`${color.name} color swatch`}
                  />
                  <p className="text-[10px] font-medium text-gray-700 truncate">{color.name}</p>
                  <p className="text-[9px] text-gray-500">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Recommended Outfits - Full Width */}
        <div className="bg-white p-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Recommended Outfits
          </h2>
          <p className="text-base text-gray-600 mb-6">
            Curated looks from Mastodon Career Closet aligned with your {season} palette. Browse the collection to find more pieces that match your colors.
          </p>

          {outfitsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"
                  role="status"
                  aria-label="Loading outfits"
                ></div>
                <p className="text-gray-600">Loading outfits...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {outfitImages.map((src, i) => (
                <button
                  key={`outfit-${i}`}
                  className="group relative overflow-hidden rounded-lg hover:shadow-lg transition-all duration-200"
                  onClick={() => window.open(`${src}?auto=format&fit=crop&w=1200&q=80`, '_blank', 'noopener,noreferrer')}
                  aria-label={`View recommended outfit ${i + 1} in full size`}
                >
                  <img
                    src={`${src}?auto=format&fit=crop&w=600&q=80`}
                    alt={`Recommended outfit ${i + 1}`}
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      console.error(`Failed to load outfit image ${i + 1}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200"></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}