/**
 * In-memory Todo store.
 * In a real app this would be a database model (e.g. Mongoose schema).
 */

let todos = [
  {
    id: "1",
    title: "Set up project",
    description: "Initialize the Express project structure",
    completed: true,
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "2",
    title: "Add authentication",
    description: "Implement JWT-based auth middleware",
    completed: false,
    createdAt: "2025-01-02T10:00:00Z",
  },
  {
    id: "3",
    title: "Write tests",
    description: "Add unit and integration tests",
    completed: false,
    createdAt: "2025-01-03T10:00:00Z",
  },
];

/**
 * Retrieve all todos from the store.
 */
function getAll() {
  return [...todos];
}

/**
 * Find a todo by its unique ID.
 */
function findById(id) {
  return todos.find((t) => t.id === id) || null;
}

/**
 * Create a new todo and add it to the store.
 */
function create(data) {
  todos.push(data);
  return data;
}

/**
 * Update fields on an existing todo.
 */
function update(id, fields) {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return null;

  todos[index] = { ...todos[index], ...fields };
  return todos[index];
}

/**
 * Remove a todo by ID from the store.
 */
function remove(id) {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const [deleted] = todos.splice(index, 1);
  return deleted;
}

module.exports = {
  getAll,
  findById,
  create,
  update,
  remove,
};
