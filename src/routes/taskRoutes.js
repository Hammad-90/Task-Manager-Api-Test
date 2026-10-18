const express = require("express");
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.route("/").post(createTask).get(getTasks);

router
  .route("/:id")
  .get(validateObjectId, getTask)
  .put(validateObjectId, updateTask)
  .delete(validateObjectId, deleteTask);

module.exports = router;
