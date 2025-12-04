import { useRef, useCallback } from 'react';

export interface UseCameraReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    capturePhoto: () => string | null;
}

export function useCamera(
    onError: (error: string) => void
): UseCameraReturn {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error('Camera access error:', err);
            onError('Could not access camera. Please check permissions.');
        }
    }, [onError]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    const capturePhoto = useCallback((): string | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            console.error('Video or canvas ref is null');
            return null;
        }

        const videoDisplayWidth = video.videoWidth;
        const videoDisplayHeight = video.videoHeight;

        let sx = 0;
        let sy = 0;
        let sWidth = videoDisplayWidth;
        let sHeight = videoDisplayHeight;

        if (videoDisplayWidth > videoDisplayHeight) {
            sWidth = videoDisplayHeight;
            sx = (videoDisplayWidth - sWidth) / 2;
        } else if (videoDisplayHeight > videoDisplayWidth) {
            sHeight = videoDisplayWidth;
            sy = (videoDisplayHeight - sWidth) / 2;
        }

        const squareSourceSize = Math.min(sWidth, sHeight);
        const captureRatio = 0.9;
        const captureSize = squareSourceSize * captureRatio;
        const captureOffset = squareSourceSize * (1 - captureRatio) / 2;

        const finalCropX = sx + captureOffset;
        const finalCropY = sy + captureOffset;

        canvas.width = captureSize;
        canvas.height = captureSize;

        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Failed to get 2D context from canvas');
            return null;
        }

        context.save();
        context.scale(-1, 1);
        context.drawImage(
            video,
            finalCropX, finalCropY,
            captureSize, captureSize,
            -canvas.width, 0, canvas.width, canvas.height
        );
        context.restore();

        return canvas.toDataURL('image/png');
    }, []);

    return {
        videoRef,
        canvasRef,
        startCamera,
        stopCamera,
        capturePhoto
    };
}
