/**
 * Generate a unique ID string.
 * Uses timestamp + random suffix for simplicity.
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Format a Date object to ISO string.
 */
function formatDate(date) {
  return date.toISOString();
}

/**
 * Paginate an array of items.
 * @param {Array} items - The full list to paginate.
 * @param {number} page - Current page number (1-indexed).
 * @param {number} limit - Items per page.
 * @returns {{ data: Array, total: number, page: number, totalPages: number }}
 */
function paginate(items, page = 1, limit = 10) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    data: items.slice(startIndex, endIndex),
    total: items.length,
    page,
    totalPages: Math.ceil(items.length / limit),
  };
}

/**
 * Slugify a string for URL-safe usage.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

module.exports = {
  generateId,
  formatDate,
  paginate,
  slugify,
};
