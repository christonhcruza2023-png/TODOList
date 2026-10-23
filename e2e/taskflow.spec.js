import { expect, test } from '@playwright/test';

const API = process.env.E2E_API_URL || 'http://127.0.0.1:5050/api';

function dateOnly(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function resetTasks(request) {
  const response = await request.get(`${API}/tasks`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  for (const task of body.data) {
    const deleted = await request.delete(`${API}/tasks/${task._id}`);
    expect(deleted.ok()).toBeTruthy();
  }
}

async function apiCreate(request, payload) {
  const response = await request.post(`${API}/tasks`, { data: payload });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).data;
}

async function openNewTaskModal(page) {
  await page.getByRole('button', { name: /new task|quick add task/i }).first().click();
  const dialog = page.getByRole('dialog', { name: 'New task' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillTaskForm(dialog, { title, description, category, priority, dueDate, status }) {
  if (title !== undefined) await dialog.getByLabel(/^Title/).fill(title);
  if (description !== undefined) await dialog.getByLabel(/^Description/).fill(description);
  if (category) await dialog.getByLabel('Category').selectOption(category);
  if (priority) await dialog.getByRole('button', { name: priority, exact: true }).click();
  if (status) await dialog.getByLabel('Status').selectOption(status);
  if (dueDate) await dialog.getByLabel(/^Due date/).fill(dueDate);
}

test.beforeEach(async ({ request }) => {
  await resetTasks(request);
});

test.describe('Taskflow core flows', () => {
  test('creates a task from the UI and keeps it after a reload', async ({ page, request }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();

    await page.getByRole('button', { name: 'Quick add task' }).click();
    const dialog = page.getByRole('dialog', { name: 'New task' });
    await expect(dialog).toBeVisible();

    await fillTaskForm(dialog, {
      title: 'Prepare sprint notes',
      description: 'Summarize blockers and next steps',
      category: 'Work',
      priority: 'High',
      dueDate: dateOnly(0),
      status: 'In Progress',
    });
    await dialog.getByRole('button', { name: 'Create task' }).click();

    await expect(page.getByText('Task created', { exact: true })).toBeVisible();
    await expect(dialog).toBeHidden();

    await page.getByRole('link', { name: 'All Tasks' }).click();
    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByRole('heading', { name: 'Prepare sprint notes' })).toBeVisible();
    await expect(page.getByText('Summarize blockers and next steps')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Prepare sprint notes' })).toBeVisible();

    const response = await request.get(`${API}/tasks`);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe('In Progress');
    expect(body.data[0].category).toBe('Work');
  });

  test('validates required input and supports cancelling', async ({ page }) => {
    await page.goto('/tasks');
    const dialog = await openNewTaskModal(page);

    await dialog.getByRole('button', { name: 'Create task' }).click();
    await expect(dialog.getByText('Title is required.')).toBeVisible();
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/^Title/).fill('Cancelled task');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Cancelled task')).toHaveCount(0);
  });

  test('edits a task through the pre-filled form', async ({ page, request }) => {
    await apiCreate(request, {
      title: 'Original title',
      description: 'Original description',
      category: 'Personal',
      priority: 'Medium',
    });

    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Edit "Original title"' }).click();

    const dialog = page.getByRole('dialog', { name: 'Edit task' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel(/^Title/)).toHaveValue('Original title');
    await expect(dialog.getByLabel(/^Description/)).toHaveValue('Original description');

    await dialog.getByLabel(/^Title/).fill('Refined title');
    await dialog.getByRole('button', { name: 'High', exact: true }).click();
    await dialog.getByLabel('Status').selectOption('Completed');
    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Task updated', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Refined title' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Refined title' })).toHaveClass(/line-through/);

    const response = await request.get(`${API}/tasks`);
    const body = await response.json();
    expect(body.data[0].title).toBe('Refined title');
    expect(body.data[0].priority).toBe('High');
    expect(body.data[0].status).toBe('Completed');
  });

  test('completes, reopens, and updates dashboard statistics', async ({ page, request }) => {
    await apiCreate(request, { title: 'Finish report' });
    await apiCreate(request, { title: 'Plan next week' });

    await page.goto('/dashboard');
    await expect(page.getByTestId('stat-total-value')).toHaveText('2');
    await expect(page.getByTestId('stat-completed-value')).toHaveText('0');

    await page.goto('/tasks');
    await page.getByRole('checkbox', { name: 'Mark "Finish report" as complete' }).click();
    await expect(page.getByText('Task completed', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Finish report' })).toHaveClass(/line-through/);

    await page.goto('/dashboard');
    await expect(page.getByTestId('stat-completed-value')).toHaveText('1');
    await expect(page.getByTestId('stat-pending-value')).toHaveText('1');

    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(page.getByRole('checkbox', { name: 'Mark "Finish report" as pending' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Mark "Finish report" as pending' }).click();
    await expect(page.getByText('Task reopened', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No completed tasks yet' })).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByTestId('stat-completed-value')).toHaveText('0');
  });

  test('searches, filters, clears, and sorts together', async ({ page, request }) => {
    await apiCreate(request, {
      title: 'Alpha report',
      description: 'Quarterly summary for the team',
      category: 'Work',
      priority: 'High',
      status: 'Pending',
      dueDate: dateOnly(0),
    });
    await apiCreate(request, {
      title: 'Buy groceries',
      description: 'Milk, eggs, and bread',
      category: 'Shopping',
      priority: 'Low',
      status: 'Pending',
    });
    await apiCreate(request, {
      title: 'Math revision',
      description: 'Chapter 4 exercises',
      category: 'School',
      priority: 'Medium',
      status: 'Pending',
      dueDate: dateOnly(2),
    });

    await page.goto('/tasks');
    await expect(page.getByText('3 tasks in total')).toBeVisible();

    await page.getByRole('searchbox', { name: 'Search tasks' }).fill('quarterly');
    await expect(page.getByText('1 task matching your filters')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alpha report' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Buy groceries' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByText('3 tasks in total')).toBeVisible();

    await page.getByLabel('Filter by category').selectOption('Work');
    await expect(page.getByText('1 task matching your filters')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alpha report' })).toBeVisible();

    await page.getByLabel('Filter by priority').selectOption('High');
    await expect(page.getByRole('heading', { name: 'Alpha report' })).toBeVisible();

    await page.getByLabel('Filter by due date').selectOption('today');
    await expect(page.getByText('1 task matching your filters')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alpha report' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByText('3 tasks in total')).toBeVisible();

    await page.getByLabel('Sort tasks').selectOption('alpha');
    await expect
      .poll(async () => page.locator('article h3').allTextContents())
      .toEqual(['Alpha report', 'Buy groceries', 'Math revision']);

    await page.getByLabel('Sort tasks').selectOption('dueDate');
    await expect
      .poll(async () => page.locator('article h3').allTextContents())
      .toEqual(['Alpha report', 'Math revision', 'Buy groceries']);
  });

  test('deletes a task only after confirmation', async ({ page, request }) => {
    await apiCreate(request, { title: 'Disposable task' });

    await page.goto('/tasks');
    await page.getByRole('button', { name: 'Delete "Disposable task"' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Are you sure you want to delete this task? This action cannot be undone.')
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Disposable task' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete "Disposable task"' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete task' }).click();

    await expect(page.getByText('Task deleted', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible();

    const response = await request.get(`${API}/tasks`);
    const body = await response.json();
    expect(body.data).toHaveLength(0);
  });

  test('shows today, upcoming, and completed views correctly', async ({ page, request }) => {
    await apiCreate(request, {
      title: 'Due today task',
      status: 'Pending',
      dueDate: dateOnly(0),
    });
    await apiCreate(request, {
      title: 'Overdue task',
      status: 'Pending',
      dueDate: dateOnly(-2),
    });
    await apiCreate(request, {
      title: 'Future task',
      status: 'In Progress',
      dueDate: dateOnly(3),
    });
    await apiCreate(request, {
      title: 'Completed today task',
      status: 'Completed',
      dueDate: dateOnly(0),
    });

    await page.goto('/today');
    await expect(page.getByRole('heading', { name: 'Due today task' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overdue task' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Completed today task' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Future task' })).toHaveCount(0);

    await page.goto('/upcoming');
    await expect(page.getByRole('heading', { name: 'Future task' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Due today task' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Overdue task' })).toHaveCount(0);

    await page.goto('/completed');
    await expect(page.getByRole('heading', { name: 'Completed today task' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Future task' })).toHaveCount(0);
  });

  test('toggles the theme and persists it across reloads', async ({ page }) => {
    await page.goto('/dashboard');
    const html = page.locator('html');
    const startedDark = await html.evaluate((element) => element.classList.contains('dark'));

    await page
      .getByRole('button', { name: startedDark ? 'Switch to light theme' : 'Switch to dark theme' })
      .click();

    await expect
      .poll(async () => html.evaluate((element) => element.classList.contains('dark')))
      .toBe(!startedDark);

    const stored = await page.evaluate(() => localStorage.getItem('taskflow.theme'));
    expect(stored).toBe(startedDark ? 'light' : 'dark');

    await page.reload();
    const afterReloadDark = await html.evaluate((element) => element.classList.contains('dark'));
    expect(afterReloadDark).toBe(!startedDark);

    await page.goto('/settings');
    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await expect(html).not.toHaveClass(/\bdark\b/);
    await page.reload();
    await expect(html).not.toHaveClass(/\bdark\b/);

    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await expect(html).toHaveClass(/\bdark\b/);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  });

  test('persists display and sorting preferences', async ({ page, request }) => {
    await apiCreate(request, {
      title: 'Bravo task',
      description: 'A description that can be hidden',
    });
    await apiCreate(request, { title: 'Alpha task' });

    await page.goto('/settings');
    await page.getByLabel('Default sorting').selectOption('alpha');
    await page.getByRole('switch', { name: 'Show task descriptions' }).click();
    await expect(page.getByRole('switch', { name: 'Show task descriptions' })).toHaveAttribute(
      'aria-checked',
      'false'
    );

    await page.goto('/tasks');
    await expect(page.getByLabel('Sort tasks')).toHaveValue('alpha');
    await expect
      .poll(async () => page.locator('article h3').allTextContents())
      .toEqual(['Alpha task', 'Bravo task']);
    await expect(page.getByText('A description that can be hidden')).toHaveCount(0);

    await page.reload();
    await expect(page.getByLabel('Sort tasks')).toHaveValue('alpha');
    await expect(page.getByText('A description that can be hidden')).toHaveCount(0);
  });

  test('opens category filters and shows correct counts', async ({ page, request }) => {
    await apiCreate(request, { title: 'Work item', category: 'Work', status: 'Completed' });
    await apiCreate(request, { title: 'Personal item', category: 'Personal' });
    await apiCreate(request, { title: 'Second work item', category: 'Work' });

    await page.goto('/categories');
    await expect(page.getByRole('button', { name: /Work/ }).first()).toContainText('2');

    await page.getByRole('button', { name: /Work/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Work tasks' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Work item', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Second work item' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Personal item' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Show all categories' }).click();
    await expect(page.getByRole('heading', { name: 'All tasks' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Personal item' })).toBeVisible();
  });

  test('respects the saved default view', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel('Default view').selectOption('/today');

    await page.goto('/');
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible();
  });

  test('clears local preferences without deleting tasks', async ({ page, request }) => {
    await apiCreate(request, { title: 'Kept task' });

    await page.goto('/settings');
    await page.getByLabel('Default sorting').selectOption('alpha');
    await page.getByRole('button', { name: 'Dark', exact: true }).click();

    await page.getByRole('button', { name: 'Clear local preferences' }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Your tasks in MongoDB are not affected.');
    await dialog.getByRole('button', { name: 'Clear preferences' }).click();

    await expect(page.getByText('Local preferences cleared', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Default sorting')).toHaveValue('newest');

    await page.reload();
    await expect(page.getByLabel('Default sorting')).toHaveValue('newest');

    await page.goto('/tasks');
    await expect(page.getByRole('heading', { name: 'Kept task' })).toBeVisible();
  });

  test('loads every view without uncaught errors', async ({ page }) => {
    const problems = [];
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (/fonts\.(googleapis|gstatic)\.com/.test(text)) return;
      problems.push(`console: ${text}`);
    });

    for (const path of ['/dashboard', '/tasks', '/today', '/upcoming', '/completed', '/categories', '/settings']) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
    }

    expect(problems).toEqual([]);
  });
});

test.describe('Mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens the navigation drawer and navigates', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Open navigation' }).click();

    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Today' }).click();

    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toHaveCount(0);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(overflows).toBe(false);
  });
});
