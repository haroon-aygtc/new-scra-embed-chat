/**
 * MySQL database connection module
 * Handles connection to MySQL database for persistent storage
 */

import mysql from "mysql2/promise";

// Database connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "scraping_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add connection timeout to fail faster if DB is not available
  connectTimeout: 10000, // 10 seconds
  // Add retry strategy
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

// Create a connection pool
let pool: mysql.Pool;
let isDbAvailable = false;

// Create a dummy pool function to use when DB is not available
const createDummyPool = () => {
  console.log("Creating dummy pool for file storage fallback");
  return {
    execute: async () => {
      throw new Error("MySQL database not available");
    },
    getConnection: async () => {
      throw new Error("MySQL database not available");
    },
    end: async () => {},
    on: () => {},
  } as unknown as mysql.Pool;
};

// Initialize pool with dummy first to ensure it's always defined
pool = createDummyPool();

// Try to create a real connection pool
try {
  console.log("Attempting to create MySQL connection pool with config:", {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit,
  });

  pool = mysql.createPool(dbConfig);

  // Add event listeners to monitor connection issues
  pool.on("connection", () => {
    console.log("New connection established to MySQL");
    isDbAvailable = true;
  });

  pool.on("error", (err) => {
    console.error("MySQL pool error:", err);
    isDbAvailable = false;
  });

  console.log("MySQL connection pool created successfully");
} catch (error) {
  console.error("Error creating MySQL connection pool:", error);
  // We already have a dummy pool initialized above
  isDbAvailable = false;
}

/**
 * Initialize the database by creating necessary tables if they don't exist
 */
export async function initializeDatabase() {
  try {
    // First test the connection before attempting to initialize
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.log("Database connection test failed, skipping initialization");
      return false;
    }

    console.log(
      "Database connection successful, proceeding with initialization",
    );

    // Get a connection from the pool with timeout
    const connectionPromise = pool.getConnection();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Connection timeout during initialization")),
        5000,
      );
    });

    const connection = (await Promise.race([
      connectionPromise,
      timeoutPromise,
    ])) as mysql.PoolConnection;

    try {
      console.log("Creating scraping_configurations table if not exists");
      // Create configurations table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS scraping_configurations (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255),
          url TEXT NOT NULL,
          mode VARCHAR(50) NOT NULL,
          scrapingMode VARCHAR(50) NOT NULL,
          selector TEXT,
          selectorType VARCHAR(50),
          categories JSON,
          options JSON,
          schedule JSON,
          outputFormat VARCHAR(50),
          urls JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          config_data JSON
        )
      `);

      console.log("Creating scraping_results table if not exists");
      // Create results table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS scraping_results (
          id VARCHAR(50) PRIMARY KEY,
          configId VARCHAR(50) NOT NULL,
          url TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) NOT NULL,
          categories JSON,
          raw JSON,
          metadata JSON,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      console.log("Database tables initialized successfully");
      return true;
    } finally {
      connection.release();
      console.log("Database connection released after initialization");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }

    console.log(
      "Falling back to file storage due to database initialization failure",
    );
    isDbAvailable = false;
    // Don't throw here to allow the application to continue even if DB init fails
    // This allows fallback to JSON file storage
    return false;
  }
}

/**
 * Execute a query on the database
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function executeQuery(query: string, params: any[] = []) {
  try {
    // Check if database is available before attempting query
    if (!isDbAvailable) {
      throw new Error(
        "MySQL database not available - falling back to file storage",
      );
    }

    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get the database connection pool
 * @returns MySQL connection pool
 */
export function getPool() {
  return pool;
}

/**
 * Check if the database is available
 * @returns Boolean indicating if the database is available
 */
export function isDatabaseAvailable() {
  return isDbAvailable;
}

/**
 * Test database connection
 * @returns Promise that resolves to true if connection is successful, false otherwise
 */
export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");

    // If we already know DB is not available, return false immediately
    if (!isDbAvailable) {
      console.log("Database already marked as unavailable, skipping test");
      return false;
    }

    // Try a simple query to test the connection with a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database connection timeout")), 5000);
    });

    const queryPromise = pool.execute("SELECT 1");

    await Promise.race([queryPromise, timeoutPromise]);

    console.log("Database connection test successful");
    isDbAvailable = true;
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    isDbAvailable = false;

    // Log more details about the error
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }

    console.log(
      "Falling back to file storage due to database connection failure",
    );
    return false;
  }
}

// Initialize the database when this module is imported, but with a slight delay
// to allow the server to fully start up first
setTimeout(() => {
  console.log("Starting delayed database initialization...");
  initializeDatabase()
    .then((success) => {
      if (success) {
        console.log("Database initialization completed successfully");
      } else {
        console.log(
          "Database initialization failed, using file storage fallback",
        );
      }
    })
    .catch((error) => {
      console.error("Unhandled error during database initialization:", error);
    });
}, 2000); // 2 second delay
