import { Check, X } from 'lucide-react';
import type { JSX } from 'react';

interface PreviewViewProps {
  image: string;
  onRetake: () => void;
  onAccept: () => void;
}

export default function PreviewView({ image, onRetake, onAccept }: PreviewViewProps): JSX.Element {
  return (
    <div className="w-full flex flex-col items-center">
      <img
        src={image}
        alt="Capture preview"
        className="w-full aspect-square bg-gray-200 rounded-lg object-cover shadow-lg"
      />

      <div className="flex justify-center gap-8 mt-6 w-full">
        <button
          onClick={onRetake}
          className="bg-red-500 text-white rounded-full p-4 shadow-lg transition-transform transform active:scale-95 hover:bg-red-600"
          aria-label="Retake photo"
        >
          <X size={32} />
        </button>
        <button
          onClick={onAccept}
          className="bg-green-500 text-white rounded-full p-4 shadow-lg transition-transform transform active:scale-95 hover:bg-green-600"
          aria-label="Accept photo and continue"
        >
          <Check size={32} />
        </button>
      </div>
    </div>
  );
}
