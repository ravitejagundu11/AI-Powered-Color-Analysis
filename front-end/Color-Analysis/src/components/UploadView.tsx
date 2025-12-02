import type { JSX } from 'react';

interface UploadViewProps {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleUploadClick: () => void;
    error: string | null;
}

export default function UploadView({
    fileInputRef,
    handleFileUpload,
    handleUploadClick,
    error
}: UploadViewProps): JSX.Element {
    return (
        <div className="w-full space-y-6 max-w-2xl">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Photo</h2>
                <p className="text-gray-600">Choose a clear photo for color analysis</p>
            </div>

            {/* Upload area */}
            <div
                onClick={handleUploadClick}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all duration-300"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                </svg>

                <p className="text-lg font-semibold text-gray-900 mb-2">
                    Click to upload an image
                </p>
                <p className="text-sm text-gray-500">
                    Only JPG and PNG files (up to 5MB)
                </p>
            </div>

            {error && (
                <div className="bg-gray-100 border border-gray-300 text-gray-900 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
        </div>
    );
}
