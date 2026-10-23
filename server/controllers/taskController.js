const { Task, CATEGORIES, PRIORITIES, STATUSES } = require('../models/Task');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { validateTaskInput, validateStatusInput } = require('../utils/validateTask');
const { escapeRegex } = require('../utils/helpers');

const VALID_SORTS = ['newest', 'oldest', 'updated', 'dueDate', 'priority', 'alpha'];
const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function parseEnumList(raw, allowed, field) {
  if (raw === undefined || raw === null || raw === '') return [];
  const values = String(raw)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const invalid = values.filter((value) => !allowed.includes(value));
  if (invalid.length > 0) {
    throw ApiError.badRequest(
      `Invalid ${field} filter: ${invalid.join(', ')}. Allowed values: ${allowed.join(', ')}.`
    );
  }
  return values;
}

function parseDateParam(raw, field) {
  if (raw === undefined || raw === null || raw === '') return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(`Invalid ${field} date.`);
  }
  return date;
}

function parseLimit(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw ApiError.badRequest('Limit must be an integer between 1 and 200.');
  }
  return limit;
}

function buildFilter(query) {
  const conditions = [];

  const search = String(query.search || '').trim().slice(0, 120);
  if (search) {
    const pattern = escapeRegex(search);
    conditions.push({
      $or: [
        { title: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } },
      ],
    });
  }

  const statuses = parseEnumList(query.status, STATUSES, 'status');
  if (statuses.length > 0) conditions.push({ status: { $in: statuses } });

  const priorities = parseEnumList(query.priority, PRIORITIES, 'priority');
  if (priorities.length > 0) conditions.push({ priority: { $in: priorities } });

  const categories = parseEnumList(query.category, CATEGORIES, 'category');
  if (categories.length > 0) conditions.push({ category: { $in: categories } });

  const dueFrom = parseDateParam(query.dueFrom, 'dueFrom');
  const dueTo = parseDateParam(query.dueTo, 'dueTo');
  if (dueFrom && dueTo && dueFrom >= dueTo) {
    throw ApiError.badRequest('dueTo must be after dueFrom.');
  }

  if (String(query.overdue) === 'true') {
    conditions.push({
      dueDate: { $ne: null, $lt: dueFrom || new Date() },
      status: { $ne: 'Completed' },
    });
  } else if (dueFrom || dueTo) {
    const range = {};
    if (dueFrom) range.$gte = dueFrom;
    if (dueTo) range.$lt = dueTo;

    if (String(query.includeOverdue) === 'true' && dueFrom) {
      conditions.push({
        $or: [
          { dueDate: range },
          { dueDate: { $ne: null, $lt: dueFrom }, status: { $ne: 'Completed' } },
        ],
      });
    } else {
      conditions.push({ dueDate: range });
    }
  }

  return conditions.length > 0 ? { $and: conditions } : {};
}

function buildSortStages(sort) {
  switch (sort) {
    case 'oldest':
      return [{ $sort: { createdAt: 1, _id: 1 } }];
    case 'updated':
      return [{ $sort: { updatedAt: -1, _id: -1 } }];
    case 'dueDate':
      return [
        {
          $addFields: {
            _dueSort: { $ifNull: ['$dueDate', new Date('9999-12-31T00:00:00.000Z')] },
          },
        },
        { $sort: { _dueSort: 1, createdAt: -1 } },
        { $unset: '_dueSort' },
      ];
    case 'priority':
      return [
        {
          $addFields: {
            _priorityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'High'] }, then: PRIORITY_WEIGHT.High },
                  { case: { $eq: ['$priority', 'Medium'] }, then: PRIORITY_WEIGHT.Medium },
                ],
                default: PRIORITY_WEIGHT.Low,
              },
            },
          },
        },
        { $sort: { _priorityRank: -1, createdAt: -1 } },
        { $unset: '_priorityRank' },
      ];
    case 'alpha':
      return [
        { $addFields: { _titleSort: { $toLower: '$title' } } },
        { $sort: { _titleSort: 1, createdAt: -1 } },
        { $unset: '_titleSort' },
      ];
    case 'newest':
    default:
      return [{ $sort: { createdAt: -1, _id: -1 } }];
  }
}

async function findTaskOrThrow(id) {
  if (!OBJECT_ID.test(id)) {
    throw ApiError.badRequest('Invalid task ID format.');
  }
  const task = await Task.findById(id);
  if (!task) {
    throw ApiError.notFound();
  }
  return task;
}

// GET /api/tasks
const listTasks = asyncHandler(async (req, res) => {
  const sort = req.query.sort ? String(req.query.sort) : 'newest';
  if (!VALID_SORTS.includes(sort)) {
    throw ApiError.badRequest(
      `Invalid sort value. Allowed values: ${VALID_SORTS.join(', ')}.`
    );
  }

  const filter = buildFilter(req.query);
  const limit = parseLimit(req.query.limit);

  const pipeline = [{ $match: filter }, ...buildSortStages(sort)];
  if (limit) pipeline.push({ $limit: limit });

  const [tasks, count] = await Promise.all([
    Task.aggregate(pipeline),
    Task.countDocuments(filter),
  ]);

  res.json({ success: true, count, data: tasks });
});

// GET /api/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await findTaskOrThrow(req.params.id);
  res.json({ success: true, data: task });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const payload = validateTaskInput(req.body, { requireTitle: true });
  const task = await Task.create(payload);
  res.status(201).json({
    success: true,
    message: 'Task created successfully.',
    data: task,
  });
});

// PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const payload = validateTaskInput(req.body, { requireTitle: true });
  const task = await findTaskOrThrow(req.params.id);
  Object.assign(task, payload);
  await task.save();
  res.json({
    success: true,
    message: 'Task updated successfully.',
    data: task,
  });
});

// PATCH /api/tasks/:id/status
const updateTaskStatus = asyncHandler(async (req, res) => {
  const status = validateStatusInput(req.body);
  const task = await findTaskOrThrow(req.params.id);
  task.status = status;
  await task.save();
  res.json({
    success: true,
    message: 'Task status updated.',
    data: task,
  });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  if (!OBJECT_ID.test(req.params.id)) {
    throw ApiError.badRequest('Invalid task ID format.');
  }
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) {
    throw ApiError.notFound();
  }
  res.json({
    success: true,
    message: 'Task deleted successfully.',
    data: { _id: task._id },
  });
});

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
