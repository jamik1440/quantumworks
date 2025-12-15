import { useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { DeviceDetector } from '@/utils/device';
import * as THREE from 'three';

interface QualitySettings {
    pixelRatio: number;
    shadowMapSize: number;
    antialias: boolean;
    toneMapping: boolean;
    maxLights: number;
}

const QUALITY_PRESETS: Record<'low' | 'medium' | 'high', QualitySettings> = {
    low: {
        pixelRatio: 1,
        shadowMapSize: 512,
        antialias: false,
        toneMapping: false,
        maxLights: 2,
    },
    medium: {
        pixelRatio: 1.5,
        shadowMapSize: 1024,
        antialias: true,
        toneMapping: true,
        maxLights: 4,
    },
    high: {
        pixelRatio: 2,
        shadowMapSize: 2048,
        antialias: true,
        toneMapping: true,
        maxLights: 8,
    },
};

export const useAdaptiveQuality = () => {
    const { gl, scene } = useThree();
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
    const [fps, setFps] = useState(60);
    const [autoAdjust, setAutoAdjust] = useState(true);

    // Initial quality detection
    useEffect(() => {
        const initialQuality = DeviceDetector.getRecommendedQuality();
        setQuality(initialQuality);
        applyQualitySettings(initialQuality);
    }, []);

    // FPS monitoring
    useFrame(({ clock }) => {
        if (!autoAdjust) return;

        const currentFps = 1 / clock.getDelta();
        setFps(currentFps);

        // Adjust quality based on FPS (with debouncing)
        if (currentFps < 25 && quality !== 'low') {
            const newQuality = quality === 'high' ? 'medium' : 'low';
            setQuality(newQuality);
            applyQualitySettings(newQuality);
        } else if (currentFps > 55 && quality !== 'high') {
            const newQuality = quality === 'low' ? 'medium' : 'high';
            setQuality(newQuality);
            applyQualitySettings(newQuality);
        }
    });

    const applyQualitySettings = (quality: 'low' | 'medium' | 'high') => {
        const settings = QUALITY_PRESETS[quality];

        // Apply renderer settings
        gl.setPixelRatio(Math.min(settings.pixelRatio, window.devicePixelRatio));
        gl.shadowMap.enabled = quality !== 'low';
        gl.shadowMap.type = quality === 'high'
            ? THREE.PCFSoftShadowMap
            : THREE.BasicShadowMap;

        // Apply scene settings
        scene.traverse((object) => {
            if (object instanceof THREE.Light) {
                object.castShadow = quality !== 'low';
                if (object instanceof THREE.DirectionalLight || object instanceof THREE.SpotLight) {
                    object.shadow.mapSize.setScalar(settings.shadowMapSize);
                }
            }

            if (object instanceof THREE.Mesh) {
                object.castShadow = quality !== 'low';
                object.receiveShadow = quality !== 'low';
            }
        });
    };

    return {
        quality,
        fps,
        setQuality: (q: 'low' | 'medium' | 'high') => {
            setQuality(q);
            applyQualitySettings(q);
        },
        setAutoAdjust,
    };
};

// Component
export const AdaptiveQualityManager = () => {
    const { quality, fps } = useAdaptiveQuality();

    return (
        <div style={{
            position: 'fixed',
            top: 50,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: 9999,
        }}>
            <div>Quality: {quality.toUpperCase()}</div>
            <div>FPS: {fps.toFixed(0)}</div>
        </div>
    );
};
