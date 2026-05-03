const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");
const { validateTodo } = require("../middleware/validation");

// GET /api/todos - List all todos
router.get("/", todoController.getAllTodos);

// GET /api/todos/:id - Get a single todo
router.get("/:id", todoController.getTodoById);

// POST /api/todos - Create a new todo
router.post("/", validateTodo, todoController.createTodo);

// PUT /api/todos/:id - Update a todo
router.put("/:id", validateTodo, todoController.updateTodo);

// DELETE /api/todos/:id - Delete a todo
router.delete("/:id", todoController.deleteTodo);

// PATCH /api/todos/:id/toggle - Toggle completion status
router.patch("/:id/toggle", todoController.toggleTodo);

module.exports = router;
