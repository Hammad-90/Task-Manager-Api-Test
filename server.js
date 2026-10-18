require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const taskRoutes = require("./src/routes/taskRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "Task Manager API is running" });
});

app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
