import { ScrapingConfig, ScrapingResult } from "@/types/scraping";
import { generateUniqueId } from "@/lib/utils/ids";
import { scrapeWebsite } from "./scraper";

// In-memory queue for development
// In production, this would be replaced with a proper queue system like Redis, RabbitMQ, etc.
interface QueueItem {
  id: string;
  config: ScrapingConfig;
  status: "pending" | "processing" | "completed" | "failed" | "retrying";
  progress: number;
  result?: ScrapingResult;
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

class ScrapingQueue {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private maxConcurrent: number = 2; // Maximum number of concurrent jobs
  private currentJobs: number = 0;
  private listeners: Map<string, (item: QueueItem) => void> = new Map();

  /**
   * Add a job to the queue
   */
  public async addJob(config: ScrapingConfig): Promise<string> {
    const jobId = generateUniqueId();
    const now = new Date().toISOString();

    // Create a new queue item
    const item: QueueItem = {
      id: jobId,
      config: {
        ...config,
        id: config.id || jobId,
      },
      status: "pending",
      progress: 0,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Add to queue
    this.queue.push(item);

    // Sort queue by priority
    this.sortQueue();

    // Start processing if not already processing
    if (!this.processing) {
      this.processQueue();
    }

    return jobId;
  }

  /**
   * Get a job from the queue
   */
  public getJob(id: string): QueueItem | undefined {
    return this.queue.find((item) => item.id === id);
  }

  /**
   * Get all jobs in the queue
   */
  public getAllJobs(): QueueItem[] {
    return [...this.queue];
  }

  /**
   * Remove a job from the queue
   */
  public removeJob(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear all jobs from the queue
   */
  public clearQueue(): void {
    this.queue = [];
  }

  /**
   * Subscribe to job updates
   */
  public subscribe(
    id: string,
    callback: (item: QueueItem) => void,
  ): () => void {
    const listenerId = `${id}_${generateUniqueId()}`;
    this.listeners.set(listenerId, callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listenerId);
    };
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.currentJobs >= this.maxConcurrent) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Find the next pending job
    const nextJob = this.queue.find((item) => {
      // Skip disabled scheduled jobs
      if (
        item.config.mode === "scheduled" &&
        item.config.schedule &&
        item.config.schedule.enabled === false
      ) {
        return false;
      }
      return item.status === "pending";
    });

    if (!nextJob) {
      this.processing = false;
      return;
    }

    console.log(
      `Processing job ${nextJob.id} with mode ${nextJob.config.mode}`,
    );

    // Update job status
    nextJob.status = "processing";
    nextJob.updatedAt = new Date().toISOString();
    this.notifyListeners(nextJob);

    // Increment current jobs
    this.currentJobs++;

    try {
      // Process the job
      const result = await this.processJob(nextJob);

      // Update job with result
      nextJob.status = "completed";
      nextJob.progress = 100;
      nextJob.result = result;
      nextJob.updatedAt = new Date().toISOString();
      this.notifyListeners(nextJob);
    } catch (error: any) {
      console.error(`Error processing job ${nextJob.id}:`, error);

      // Check if we should retry
      const maxRetries = nextJob.config.maxRetries || 3;
      if (nextJob.retryCount < maxRetries) {
        // Retry the job
        nextJob.status = "retrying";
        nextJob.retryCount++;
        nextJob.error = error.message;
        nextJob.progress = 0;
        nextJob.updatedAt = new Date().toISOString();
        this.notifyListeners(nextJob);

        // Add a delay before retrying
        setTimeout(() => {
          nextJob.status = "pending";
          this.notifyListeners(nextJob);
          this.processQueue();
        }, 5000); // 5 second delay before retry
      } else {
        // Max retries reached, mark as failed
        nextJob.status = "failed";
        nextJob.error = error.message;
        nextJob.updatedAt = new Date().toISOString();
        this.notifyListeners(nextJob);
      }
    } finally {
      // Decrement current jobs
      this.currentJobs--;

      // Continue processing the queue
      this.processQueue();
    }
  }

  /**
   * Process a job
   */
  private async processJob(job: QueueItem): Promise<ScrapingResult> {
    // Check if this is a scheduled job and if it's time to run it
    if (job.config.mode === "scheduled" && job.config.schedule) {
      console.log(
        `Checking scheduled job ${job.id} with schedule:`,
        job.config.schedule,
      );
      const shouldRun = this.shouldRunScheduledJob(job.config);
      if (!shouldRun) {
        // Not time to run yet, reschedule
        console.log(
          `Job ${job.id} not scheduled to run now, next run at: ${this.calculateNextRunTime(job.config)}`,
        );
        return this.createPendingResult(
          job.config,
          "Scheduled job waiting for next run time",
        );
      }
      console.log(`Running scheduled job ${job.id} now`);

      // Update the last run time in the config metadata
      if (!job.config.metadata) job.config.metadata = {};
      job.config.metadata.lastRun = new Date().toISOString();
    }

    // Simulate progress updates
    const updateProgress = (progress: number) => {
      job.progress = progress;
      job.updatedAt = new Date().toISOString();
      this.notifyListeners(job);
    };

    // Update progress at intervals
    const progressInterval = setInterval(() => {
      if (job.progress < 90) {
        updateProgress(job.progress + 10);
      }
    }, 1000);

    try {
      // Apply rate limit delay if specified
      if (job.config.options.rateLimitDelay > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, job.config.options.rateLimitDelay),
        );
      }

      // For multiple URLs mode, process each URL
      if (
        job.config.mode === "multiple" &&
        Array.isArray(job.config.urls) &&
        job.config.urls.length > 0
      ) {
        // Process multiple URLs and combine results
        const results: ScrapingResult[] = [];
        const totalUrls = job.config.urls.length;

        for (let i = 0; i < totalUrls; i++) {
          const url = job.config.urls[i];

          // Update progress based on URL processing
          updateProgress(Math.floor((i / totalUrls) * 80)); // Reserve last 20% for post-processing

          // Create a config for this specific URL
          const urlConfig = {
            ...job.config,
            url,
            mode: "single", // Process as single URL
          };

          try {
            // Process this URL
            const result = await scrapeWebsite(urlConfig);
            results.push(result);
          } catch (urlError: any) {
            console.error(`Error processing URL ${url}:`, urlError);
            // Add a failed result for this URL
            results.push({
              id: `error_${Date.now()}_${i}`,
              configId: job.config.id || "batch",
              url,
              timestamp: new Date().toISOString(),
              status: "failed",
              categories: {},
              raw: {
                text: urlError.message || "Failed to process URL",
              },
              metadata: {
                errors: [urlError.message || "Unknown error"],
                version: "1.0.0",
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }

          // Add a small delay between URLs to avoid overwhelming the target server
          if (i < totalUrls - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        // Combine results into a single batch result
        updateProgress(90); // Final processing stage

        // Create a combined result
        const combinedResult: ScrapingResult = {
          id: `batch_${Date.now()}`,
          configId: job.config.id || "batch",
          url: job.config.urls[0], // Use the first URL as the main URL
          timestamp: new Date().toISOString(),
          status: results.some((r) => r.status === "success")
            ? "partial"
            : "failed",
          categories: this.combineCategories(results),
          raw: {
            json: JSON.stringify(
              {
                batchResults: results.map((r) => ({
                  url: r.url,
                  status: r.status,
                  timestamp: r.timestamp,
                  categories: Object.keys(r.categories),
                })),
              },
              null,
              2,
            ),
            text: `Batch processing completed for ${results.length} URLs. Success: ${results.filter((r) => r.status === "success").length}, Failed: ${results.filter((r) => r.status === "failed").length}`,
          },
          metadata: {
            batchSize: totalUrls,
            successCount: results.filter((r) => r.status === "success").length,
            failureCount: results.filter((r) => r.status === "failed").length,
            batchResults: results.map((r) => ({
              id: r.id,
              url: r.url,
              status: r.status,
            })),
            version: "1.0.0",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Clear the progress interval
        clearInterval(progressInterval);

        return combinedResult;
      } else {
        // Process a single URL
        const result = await scrapeWebsite(job.config);

        // Clear the progress interval
        clearInterval(progressInterval);

        // Return the result
        return result;
      }
    } catch (error) {
      // Clear the progress interval
      clearInterval(progressInterval);

      // Re-throw the error
      throw error;
    }
  }

  /**
   * Combines categories from multiple scraping results
   */
  private combineCategories(results: ScrapingResult[]): Record<string, any> {
    const combinedCategories: Record<string, any> = {};

    // Process each result
    results.forEach((result) => {
      // Skip failed results
      if (result.status === "failed") return;

      // Process each category in this result
      Object.entries(result.categories).forEach(
        ([categoryKey, categoryData]) => {
          // Initialize category if it doesn't exist
          if (!combinedCategories[categoryKey]) {
            combinedCategories[categoryKey] = {
              description: categoryData.description,
              items: [],
              metadata: { sources: [] },
            };
          }

          // Add items from this result, with source URL
          const itemsWithSource = categoryData.items.map((item) => ({
            ...item,
            source: item.source || result.url,
            metadata: {
              ...item.metadata,
              resultId: result.id,
              sourceUrl: result.url,
            },
          }));

          combinedCategories[categoryKey].items.push(...itemsWithSource);

          // Track source
          if (
            !combinedCategories[categoryKey].metadata.sources.includes(
              result.url,
            )
          ) {
            combinedCategories[categoryKey].metadata.sources.push(result.url);
          }
        },
      );
    });

    // Deduplicate items in each category
    Object.keys(combinedCategories).forEach((categoryKey) => {
      const items = combinedCategories[categoryKey].items;
      const uniqueItems: any[] = [];
      const seenTitles = new Set();

      items.forEach((item) => {
        // Use title as a simple deduplication key
        if (!seenTitles.has(item.title)) {
          seenTitles.add(item.title);
          uniqueItems.push(item);
        }
      });

      combinedCategories[categoryKey].items = uniqueItems;
    });

    return combinedCategories;
  }

  /**
   * Sort the queue by priority
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // First sort by status (pending first)
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;

      // Then sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.config.priority || "medium"];
      const bPriority = priorityOrder[b.config.priority || "medium"];
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then sort by creation date (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  /**
   * Notify listeners of job updates
   */
  private notifyListeners(job: QueueItem): void {
    this.listeners.forEach((callback) => {
      try {
        callback(job);
      } catch (error) {
        console.error("Error in queue listener:", error);
      }
    });
  }

  /**
   * Determines if a scheduled job should run based on its schedule
   */
  private shouldRunScheduledJob(config: ScrapingConfig): boolean {
    if (!config.schedule) return false;

    const now = new Date();
    const schedule = config.schedule;

    // Parse the scheduled time
    const [hours, minutes] = schedule.time.split(":").map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Get the last run time from metadata or use a default past date
    const lastRunStr = config.metadata?.lastRun || "2000-01-01T00:00:00.000Z";
    const lastRun = new Date(lastRunStr);

    // Calculate time difference in milliseconds
    const timeSinceLastRun = now.getTime() - lastRun.getTime();
    const minimumInterval = 60 * 60 * 1000; // 1 hour minimum between runs to prevent duplicates

    // Don't run if it's been less than the minimum interval since last run
    if (timeSinceLastRun < minimumInterval) {
      console.log(
        `Skipping scheduled job ${config.id}: last run was too recent`,
      );
      return false;
    }

    // Check if it's time to run based on frequency
    switch (schedule.frequency) {
      case "daily": {
        // Check if we're past the scheduled time for today
        const isPastScheduledTime = now.getTime() >= scheduledTime.getTime();

        // Check if we've already run today after the scheduled time
        const lastRunDate = lastRun.toDateString();
        const todayDate = now.toDateString();
        const lastRunTime = lastRun.getHours() * 60 + lastRun.getMinutes();
        const scheduledTimeMinutes = hours * 60 + minutes;

        const alreadyRanToday =
          lastRunDate === todayDate && lastRunTime >= scheduledTimeMinutes;

        return isPastScheduledTime && !alreadyRanToday;
      }

      case "weekly": {
        // If days of week specified, check if today is one of those days
        if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
          const today = now.getDay(); // 0 = Sunday, 6 = Saturday
          if (!schedule.daysOfWeek.includes(today)) return false;
        }

        // Check if we're past the scheduled time for today
        const isPastScheduledTime = now.getTime() >= scheduledTime.getTime();

        // Check if we've already run today after the scheduled time
        const lastRunDate = lastRun.toDateString();
        const todayDate = now.toDateString();
        const lastRunTime = lastRun.getHours() * 60 + lastRun.getMinutes();
        const scheduledTimeMinutes = hours * 60 + minutes;

        const alreadyRanToday =
          lastRunDate === todayDate && lastRunTime >= scheduledTimeMinutes;

        return isPastScheduledTime && !alreadyRanToday;
      }

      case "monthly": {
        // Run on the same day of month at the specified time
        const dayOfMonth = schedule.startDate
          ? new Date(schedule.startDate).getDate()
          : 1; // Default to 1st day of month

        if (now.getDate() !== dayOfMonth) return false;

        // Check if we're past the scheduled time for today
        const isPastScheduledTime = now.getTime() >= scheduledTime.getTime();

        // Check if we've already run today after the scheduled time
        const lastRunDate = lastRun.toDateString();
        const todayDate = now.toDateString();
        const lastRunTime = lastRun.getHours() * 60 + lastRun.getMinutes();
        const scheduledTimeMinutes = hours * 60 + minutes;

        const alreadyRanToday =
          lastRunDate === todayDate && lastRunTime >= scheduledTimeMinutes;

        return isPastScheduledTime && !alreadyRanToday;
      }

      default:
        return false;
    }
  }

  /**
   * Creates a pending result for scheduled jobs
   */
  private createPendingResult(
    config: ScrapingConfig,
    message: string,
  ): ScrapingResult {
    const now = new Date();
    const nextRunTime = this.calculateNextRunTime(config);

    // Update the config with the next run time
    if (!config.schedule)
      config.schedule = { frequency: "daily", time: "12:00" };
    config.schedule.nextRun = nextRunTime;

    // Update metadata
    if (!config.metadata) config.metadata = {};
    config.metadata.nextRun = nextRunTime;

    return {
      id: `scheduled_${now.getTime()}`,
      configId: config.id || "scheduled",
      url: config.url,
      timestamp: now.toISOString(),
      status: "pending",
      categories: {},
      raw: {
        text: message,
      },
      metadata: {
        nextRun: nextRunTime,
        lastRun: config.metadata?.lastRun,
        scheduledFrequency: config.schedule.frequency,
        scheduledTime: config.schedule.time,
        scheduledTimezone: config.schedule.timezone || "UTC",
        enabled: config.schedule.enabled !== false,
        version: "1.0.0",
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Calculates the next run time for a scheduled job
   */
  private calculateNextRunTime(config: ScrapingConfig): string {
    if (!config.schedule) return "";

    const now = new Date();
    const schedule = config.schedule;
    const [hours, minutes] = schedule.time.split(":").map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    // If the scheduled time has already passed today, move to next occurrence
    if (nextRun.getTime() <= now.getTime()) {
      switch (schedule.frequency) {
        case "daily":
          nextRun.setDate(nextRun.getDate() + 1);
          break;

        case "weekly":
          if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
            // Find the next day of week that's in the schedule
            const today = now.getDay();
            const sortedDays = [...schedule.daysOfWeek].sort((a, b) => a - b);

            // Find the next day after today
            const nextDay = sortedDays.find((day) => day > today);
            if (nextDay !== undefined) {
              // Next day is this week
              nextRun.setDate(nextRun.getDate() + (nextDay - today));
            } else {
              // Next day is next week, take the first day in the sorted list
              nextRun.setDate(nextRun.getDate() + (7 - today + sortedDays[0]));
            }
          } else {
            // Default to next week same day
            nextRun.setDate(nextRun.getDate() + 7);
          }
          break;

        case "monthly":
          // Move to next month, same day
          const targetDay = schedule.startDate
            ? new Date(schedule.startDate).getDate()
            : now.getDate();

          // Start with next month
          nextRun.setMonth(nextRun.getMonth() + 1);

          // Set to the target day, handling months with fewer days
          const daysInMonth = new Date(
            nextRun.getFullYear(),
            nextRun.getMonth() + 1,
            0,
          ).getDate();
          nextRun.setDate(Math.min(targetDay, daysInMonth));

          // Reset time to scheduled time
          nextRun.setHours(hours, minutes, 0, 0);
          break;
      }
    }

    // Apply timezone if specified
    if (schedule.timezone) {
      try {
        // Format the date in the specified timezone
        // Note: This is a simplified approach - in production, use a library like date-fns-tz
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: schedule.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });

        const formattedDate = formatter.format(nextRun);
        console.log(
          `Next run time in timezone ${schedule.timezone}: ${formattedDate}`,
        );
      } catch (error) {
        console.error(
          `Error formatting date with timezone ${schedule.timezone}:`,
          error,
        );
      }
    }

    return nextRun.toISOString();
  }
}

// Create a singleton instance
const scrapingQueue = new ScrapingQueue();

export default scrapingQueue;
