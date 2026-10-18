exports.notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ success: false, message: "Invalid JSON in request body" });
  }

  // Mongoose validation errors (missing title, bad status, ...)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: "Validation failed", errors });
  }

  // Bad value types (e.g. invalid dueDate, invalid ObjectId)
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: `Invalid value for field '${err.path}'` });
  }

  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
};
