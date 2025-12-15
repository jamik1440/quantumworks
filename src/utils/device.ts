// Device detection utilities
export class DeviceDetector {
    static isMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    static isTablet(): boolean {
        return /iPad|Android/i.test(navigator.userAgent) && !this.isMobile();
    }

    static isLowEndDevice(): boolean {
        // Check for low-end indicators
        const memory = (navigator as any).deviceMemory; // GB
        const cores = navigator.hardwareConcurrency;

        if (memory && memory < 4) return true;
        if (cores && cores < 4) return true;

        return this.isMobile();
    }

    static getRecommendedQuality(): 'low' | 'medium' | 'high' {
        if (this.isLowEndDevice()) return 'low';
        if (this.isMobile() || this.isTablet()) return 'medium';
        return 'high';
    }

    static supportsWebGL2(): boolean {
        try {
            const canvas = document.createElement('canvas');
            return !!canvas.getContext('webgl2');
        } catch {
            return false;
        }
    }

    static async getGPUTier(): Promise<'high' | 'medium' | 'low'> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

            if (!gl) {
                resolve('low');
                return;
            }

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL);

                // Simple heuristic
                if (/Intel HD|Intel UHD 6/.test(renderer)) {
                    resolve('low');
                } else if (/GTX|RTX|Radeon RX/.test(renderer)) {
                    resolve('high');
                } else {
                    resolve('medium');
                }
            } else {
                resolve('medium');
            }
        });
    }
}
