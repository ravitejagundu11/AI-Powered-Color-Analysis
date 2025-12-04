import { useCallback } from 'react';
import { API_BASE_URL } from '../constants';
import type { ApiAnalysisResponse, ApiErrorResponse } from '../types/api';
import type { IColor } from '../types';

export interface AnalysisResult {
    season: string;
    primaryPalette: IColor[];
    secondaryPalette: IColor[];
    confidence: number;
    allProbabilities: Record<string, number>;
}

export interface UseImageAnalysisReturn {
    analyzeImage: (imageData: string) => Promise<AnalysisResult>;
}

// Helper function to convert dataURL to Blob
const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

export function useImageAnalysis(): UseImageAnalysisReturn {
    const analyzeImage = useCallback(async (imageData: string): Promise<AnalysisResult> => {
        try {
            const imageBlob = dataURLtoBlob(imageData);
            const formData = new FormData();
            formData.append('image', imageBlob, 'captured-image.png');

            const includeDescription = true;
            const url = `${API_BASE_URL}/analyze-color?include_description=${includeDescription}`;

            console.log('🚀 Sending image to API...');

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData: ApiErrorResponse = await response.json().catch(() => ({
                    detail: 'Unknown error'
                }));
                throw new Error(errorData.detail || `API error: ${response.status}`);
            }

            const apiResponse: ApiAnalysisResponse = await response.json();
            console.log('✅ API Response:', apiResponse);

            return {
                season: apiResponse.season,
                primaryPalette: apiResponse.palettes.primary.map((color) => ({
                    name: color.name,
                    hex: color.hex
                })),
                secondaryPalette: apiResponse.palettes.secondary.map((color) => ({
                    name: color.name,
                    hex: color.hex
                })),
                confidence: apiResponse.confidence,
                allProbabilities: apiResponse.all_probabilities
            };
        } catch (err) {
            console.error('❌ Error analyzing image:', err);
            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to analyze image. Please try again.';

            throw new Error(errorMessage);
        }
    }, []);

    return {
        analyzeImage
    };
}
