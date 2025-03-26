import { NextRequest, NextResponse } from "next/server";
import scrapingQueue from "@/lib/scraping/queue";
import { ScrapingConfig } from "@/types/scraping";

/**
 * API route handler for queue operations
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const jobId = url.searchParams.get("id");

    if (jobId) {
      // Get specific job
      const job = scrapingQueue.getJob(jobId);
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json(job);
    } else {
      // Get all jobs
      const jobs = scrapingQueue.getAllJobs();
      return NextResponse.json(jobs);
    }
  } catch (error: any) {
    console.error("Queue API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve queue information" },
      { status: 500 },
    );
  }
}

/**
 * API route handler for adding a job to the queue
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const config: ScrapingConfig = await request.json();

    // Validate the configuration
    if (!config.url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Add the job to the queue
    const jobId = await scrapingQueue.addJob(config);

    // Return the job ID
    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("Queue API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add job to queue" },
      { status: 500 },
    );
  }
}

/**
 * API route handler for removing a job from the queue
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const jobId = url.searchParams.get("id");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 },
      );
    }

    // Remove the job from the queue
    const removed = scrapingQueue.removeJob(jobId);

    if (!removed) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Return success
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Queue API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove job from queue" },
      { status: 500 },
    );
  }
}
