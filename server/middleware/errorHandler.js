class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  }

  static notFound(message = 'Task not found. It may have already been deleted.') {
    return new ApiError(404, message);
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handling: consistent JSON, no stack traces or secrets leaked.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let errors = Array.isArray(err.errors) ? err.errors : [];

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in the request body.';
    errors = [];
  } else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Please fix the highlighted fields.';
    errors = Object.values(err.errors).map((issue) => ({
      field: issue.path,
      message: issue.message,
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}".`;
    errors = [];
  }

  if (statusCode >= 500) {
    // Log the real error server-side; never expose internals to the client.
    console.error('[TaskFlow API]', err);
    message = 'Something went wrong on our end. Please try again.';
    errors = [];
  }

  const body = { success: false, message };
  if (errors.length > 0) body.errors = errors;
  res.status(statusCode).json(body);
}

module.exports = { ApiError, asyncHandler, notFound, errorHandler };
