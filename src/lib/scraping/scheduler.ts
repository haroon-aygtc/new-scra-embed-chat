/**
 * Scheduler module for periodic data synchronization
 * This module handles scheduling periodic data synchronization between MySQL and JSON files
 */

import { syncAll } from "./sync";

// Interval for synchronization in milliseconds (default: 1 hour)
const SYNC_INTERVAL = process.env.SYNC_INTERVAL
  ? parseInt(process.env.SYNC_INTERVAL, 10)
  : 60 * 60 * 1000;

// Flag to track if synchronization is already running
let isSyncRunning = false;

// Timer ID for the scheduled synchronization
let syncTimerId: NodeJS.Timeout | null = null;

/**
 * Start the synchronization scheduler
 * @param interval Optional interval in milliseconds (default: 1 hour)
 */
export function startSyncScheduler(interval = SYNC_INTERVAL): void {
  // Clear any existing timer
  if (syncTimerId) {
    clearInterval(syncTimerId);
  }

  console.log(`Starting synchronization scheduler with interval ${interval}ms`);

  // Run initial synchronization
  runSynchronization();

  // Schedule periodic synchronization
  syncTimerId = setInterval(runSynchronization, interval);
}

/**
 * Stop the synchronization scheduler
 */
export function stopSyncScheduler(): void {
  if (syncTimerId) {
    clearInterval(syncTimerId);
    syncTimerId = null;
    console.log("Synchronization scheduler stopped");
  }
}

/**
 * Run synchronization if not already running
 */
async function runSynchronization(): Promise<void> {
  if (isSyncRunning) {
    console.log("Synchronization already in progress, skipping");
    return;
  }

  isSyncRunning = true;

  try {
    console.log("Running scheduled data synchronization...");
    const result = await syncAll();
    console.log(
      `Synchronized ${result.configurations} configurations and ${result.results} results`,
    );
  } catch (error) {
    console.error("Error during scheduled synchronization:", error);
  } finally {
    isSyncRunning = false;
  }
}

// Export the scheduler functions
export default {
  startSyncScheduler,
  stopSyncScheduler,
};
