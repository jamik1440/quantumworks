import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

interface InstancedMeshProps {
    count: number;
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
    positions?: THREE.Vector3[];
    rotations?: THREE.Euler[];
    scales?: THREE.Vector3[];
}

export const OptimizedInstancedMesh = ({
    count,
    geometry,
    material,
    positions = [],
    rotations = [],
    scales = [],
}: InstancedMeshProps) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Generate random positions if not provided
    const instanceData = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push({
                position: positions[i] || new THREE.Vector3(
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50,
                    Math.random() * 100 - 50
                ),
                rotation: rotations[i] || new THREE.Euler(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                ),
                scale: scales[i] || new THREE.Vector3(1, 1, 1),
            });
        }
        return data;
    }, [count, positions, rotations, scales]);

    // Set instance matrices
    useEffect(() => {
        if (!meshRef.current) return;

        const tempObject = new THREE.Object3D();

        instanceData.forEach((data, i) => {
            tempObject.position.copy(data.position);
            tempObject.rotation.copy(data.rotation);
            tempObject.scale.copy(data.scale);
            tempObject.updateMatrix();

            meshRef.current!.setMatrixAt(i, tempObject.matrix);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [instanceData]);

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, count]}
            frustumCulled
        />
    );
};
