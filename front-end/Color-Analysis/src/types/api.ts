// API Response Types
export interface ApiColorResponse {
    name: string;
    hex: string;
}

export interface ApiPalettesResponse {
    primary: ApiColorResponse[];
    secondary: ApiColorResponse[];
}

export interface ApiAnalysisResponse {
    season: string;
    palettes: ApiPalettesResponse;
    confidence: number;
    all_probabilities: Record<string, number>;
}

export interface ApiErrorResponse {
    detail: string;
}
