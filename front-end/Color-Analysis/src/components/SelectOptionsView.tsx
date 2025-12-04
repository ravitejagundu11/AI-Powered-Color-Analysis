import type { JSX } from 'react';
import { Camera, Upload } from 'lucide-react';

interface SelectOptionsViewProps {
    onSelectCamera: () => void;
    onSelectUpload: () => void;
}

export default function SelectOptionsView({ onSelectCamera, onSelectUpload }: SelectOptionsViewProps): JSX.Element {
    return (
        <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="text-center space-y-8 w-full">
                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                    Choose an Option
                </h2>

                <p className="text-lg text-gray-600">
                    How would you like to provide your photo?
                </p>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    {/* Camera Option */}
                    <button
                        onClick={onSelectCamera}
                        className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all duration-200"
                    >
                        <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4 group-hover:bg-black transition-colors duration-200">
                            <Camera className="w-10 h-10 text-gray-700 group-hover:text-white transition-colors duration-200" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Click Picture
                        </h3>
                        <p className="text-sm text-gray-500 text-center">
                            Use your camera to take a photo
                        </p>
                    </button>

                    {/* Upload Option */}
                    <button
                        onClick={onSelectUpload}
                        className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all duration-200"
                    >
                        <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mb-4 group-hover:bg-black transition-colors duration-200">
                            <Upload className="w-10 h-10 text-gray-700 group-hover:text-white transition-colors duration-200" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Upload Picture
                        </h3>
                        <p className="text-sm text-gray-500 text-center">
                            Choose a photo from your device
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}
