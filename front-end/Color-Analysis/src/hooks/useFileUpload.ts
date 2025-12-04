import { useRef, useCallback } from 'react';
import { VALID_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../constants';

export interface UseFileUploadReturn {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleUploadClick: () => void;
    resetFileInput: () => void;
}

export function useFileUpload(
    onSuccess: (imageData: string) => void,
    onError: (error: string) => void
): UseFileUploadReturn {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!VALID_FILE_TYPES.includes(file.type.toLowerCase())) {
            onError('Only JPG and PNG files are allowed');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            onError('Image size must be less than 5MB');
            return;
        }

        // Read the file and create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target?.result as string;
            onSuccess(imageData);
        };
        reader.onerror = () => {
            onError('Failed to read the image file');
        };
        reader.readAsDataURL(file);
    }, [onSuccess, onError]);

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const resetFileInput = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return {
        fileInputRef,
        handleFileUpload,
        handleUploadClick,
        resetFileInput
    };
}
