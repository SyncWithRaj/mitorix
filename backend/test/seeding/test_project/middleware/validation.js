/**
 * Validation middleware for todo requests.
 * Ensures required fields are present and valid.
 */
function validateTodo(req, res, next) {
  const { title } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({
      error: "Validation failed",
      message: "Title is required and must be a string",
    });
  }

  if (title.trim().length < 1 || title.trim().length > 200) {
    return res.status(400).json({
      error: "Validation failed",
      message: "Title must be between 1 and 200 characters",
    });
  }

  // Sanitize
  req.body.title = title.trim();

  if (req.body.description) {
    req.body.description = req.body.description.trim();
  }

  next();
}

/**
 * Simple request logger middleware.
 */
function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
}

module.exports = {
  validateTodo,
  requestLogger,
};
