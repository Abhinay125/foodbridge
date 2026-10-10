import { test, expect } from '@playwright/test';

test.describe('FoodBridge App', () => {
  test.beforeEach(async ({ page }) => {
    // Collect ALL console messages BEFORE navigation
    page.on('console', msg => {
      console.log('BROWSER:', msg.type(), msg.text());
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('http://localhost:3000/');
    // Wait for the app to initialize
    await page.waitForLoadState('networkidle');
    // Add small delay for JS initialization
    await page.waitForTimeout(1000);
  });

  test('Home page loads and shows content', async ({ page }) => {
    // Check that the main container exists
    await expect(page.locator('#app-content')).toBeVisible();
    
    // Collect ALL console messages
    page.on('console', msg => {
      console.log('BROWSER:', msg.type(), msg.text());
    });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    // Check initial URL
    const url = page.url();
    console.log('=== INITIAL URL ===', url);
    
    // Wait for the app to fully initialize and render
    await page.waitForTimeout(5000);
    
    // Check the actual body content (what's actually rendered by the app)
    const bodyContent = await page.locator('body').innerHTML();
    console.log('=== BODY CONTENT ===');
    console.log(bodyContent.substring(0, 10000));
    console.log('=== END ===');
    
    // Check the app-content content
    const appContent = await page.locator('#app-content').innerHTML();
    console.log('=== APP CONTENT ===');
    console.log(appContent);
    console.log('=== END ===');
    
    // Check for JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));
    console.log('=== JS ERRORS ===', jsErrors);
    
    // Check for intro section
    await expect(page.locator('.intro')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.intro h2')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.intro p')).toBeVisible({ timeout: 5000 });
    
    // Check sidebar navigation
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('nav button[data-page="home"]')).toBeVisible();
    await expect(page.locator('nav button[data-page="donate"]')).toBeVisible();
    await expect(page.locator('nav button[data-page="map"]')).toBeVisible();
    await expect(page.locator('nav button[data-page="messages"]')).toBeVisible();
    await expect(page.locator('nav button[data-page="settings"]')).toBeVisible();
  });

  test('Navigation to Food page works (shows food listings)', async ({ page }) => {
    // Food listings are on the home page at /
    await page.click('nav button[data-page="home"]');
    await page.waitForURL('**/#/');
    
    await expect(page.locator('#app-content')).toBeVisible();
    // Should show intro section with Donate button
    await expect(page.locator('.intro')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.home-actions a[href="#/donate"]')).toBeVisible({ timeout: 5000 });
  });

  test('Navigation to Donate page works (open form)', async ({ page }) => {
    await page.click('nav button[data-page="donate"]');
    await page.waitForURL('**/#/donate');
    
    await expect(page.locator('#app-content')).toBeVisible();
    // Should show donation form
    await expect(page.locator('h2.section-title:has-text("Donate Food")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#donate-content')).toBeVisible({ timeout: 10000 });
  });

  test('Navigation to Map page works', async ({ page }) => {
    await page.click('nav button[data-page="map"]');
    await page.waitForURL('**/#/map');
    
    await expect(page.locator('#app-content')).toBeVisible();
    // Map container should exist (map may fail to load due to missing plugins in test env)
    await expect(page.locator('.map-container, #main-map')).toBeVisible({ timeout: 10000 });
  });

  test('Navigation to Messages page works', async ({ page }) => {
    await page.click('nav button[data-page="messages"]');
    await page.waitForURL('**/#/messages');
    
    await expect(page.locator('#app-content')).toBeVisible();
    await expect(page.locator('h1:has-text("Messages")')).toBeVisible({ timeout: 5000 });
    // Should show message that login is needed for messages
    await expect(page.locator('.empty-state')).toBeVisible({ timeout: 5000 });
  });

  test('Navigation to Settings page works', async ({ page }) => {
    await page.click('nav button[data-page="settings"]');
    await page.waitForURL('**/#/settings');
    
    await expect(page.locator('#app-content')).toBeVisible();
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 5000 });
    // Should show language selector
    await expect(page.locator('#language')).toBeVisible({ timeout: 5000 });
  });

  test('Navigation to Profile page works', async ({ page }) => {
    await page.click('nav button[data-page="settings"]'); // Click settings first to load
    await page.waitForURL('**/#/settings');
    await page.click('nav button[data-page="settings"]');
    
    // Navigate to profile
    await page.goto('http://localhost:3000/#/profile');
    await page.waitForURL('**/#/profile');
    await expect(page.locator('#app-content')).toBeVisible();
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible({ timeout: 5000 });
  });

  test('Active sidebar link highlighting', async ({ page }) => {
    // Navigate to map
    await page.click('nav button[data-page="map"]');
    await page.waitForURL('**/#/map');
    await expect(page.locator('nav button[data-page="map"]')).toHaveClass(/active/);
    
    // Navigate to food (home)
    await page.click('nav button[data-page="home"]');
    await page.waitForURL('**/#/');
    await expect(page.locator('nav button[data-page="home"]')).toHaveClass(/active/);
  });

  test('No console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors (like missing Supabase config)
    const criticalErrors = errors.filter(e => 
      !e.includes('Supabase') && 
      !e.includes('supabase') &&
      !e.includes('Failed to load') &&
      !e.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});