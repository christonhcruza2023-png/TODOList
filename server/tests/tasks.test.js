process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/taskflow_test';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../app');
const connectDB = require('../config/db');
const { Task } = require('../models/Task');

const api = request(app);

function dateOnly(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function createTask(overrides = {}) {
  const response = await api
    .post('/api/tasks')
    .send({ title: 'Sample task', ...overrides });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return response.body.data;
}

before(async () => {
  await connectDB(process.env.MONGO_URI);
  await Task.deleteMany({});
});

after(async () => {
  await Task.deleteMany({});
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe('TaskFlow API health', () => {
  it('reports ok and a connected database', async () => {
    const response = await api.get('/api/health');
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.database, 'connected');
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const response = await api.get('/api/does-not-exist');
    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
  });
});

describe('Task CRUD', () => {
  it('creates a task with sensible defaults', async () => {
    const response = await api.post('/api/tasks').send({ title: '  Plan the week  ' });
    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    const task = response.body.data;
    assert.equal(task.title, 'Plan the week');
    assert.equal(task.description, '');
    assert.equal(task.category, 'Other');
    assert.equal(task.priority, 'Medium');
    assert.equal(task.status, 'Pending');
    assert.equal(task.dueDate, null);
    assert.ok(task._id);
    assert.ok(task.createdAt);
    assert.ok(task.updatedAt);
  });

  it('lists, reads, updates, toggles, and deletes a task', async () => {
    const created = await createTask({
      title: 'Draft project brief',
      description: 'Outline scope and milestones',
      category: 'Projects',
      priority: 'High',
      status: 'Pending',
      dueDate: dateOnly(1),
    });

    const listResponse = await api.get('/api/tasks');
    assert.equal(listResponse.status, 200);
    assert.equal(listResponse.body.count, 1);
    assert.equal(listResponse.body.data.length, 1);

    const readResponse = await api.get(`/api/tasks/${created._id}`);
    assert.equal(readResponse.status, 200);
    assert.equal(readResponse.body.data.title, 'Draft project brief');

    const updateResponse = await api.put(`/api/tasks/${created._id}`).send({
      title: 'Draft final project brief',
      description: 'Outline scope, milestones, and owners',
      category: 'Work',
      priority: 'Medium',
      status: 'In Progress',
      dueDate: dateOnly(2),
    });
    assert.equal(updateResponse.status, 200);
    assert.equal(updateResponse.body.data.title, 'Draft final project brief');
    assert.equal(updateResponse.body.data.category, 'Work');
    assert.equal(updateResponse.body.data.status, 'In Progress');

    const statusResponse = await api
      .patch(`/api/tasks/${created._id}/status`)
      .send({ status: 'Completed' });
    assert.equal(statusResponse.status, 200);
    assert.equal(statusResponse.body.data.status, 'Completed');

    const deleteResponse = await api.delete(`/api/tasks/${created._id}`);
    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteResponse.body.success, true);

    const missingResponse = await api.get(`/api/tasks/${created._id}`);
    assert.equal(missingResponse.status, 404);
  });

  it('persists createdAt and bumps updatedAt on edit', async () => {
    const created = await createTask({ title: 'Timestamp check' });
    await new Promise((resolve) => setTimeout(resolve, 15));
    const updated = await api
      .put(`/api/tasks/${created._id}`)
      .send({ title: 'Timestamp check edited' });
    assert.equal(updated.status, 200);
    assert.equal(new Date(updated.body.data.createdAt).getTime(), new Date(created.createdAt).getTime());
    assert.ok(new Date(updated.body.data.updatedAt) >= new Date(created.updatedAt));
  });

  it('returns a friendly 404 when deleting a task twice', async () => {
    const created = await createTask({ title: 'Delete me' });
    const first = await api.delete(`/api/tasks/${created._id}`);
    assert.equal(first.status, 200);
    const second = await api.delete(`/api/tasks/${created._id}`);
    assert.equal(second.status, 404);
    assert.match(second.body.message, /deleted/i);
  });
});

describe('Validation and error handling', () => {
  it('rejects a missing or empty title', async () => {
    for (const payload of [{}, { title: '   ' }, { title: 42 }]) {
      const response = await api.post('/api/tasks').send(payload);
      assert.equal(response.status, 400, JSON.stringify(payload));
      assert.equal(response.body.success, false);
      assert.ok(response.body.errors.some((error) => error.field === 'title'));
    }
  });

  it('rejects titles and descriptions that are too long', async () => {
    const longTitle = await api.post('/api/tasks').send({ title: 'a'.repeat(121) });
    assert.equal(longTitle.status, 400);

    const longDescription = await api
      .post('/api/tasks')
      .send({ title: 'Valid', description: 'b'.repeat(1001) });
    assert.equal(longDescription.status, 400);
  });

  it('rejects invalid enums and dates', async () => {
    const cases = [
      { category: 'Errands' },
      { priority: 'Urgent' },
      { status: 'Done' },
      { dueDate: 'not-a-date' },
      { dueDate: '2026-02-31' },
    ];
    for (const invalid of cases) {
      const response = await api.post('/api/tasks').send({ title: 'Validation', ...invalid });
      assert.equal(response.status, 400, JSON.stringify(invalid));
      assert.ok(Array.isArray(response.body.errors));
    }
  });

  it('rejects malformed JSON bodies', async () => {
    const response = await api
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title": "broken"');
    assert.equal(response.status, 400);
    assert.match(response.body.message, /malformed json/i);
  });

  it('handles invalid and non-existent ids', async () => {
    const invalid = await api.get('/api/tasks/not-an-id');
    assert.equal(invalid.status, 400);
    assert.match(invalid.body.message, /invalid task id/i);

    const missing = await api.get(`/api/tasks/${new mongoose.Types.ObjectId()}`);
    assert.equal(missing.status, 404);
  });

  it('rejects invalid status updates', async () => {
    const task = await createTask();
    const response = await api.patch(`/api/tasks/${task._id}/status`).send({ status: 'Nope' });
    assert.equal(response.status, 400);
    assert.ok(response.body.errors.some((error) => error.field === 'status'));
  });

  it('requires a title on update', async () => {
    const task = await createTask();
    const response = await api.put(`/api/tasks/${task._id}`).send({ description: 'No title' });
    assert.equal(response.status, 400);
  });
});

describe('Search, filters, and sorting', () => {
  let fixtures;

  beforeEach(async () => {
    fixtures = {
      work: await createTask({
        title: 'Alpha report',
        description: 'Write the quarterly summary',
        category: 'Work',
        priority: 'High',
        status: 'Pending',
        dueDate: dateOnly(0),
      }),
      shopping: await createTask({
        title: 'Buy groceries',
        description: 'Milk, eggs, and bread',
        category: 'Shopping',
        priority: 'Low',
        status: 'Completed',
        dueDate: dateOnly(-1),
      }),
      school: await createTask({
        title: 'Math revision',
        description: 'Chapter 4 exercises',
        category: 'School',
        priority: 'Medium',
        status: 'In Progress',
        dueDate: dateOnly(2),
      }),
      health: await createTask({
        title: 'Evening run',
        description: 'Easy 5k around the park',
        category: 'Health',
        priority: 'High',
        status: 'Pending',
        dueDate: null,
      }),
    };
  });

  it('searches titles and descriptions case-insensitively', async () => {
    const byDescription = await api.get('/api/tasks').query({ search: 'QUARTERLY' });
    assert.equal(byDescription.status, 200);
    assert.equal(byDescription.body.count, 1);
    assert.equal(byDescription.body.data[0]._id, fixtures.work._id);

    const byTitle = await api.get('/api/tasks').query({ search: 'math' });
    assert.equal(byTitle.body.count, 1);
    assert.equal(byTitle.body.data[0]._id, fixtures.school._id);

    const none = await api.get('/api/tasks').query({ search: 'no-such-task' });
    assert.equal(none.body.count, 0);
    assert.deepEqual(none.body.data, []);
  });

  it('combines status, priority, and category filters', async () => {
    const combined = await api.get('/api/tasks').query({
      status: 'Pending',
      priority: 'High',
      category: 'Work',
    });
    assert.equal(combined.body.count, 1);
    assert.equal(combined.body.data[0]._id, fixtures.work._id);

    const multiple = await api.get('/api/tasks').query({ priority: 'High,Medium' });
    assert.equal(multiple.body.count, 3);

    const invalid = await api.get('/api/tasks').query({ status: 'Nope' });
    assert.equal(invalid.status, 400);
  });

  it('sorts by newest, oldest, title, due date, and priority', async () => {
    const newest = await api.get('/api/tasks').query({ sort: 'newest' });
    assert.equal(newest.body.data[0]._id, fixtures.health._id);

    const oldest = await api.get('/api/tasks').query({ sort: 'oldest' });
    assert.equal(oldest.body.data[0]._id, fixtures.work._id);

    const alpha = await api.get('/api/tasks').query({ sort: 'alpha' });
    assert.deepEqual(
      alpha.body.data.map((task) => task.title),
      ['Alpha report', 'Buy groceries', 'Evening run', 'Math revision']
    );

    const dueDate = await api.get('/api/tasks').query({ sort: 'dueDate' });
    assert.deepEqual(
      dueDate.body.data.map((task) => task._id),
      [fixtures.shopping._id, fixtures.work._id, fixtures.school._id, fixtures.health._id]
    );

    const priority = await api.get('/api/tasks').query({ sort: 'priority' });
    assert.deepEqual(
      priority.body.data.map((task) => task.title),
      ['Evening run', 'Alpha report', 'Math revision', 'Buy groceries']
    );

    const invalidSort = await api.get('/api/tasks').query({ sort: 'sideways' });
    assert.equal(invalidSort.status, 400);
  });

  it('filters by due date range, including overdue tasks for today', async () => {
    const { start, end } = dayBounds();

    const today = await api.get('/api/tasks').query({ dueFrom: start, dueTo: end });
    assert.equal(today.body.count, 1);
    assert.equal(today.body.data[0]._id, fixtures.work._id);

    await createTask({
      title: 'Overdue admin',
      status: 'Pending',
      dueDate: dateOnly(-2),
    });

    const withOverdue = await api.get('/api/tasks').query({
      dueFrom: start,
      dueTo: end,
      includeOverdue: 'true',
    });
    assert.equal(withOverdue.body.count, 2);

    const overdue = await api.get('/api/tasks').query({ dueFrom: start, overdue: 'true' });
    assert.equal(overdue.body.count, 1);
    assert.equal(overdue.body.data[0].title, 'Overdue admin');
  });

  it('supports limits and rejects bad ranges', async () => {
    const limited = await api.get('/api/tasks').query({ limit: 2 });
    assert.equal(limited.body.data.length, 2);
    assert.equal(limited.body.count, 4);

    const badLimit = await api.get('/api/tasks').query({ limit: 0 });
    assert.equal(badLimit.status, 400);

    const badRange = await api.get('/api/tasks').query({
      dueFrom: dayBounds().end,
      dueTo: dayBounds().start,
    });
    assert.equal(badRange.status, 400);
  });
});

describe('Dashboard statistics', () => {
  it('computes totals, overdue, today, upcoming, and category breakdowns', async () => {
    await createTask({
      title: 'Overdue report',
      category: 'Work',
      priority: 'High',
      status: 'Pending',
      dueDate: dateOnly(-2),
    });
    await createTask({
      title: 'Due today',
      category: 'Work',
      priority: 'Medium',
      status: 'In Progress',
      dueDate: dateOnly(0),
    });
    await createTask({
      title: 'Due later',
      category: 'Personal',
      priority: 'Low',
      status: 'Pending',
      dueDate: dateOnly(3),
    });
    await createTask({
      title: 'Finished already',
      category: 'Personal',
      priority: 'Low',
      status: 'Completed',
      dueDate: dateOnly(1),
    });

    const { start, end } = dayBounds();
    const response = await api.get('/api/stats').query({ dayStart: start, dayEnd: end });

    assert.equal(response.status, 200);
    const stats = response.body.data;
    assert.equal(stats.total, 4);
    assert.equal(stats.completed, 1);
    assert.equal(stats.pending, 3);
    assert.equal(stats.inProgress, 1);
    assert.equal(stats.overdue, 1);
    assert.equal(stats.dueToday, 1);
    assert.equal(stats.upcoming, 1);
    assert.equal(stats.completedToday, 1);
    assert.equal(stats.completionRate, 25);

    const work = stats.byCategory.find((row) => row.category === 'Work');
    assert.deepEqual(work, { category: 'Work', total: 2, completed: 0 });
    assert.equal(stats.byCategory.length, 7);

    assert.equal(stats.recentTasks.length, 4);
    assert.equal(stats.todayTasks.length, 1);
    assert.equal(stats.todayTasks[0].title, 'Due today');
    assert.equal(stats.byPriority.find((row) => row.priority === 'High').total, 1);
  });

  it('rejects an invalid day range', async () => {
    const response = await api.get('/api/stats').query({
      dayStart: '2026-10-10T00:00:00.000Z',
      dayEnd: '2026-10-09T00:00:00.000Z',
    });
    assert.equal(response.status, 400);
  });
});
