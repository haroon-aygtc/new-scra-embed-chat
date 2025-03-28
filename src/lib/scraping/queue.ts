import { ScrapingConfig } from "@/types/scraping";

/**
 * Scraping queue module
 * Handles job queue for scraping operations
 */

// In-memory queue for simplicity
const queue = new Map();

/**
 * Add a job to the queue
 * @param config Scraping configuration
 * @returns Job ID
 */
function addJob(config: ScrapingConfig): string {
  const jobId = config.id || `job_${Date.now()}`;
  queue.set(jobId, {
    id: jobId,
    config,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return jobId;
}

/**
 * Get a job from the queue
 * @param jobId Job ID
 * @returns Job or null if not found
 */
function getJob(jobId: string) {
  return queue.get(jobId) || null;
}

/**
 * Get all jobs from the queue
 * @returns Array of all jobs
 */
function getAllJobs() {
  return Array.from(queue.values());
}

/**
 * Remove a job from the queue
 * @param jobId Job ID
 * @returns True if removed, false if not found
 */
function removeJob(jobId: string): boolean {
  return queue.delete(jobId);
}

export default {
  addJob,
  getJob,
  getAllJobs,
  removeJob,
};
