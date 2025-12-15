import { useState } from 'react';
import { useFrame } from '@react-three/fiber';

interface FPSCounterProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const FPSCounter = ({ position = 'top-left' }: FPSCounterProps) => {
    const [fps, setFps] = useState(0);

    useFrame(({ clock }) => {
        const currentFps = Math.round(1 / clock.getDelta());
        setFps(currentFps);
    });

    const positionStyles = {
        'top-left': { top: 10, left: 10 },
        'top-right': { top: 10, right: 10 },
        'bottom-left': { bottom: 10, left: 10 },
        'bottom-right': { bottom: 10, right: 10 },
    };

    return (
        <div style={{
            position: 'fixed',
            ...positionStyles[position],
            background: fps < 30 ? '#ef4444' : fps < 50 ? '#f59e0b' : '#10b981',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
            {fps} FPS
        </div>
    );
};
