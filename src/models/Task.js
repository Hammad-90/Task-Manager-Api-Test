const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "in-progress", "completed"],
        message: "Status must be one of: pending, in-progress, completed",
      },
      default: "pending",
    },
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
