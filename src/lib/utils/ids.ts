/**
 * Generates a unique ID
 */
export function generateUniqueId(): string {
  // Generate a random string
  const randomPart = Math.random().toString(36).substring(2, 15);

  // Add a timestamp for uniqueness
  const timestampPart = Date.now().toString(36);

  // Combine them
  return `${timestampPart}-${randomPart}`;
}
