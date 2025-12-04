// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Camera and Capture Constants
export const COUNTDOWN_START = 3;
export const COUNTDOWN_INTERVAL_MS = 1000;
export const CAPTURE_RATIO = 0.9;

// File Upload Constants
export const VALID_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Outfit Loading Delay
export const OUTFIT_LOADING_DELAY_MS = 1000;

// Outfit Images by Season
export const OUTFITS_BY_SEASON: Record<string, string[]> = {
    Spring: [
        'https://images.unsplash.com/photo-1520975682031-6d0f3b4c36c3',
        'https://images.unsplash.com/photo-1520975592280-95fef0b5c015',
        'https://images.unsplash.com/photo-1520974735194-9b6a2e2a9a4d',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f'
    ],
    Summer: [
        'https://images.unsplash.com/photo-1503342217505-b0a15cf70489',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
        'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2',
        'https://images.unsplash.com/photo-1551028719-00167b16eac5'
    ],
    Autumn: [
        'https://images.unsplash.com/photo-1503342452485-86ff0a6ccc72',
        'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2',
        'https://images.unsplash.com/photo-1520975682031-6d0f3b4c36c3?autumn=1',
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105'
    ],
    Winter: [
        'https://images.unsplash.com/photo-1542060748-10c28b62716b',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246',
        'https://images.unsplash.com/photo-1539533018447-63fcce2678e3'
    ]
};

// Placeholder Image for Camera Fallback
export const PLACEHOLDER_IMAGE_DATA = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0iIzQ3NWQ3YSI+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiM3Mzk2YjciPjwvcmVjdD4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNTAgMjUwKSI+CiAgICA8cGF0aCBkPSJNIDAgLTEyNSBDIDY5LjAgLTEyNSA4Ny41IC04Ny41IDg3LjUgLTYyLjUgQyA4Ny41IC0zNy41IDY5LjAgMCAwIDAgQyAtNjkuMCAwIC04Ny41IC0zNy41IC04Ny41IC02Mi41IEMgLTg3LjUgLTg3LjUgLTY5LjAgLTEyNSAwIC0xMjUgWiIgZmlsbD0iI2YxZmFlZSI+PC9wYXRoPgogICAgPGNpcmNsZSBjeD0iMCIgY3k9IjAiIHI9IjY1IiBmaWxsPSIjZjFmYWVlIj48L2NpcmNsZT4KICAgIDxyZWN0IHg9Ii0xMDAiIHk9IjM1IiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgcng9IjUwIiByeT0iNTAiIGZpbGw9IiNmMWZhZWUiPjwvcmVjdD4KICA8L2c+Cjwvc3ZnPg==';
