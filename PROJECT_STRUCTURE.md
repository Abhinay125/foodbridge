# Vite + TypeScript Project Structure for Preview Migration

## Complete Directory Tree

```
preview-app/
├── public/
│   ├── locales/
│   │   ├── en.json
│   │   ├── te.json
│   │   └── hi.json
│   └── favicon.ico
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── index.ts
│   │   │   ├── AuthManager.ts
│   │   │   ├── SessionManager.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   ├── SupabaseClient.ts
│   │   │   ├── queries.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── maps/
│   │   │   ├── index.ts
│   │   │   ├── MapManager.ts
│   │   │   ├── MarkerManager.ts
│   │   │   ├── LayerManager.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── ui/
│   │   │   ├── index.ts
│   │   │   ├── UIManager.ts
│   │   │   ├── ModalManager.ts
│   │   │   ├── ToastManager.ts
│   │   │   ├── LoadingManager.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── i18n/
│   │   │   ├── index.ts
│   │   │   ├── I18nManager.ts
│   │   │   ├── translations.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── messages/
│   │   │   ├── index.ts
│   │   │   ├── MessageManager.ts
│   │   │   ├── MessageRenderer.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── donations/
│   │   │   ├── index.ts
│   │   │   ├── DonationManager.ts
│   │   │   ├── PaymentGateway.ts
│   │   │   └── types.ts
│   │   │
│   │   └── analytics/
│   │       ├── index.ts
│   │       ├── AnalyticsManager.ts
│   │       └── types.ts
│   │
│   ├── utils/
│   │   ├── index.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── storage.ts
│   │   ├── dom.ts
│   │   └── constants.ts
│   │
│   ├── styles/
│   │   ├── main.css
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── components/
│   │   │   ├── auth.css
│   │   │   ├── map.css
│   │   │   ├── modal.css
│   │   │   ├── toast.css
│   │   │   └── buttons.css
│   │   └── layouts/
│   │       ├── header.css
│   │       ├── footer.css
│   │       └── grid.css
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── global.d.ts
│   │   └── env.d.ts
│   │
│   ├── config/
│   │   ├── index.ts
│   │   ├── supabase.ts
│   │   ├── maps.ts
│   │   └── app.ts
│   │
│   ├── app.ts
│   ├── main.ts
│   └── vite-env.d.ts
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── .env.example
├── .env.local (gitignored)
├── .gitignore
└── README.md
```

## Module Responsibilities and Interfaces

### 1. Auth Module (`src/modules/auth/`)

**Purpose**: Handle user authentication, registration, and session management.

**Files**:
- `AuthManager.ts`: Main authentication logic
- `SessionManager.ts`: Session persistence and validation
- `types.ts`: Auth-related TypeScript types

**Interface**:
```typescript
interface IAuthManager {
  login(email: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  register(userData: UserRegistration): Promise<AuthResult>;
  getCurrentUser(): User | null;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}
```

### 2. Database Module (`src/modules/database/`)

**Purpose**: Supabase client wrapper and database queries.

**Files**:
- `SupabaseClient.ts`: Singleton Supabase client instance
- `queries.ts`: Typed database queries
- `types.ts`: Database schema types

**Interface**:
```typescript
interface IDatabaseClient {
  fetchMessages(filters?: MessageFilters): Promise<Message[]>;
  createMessage(message: NewMessage): Promise<Message>;
  updateMessage(id: string, updates: Partial<Message>): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
  subscribeToChanges(callback: (payload: RealtimePayload) => void): () => void;
}
```

### 3. Maps Module (`src/modules/maps/`)

**Purpose**: Leaflet map initialization and interaction management.

**Files**:
- `MapManager.ts`: Map initialization and control
- `MarkerManager.ts`: Marker creation and clustering
- `LayerManager.ts`: Layer management (satellite, streets, etc.)
- `types.ts`: Map-related types

**Interface**:
```typescript
interface IMapManager {
  initialize(container: HTMLElement, options?: MapOptions): void;
  setView(lat: number, lng: number, zoom: number): void;
  addMarker(location: Location, options?: MarkerOptions): Marker;
  removeMarker(markerId: string): void;
  fitBounds(bounds: LatLngBounds): void;
}
```

### 4. UI Module (`src/modules/ui/`)

**Purpose**: UI component management and interactions.

**Files**:
- `UIManager.ts`: Main UI coordinator
- `ModalManager.ts`: Modal dialogs
- `ToastManager.ts`: Toast notifications
- `LoadingManager.ts`: Loading states

**Interface**:
```typescript
interface IUIManager {
  showModal(content: string | HTMLElement, options?: ModalOptions): Promise<ModalResult>;
  hideModal(): void;
  showToast(message: string, type?: ToastType): void;
  showLoading(message?: string): void;
  hideLoading(): void;
}
```

### 5. I18n Module (`src/modules/i18n/`)

**Purpose**: Multi-language support (en, te, hi).

**Files**:
- `I18nManager.ts`: Language switching and translation
- `translations.ts`: Translation utilities
- `types.ts`: Translation types

**Interface**:
```typescript
interface II18nManager {
  initialize(defaultLanguage: Language): Promise<void>;
  setLanguage(language: Language): Promise<void>;
  getCurrentLanguage(): Language;
  translate(key: string, params?: Record<string, any>): string;
  t(key: string, params?: Record<string, any>): string; // Alias
}
```

### 6. Messages Module (`src/modules/messages/`)

**Purpose**: Message display and interaction.

**Files**:
- `MessageManager.ts`: Message CRUD operations
- `MessageRenderer.ts`: Message rendering logic
- `types.ts`: Message types

**Interface**:
```typescript
interface IMessageManager {
  loadMessages(filters?: MessageFilters): Promise<void>;
  createMessage(message: NewMessage): Promise<void>;
  updateMessage(id: string, updates: Partial<Message>): Promise<void>;
  deleteMessage(id: string): Promise<void>;
  renderMessages(container: HTMLElement): void;
}
```

### 7. Donations Module (`src/modules/donations/`)

**Purpose**: Donation processing and tracking.

**Files**:
- `DonationManager.ts`: Donation logic
- `PaymentGateway.ts`: Payment gateway integration
- `types.ts`: Donation types

**Interface**:
```typescript
interface IDonationManager {
  initiateDonation(amount: number, details: DonationDetails): Promise<PaymentResult>;
  recordDonation(donation: Donation): Promise<void>;
  getDonationHistory(userId: string): Promise<Donation[]>;
}
```

### 8. Analytics Module (`src/modules/analytics/`)

**Purpose**: User behavior tracking and analytics.

**Files**:
- `AnalyticsManager.ts`: Analytics tracking
- `types.ts`: Analytics types

**Interface**:
```typescript
interface IAnalyticsManager {
  trackEvent(event: string, properties?: Record<string, any>): void;
  trackPageView(page: string): void;
  setUser(userId: string): void;
}
```

## Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  base: '/',
  publicDir: 'public',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@modules': resolve(__dirname, './src/modules'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles'),
      '@types': resolve(__dirname, './src/types'),
      '@config': resolve(__dirname, './src/config'),
    },
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet': ['leaflet'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },

  server: {
    port: 3000,
    host: true,
    open: true,
  },

  optimizeDeps: {
    include: ['leaflet', '@supabase/supabase-js'],
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@modules/*": ["./src/modules/*"],
      "@utils/*": ["./src/utils/*"],
      "@styles/*": ["./src/styles/*"],
      "@types/*": ["./src/types/*"],
      "@config/*": ["./src/config/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### package.json

```json
{
  "name": "preview-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext ts",
    "format": "prettier --write \"src/**/*.{ts,css}\""
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "leaflet": "^1.9.4"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@types/node": "^20.10.5",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "terser": "^5.26.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

## Environment Configuration (.env.example)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Map Configuration
VITE_MAP_DEFAULT_LAT=17.385044
VITE_MAP_DEFAULT_LNG=78.486671
VITE_MAP_DEFAULT_ZOOM=13

# App Configuration
VITE_APP_NAME=Preview App
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_LANGUAGE=en

# API URLs
VITE_API_BASE_URL=https://api.example.com
```

## Key Architecture Decisions

### 1. **Module Organization**
- Each module is self-contained with its own types and logic
- Clear separation of concerns (auth, database, UI, etc.)
- Easy to test and maintain

### 2. **TypeScript First**
- Strict type checking enabled
- Type-safe interfaces for all modules
- Leverages TypeScript 5.3+ features

### 3. **Vanilla TS (No Framework)**
- Direct DOM manipulation
- Event-driven architecture
- Lightweight and fast

### 4. **Build Optimization**
- Code splitting for large dependencies
- Tree shaking for unused code
- Minification with Terser

### 5. **Developer Experience**
- Path aliases for clean imports
- Hot module replacement in development
- TypeScript checking before build

### 6. **Scalability**
- Easy to add new modules
- Clear module boundaries
- Shared utilities in dedicated folder

## Migration Strategy

1. **Phase 1**: Extract HTML structure to `index.html`
2. **Phase 2**: Convert inline CSS to modular CSS files
3. **Phase 3**: Extract JavaScript logic into TypeScript modules
4. **Phase 4**: Implement Supabase integration
5. **Phase 5**: Integrate Leaflet maps
6. **Phase 6**: Add multi-language support
7. **Phase 7**: Testing and optimization

## Additional Files Needed

### .gitignore
```
node_modules/
dist/
.env.local
.DS_Store
*.log
.vite
```

### README.md
Should include:
- Project overview
- Setup instructions
- Environment variables
- Build commands
- Development workflow
- Architecture documentation

## Benefits of This Structure

1. **Maintainability**: Clear module boundaries make updates easier
2. **Testability**: Each module can be tested in isolation
3. **Type Safety**: Full TypeScript coverage prevents runtime errors
4. **Performance**: Optimized build with code splitting
5. **Developer Experience**: Fast HMR, clear imports, type hints
6. **Scalability**: Easy to add new features without affecting existing code
