const { CATEGORIES, PRIORITIES, STATUSES } = require('../models/Task');
const { ApiError } = require('../middleware/errorHandler');

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 1000;

// Remove control characters and surrounding whitespace.
// Non-string values (numbers, arrays, objects) are never valid task text.
function cleanText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .trim();
}

// Due dates are day-based. Date-only strings are stored at local noon so the
// calendar day stays stable regardless of timezone conversions.
function parseDueDate(value) {
  if (value === null || value === '' || value === undefined) return null;
  if (typeof value !== 'string') throw new Error('invalid date');

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch.map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error('invalid date');
    }
    return date;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('invalid date');
  return date;
}

function validateTaskInput(body, { requireTitle = true } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('Request body must be a JSON object.');
  }

  const value = {};
  const errors = [];

  if (requireTitle || Object.prototype.hasOwnProperty.call(body, 'title')) {
    const title = cleanText(body.title);
    if (!title) {
      errors.push({ field: 'title', message: 'Title is required.' });
    } else if (title.length > MAX_TITLE) {
      errors.push({
        field: 'title',
        message: `Title cannot exceed ${MAX_TITLE} characters.`,
      });
    } else {
      value.title = title;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    const description = cleanText(body.description);
    if (description.length > MAX_DESCRIPTION) {
      errors.push({
        field: 'description',
        message: `Description cannot exceed ${MAX_DESCRIPTION} characters.`,
      });
    } else {
      value.description = description;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'category')) {
    if (!CATEGORIES.includes(body.category)) {
      errors.push({
        field: 'category',
        message: `Category must be one of: ${CATEGORIES.join(', ')}.`,
      });
    } else {
      value.category = body.category;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'priority')) {
    if (!PRIORITIES.includes(body.priority)) {
      errors.push({
        field: 'priority',
        message: `Priority must be one of: ${PRIORITIES.join(', ')}.`,
      });
    } else {
      value.priority = body.priority;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    if (!STATUSES.includes(body.status)) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${STATUSES.join(', ')}.`,
      });
    } else {
      value.status = body.status;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
    try {
      value.dueDate = parseDueDate(body.dueDate);
    } catch {
      errors.push({
        field: 'dueDate',
        message: 'Due date must be a valid date.',
      });
    }
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Please fix the highlighted fields.', errors);
  }

  return value;
}

function validateStatusInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !('status' in body)) {
    throw ApiError.badRequest('A status value is required.', [
      { field: 'status', message: 'Status is required.' },
    ]);
  }
  if (!STATUSES.includes(body.status)) {
    throw ApiError.badRequest('Invalid task status.', [
      { field: 'status', message: `Status must be one of: ${STATUSES.join(', ')}.` },
    ]);
  }
  return body.status;
}

module.exports = { validateTaskInput, validateStatusInput, parseDueDate, cleanText };
