import { useEffect } from 'react';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    imageAlt: string;
    imageIndex?: number;
}

export function ImageModal({ isOpen, onClose, imageSrc, imageAlt, imageIndex }: ImageModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
            onClick={onClose}
        >
            <div
                className="relative max-w-4xl w-full bg-white rounded-lg shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition"
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Image */}
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/3 bg-gray-100 flex items-center justify-center p-4">
                        <img
                            src={imageSrc}
                            alt={imageAlt}
                            className="max-h-[70vh] w-auto object-contain rounded"
                        />
                    </div>

                    {/* Details sidebar */}
                    <div className="md:w-1/3 p-6 bg-white">
                        <h3 className="text-xl font-bold mb-4">Outfit Details</h3>

                        {imageIndex !== undefined && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">Outfit #{imageIndex + 1}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-700">Source</p>
                                <p className="text-sm text-gray-600">Mastodon Career Closet</p>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700">Match Status</p>
                                <p className="text-sm text-green-600">✓ Matches your color palette</p>
                            </div>

                            <div className="pt-4 border-t">
                                <a
                                    href={imageSrc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                    Open in new tab
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
