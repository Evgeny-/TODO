import { test, expect, _electron as electron } from '@playwright/test';

const E2E_USERNAME = 'E2E_USERNAME';

test.describe('TODO App, initial', () => {
  let electronApp: Awaited<ReturnType<(typeof electron)['launch']>>;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['.'],
    });
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should load the main window and show correct title', async () => {
    const window = await electronApp.firstWindow();
    await expect(window).toHaveTitle('TODO');
  });

  test('should display Login page', async () => {
    const window = await electronApp.firstWindow();

    const content = await window.textContent('h1');
    expect(content).toBe('Login');
  });
});

test.describe('TODO App logged in', () => {
  let electronApp: Awaited<ReturnType<(typeof electron)['launch']>>;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['.'],
    });

    const window = await electronApp.firstWindow();

    const content = await window.textContent('h1');
    expect(content).toBe('Login');

    await window.fill('input', E2E_USERNAME);
    await window.click('button:has-text("Login")');

    await window.waitForTimeout(500);
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should display collections page', async () => {
    const window = await electronApp.firstWindow();
    const title = await window.textContent('h1');

    expect(title).toBe('Collections');

    // Create new collection
    await window.click('button:has-text("Create new collection")');
    await window.waitForTimeout(500);

    const content = await window.textContent('h1');

    expect(content).not.toBe('Collections');

    await window.click('button:has-text("+ Add")');
    await window.waitForTimeout(300);

    await window.fill('textarea', 'My new TODO');
    await window.click('button:has-text("Add todo")');

    await window.waitForTimeout(300);

    const todoText = await window.textContent('[data-e2e-id="todo"]');
    expect(todoText).toContain('My new TODO');
  });
});
