import type { IColor } from '../types';
import type { JSX } from 'react';

interface PaletteGridProps {
  title: string;
  colors: IColor[];
}

export default function PaletteGrid({ title, colors }: PaletteGridProps): JSX.Element {
  return (
    <div className="w-full mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">{title}</h3>
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {colors.map(color => (
          <div key={color.hex} className="flex flex-col items-center group flex-shrink-0">
            <div
              className="w-16 h-16 rounded-lg shadow-sm border border-gray-300 transition-transform duration-150 group-hover:scale-110 cursor-pointer"
              style={{ backgroundColor: color.hex }}
              title={`${color.name} - ${color.hex}`}
            ></div>
            <span className="text-xs text-gray-500 mt-2 font-medium uppercase tracking-wider">
              {color.hex}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
