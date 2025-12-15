/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_CDN_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Extend Window interface
declare global {
    interface Window {
        // Add any global window properties here
    }
}

export { };
