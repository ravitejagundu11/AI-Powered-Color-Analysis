import type { JSX } from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { IColor } from '../types';
import { SEASON_DESCRIPTIONS, getConfidenceLevel, CONFIDENCE_DESCRIPTION } from '../constants/seasonDescriptions';
import { API_BASE_URL } from '../constants';
import { LazyImage } from './LazyImage';
import { ImageModal } from './ImageModal';

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

  const [loadingOutfits, setLoadingOutfits] = useState(true);
  const [outfitImages, setOutfitImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<{ src: string; index: number } | null>(null);

  // Pagination configuration
  const IMAGES_PER_PAGE = 12;
  const totalPages = Math.ceil(outfitImages.length / IMAGES_PER_PAGE);
  const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
  const endIndex = startIndex + IMAGES_PER_PAGE;
  const currentImages = outfitImages.slice(startIndex, endIndex);

  // 🟦 FIX: Memoize the hex colors → prevents infinite re-renders
  const primaryHexColors = useMemo(() => {
    return primary.map((c) => c.hex);
  }, [primary]);

  // Reset to page 1 when gender filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGender]);

  // --- FETCH MATCHING OUTFITS FROM BACKEND ---
  useEffect(() => {
    if (!primaryHexColors.length) return;

    async function fetchOutfits() {
      try {
        setLoadingOutfits(true);
        setError(null);

        const genderParam =
          selectedGender === "all" ? "" : `?gender=${selectedGender}`;


        console.log("Fetching outfits for:", primaryHexColors);

        const response = await fetch(
          `${API_BASE_URL}/get-matching-clothes${genderParam}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(primaryHexColors)
          }
        );

        const data = await response.json();
        // console.log("API Response:", data);

        if (data.images) {
          setOutfitImages(data.images);
        } else {
          setOutfitImages([]);
        }

      } catch (err) {
        console.error("Error fetching matching clothes:", err);
        setError("Failed to load matching outfits.");
      } finally {
        setLoadingOutfits(false);
      }
    }

    fetchOutfits();
  }, [primaryHexColors, selectedGender]);

  return (
    <div className="w-full min-h-screen bg-white px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ---------------------------------- */}
        {/* SECTION 1: IMAGE + SEASON DETAILS */}
        {/* ---------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-[30%_70%] gap-4">

          {/* User Image */}
          <div className="w-full">
            <img
              src={image}
              alt="Input photo"
              className="w-full aspect-[4/3] rounded-lg object-cover shadow-md"
            />

            <button
              onClick={onRestart}
              className="w-full mt-3 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <span className="text-lg">↻</span> Recapture / Reupload
            </button>
          </div>

          {/* Season Details */}
          <div className="bg-white p-6 space-y-4">
            <h1 className="text-3xl font-bold">Your Season: {season}</h1>

            {season && (
              <p className="text-gray-600">{SEASON_DESCRIPTIONS[season]}</p>
            )}

            {confidence !== undefined && (
              <div className="pt-3 border-t">
                <p className="text-sm">
                  <span className="font-semibold">Confidence:</span>{" "}
                  {(confidence * 100).toFixed(1)}% (
                  {getConfidenceLevel(confidence)})
                </p>
                <p className="text-xs text-gray-500">{CONFIDENCE_DESCRIPTION}</p>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------ */}
        {/* SECTION 2: COLOR PALETTES */}
        {/* ------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Primary Palette */}
          <div className="bg-white p-4">
            <h2 className="text-lg font-bold mb-3">Primary Colors</h2>
            <div className="grid grid-cols-6 gap-2">
              {primary.map((color, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-full aspect-square rounded-md shadow-sm mb-1"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-[10px]">{color.name}</p>
                  <p className="text-[9px] text-gray-500">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Palette */}
          <div className="bg-white p-4">
            <h2 className="text-lg font-bold mb-3">Secondary Colors</h2>
            <div className="grid grid-cols-6 gap-2">
              {secondary.map((color, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-full aspect-square rounded-md shadow-sm mb-1"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-[10px]">{color.name}</p>
                  <p className="text-[9px] text-gray-500">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ------------------------------ */}
        {/* SECTION 3: MATCHING OUTFITS */}
        {/* ------------------------------ */}
        <div className="bg-white p-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">

            {/* Left Text */}
            <div>
              <h2 className="text-2xl font-bold mb-1">Recommended Outfits</h2>
              <p className="text-gray-600">
                Clothes from the Career Closet that match your personal color palette.
              </p>
            </div>

            {/* Right Toggle Buttons */}
            <div className="flex bg-gray-100 rounded-full p-1 shadow-inner">
              {["all", "female", "male"].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g as any)}
                  className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all
                    ${selectedGender === g
                      ? "bg-black text-white shadow"
                      : "text-gray-600 hover:text-black"
                    }
                  `}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>


          {/* Loading State */}
          {loadingOutfits ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : outfitImages.length === 0 ? (
            <p className="text-center text-gray-500">No matching outfits found.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentImages.map((src, index) => (
                  <LazyImage
                    key={startIndex + index}
                    src={src}
                    alt={`Outfit ${startIndex + index + 1}`}
                    className="group overflow-hidden hover:shadow-lg transition cursor-pointer"
                    onClick={() => setSelectedImage({ src, index: startIndex + index })}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        imageSrc={selectedImage?.src || ''}
        imageAlt={`Outfit ${(selectedImage?.index ?? 0) + 1}`}
        imageIndex={selectedImage?.index}
      />
    </div>
  );
}