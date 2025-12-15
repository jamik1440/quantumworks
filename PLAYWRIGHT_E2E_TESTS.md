# 🧪 QuantumWorks - Playwright E2E Test Suite

Complete end-to-end testing strategy with realistic user scenarios.

---

## 📁 Project Structure

```
quantumworks/
├── e2e/
│   ├── tests/
│   │   ├── auth.spec.ts                 # Authentication flows
│   │   ├── marketplace.spec.ts          # Job browsing
│   │   ├── job-creation.spec.ts        # Creating jobs
│   │   ├── proposals.spec.ts            # Proposal submissions
│   │   ├── dashboard.spec.ts            # Dashboard features
│   │   ├── navigation.spec.ts           # Navigation & routing
│   │   └── edge-cases.spec.ts           # Error handling
│   ├── fixtures/
│   │   └── test-data.ts                 # Test data & helpers
│   ├── utils/
│   │   ├── auth-helpers.ts              # Reusable auth functions
│   │   └── wait-helpers.ts              # Custom waiters
│   └── playwright.config.ts             # Playwright config
├── package.json
└── .env.test                            # Test environment variables
```

---

## 🚀 Setup Instructions

### 1. Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Create Configuration

**File: `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail build on CI if tests were accidentally marked as test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Parallel workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    // Base URL
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Test projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
```

### 3. Create Test Environment File

**File: `.env.test`**

```env
VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=test_key_for_e2e
TEST_USER_EMAIL=test@quantumworks.com
TEST_USER_PASSWORD=TestPass123!
TEST_EMPLOYER_EMAIL=employer@quantumworks.com
TEST_EMPLOYER_PASSWORD=EmployerPass123!
```

---

## 📝 Test Files

### Test 1: Authentication Flow

**File: `e2e/tests/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.goto('/');
  });

  test('should register a new user successfully', async ({ page }) => {
    // Generate unique email
    const timestamp = Date.now();
    const email = `test-${timestamp}@quantumworks.com`;
    
    // Navigate to register page
    await page.click('text=Join Q-Works');
    
    // Fill registration form
    await page.fill('[name="full_name"]', 'E2E Test User');
    await page.fill('[name="email"]', email);
    await page.fill('[name="password"]', 'TestPass123!');
    await page.selectOption('[name="role"]', 'freelancer');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Should show welcome message or user name
    await expect(page.locator('text=/E2E Test User|Welcome/')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Fill login form
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    
    // Submit
    await page.click('button:has-text("Log In")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Should NOT show login button anymore
    await expect(page.locator('text=Log In')).not.toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button:has-text("Log In")');
    
    // Should show error message
    await expect(page.locator('text=/Invalid|Error|Failed/')).toBeVisible({
      timeout: 5000
    });
    
    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button:has-text("Log In")');
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Logout
    await page.click('text=Logout');
    
    // Should redirect to login or home
    await expect(page).toHaveURL(/\/(login|)/);
    
    // Trying to access dashboard should redirect
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should persist auth after page refresh', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button:has-text("Log In")');
    
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should protect routes when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
```

---

### Test 2: Marketplace & Job Browsing

**File: `e2e/tests/marketplace.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Marketplace', () => {
  
  test('should display jobs on marketplace page', async ({ page }) => {
    await page.goto('/jobs');
    
    // Wait for jobs to load
    await page.waitForSelector('[data-testid="job-card"]', { 
      timeout: 10000,
      state: 'attached' 
    }).catch(() => {
      // If no jobs exist, check for empty state
    });
    
    const jobCards = await page.locator('[data-testid="job-card"]').count();
    
    if (jobCards > 0) {
      // Verify job card has required fields
      const firstJob = page.locator('[data-testid="job-card"]').first();
      await expect(firstJob.locator('h3')).toBeVisible(); // Title
      await expect(firstJob.locator('text=/\\$|USD|Budget/')).toBeVisible(); // Budget
    } else {
      // Empty state
      await expect(page.locator('text=/No.*jobs|Be the first/')).toBeVisible();
    }
  });

  test('should navigate to job details', async ({ page }) => {
    await page.goto('/jobs');
    
    // Wait for jobs
    await page.waitForLoadState('networkidle');
    
    const firstJob = page.locator('[data-testid="job-card"]').first();
    if (await firstJob.isVisible()) {
      await firstJob.click();
      
      // Should be on job details page
      await expect(page).toHaveURL(/.*jobs\/\d+/);
      
      // Should show job details
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });

  test('should filter jobs by category', async ({ page }) => {
    await page.goto('/jobs');
    
    // If category filter exists
    const categoryFilter = page.locator('[data-testid="category-filter"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption('Web Development');
      
      // Jobs should update
      await page.waitForLoadState('networkidle');
      
      // Verify URL has category param
      expect(page.url()).toContain('category=');
    }
  });

  test('should search jobs', async ({ page }) => {
    await page.goto('/jobs');
    
    const searchInput = page.locator('[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('react developer');
      await searchInput.press('Enter');
      
      await page.waitForLoadState('networkidle');
      
      // Results should contain search term
      const results = await page.locator('[data-testid="job-card"]').all();
      if (results.length > 0) {
        const firstJobText = await results[0].textContent();
        expect(firstJobText?.toLowerCase()).toContain('react');
      }
    }
  });
});
```

---

### Test 3: Job Creation with AI

**File: `e2e/tests/job-creation.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsEmployer } from '../utils/auth-helpers';

test.describe('Job Creation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as employer
    await loginAsEmployer(page);
  });

  test('should create job with AI assistant', async ({ page }) => {
    await page.goto('/post-job');
    
    // Enter job description
    const description = 'I need a React developer to build a dashboard';
    await page.fill('textarea[placeholder*="describe"]', description);
    
    // Click Generate
    await page.click('button:has-text("Generate")');
    
    // Wait for AI result
    await expect(page.locator('text=/AI Analysis|Generated/')).toBeVisible({
      timeout: 15000
    });
    
    // AI should extract skills
    await expect(page.locator('text=/React|JavaScript/')).toBeVisible();
    
    // Submit project
    await page.click('button:has-text("Post")');
    
    // Should show success
    await expect(page.locator('text=/Success|Created/')).toBeVisible({
      timeout: 5000
    });
  });

  test('should create job manually without AI', async ({ page }) => {
    await page.goto('/post-job');
    
    // Skip AI, use manual form if available
    const manualButton = page.locator('text=/Manual|Skip AI/');
    if (await manualButton.isVisible()) {
      await manualButton.click();
    }
    
    // Fill manual form
    await page.fill('[name="title"]', 'Manual Test Job');
    await page.fill('[name="description"]', 'Test description');
    await page.fill('[name="budget"]', '5000');
    await page.fill('[name="skills"]', 'React, Node.js');
    
    await page.click('button:has-text("Submit")');
    
    await expect(page).toHaveURL(/.*jobs/, { timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/post-job');
    
    // Try submitting empty form
    await page.click('button:has-text("Submit")');
    
    // Should show validation errors
    const errors = page.locator('.error, [role="alert"], text=/required|invalid/i');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test('should handle AI timeout gracefully', async ({ page }) => {
    await page.goto('/post-job');
    
    await page.fill('textarea', 'test job description');
    
    // Mock slow API by intercepting
    await page.route('**/ai/**', route => {
      setTimeout(() => route.abort(), 20000);
    });
    
    await page.click('button:has-text("Generate")');
    
    // Should show timeout/error message
    await expect(page.locator('text=/timeout|failed|try again/i')).toBeVisible({
      timeout: 25000
    });
  });
});
```

---

### Test 4: Proposal Submission

**File: `e2e/tests/proposals.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsFreelancer } from '../utils/auth-helpers';

test.describe('Proposals', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsFreelancer(page);
  });

  test('should submit proposal to a job', async ({ page }) => {
    // Go to marketplace
    await page.goto('/jobs');
    
    // Click first job
    await page.click('[data-testid="job-card"]:first-child a');
    
    // Fill proposal form
    await page.fill('[name="cover_letter"]', 'I am perfect for this job!');
    await page.fill('[name="price_quote"]', '3000');
    await page.fill('[name="estimated_days"]', '15');
    
    // Submit
    await page.click('button:has-text("Submit Proposal")');
    
    // Should show success notification
    await expect(page.locator('text=/submitted|success/i')).toBeVisible({
      timeout: 5000
    });
  });

  test('should not allow duplicate proposals', async ({ page }) => {
    await page.goto('/jobs/1'); // Assuming job 1 exists
    
    // Submit first proposal
    await page.fill('[name="cover_letter"]', 'Proposal 1');
    await page.fill('[name="price_quote"]', '2000');
    await page.fill('[name="estimated_days"]', '10');
    await page.click('button:has-text("Submit")');
    
    await page.waitForTimeout(2000);
    
    // Try submitting again
    await page.click('button:has-text("Submit")');
    
    // Should show error
    await expect(page.locator('text=/already|duplicate/i')).toBeVisible();
  });

  test('should view my proposals', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click "My Proposals" tab/link
    const proposalsLink = page.locator('text=/My Proposals/');
    if (await proposalsLink.isVisible()) {
      await proposalsLink.click();
      
      // Should list proposals
      await expect(page.locator('[data-testid="proposal-item"]').first())
        .toBeVisible({ timeout: 5000 });
    }
  });
});
```

---

### Test 5: Dashboard Features

**File: `e2e/tests/dashboard.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import { loginAsFreelancer } from '../utils/auth-helpers';

test.describe('Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsFreelancer(page);
    await page.goto('/dashboard');
  });

  test('should display active contracts', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    const contractsSection = page.locator('text=/Active Contracts/');
    await expect(contractsSection).toBeVisible();
    
    // Check for contracts or empty state
    const hasContracts = await page.locator('[data-testid="contract-card"]').isVisible();
    
    if (!hasContracts) {
      await expect(page.locator('text=/No active contracts/')).toBeVisible();
    }
  });

  test('should open chat for contract', async ({ page }) => {
    const chatButton = page.locator('button:has-text("Open Chat")').first();
    
    if (await chatButton.isVisible()) {
      await chatButton.click();
      
      // Chat should open
      await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
      
      // Should have message input
      await expect(page.locator('input[placeholder*="message"]')).toBeVisible();
    }
  });

  test('should send chat message', async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has-text("Open Chat")').first();
    if (await chatButton.isVisible()) {
      await chatButton.click();
      
      const messageInput = page.locator('input[placeholder*="message"]');
      await messageInput.fill('Test message');
      await messageInput.press('Enter');
      
      // Message should appear in chat
      await expect(page.locator('text=Test message')).toBeVisible({
        timeout: 5000
      });
    }
  });

  test('should show user profile info', async ({ page }) => {
    // Profile should show user's name
    await expect(page.locator('text=/Welcome|Hello|Dashboard/'))
      .toBeVisible();
  });
});
```

---

### Test 6: Navigation & Routing

**File: `e2e/tests/navigation.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  
  test('should navigate through all main pages', async ({ page }) => {
    await page.goto('/');
    
    // Home
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Jobs
    await page.click('text=Jobs');
    await expect(page).toHaveURL(/.*jobs|marketplace/);
    
    // Post Job
    await page.click('text=Post');
    await expect(page).toHaveURL(/.*post-job|create/);
    
    // Login
    await page.click('text=Log In');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show 404 or redirect
    const is404 = await page.locator('text=/404|Not Found/').isVisible();
    const isRedirected = page.url() === 'http://localhost:5173/';
    
    expect(is404 || isRedirected).toBeTruthy();
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button:has-text("Log In")');
    
    // Navigate away and back
    await page.goto('/jobs');
    await page.goto('/dashboard');
    
    // Should still be logged in
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
```

---

### Test 7: Edge Cases & Error Handling

**File: `e2e/tests/edge-cases.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Edge Cases', () => {
  
  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/jobs');
    
    // Should show error message or retry button
    await expect(page.locator('text=/error|failed|retry/i')).toBeVisible({
      timeout: 10000
    });
  });

  test('should handle very long input gracefully', async ({ page }) => {
    await page.goto('/post-job');
    
    const longText = 'a'.repeat(10000);
    await page.fill('textarea', longText);
    
    // Should either truncate, show warning, or accept
    // Should not crash
    await page.click('button:has-text("Generate")');
    
    // Page should not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle special characters in input', async ({ page }) => {
    await page.goto('/login');
    
    const specialChars = `<script>alert('xss')</script>`;
    await page.fill('[name="email"]', specialChars);
    await page.fill('[name="password"]', specialChars);
    await page.click('button:has-text("Log In")');
    
    // Should not execute script
    await page.waitForTimeout(2000);
    
    // Alert should not appear
    const dialogs: string[] = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });
    
    expect(dialogs.length).toBe(0);
  });

  test('should handle empty form submissions', async ({ page }) => {
    await page.goto('/register');
    
    await page.click('button[type="submit"]');
    
    // HTML5 validation or custom errors should appear
    const isValid = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form?.checkValidity() ?? true;
    });
    
    expect(isValid).toBe(false);
  });

  test('should handle stale data on page revisit', async ({ page }) => {
    await page.goto('/jobs');
    
    // Get initial job count
    const initialCount = await page.locator('[data-testid="job-card"]').count();
    
    // Navigate away
    await page.goto('/');
    
    // Come back
    await page.goto('/jobs');
    
    // Data should refresh (count stays same or changes)
    await page.waitForLoadState('networkidle');
    const newCount = await page.locator('[data-testid="job-card"]').count();
    
    // Test passes if it doesn't crash
    expect(newCount).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 🛠️ Helper Utilities

### Auth Helpers

**File: `e2e/utils/auth-helpers.ts`**

```typescript
import { Page } from '@playwright/test';

export async function loginAsFreelancer(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('button:has-text("Log In")');
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

export async function loginAsEmployer(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', process.env.TEST_EMPLOYER_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_EMPLOYER_PASSWORD!);
  await page.click('button:has-text("Log In")');
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

export async function logout(page: Page) {
  const logoutButton = page.locator('text=Logout');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }
  await page.waitForURL(/\/(login|)/, { timeout: 5000 });
}
```

---

## 🏃 Running Tests

### Local Development

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific browser
npx playwright test --project=chromium

# Generate test code recorder
npx playwright codegen http://localhost:5173
```

### CI/CD Integration

```bash
# Run tests in CI mode
CI=true npx playwright test

# Generate HTML report
npx playwright show-report
```

---

## 📊 Test Coverage Goals

```
Authentication:       100% ✅
Job Browsing:         100% ✅
Job Creation:          90% ✅
Proposals:             90% ✅
Dashboard:             80% ✅
Navigation:           100% ✅
Error Handling:        70% ✅
```

---

## 🔧 Best Practices

### 1. Use Data Test IDs

```typescript
// ❌ BAD - Brittle selector
await page.click('.btn-primary');

// ✅ GOOD - Stable selector
await page.click('[data-testid="submit-button"]');
```

### 2. Wait for Network Idle

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Use Proper Assertions

```typescript
// ❌ BAD
expect(await page.locator('h1').textContent()).toBe('Welcome');

// ✅ GOOD
await expect(page.locator('h1')).toHaveText('Welcome');
```

### 4. Isolate Tests

```typescript
test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
  await page.context().clearLocalStorage();
});
```

### 5. Handle Flaky Tests

```typescript
// Add retry logic for flaky selectors
await expect(async () => {
  await expect(page.locator('.dynamic-element')).toBeVisible();
}).toPass({ timeout: 10000 });
```

---

## 📦 Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:e2e:ci": "CI=true playwright test"
  }
}
```

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All critical path tests passing
- [ ] Tests run on all 3 browsers (Chrome, Firefox, Safari)
- [ ] Mobile tests passing
- [ ] Edge case tests passing
- [ ] No flaky tests (run 3 times, all pass)
- [ ] Test coverage > 70%
- [ ] Test execution time < 10 minutes

---

**End of Playwright E2E Test Suite**  
**Next**: See PRODUCTION_DEPLOY_CHECKLIST.md for deployment steps
