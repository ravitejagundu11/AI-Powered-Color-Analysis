// Season descriptions for user education
export const SEASON_DESCRIPTIONS: Record<string, string> = {
    Spring: 'Spring types have warm, fresh coloring with golden undertones. You look best in warm, clear colors like coral, peach, and warm greens.',
    Summer: 'Summer types have cool, soft coloring with blue or pink undertones. You look best in soft, cool pastels and muted colors like lavender, soft blue, and rose.',
    Autumn: 'Autumn types have warm, rich coloring with golden or olive undertones. You look best in deep warm colors and earth tones like rust, olive, and warm browns.',
    Winter: 'Winter types have cool, clear coloring with high contrast. You look best in bold, cool, vibrant colors like royal blue, emerald, and true red.'
};

// Confidence level interpretation
export const getConfidenceLevel = (confidence: number): string => {
    if (confidence >= 0.85) return 'High';
    if (confidence >= 0.70) return 'Good';
    if (confidence >= 0.55) return 'Moderate';
    return 'Low';
};

export const CONFIDENCE_DESCRIPTION = 'This indicates how certain our AI is about your color season classification.';
