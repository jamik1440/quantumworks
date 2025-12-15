// Environment configuration
export const config = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    cdnUrl: import.meta.env.VITE_CDN_URL || '',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
} as const;

// CDN helpers
export const CDN = {
    getAssetUrl: (path: string) => {
        if (config.isProduction && config.cdnUrl) {
            return `${config.cdnUrl}${path}`;
        }
        return path;
    },

    getModelUrl: (filename: string) => {
        return CDN.getAssetUrl(`/models/${filename}`);
    },

    getTextureUrl: (filename: string) => {
        return CDN.getAssetUrl(`/textures/${filename}`);
    },
};
