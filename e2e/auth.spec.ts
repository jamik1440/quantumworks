// @ts-nocheck
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/QuantumWorks|Vite/);
});

test('can navigate to create job page', async ({ page }) => {
    await page.goto('/');

    // Click the "Create Job" button
    await page.getByRole('link', { name: /Create Job/i }).first().click();

    // Should see the AI Wizard
    await expect(page.getByText('Create Job with AI')).toBeVisible();
});

test('ai wizard flow (mocked)', async ({ page }) => {
    // Mock the AI response to avoid backend dependency in frontend tests if needed
    // For full E2E we might want to hit real backend, but mocking is faster/reliable
    await page.route('*/**/ai/task/parse', async route => {
        const json = {
            extracted_data: { title: "Automated Test Project", skills: ["Playwright"], category: "Testing" },
            budget_estimate: { range: "$100-200" }
        };
        await route.fulfill({ json });
    });

    await page.goto('/post-job');

    // Fill input
    await page.getByRole('textbox').fill('I need a test automation script');

    // Click Generate
    await page.getByRole('button', { name: /Generate/i }).click();

    // Expect result
    await expect(page.getByText('Automated Test Project')).toBeVisible();

    // Ensure "Post This Project" button appears
    await expect(page.getByRole('button', { name: /Post This Project/i })).toBeVisible();
});
