/**
 * Database initialization script
 * Creates all necessary tables for the scraping module
 */

import {
  executeQuery,
  isDatabaseAvailable,
  testDatabaseConnection,
} from "./mysql";

/**
 * Initialize all database tables
 */
export async function initializeAllTables() {
  try {
    console.log("Starting database initialization...");

    // Test database connection before proceeding
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.warn(
        "Database connection failed - skipping table initialization",
      );
      console.log("The application will fall back to file storage");
      return false;
    }

    // Create scraping_configurations table
    await executeQuery(`
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
    console.log("Created scraping_configurations table");

    // Create scraping_results table
    await executeQuery(`
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
    console.log("Created scraping_results table");

    // Create scraping_categories table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS scraping_categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        keywords JSON,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("Created scraping_categories table");

    // Insert default categories if they don't exist
    const defaultCategories = [
      { name: "services", description: "Services offered by the organization" },
      { name: "fees", description: "Pricing and fee structure" },
      { name: "documents", description: "Required documents and forms" },
      { name: "eligibility", description: "Eligibility criteria for services" },
      { name: "products", description: "Products available for purchase" },
      {
        name: "contact",
        description: "Contact information and support details",
      },
      { name: "faq", description: "Frequently asked questions and answers" },
      { name: "hours", description: "Business hours and availability" },
      { name: "locations", description: "Physical locations and addresses" },
      { name: "team", description: "Team members and staff information" },
      {
        name: "testimonials",
        description: "Customer reviews and testimonials",
      },
    ];

    for (const category of defaultCategories) {
      await executeQuery(
        `
        INSERT IGNORE INTO scraping_categories (id, name, description, keywords, metadata)
        VALUES (UUID(), ?, ?, '[]', '{}')
      `,
        [category.name, category.description],
      );
    }
    console.log("Inserted default categories");

    console.log("Database initialization completed successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database tables:", error);
    return false;
  }
}
