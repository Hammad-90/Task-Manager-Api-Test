const mongoose = require("mongoose");

// Rejects requests whose :id is not a valid MongoDB ObjectId
module.exports = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res
      .status(400)
      .json({ success: false, message: `Invalid task ID: ${req.params.id}` });
  }
  next();
};
