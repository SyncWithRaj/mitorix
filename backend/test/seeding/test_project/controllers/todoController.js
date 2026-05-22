const Todo = require("../models/Todo");
const { generateId, formatDate } = require("../utils/helpers");

/**
 * Get all todos, optionally filtered by completion status.
 */
function getAllTodos(req, res) {
  let todos = Todo.getAll();

  if (req.query.completed !== undefined) {
    const isCompleted = req.query.completed === "true";
    todos = todos.filter((t) => t.completed === isCompleted);
  }

  res.json({
    success: true,
    count: todos.length,
    data: todos,
  });
}

/**
 * Get a single todo by ID.
 */
function getTodoById(req, res) {
  const todo = Todo.findById(req.params.id);

  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }

  res.json({ success: true, data: todo });
}

/**
 * Create a new todo item.
 */
function createTodo(req, res) {
  const newTodo = Todo.create({
    id: generateId(),
    title: req.body.title,
    description: req.body.description || "",
    completed: false,
    createdAt: formatDate(new Date()),
  });

  res.status(201).json({ success: true, data: newTodo });
}

/**
 * Update an existing todo.
 */
function updateTodo(req, res) {
  const updated = Todo.update(req.params.id, {
    title: req.body.title,
    description: req.body.description,
  });

  if (!updated) {
    return res.status(404).json({ error: "Todo not found" });
  }

  res.json({ success: true, data: updated });
}

/**
 * Delete a todo by ID.
 */
function deleteTodo(req, res) {
  const deleted = Todo.remove(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: "Todo not found" });
  }

  res.json({ success: true, message: "Todo deleted" });
}

/**
 * Toggle the completed status of a todo.
 */
function toggleTodo(req, res) {
  const todo = Todo.findById(req.params.id);

  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }

  const updated = Todo.update(req.params.id, {
    completed: !todo.completed,
  });

  res.json({ success: true, data: updated });
}

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
};
