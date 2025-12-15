import { useState, useEffect } from 'react';

export function useWebGL(): {
    isSupported: boolean;
    isWebGL2Supported: boolean;
    maxTextureSize: number;
    renderer: string;
} {
    const [webGLInfo, setWebGLInfo] = useState({
        isSupported: false,
        isWebGL2Supported: false,
        maxTextureSize: 0,
        renderer: 'Unknown',
    });

    useEffect(() => {
        const checkWebGL = () => {
            try {
                const canvas = document.createElement('canvas');

                // Check WebGL 1.0
                const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
                const isSupported = !!gl;

                // Check WebGL 2.0
                const gl2 = canvas.getContext('webgl2');
                const isWebGL2Supported = !!gl2;

                let maxTextureSize = 0;
                let renderer = 'Unknown';

                if (gl) {
                    maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        renderer = gl.getParameter((debugInfo as any).UNMASKED_RENDERER_WEBGL);
                    }
                }

                setWebGLInfo({
                    isSupported,
                    isWebGL2Supported,
                    maxTextureSize,
                    renderer,
                });
            } catch (error) {
                console.error('Error checking WebGL support:', error);
            }
        };

        checkWebGL();
    }, []);

    return webGLInfo;
}
