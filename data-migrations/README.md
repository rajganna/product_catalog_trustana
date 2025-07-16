# Data Migrations

This directory contains data migration scripts for the Product Catalog service. These migrations are used to populate the database with initial data after schema migrations have been run.

## Overview

Data migrations are different from schema migrations:
- **Schema migrations** (in `/migrations`) create and modify database structure (tables, columns, indexes, etc.)
- **Data migrations** (in `/data-migrations`) populate existing tables with initial or seed data

## Usage

### Running Data Migrations

To run all data migrations:

```bash
# From the project root
npm run db:migrate:data
```

Or run directly with TypeScript:

```bash
npx ts-node data-migrations/index.ts
```

Or using the Makefile:

```bash
make migrate-data
```

### Environment Variables

Ensure these environment variables are set before running data migrations:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USERNAME` - Database username (default: root)
- `DB_PASSWORD` - Database password (default: secret)
- `DB_NAME` - Database name (default: product_catalog)

## API Documentation

### Interactive Swagger UI

When the service is running, you can access the interactive API documentation:

🌐 **http://localhost:3000/api/docs**

Features:
- Interactive API explorer
- Try out endpoints directly from the browser
- Request/response examples
- Schema definitions
- Authentication testing

### API Endpoints

The API endpoints are available at:
- **Base URL**: http://localhost:3000/api/v1
- **Health**: http://localhost:3000/api/v1/health
- **Categories**: http://localhost:3000/api/v1/categories
- **Attributes**: http://localhost:3000/api/v1/attributes
- **Products**: http://localhost:3000/api/v1/products

### Static OpenAPI Specification

The OpenAPI 3.0 specification is available as a static file:

```bash
# View the spec file
cat docs/swagger/oas3.yaml

# Validate the spec
npm run validate:swagger

# Lint the spec
make lint-oas

# Generate HTML documentation
make generate-docs
```

### External Tools

You can also use external tools to view the API specification:

1. **Swagger Editor**: https://editor.swagger.io
   - Copy the content of `docs/swagger/oas3.yaml`
   - Paste into the online editor

2. **Postman**: Import the OpenAPI file directly
3. **Insomnia**: Supports OpenAPI import
4. **VS Code**: Use OpenAPI extensions for local editing

## Migration Files

### Current Data Migrations

1. **20250712000001-seed-categories.ts**
   - Creates initial product categories (Electronics, Clothing, Home & Garden, Books)
   - Creates subcategories for Electronics (Smartphones, Laptops, Audio Equipment)

2. **20250712000002-seed-attributes.ts**
   - Creates common product attributes (Brand, Color, Weight, Dimensions, etc.)
   - Defines attribute types (text, number, boolean, date, select, multi_select)

3. **20250712000003-link-category-attributes.ts**
   - Links attributes to relevant categories
   - Establishes which attributes are available for each category

### Archive

The `/archive` folder contains legacy data migrations from the previous meetings system. These are kept for reference but are not applicable to the current product catalog system.

## Creating New Data Migrations

1. Create a new TypeScript file with timestamp prefix: `YYYYMMDDHHMMSS-description.ts`
2. Implement the required `run` function:

```typescript
import { EntityManager } from "typeorm";

export async function run(manager: EntityManager): Promise<void> {
  console.log('Starting your migration...');

  // Your migration logic here
  // Use manager.query() for raw SQL or manager.save()/find() for entity operations

  console.log('Migration completed successfully');
}
```

3. The migration will be automatically detected and run in filename order

## Best Practices

- Always check if data already exists before inserting to avoid duplicates
- Use descriptive console.log statements to track progress
- Handle errors gracefully and provide meaningful error messages
- Use transactions for complex operations to ensure data consistency
- Test migrations on a copy of production data before deployment

## Database Connection

The migration system uses the same database configuration as the main application (`ormconfig.js`) to ensure consistency.

## Troubleshooting

- **Connection errors**: Verify database is running and environment variables are set correctly
- **Permission errors**: Ensure database user has necessary permissions to insert data
- **Duplicate data**: Most migrations check for existing data before inserting
- **TypeScript errors**: Ensure all imports are correct and types are properly defined
