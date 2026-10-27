
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));

// ---------- DATABASE MODELS ----------

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      password: { type: String, required: true },
    },
    { timestamps: true }
  )
);

const Task = mongoose.model(
  "Task",
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      title: { type: String, required: true, trim: true, maxlength: 200 },
      category: {
        type: String,
        enum: ["Study", "Work", "Project", "Personal"],
        default: "Study",
      },
      priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium",
      },
      due: {
        type: String,
        enum: ["Today", "Tomorrow", "This week", "No deadline"],
        default: "Today",
      },
      completed: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

// ---------- AUTHENTICATION MIDDLEWARE ----------

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Please log in first" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ---------- REGISTER ----------

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ message: "Name is too long" });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully. Please log in.",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Unable to register right now" });
  }
});

// ---------- LOGIN ----------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Unable to log in right now" });
  }
});

// ---------- CURRENT USER ----------

app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    return res.json({
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    return res.status(401).json({ message: "Unable to verify your account" });
  }
});

// ---------- LIST USER TASKS ----------

app.get("/api/tasks", authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({
      createdAt: -1,
    });

    return res.json({ tasks });
  } catch (error) {
    console.error("Fetch tasks error:", error.message);
    return res.status(500).json({ message: "Unable to fetch tasks" });
  }
});

// ---------- CREATE TASK ----------

app.post("/api/tasks", authenticate, async (req, res) => {
  try {
    const { title, category, priority, due } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({ message: "Task title is too long" });
    }

    const task = await Task.create({
      user: req.userId,
      title: title.trim(),
      category: category || "Study",
      priority: priority || "Medium",
      due: due || "Today",
    });

    return res.status(201).json({ task });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid task details" });
    }
    console.error("Create task error:", error.message);
    return res.status(500).json({ message: "Unable to create task" });
  }
});

// ---------- UPDATE TASK ----------

app.patch("/api/tasks/:id", authenticate, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const allowed = ["title", "category", "priority", "due", "completed"];
    const updates = {};

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No task updates provided" });
    }

    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" ||
        !updates.title.trim() ||
        updates.title.trim().length > 200)
    ) {
      return res.status(400).json({ message: "Invalid task title" });
    }

    if (
      updates.completed !== undefined &&
      typeof updates.completed !== "boolean"
    ) {
      return res.status(400).json({ message: "Invalid completion status" });
    }

    if (updates.title !== undefined) updates.title = updates.title.trim();

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ task });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid task details" });
    }
    console.error("Update task error:", error.message);
    return res.status(500).json({ message: "Unable to update task" });
  }
});

// ---------- DELETE TASK ----------

app.delete("/api/tasks/:id", authenticate, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error.message);
    return res.status(500).json({ message: "Unable to delete task" });
  }
});

// ---------- HEALTH CHECK ----------

app.get("/", (req, res) => {
  res.json({ message: "Taskflow API is running" });
});

// ---------- START SERVER ----------

async function startServer() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("Please configure MONGO_URI and JWT_SECRET in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log(`Taskflow API running on http://localhost:${process.env.PORT || 5000}`);
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();

