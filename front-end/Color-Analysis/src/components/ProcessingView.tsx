import { Loader2 } from 'lucide-react';
import type { JSX } from 'react';

export default function ProcessingView(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center text-gray-600 h-64">
      <Loader2 size={48} className="animate-spin mb-4" />
      <span className="text-xl">Analyzing your colors...</span>
    </div>
  );
}
