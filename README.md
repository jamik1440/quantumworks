# QuantumWorks - Precision Talent. Quantum Speed.

Modern marketplace platform built with React, TypeScript, Three.js, and cutting-edge web technologies.

## 🚀 Features

- **Modern UI/UX** - Beautiful, responsive design with Framer Motion animations
- **3D Graphics** - Powered by Three.js and React Three Fiber
- **State Management** - Zustand for global state, React Query for server state
- **Performance Optimized** - Code splitting, lazy loading, adaptive quality
- **Type Safe** - Full TypeScript support with strict mode
- **Real-time** - WebSocket integration for live updates
- **AI-Powered** - Gemini AI integration for smart features

## 📦 Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **Framer Motion** - Animation library
- **Zustand** - State management
- **React Query** - Server state management
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database
- **WebSocket** - Real-time communication
- **Redis** - Caching

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Analyze bundle
npm run build:analyze
```

## 📁 Project Structure

```
quantumworks/
├── src/
│   ├── components/     # Reusable components
│   │   ├── three/     # Three.js components
│   │   └── shared/    # Shared components
│   ├── features/      # Feature modules
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Third-party integrations
│   ├── store/         # State management
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript types
├── pages/             # Page components
├── components/        # Legacy components
├── contexts/          # React contexts
├── services/          # API services
├── backend/           # Python backend
└── docs/              # Documentation
```

## 🎨 Architecture

See detailed architecture documentation:
- [Admin System Architecture](docs/admin-system-architecture.md)
- [Frontend Architecture](docs/frontend-architecture.md)
- [WebGL Performance Optimization](docs/webgl-performance-optimization.md)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your_api_key_here
```

### Path Aliases

The project uses path aliases for cleaner imports:

```typescript
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/axios/client';
```

## 🚀 Performance

- **Code Splitting** - Automatic route-based code splitting
- **Lazy Loading** - Components and images loaded on demand
- **Adaptive Quality** - Automatically adjusts 3D quality based on device
- **Instanced Rendering** - Efficient rendering of thousands of objects
- **Asset Optimization** - Compressed textures and models

## 📱 Mobile Support

- Responsive design for all screen sizes
- Adaptive quality for mobile devices
- Touch-friendly interactions
- Fallback to 2D when WebGL is unavailable

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## 📝 License

MIT

## 👥 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 🔗 Links

- [Documentation](docs/)
- [API Documentation](backend/README.md)
- [Changelog](CHANGELOG.md)
