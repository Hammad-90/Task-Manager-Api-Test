const Task = require("../models/Task");

// Only allow these fields to be set from the request body
const pickTaskFields = (body) => {
  const allowed = ["title", "description", "status", "dueDate"];
  const data = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

// POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create(pickTaskFields(req.body));
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      pickTaskFields(req.body),
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Task deleted successfully", data: task });
  } catch (err) {
    next(err);
  }
};
