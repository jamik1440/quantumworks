# Frontend Architecture Guide
## React + TypeScript + Vite + Three.js

---

## 1. Scalable Folder Structure

### Recommended Project Structure

```
quantumworks/
├── public/                          # Static assets
│   ├── models/                      # 3D models (.glb, .gltf)
│   ├── textures/                    # Texture files
│   ├── fonts/                       # Custom fonts
│   └── images/                      # Static images
│
├── src/
│   ├── app/                         # App-level configuration
│   │   ├── App.tsx                  # Root component
│   │   ├── Router.tsx               # Route configuration
│   │   └── providers/               # Global providers
│   │       ├── ThemeProvider.tsx
│   │       ├── AuthProvider.tsx
│   │       └── QueryProvider.tsx
│   │
│   ├── assets/                      # Source assets
│   │   ├── icons/                   # SVG icons
│   │   ├── images/                  # Images to be processed
│   │   └── styles/                  # Global styles
│   │       ├── global.css
│   │       ├── variables.css
│   │       └── animations.css
│   │
│   ├── components/                  # Reusable components
│   │   ├── ui/                      # Basic UI components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.module.css
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   ├── Sidebar/
│   │   │   └── Container/
│   │   │
│   │   ├── three/                   # Three.js components
│   │   │   ├── Scene/
│   │   │   ├── Camera/
│   │   │   ├── Lights/
│   │   │   ├── Models/
│   │   │   │   ├── AnimatedModel/
│   │   │   │   ├── InteractiveModel/
│   │   │   │   └── OptimizedModel/
│   │   │   ├── Effects/
│   │   │   │   ├── PostProcessing/
│   │   │   │   ├── Particles/
│   │   │   │   └── Shaders/
│   │   │   └── Controls/
│   │   │
│   │   └── shared/                  # Shared/composite components
│   │       ├── LoadingSpinner/
│   │       ├── ErrorBoundary/
│   │       └── Suspense/
│   │
│   ├── features/                    # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm/
│   │   │   │   └── RegisterForm/
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useLogin.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── store/
│   │   │   │   └── authStore.ts
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   └── utils/
│   │   │       └── validation.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   │
│   │   ├── tasks/
│   │   ├── reviews/
│   │   ├── disputes/
│   │   └── admin/
│   │
│   ├── hooks/                       # Global custom hooks
│   │   ├── useDebounce.ts
│   │   ├── useIntersectionObserver.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useThrottle.ts
│   │   └── useWebGL.ts
│   │
│   ├── lib/                         # Third-party integrations
│   │   ├── axios/
│   │   │   ├── client.ts
│   │   │   └── interceptors.ts
│   │   ├── three/
│   │   │   ├── loaders.ts
│   │   │   ├── helpers.ts
│   │   │   └── optimizations.ts
│   │   └── analytics/
│   │
│   ├── pages/                       # Page components
│   │   ├── Home/
│   │   │   ├── Home.tsx
│   │   │   ├── Home.module.css
│   │   │   └── index.ts
│   │   ├── Dashboard/
│   │   ├── Auth/
│   │   ├── NotFound/
│   │   └── index.ts
│   │
│   ├── services/                    # API services
│   │   ├── api/
│   │   │   ├── base.ts
│   │   │   ├── users.ts
│   │   │   ├── tasks.ts
│   │   │   └── reviews.ts
│   │   └── websocket/
│   │       └── client.ts
│   │
│   ├── store/                       # Global state management
│   │   ├── slices/                  # Redux slices (if using Redux)
│   │   │   ├── userSlice.ts
│   │   │   └── uiSlice.ts
│   │   ├── atoms/                   # Jotai atoms (if using Jotai)
│   │   │   ├── userAtoms.ts
│   │   │   └── uiAtoms.ts
│   │   └── index.ts
│   │
│   ├── types/                       # Global TypeScript types
│   │   ├── api.types.ts
│   │   ├── models.types.ts
│   │   ├── three.types.ts
│   │   └── global.d.ts
│   │
│   ├── utils/                       # Utility functions
│   │   ├── formatters/
│   │   │   ├── date.ts
│   │   │   ├── currency.ts
│   │   │   └── number.ts
│   │   ├── validators/
│   │   │   ├── email.ts
│   │   │   └── form.ts
│   │   ├── helpers/
│   │   │   ├── array.ts
│   │   │   ├── object.ts
│   │   │   └── string.ts
│   │   └── constants.ts
│   │
│   ├── config/                      # Configuration files
│   │   ├── env.ts
│   │   ├── routes.ts
│   │   └── theme.ts
│   │
│   ├── main.tsx                     # Entry point
│   └── vite-env.d.ts
│
├── tests/                           # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### Folder Structure Principles

#### **1. Feature-Based Organization**
- Group related code by feature/domain
- Each feature is self-contained
- Easy to locate and modify code

#### **2. Component Organization**
```typescript
// Each component folder contains:
ComponentName/
├── ComponentName.tsx        // Component logic
├── ComponentName.module.css // Scoped styles
├── ComponentName.test.tsx   // Unit tests
├── ComponentName.stories.tsx // Storybook stories (optional)
├── types.ts                 // Component-specific types
├── hooks.ts                 // Component-specific hooks
└── index.ts                 // Public exports
```

#### **3. Barrel Exports**
```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';

// Usage:
import { Button, Input, Modal } from '@/components/ui';
```

---

## 2. State Management Strategy

### State Management Decision Tree

```
Is the state needed globally?
│
├─ NO → Use local component state (useState)
│       or React Context for small scope
│
└─ YES → What type of state?
         │
         ├─ Server State (API data)
         │  └─ Use: TanStack Query (React Query)
         │
         ├─ UI State (theme, modals, etc.)
         │  └─ Use: Zustand or Jotai
         │
         ├─ Form State
         │  └─ Use: React Hook Form
         │
         └─ Complex Global State
            └─ Use: Redux Toolkit or Zustand
```

### Recommended Stack

#### **1. TanStack Query (React Query)** - Server State
```typescript
// services/api/tasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios/client';

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await apiClient.get('/tasks');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: TaskInput) => {
      const { data } = await apiClient.post('/tasks', taskData);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
```

#### **2. Zustand** - Global UI State
```typescript
// store/uiStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  modalStack: string[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        sidebarOpen: true,
        modalStack: [],
        
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        openModal: (modalId) => set((state) => ({ 
          modalStack: [...state.modalStack, modalId] 
        })),
        closeModal: () => set((state) => ({ 
          modalStack: state.modalStack.slice(0, -1) 
        })),
      }),
      { name: 'ui-storage' }
    )
  )
);
```

#### **3. Jotai** - Atomic State (Alternative to Zustand)
```typescript
// store/atoms/userAtoms.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const userAtom = atom<User | null>(null);
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null);
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');

// Derived atoms
export const userRoleAtom = atom((get) => {
  const user = get(userAtom);
  return user?.role ?? 'guest';
});
```

#### **4. React Hook Form** - Form State
```typescript
// features/auth/components/LoginForm/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // Handle login
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### State Management Best Practices

#### **1. Separate Concerns**
```typescript
// ❌ Bad: Mixing server and UI state
const [tasks, setTasks] = useState([]);
const [loading, setLoading] = useState(false);

// ✅ Good: Use appropriate tools
const { data: tasks, isLoading } = useTasks(); // Server state
const { sidebarOpen } = useUIStore(); // UI state
```

#### **2. Colocate State**
```typescript
// ❌ Bad: Global state for local UI
const { modalOpen, setModalOpen } = useGlobalStore();

// ✅ Good: Local state for local UI
const [modalOpen, setModalOpen] = useState(false);
```

#### **3. Optimize Re-renders**
```typescript
// Use selectors to prevent unnecessary re-renders
const theme = useUIStore((state) => state.theme); // Only re-renders when theme changes
```

---

## 3. Performance Optimization Plan

### Performance Optimization Checklist

#### **A. Code Splitting & Lazy Loading**

```typescript
// app/Router.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// Lazy load pages
const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Admin = lazy(() => import('@/pages/Admin'));

export const Router = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
```

#### **B. Three.js Optimization**

```typescript
// components/three/OptimizedModel/OptimizedModel.tsx
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

interface OptimizedModelProps {
  url: string;
  quality: 'low' | 'medium' | 'high';
}

export const OptimizedModel = ({ url, quality }: OptimizedModelProps) => {
  const { scene } = useGLTF(url);
  
  // Optimize materials
  useMemo(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Enable frustum culling
        child.frustumCulled = true;
        
        // Optimize materials
        if (child.material) {
          child.material.precision = quality === 'high' ? 'highp' : 'mediump';
          
          // Disable unnecessary features for performance
          if (quality === 'low') {
            child.material.flatShading = true;
            child.castShadow = false;
            child.receiveShadow = false;
          }
        }
        
        // Optimize geometry
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
      }
    });
  }, [scene, quality]);
  
  return <primitive object={scene} />;
};

// Preload models
useGLTF.preload('/models/character.glb');
```

#### **C. Level of Detail (LOD)**

```typescript
// components/three/LODModel/LODModel.tsx
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const LODModel = () => {
  const lodRef = useRef<THREE.LOD>(null);
  
  useEffect(() => {
    if (!lodRef.current) return;
    
    const lod = lodRef.current;
    
    // High detail (close)
    const highDetail = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial()
    );
    lod.addLevel(highDetail, 0);
    
    // Medium detail
    const mediumDetail = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshStandardMaterial()
    );
    lod.addLevel(mediumDetail, 10);
    
    // Low detail (far)
    const lowDetail = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshBasicMaterial()
    );
    lod.addLevel(lowDetail, 20);
  }, []);
  
  return <lod ref={lodRef} />;
};
```

#### **D. Instance Rendering**

```typescript
// components/three/InstancedModels/InstancedModels.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const InstancedModels = ({ count = 1000 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const positions = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          Math.random() * 100 - 50,
          Math.random() * 100 - 50,
          Math.random() * 100 - 50,
        ],
      });
    }
    return temp;
  }, [count]);
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    const tempObject = new THREE.Object3D();
    positions.forEach((item, i) => {
      tempObject.position.set(...item.position);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry />
      <meshStandardMaterial />
    </instancedMesh>
  );
};
```

#### **E. React Performance Optimizations**

```typescript
// 1. Memoization
import { memo, useMemo, useCallback } from 'react';

export const ExpensiveComponent = memo(({ data }: Props) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);
  
  // Memoize callbacks
  const handleClick = useCallback(() => {
    console.log('Clicked');
  }, []);
  
  return <div onClick={handleClick}>{processedData}</div>;
});

// 2. Virtual Lists for large datasets
import { FixedSizeList } from 'react-window';

export const VirtualList = ({ items }: { items: any[] }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
};

// 3. Debounce expensive operations
import { useDebouncedCallback } from 'use-debounce';

export const SearchInput = () => {
  const handleSearch = useDebouncedCallback((value: string) => {
    // Expensive search operation
    performSearch(value);
  }, 300);
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
};
```

#### **F. Image Optimization**

```typescript
// components/ui/OptimizedImage/OptimizedImage.tsx
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  lazy = true 
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(!lazy);
  
  useEffect(() => {
    if (!lazy) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    const element = document.getElementById(`img-${src}`);
    if (element) observer.observe(element);
    
    return () => observer.disconnect();
  }, [src, lazy]);
  
  return (
    <div id={`img-${src}`} style={{ width, height }}>
      {inView && (
        <>
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
          />
          {!loaded && <div className="skeleton" />}
        </>
      )}
    </div>
  );
};
```

#### **G. Bundle Size Optimization**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true }), // Analyze bundle size
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'ui-vendor': ['framer-motion', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three'],
  },
});
```

### Performance Monitoring

```typescript
// utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start}ms`);
};

// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const reportWebVitals = () => {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
};
```

---

## 4. Error Handling & UX Fallback Strategies

### Error Boundary Implementation

```typescript
// components/shared/ErrorBoundary/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error tracking service
    this.logErrorToService(error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Send to Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Three.js Error Boundary

```typescript
// components/three/ThreeErrorBoundary/ThreeErrorBoundary.tsx
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export const ThreeErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="three-error-fallback">
          <h3>3D Scene Error</h3>
          <p>Unable to load 3D content. Your device may not support WebGL.</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      }
      onError={(error) => {
        console.error('Three.js error:', error);
        // Check if WebGL is supported
        if (!isWebGLAvailable()) {
          console.warn('WebGL not supported');
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

// utils/webgl.ts
export const isWebGLAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
};
```

### API Error Handling

```typescript
// lib/axios/client.ts
import axios, { AxiosError } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access denied');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error');
          break;
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response received');
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);
```

### React Query Error Handling

```typescript
// app/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Query error:', error);
        // Show toast notification
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
        // Show error notification
      },
    },
  },
});

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
```

### Loading States & Skeletons

```typescript
// components/shared/Suspense/SuspenseFallback.tsx
export const SuspenseFallback = () => {
  return (
    <div className="suspense-fallback">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
};

// components/ui/Skeleton/Skeleton.tsx
export const Skeleton = ({ 
  width, 
  height, 
  variant = 'rectangular' 
}: SkeletonProps) => {
  return (
    <div
      className={`skeleton skeleton-${variant}`}
      style={{ width, height }}
    />
  );
};

// Usage in components
export const TaskCard = ({ taskId }: { taskId: string }) => {
  const { data: task, isLoading, error } = useTask(taskId);
  
  if (isLoading) {
    return (
      <div className="task-card">
        <Skeleton width="100%" height={20} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={16} />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="task-card-error">
        <p>Failed to load task</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }
  
  return <div className="task-card">{/* Render task */}</div>;
};
```

### Offline Support

```typescript
// hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// components/shared/OfflineIndicator/OfflineIndicator.tsx
export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  
  if (isOnline) return null;
  
  return (
    <div className="offline-banner">
      <p>You are currently offline. Some features may be unavailable.</p>
    </div>
  );
};
```

### Graceful Degradation for Three.js

```typescript
// components/three/Scene/AdaptiveScene.tsx
import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';

export const AdaptiveScene = ({ children }: { children: ReactNode }) => {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [fps, setFps] = useState(60);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        
        // Adjust quality based on FPS
        if (currentFPS < 30) {
          setQuality('low');
        } else if (currentFPS < 50) {
          setQuality('medium');
        } else {
          setQuality('high');
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  return (
    <Canvas
      dpr={quality === 'low' ? 1 : quality === 'medium' ? 1.5 : 2}
      performance={{ min: 0.5 }}
      gl={{
        antialias: quality !== 'low',
        alpha: true,
        powerPreference: quality === 'high' ? 'high-performance' : 'default',
      }}
    >
      {children}
    </Canvas>
  );
};
```

---

## 5. Best Practices

### TypeScript Best Practices

```typescript
// 1. Use strict mode
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}

// 2. Define proper types
// types/api.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = 'admin' | 'moderator' | 'user';

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// 3. Use discriminated unions
export type TaskStatus = 
  | { type: 'pending'; submittedAt: Date }
  | { type: 'in_progress'; startedAt: Date; assignee: string }
  | { type: 'completed'; completedAt: Date; result: string }
  | { type: 'cancelled'; reason: string };

// 4. Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];
```

### Code Organization Best Practices

```typescript
// 1. Single Responsibility Principle
// ❌ Bad: Component doing too much
const UserDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  // ... 200 lines of code
};

// ✅ Good: Separated concerns
const UserDashboard = () => {
  return (
    <>
      <UserStats />
      <UserList />
      <UserActions />
    </>
  );
};

// 2. Custom hooks for reusable logic
// hooks/useUser.ts
export const useUser = (userId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  
  return { user: data, isLoading, error };
};

// 3. Composition over inheritance
// ❌ Bad: Deep component hierarchy
<Container>
  <Wrapper>
    <Box>
      <Content />
    </Box>
  </Wrapper>
</Container>

// ✅ Good: Flat composition
<Container>
  <Content />
</Container>
```

### Testing Best Practices

```typescript
// tests/unit/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

---

## 6. Performance Checklist

### Development Phase
- [ ] Enable React DevTools Profiler
- [ ] Use React.memo for expensive components
- [ ] Implement code splitting with React.lazy
- [ ] Use useMemo for expensive calculations
- [ ] Use useCallback for function props
- [ ] Implement virtual scrolling for long lists
- [ ] Optimize images (WebP, lazy loading)
- [ ] Use CSS modules or styled-components for scoped styles
- [ ] Implement proper error boundaries
- [ ] Add loading states and skeletons

### Three.js Specific
- [ ] Use instancing for repeated geometries
- [ ] Implement LOD (Level of Detail)
- [ ] Enable frustum culling
- [ ] Optimize materials (reduce shader complexity)
- [ ] Use texture compression
- [ ] Implement object pooling
- [ ] Dispose of geometries and materials properly
- [ ] Use lower polygon models when possible
- [ ] Implement adaptive quality based on FPS
- [ ] Preload critical 3D assets

### Build Phase
- [ ] Analyze bundle size with visualizer
- [ ] Configure code splitting in Vite
- [ ] Enable tree shaking
- [ ] Minify and compress assets
- [ ] Use CDN for static assets
- [ ] Enable gzip/brotli compression
- [ ] Implement service worker for caching
- [ ] Optimize font loading
- [ ] Remove unused dependencies
- [ ] Use production builds

### Runtime Phase
- [ ] Monitor Web Vitals (LCP, FID, CLS)
- [ ] Implement performance monitoring
- [ ] Use React Query for data caching
- [ ] Implement request deduplication
- [ ] Add request/response compression
- [ ] Use IndexedDB for offline storage
- [ ] Implement pagination for large datasets
- [ ] Debounce/throttle expensive operations
- [ ] Monitor memory leaks
- [ ] Profile with Chrome DevTools

---

## 7. Quick Reference

### Import Aliases (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/features/*": ["src/features/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/store/*": ["src/store/*"],
      "@/services/*": ["src/services/*"]
    }
  }
}
```

### Essential Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "@tanstack/react-query": "^5.14.0",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "axios": "^1.6.2",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/three": "^0.160.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  }
}
```

---

## Summary

This architecture provides:

✅ **Scalable folder structure** with feature-based organization  
✅ **Optimal state management** using the right tool for each use case  
✅ **Comprehensive performance optimizations** for React and Three.js  
✅ **Robust error handling** with fallback strategies  
✅ **Type-safe development** with TypeScript best practices  
✅ **Production-ready setup** with monitoring and optimization  

Follow this guide to build a high-performance, maintainable React application with Three.js integration!
