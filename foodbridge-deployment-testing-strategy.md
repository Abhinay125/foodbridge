# FoodBridge Deployment & Testing Strategy

## Table of Contents
1. [Deployment Strategy](#deployment-strategy)
2. [Testing Strategy](#testing-strategy)
3. [Test Plan & Scenarios](#test-plan--scenarios)

---

## Deployment Strategy

### 1. Cloudflare Pages Configuration

#### Project Setup
```yaml
# wrangler.toml or Pages configuration
name = "foodbridge"
compatibility_date = "2026-10-09"

[build]
command = "npm run build"
publish = "dist"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200

[env.production]
vars = { NODE_ENV = "production" }

[env.preview]
vars = { NODE_ENV = "preview" }
```

#### Build Configuration
- **Framework**: React + Vite
- **Build Command**: `npm run build` or `pnpm build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or 20.x
- **Install Command**: `npm ci` or `pnpm install --frozen-lockfile`

#### Custom Headers
```toml
[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
Permissions-Policy = "geolocation=(self), camera=(self)"

[[headers]]
for = "/assets/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
```

---

### 2. GitHub Actions Workflow

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy FoodBridge

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: TypeScript type check
        run: npm run type-check

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/unit/coverage-final.json
          flags: unit

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    env:
      VITE_SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/integration/coverage-final.json
          flags: integration

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    env:
      VITE_SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
      VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
      PLAYWRIGHT_BROWSERS_PATH: 0
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: test-results/
          retention-days: 7

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint, unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist
      
      - name: Deploy to Cloudflare Pages (Preview)
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: foodbridge
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://foodbridge.pages.dev
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist
      
      - name: Deploy to Cloudflare Pages (Production)
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: foodbridge
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
          branch: main
      
      - name: Notify deployment
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"FoodBridge deployed to production successfully!"}'
```

---

### 3. Environment Variables Setup

#### Required Environment Variables

**GitHub Secrets** (Repository Settings → Secrets and Variables → Actions):
```bash
# Cloudflare
CLOUDFLARE_API_TOKEN=<your_cloudflare_api_token>
CLOUDFLARE_ACCOUNT_ID=<your_cloudflare_account_id>

# Supabase (Production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>

# Supabase (Test/Staging)
SUPABASE_TEST_URL=https://your-test-project.supabase.co
SUPABASE_TEST_ANON_KEY=<your_test_anon_key>

# Optional: Notifications
SLACK_WEBHOOK_URL=<slack_webhook_for_notifications>
```

**Cloudflare Pages Environment Variables**:
```bash
# Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
NODE_ENV=production

# Preview
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your_staging_anon_key>
NODE_ENV=preview
```

#### `.env` File Structure
```bash
# .env.example (checked into git)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=http://localhost:5173

# .env.local (gitignored, for local development)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=http://localhost:5173
```

---

### 4. Supabase Auth Redirect URLs

#### Configuration in Supabase Dashboard

**Authentication → URL Configuration**:

```yaml
# Site URL (Production)
https://foodbridge.pages.dev

# Redirect URLs (Allowlist)
- https://foodbridge.pages.dev/**
- https://*.foodbridge.pages.dev/**  # Preview deployments
- http://localhost:5173/**            # Local development
- http://127.0.0.1:5173/**            # Local development alternative

# Email Templates - Redirect URLs
Confirm signup: {{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup
Reset password: {{ .SiteURL }}/auth/reset-password?token={{ .Token }}
Magic link: {{ .SiteURL }}/auth/verify?token={{ .Token }}&type=magiclink
```

#### Auth Configuration Code
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: `${appUrl}/auth/callback`,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

---

### 5. Build Optimization

#### Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  build: {
    target: 'es2020',
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
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'vendor-map': ['leaflet', 'react-leaflet'],
        },
      },
    },
    
    chunkSizeWarningLimit: 1000,
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  
  server: {
    port: 5173,
    strictPort: true,
  },
});
```

#### Performance Optimizations
1. **Code Splitting**: Lazy load routes and heavy components
2. **Image Optimization**: Use WebP format, implement lazy loading
3. **Tree Shaking**: Remove unused code automatically
4. **Bundle Analysis**: Monitor bundle size with visualizer
5. **Compression**: Enable gzip and Brotli compression
6. **CDN Caching**: Leverage Cloudflare's CDN for static assets

#### package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "analyze": "vite build --mode analyze"
  }
}
```

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /E2E\         ~10% (Critical user flows)
      /______\
     /        \
    /Integration\   ~30% (API & Service interactions)
   /____________\
  /              \
 /  Unit Tests    \  ~60% (Business logic & utilities)
/__________________\
```

### Test Coverage Goals
- **Unit Tests**: 80%+ coverage for business logic
- **Integration Tests**: 70%+ coverage for Supabase operations
- **E2E Tests**: Cover all critical user journeys

---

### 1. Unit Tests (Vitest)

#### Setup: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
    },
  },
});
```

#### Test Structure
```
src/
├── components/
│   ├── FoodCard.tsx
│   └── FoodCard.test.tsx
├── lib/
│   ├── utils.ts
│   └── utils.test.ts
├── hooks/
│   ├── useDonations.ts
│   └── useDonations.test.ts
└── test/
    ├── setup.ts
    ├── mocks/
    │   ├── supabase.ts
    │   └── handlers.ts
    └── utils/
        └── testHelpers.ts
```

---

### 2. Integration Tests

#### Setup: `vitest.integration.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    setupFiles: ['./src/test/integration-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
```

#### Test Structure
```
src/
└── services/
    ├── donations.service.ts
    ├── donations.integration.test.ts
    ├── pickup.service.ts
    └── pickup.integration.test.ts
```

---

### 3. E2E Tests (Playwright)

#### Setup: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

#### Test Structure
```
e2e/
├── auth.setup.ts
├── auth/
│   ├── signup.spec.ts
│   ├── login.spec.ts
│   └── logout.spec.ts
├── donations/
│   ├── create-donation.spec.ts
│   ├── upload-image.spec.ts
│   └── edit-donation.spec.ts
├── pickups/
│   ├── request-pickup.spec.ts
│   └── cancel-pickup.spec.ts
├── messaging/
│   └── message-visibility.spec.ts
├── navigation/
│   └── user-flows.spec.ts
├── map/
│   └── map-interactions.spec.ts
└── fixtures/
    ├── test-users.ts
    └── test-data.ts
```

---

## Test Plan & Scenarios

### Test Execution Matrix

| Test Category | Tool | Frequency | Environment |
|--------------|------|-----------|-------------|
| Unit Tests | Vitest | On every commit | Local + CI |
| Integration Tests | Vitest | On every commit | Local + CI |
| E2E Tests (Desktop) | Playwright | On PR + Main | CI |
| E2E Tests (Mobile) | Playwright | On PR + Main | CI |
| Visual Regression | Playwright | Weekly | CI |
| Performance Tests | Lighthouse CI | On Main | CI |

---

### 1. Navigation Flow Tests

#### Test Scenario: NAV-001 - Landing Page Navigation
**Objective**: Verify all navigation links work correctly

**Test Steps**:
1. Visit landing page (`/`)
2. Verify header contains: Logo, How It Works, About, Login, Sign Up
3. Click "How It Works" → Verify scroll to section
4. Click "About" → Verify scroll to section
5. Click "Sign Up" → Verify redirect to `/signup`
6. Click "Login" → Verify redirect to `/login`

**Acceptance Criteria**:
- ✅ All links are visible and clickable
- ✅ Navigation is smooth without errors
- ✅ Active section is highlighted
- ✅ Mobile menu works on small screens

#### Test Scenario: NAV-002 - Authenticated User Navigation
**Objective**: Verify authenticated users see correct navigation

**Precondition**: User is logged in

**Test Steps**:
1. Login as donor
2. Verify navbar shows: Dashboard, My Donations, Profile, Logout
3. Click "My Donations" → Verify route `/donations`
4. Click "Dashboard" → Verify route `/dashboard`
5. Verify logout button exists

**Acceptance Criteria**:
- ✅ Authenticated nav replaces public nav
- ✅ All routes load correctly
- ✅ User avatar/name displayed correctly

#### Test Scenario: NAV-003 - Breadcrumb Navigation
**Objective**: Verify breadcrumb trail works

**Test Steps**:
1. Navigate to `/donations/123`
2. Verify breadcrumb: Home > Donations > [Donation Title]
3. Click "Donations" → Verify redirect to `/donations`
4. Click "Home" → Verify redirect to `/`

**Acceptance Criteria**:
- ✅ Breadcrumbs show correct path
- ✅ All breadcrumb links work
- ✅ Current page is not clickable

---

### 2. Authentication Tests

#### Test Scenario: AUTH-001 - User Signup (Donor)
**Objective**: New donor can create an account

**Test Steps**:
1. Navigate to `/signup`
2. Select "I want to donate food" option
3. Fill form:
   - Full Name: "John Donor"
   - Email: "john.donor@test.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
   - Organization: "John's Restaurant"
   - Phone: "+1234567890"
4. Submit form
5. Verify email confirmation message appears
6. Check test email inbox for confirmation link
7. Click confirmation link
8. Verify redirect to onboarding/dashboard

**Acceptance Criteria**:
- ✅ Form validation works (email format, password strength)
- ✅ Passwords must match
- ✅ Email confirmation sent
- ✅ User created in Supabase
- ✅ User role set to "donor"
- ✅ Profile data saved correctly

#### Test Scenario: AUTH-002 - User Signup (Receiver)
**Objective**: New receiver can create an account

**Test Steps**:
1. Navigate to `/signup`
2. Select "I need food" option
3. Fill form:
   - Full Name: "Jane Receiver"
   - Email: "jane.receiver@test.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
   - Organization: "Community Food Bank"
   - Phone: "+1234567891"
4. Submit form
5. Verify email confirmation

**Acceptance Criteria**:
- ✅ User role set to "receiver"
- ✅ Different onboarding flow than donor
- ✅ Profile created with correct data

#### Test Scenario: AUTH-003 - User Login
**Objective**: Existing user can log in

**Test Steps**:
1. Navigate to `/login`
2. Enter email: "john.donor@test.com"
3. Enter password: "SecurePass123!"
4. Click "Login"
5. Verify redirect to dashboard

**Acceptance Criteria**:
- ✅ Login successful with correct credentials
- ✅ Session persisted in localStorage
- ✅ User redirected to appropriate dashboard
- ✅ Error shown for incorrect credentials

#### Test Scenario: AUTH-004 - Password Reset
**Objective**: User can reset forgotten password

**Test Steps**:
1. Navigate to `/login`
2. Click "Forgot Password?"
3. Enter email: "john.donor@test.com"
4. Submit
5. Verify "Check your email" message
6. Check test email inbox
7. Click reset link
8. Enter new password: "NewSecurePass123!"
9. Confirm password
10. Submit
11. Verify redirect to login

**Acceptance Criteria**:
- ✅ Reset email sent
- ✅ Reset token valid
- ✅ Password updated in database
- ✅ User can login with new password

#### Test Scenario: AUTH-005 - Logout
**Objective**: User can log out successfully

**Test Steps**:
1. Login as any user
2. Click "Logout" button
3. Verify redirect to home page
4. Try accessing `/dashboard` → Verify redirect to `/login`

**Acceptance Criteria**:
- ✅ Session cleared
- ✅ User redirected to public page
- ✅ Protected routes inaccessible

#### Test Scenario: AUTH-006 - Protected Route Access
**Objective**: Unauthenticated users cannot access protected pages

**Test Steps**:
1. Logout (if logged in)
2. Try accessing `/dashboard` → Verify redirect to `/login`
3. Try accessing `/donations/new` → Verify redirect to `/login`
4. Try accessing `/profile` → Verify redirect to `/login`

**Acceptance Criteria**:
- ✅ All protected routes redirect to login
- ✅ Return URL preserved for post-login redirect

---

### 3. Food Donation Submission Tests

#### Test Scenario: DONATE-001 - Create New Donation (Basic)
**Objective**: Donor can create a food donation listing

**Precondition**: User logged in as donor

**Test Steps**:
1. Navigate to `/donations/new`
2. Fill form:
   - Food Type: "Prepared Meals"
   - Description: "50 portions of vegetarian pasta"
   - Quantity: "50"
   - Unit: "portions"
   - Best Before: Tomorrow's date
   - Pickup Location: "123 Main St, City"
   - Special Instructions: "Ring doorbell"
3. Click "Create Donation"
4. Verify success message
5. Verify redirect to donation detail page
6. Verify donation appears in "My Donations"

**Acceptance Criteria**:
- ✅ All required fields validated
- ✅ Date validation (must be future date)
- ✅ Donation created in database
- ✅ Donor ID associated correctly
- ✅ Status set to "available"

#### Test Scenario: DONATE-002 - Create Donation with Images
**Objective**: Donor can upload food images

**Precondition**: User logged in as donor

**Test Steps**:
1. Navigate to `/donations/new`
2. Fill basic donation details
3. Click "Upload Image" button
4. Select image file (food.jpg, 2MB)
5. Verify image preview appears
6. Upload second image (food2.jpg)
7. Verify both previews shown
8. Submit donation
9. Verify images saved and accessible

**Acceptance Criteria**:
- ✅ Multiple images can be uploaded
- ✅ Image preview works
- ✅ Images stored in Supabase Storage
- ✅ Image URLs saved to donation record
- ✅ Images display in donation detail view

#### Test Scenario: DONATE-003 - Edit Existing Donation
**Objective**: Donor can edit their donations

**Precondition**: Donor has created a donation

**Test Steps**:
1. Navigate to "My Donations"
2. Click "Edit" on a donation
3. Update quantity from "50" to "45"
4. Update description
5. Click "Save Changes"
6. Verify success message
7. Verify changes reflected in detail view

**Acceptance Criteria**:
- ✅ Only donor can edit their donations
- ✅ Changes saved correctly
- ✅ Edit history tracked (optional)

#### Test Scenario: DONATE-004 - Delete Donation
**Objective**: Donor can delete unpicked donations

**Precondition**: Donor has created donation with no pickups

**Test Steps**:
1. Navigate to donation detail page
2. Click "Delete" button
3. Verify confirmation dialog appears
4. Confirm deletion
5. Verify redirect to "My Donations"
6. Verify donation no longer in list

**Acceptance Criteria**:
- ✅ Confirmation required
- ✅ Donation soft-deleted or removed
- ✅ Cannot delete donation with active pickups

#### Test Scenario: DONATE-005 - Mark Donation as Picked Up
**Objective**: Donor can mark donation as completed

**Precondition**: Donation has confirmed pickup

**Test Steps**:
1. Navigate to donation detail
2. Click "Mark as Picked Up"
3. Verify confirmation dialog
4. Confirm
5. Verify status changes to "completed"
6. Verify no longer in "available" listings

**Acceptance Criteria**:
- ✅ Status updated to "completed"
- ✅ Timestamp recorded
- ✅ Notification sent to receiver

---

### 4. Image Upload Tests

#### Test Scenario: IMAGE-001 - Single Image Upload
**Objective**: Verify single image upload works

**Test Steps**:
1. Create new donation
2. Upload image (JPEG, 1MB)
3. Verify upload progress indicator
4. Verify image preview
5. Submit donation
6. Verify image accessible in detail view

**Acceptance Criteria**:
- ✅ Upload completes successfully
- ✅ Progress indicator shown
- ✅ Image stored in correct path
- ✅ Public URL generated

#### Test Scenario: IMAGE-002 - Multiple Image Upload
**Objective**: Verify multiple images can be uploaded

**Test Steps**:
1. Create new donation
2. Upload 3 images sequentially
3. Verify all 3 previews shown
4. Submit donation
5. Verify all 3 images in detail view
6. Verify correct order maintained

**Acceptance Criteria**:
- ✅ Up to 5 images allowed
- ✅ All images uploaded successfully
- ✅ Order preserved

#### Test Scenario: IMAGE-003 - Image Validation
**Objective**: Verify file type and size validation

**Test Steps**:
1. Try uploading .pdf file → Verify error "Only images allowed"
2. Try uploading 15MB image → Verify error "Max 10MB"
3. Upload valid PNG → Verify success
4. Upload valid WebP → Verify success

**Acceptance Criteria**:
- ✅ Only image types accepted (JPEG, PNG, WebP)
- ✅ Max size enforced (10MB)
- ✅ Clear error messages

#### Test Scenario: IMAGE-004 - Remove Uploaded Image
**Objective**: User can remove image before submission

**Test Steps**:
1. Upload 2 images
2. Click remove on first image
3. Verify image removed from preview
4. Submit donation
5. Verify only 1 image saved

**Acceptance Criteria**:
- ✅ Image removed from preview
- ✅ Not uploaded to storage
- ✅ Only remaining images saved

#### Test Scenario: IMAGE-005 - Image Compression
**Objective**: Verify images are compressed on upload

**Test Steps**:
1. Upload 5MB image
2. Verify compressed version created
3. Check final stored size < original
4. Verify quality acceptable

**Acceptance Criteria**:
- ✅ Images auto-compressed
- ✅ Storage optimized
- ✅ Quality maintained

---

### 5. Pickup Request Workflow Tests

#### Test Scenario: PICKUP-001 - Request Pickup as Receiver
**Objective**: Receiver can request to pickup donation

**Precondition**: Logged in as receiver

**Test Steps**:
1. Navigate to available donations list
2. Click on a donation
3. Click "Request Pickup" button
4. Verify confirmation dialog with details
5. Confirm request
6. Verify success message
7. Verify donation appears in "My Pickups"

**Acceptance Criteria**:
- ✅ Pickup request created
- ✅ Status set to "requested"
- ✅ Notification sent to donor
- ✅ Appears in receiver's pickups list

#### Test Scenario: PICKUP-002 - Donor Approves Pickup Request
**Objective**: Donor can approve pending pickup requests

**Precondition**: Donor has pending pickup request

**Test Steps**:
1. Login as donor
2. Navigate to "Pending Requests"
3. Review pickup request details
4. Click "Approve" button
5. Verify confirmation dialog
6. Confirm approval
7. Verify status changes to "confirmed"
8. Verify notification sent to receiver

**Acceptance Criteria**:
- ✅ Status updated to "confirmed"
- ✅ Notification sent to receiver
- ✅ Contact info visible to both parties

#### Test Scenario: PICKUP-003 - Donor Declines Pickup Request
**Objective**: Donor can decline inappropriate pickup requests

**Precondition**: Donor has pending pickup request

**Test Steps**:
1. Login as donor
2. Click "Decline" on request
3. Enter reason (optional)
4. Confirm decline
5. Verify request removed from pending
6. Verify notification sent to receiver
7. Verify donation still available for others

**Acceptance Criteria**:
- ✅ Request status set to "declined"
- ✅ Notification sent with reason
- ✅ Donation remains available

#### Test Scenario: PICKUP-004 - Multiple Pickup Requests
**Objective**: Verify handling of multiple requests for same donation

**Test Steps**:
1. As receiver 1, request pickup
2. As receiver 2, request pickup
3. As receiver 3, request pickup
4. As donor, approve receiver 2's request
5. Verify other requests auto-declined
6. Verify donation no longer available
7. Verify notifications sent to all

**Acceptance Criteria**:
- ✅ Multiple requests allowed
- ✅ First approval locks donation
- ✅ Other requests auto-declined
- ✅ All parties notified

#### Test Scenario: PICKUP-005 - Cancel Pickup Request
**Objective**: Receiver can cancel their pickup request

**Precondition**: Receiver has pending request

**Test Steps**:
1. Login as receiver
2. Navigate to "My Pickups"
3. Click "Cancel" on pending request
4. Confirm cancellation
5. Verify request removed
6. Verify donor notified
7. Verify donation available again

**Acceptance Criteria**:
- ✅ Request cancelled
- ✅ Donor notified
- ✅ Donation returns to available status

#### Test Scenario: PICKUP-006 - Complete Pickup
**Objective**: Verify pickup completion flow

**Precondition**: Pickup confirmed by donor

**Test Steps**:
1. As donor, mark as "Picked Up"
2. Verify both parties can see completed status
3. Verify rating prompt appears for receiver
4. Receiver rates experience (5 stars)
5. Verify thank you message

**Acceptance Criteria**:
- ✅ Status updated to "completed"
- ✅ Rating system works
- ✅ Stats updated for both users

---

### 6. Message Visibility Tests

#### Test Scenario: MSG-001 - Contact Info Hidden Until Approval
**Objective**: Verify contact info privacy rules

**Test Steps**:
1. As receiver, request pickup
2. Verify cannot see donor phone/address
3. As donor, approve request
4. As receiver, refresh/reload
5. Verify contact info now visible
6. Verify phone number shown
7. Verify full address shown

**Acceptance Criteria**:
- ✅ Contact info hidden until approval
- ✅ Info revealed after approval
- ✅ Both parties can see each other's info

#### Test Scenario: MSG-002 - In-App Messaging
**Objective**: Users can message after pickup approved

**Test Steps**:
1. After approval, click "Message" button
2. Type message: "I'll pick up at 3pm"
3. Send message
4. As other user, verify message received
5. Reply: "Sounds good!"
6. Verify conversation thread

**Acceptance Criteria**:
- ✅ Messaging enabled after approval
- ✅ Real-time message delivery
- ✅ Conversation history preserved
- ✅ Notifications for new messages

#### Test Scenario: MSG-003 - Message Notifications
**Objective**: Users notified of new messages

**Test Steps**:
1. Send message while recipient online
2. Verify real-time notification appears
3. Send message while recipient offline
4. Verify email notification sent
5. Verify unread badge on messages icon

**Acceptance Criteria**:
- ✅ Real-time notifications work
- ✅ Email sent for offline users
- ✅ Unread count accurate

---

### 7. Map Interaction Tests

#### Test Scenario: MAP-001 - View Donations on Map
**Objective**: Available donations shown on map

**Test Steps**:
1. Navigate to map view
2. Verify markers for available donations
3. Click on a marker
4. Verify popup with basic info
5. Click "View Details" in popup
6. Verify redirect to detail page

**Acceptance Criteria**:
- ✅ All available donations shown
- ✅ Markers clustered at zoom out
- ✅ Popup shows: food type, quantity, distance
- ✅ Click redirects to details

#### Test Scenario: MAP-002 - Filter Donations on Map
**Objective**: Users can filter map markers

**Test Steps**:
1. On map view, open filters
2. Select "Prepared Meals" category
3. Verify only meal markers shown
4. Select distance "< 5 miles"
5. Verify only nearby donations shown
6. Clear filters
7. Verify all donations return

**Acceptance Criteria**:
- ✅ Filters work correctly
- ✅ Map updates dynamically
- ✅ Marker count accurate

#### Test Scenario: MAP-003 - User Location
**Objective**: Map centers on user location

**Test Steps**:
1. Visit map page
2. Allow location permission
3. Verify map centers on user location
4. Verify "You are here" marker
5. Deny location permission
6. Verify default location used
7. Verify distance still calculated from IP

**Acceptance Criteria**:
- ✅ Geolocation permission requested
- ✅ Map centers correctly
- ✅ Fallback to IP location works

#### Test Scenario: MAP-004 - Search Location
**Objective**: Users can search for location

**Test Steps**:
1. On map, use search box
2. Type "Central Park, NYC"
3. Select from autocomplete
4. Verify map centers on location
5. Verify donations near that location shown
6. Verify distance recalculated

**Acceptance Criteria**:
- ✅ Location search works
- ✅ Autocomplete suggestions shown
- ✅ Map updates correctly

#### Test Scenario: MAP-005 - Mobile Map Gestures
**Objective**: Map works on mobile devices

**Precondition**: Test on mobile viewport

**Test Steps**:
1. Open map on mobile
2. Pinch to zoom → Verify zoom works
3. Pan by dragging → Verify pan works
4. Tap marker → Verify popup
5. Tap popup → Verify details open
6. Test with fullscreen map mode

**Acceptance Criteria**:
- ✅ Touch gestures work smoothly
- ✅ No performance issues
- ✅ UI elements accessible

---

### 8. Mobile Responsive Behavior Tests

#### Test Scenario: MOBILE-001 - Mobile Navigation
**Objective**: Navigation works on mobile devices

**Viewport**: 375x667 (iPhone SE)

**Test Steps**:
1. Visit home page on mobile
2. Verify hamburger menu appears
3. Tap hamburger → Verify menu slides in
4. Verify all links accessible
5. Tap link → Verify menu closes
6. Verify page navigates correctly

**Acceptance Criteria**:
- ✅ Hamburger menu shown < 768px
- ✅ Smooth slide animation
- ✅ Touch targets > 44x44px
- ✅ No horizontal scroll

#### Test Scenario: MOBILE-002 - Form Inputs on Mobile
**Objective**: Forms are mobile-friendly

**Test Steps**:
1. Open signup form on mobile
2. Tap email field → Verify keyboard opens
3. Verify correct keyboard type (email)
4. Tap phone field → Verify numeric keyboard
5. Verify form doesn't overflow
6. Submit form → Verify validation messages visible

**Acceptance Criteria**:
- ✅ Correct input types used
- ✅ No zoom on input focus
- ✅ Labels clearly visible
- ✅ Buttons easily tappable

#### Test Scenario: MOBILE-003 - Image Upload on Mobile
**Objective**: Image upload works on mobile

**Test Steps**:
1. Create donation on mobile
2. Tap "Upload Image"
3. Verify camera option available
4. Select from gallery
5. Verify image preview
6. Verify orientation correct
7. Submit donation

**Acceptance Criteria**:
- ✅ Camera access works (if permission granted)
- ✅ Gallery picker works
- ✅ Image orientation preserved
- ✅ Upload completes successfully

#### Test Scenario: MOBILE-004 - Tablet Layout
**Objective**: Verify tablet-specific layouts

**Viewport**: 768x1024 (iPad)

**Test Steps**:
1. View donations list on tablet
2. Verify 2-column grid layout
3. Rotate to landscape
4. Verify 3-column layout
5. Test all major pages
6. Verify no UI breaks

**Acceptance Criteria**:
- ✅ Responsive breakpoints work
- ✅ Content readable at all sizes
- ✅ Touch targets adequate

#### Test Scenario: MOBILE-005 - Performance on Mobile
**Objective**: App performs well on mobile

**Test Steps**:
1. Open app on throttled 3G
2. Measure load time
3. Navigate between pages
4. Scroll long lists
5. Interact with map
6. Upload image

**Acceptance Criteria**:
- ✅ Initial load < 5s on 3G
- ✅ Navigation smooth (> 30fps)
- ✅ No janky scrolling
- ✅ Image upload completes

---

## Continuous Improvement

### Monitoring & Alerts
```yaml
# Cloudflare Web Analytics
- Page views and unique visitors
- Performance metrics (LCP, FID, CLS)
- Error tracking and alerts

# Sentry Error Tracking
- Frontend errors
- Performance monitoring
- User feedback collection

# Supabase Monitoring
- API response times
- Database query performance
- Storage usage
- Auth success/failure rates
```

### Scheduled Tests
```yaml
Daily:
  - Smoke tests (critical paths)
  - Performance tests
  - Uptime checks

Weekly:
  - Full E2E suite
  - Visual regression tests
  - Accessibility audit

Monthly:
  - Security scan
  - Dependency updates
  - Load testing
```

---

## Rollback Strategy

### Cloudflare Pages Rollback
```bash
# Via Dashboard
1. Go to Cloudflare Pages → FoodBridge
2. Click "Deployments"
3. Find last stable deployment
4. Click "Rollback to this deployment"
5. Confirm rollback

# Via CLI
wrangler pages deployment list --project-name=foodbridge
wrangler pages deployment rollback <deployment-id>
```

### Database Migration Rollback
```sql
-- Supabase migrations are version controlled
-- Rollback via migration down scripts
-- Or restore from point-in-time backup

-- Via Supabase CLI
supabase db reset
supabase db push --dry-run
```

---

## Summary

This deployment and testing strategy provides:

1. **Automated CI/CD** with GitHub Actions
2. **Multi-environment support** (dev, preview, production)
3. **Comprehensive test coverage** (unit, integration, E2E)
4. **Mobile-first testing** approach
5. **Performance optimization** with build tools
6. **Security best practices** throughout
7. **Monitoring and observability** for production
8. **Clear rollback procedures** for incidents

**Next Steps**:
1. Set up Cloudflare Pages project
2. Configure GitHub repository secrets
3. Implement test files per this plan
4. Set up Supabase projects (test + prod)
5. Configure auth redirect URLs
6. Run initial test suite
7. Deploy to preview environment
8. Verify all flows work end-to-end
9. Deploy to production
10. Monitor and iterate
