# FoodBridge

FoodBridge is a platform for food redistribution and community support, connecting food donors with local communities in need.

## Tech Stack

- **Framework**: Vanilla TypeScript with Vite
- **Database & Auth**: Supabase
- **Maps**: Leaflet.js
- **Build Tool**: Vite
- **Testing**: Vitest (unit), Playwright (e2e)
- **Code Quality**: ESLint, Prettier, TypeScript (strict mode)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
cd foodbridge

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `VITE_APP_URL` | Application URL (default: http://localhost:3000) | No |

### Development

```bash
# Start development server
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format

# Run unit tests
pnpm test:unit

# Run e2e tests
pnpm test:e2e
```

### Building for Production

```bash
# Build production bundle
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
foodbridge/
├── src/
│   ├── config/         # Configuration files
│   ├── modules/        # Feature modules
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
├── tests/              # Test files
└── ...
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test:unit` | Run unit tests with Vitest |
| `pnpm test:e2e` | Run e2e tests with Playwright |

## License

MIT