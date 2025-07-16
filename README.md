## Trustana Product Catalog API

This project implements a REST API for managing a product catalog with hierarchical categories and attributes as per the Trustana take-home assignment.

### Tech Stack
- Node.js with TypeScript
- NestJS framework
- PostgreSQL database
- TypeORM for database operations

### Key Features Implemented

#### 1. Database Schema
- **Categories**: Hierarchical tree structure with self-referencing parent-child relationships
- **Attributes**: Configurable attributes with different types (text, number, boolean, date, select, multi-select)
- **Products**: Products linked to exactly one category (leaf node)
- **CategoryAttributes**: Junction table managing attribute-category relationships with link types
- **ProductAttributeValues**: Stores actual attribute values for products

#### 2. REST API Endpoints

##### Get Attributes
```
GET /api/v1/attributes
```

**Query Parameters:**
- `categoryIds` (optional): Array of category UUIDs to filter attributes
- `linkTypes` (optional): Array of link types (`direct`, `inherited`, `global`)
- `keyword` (optional): Search keyword for attribute name/description
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Field to sort by (default: `name`)
- `sortOrder` (optional): Sort order `ASC` or `DESC` (default: `ASC`)
- `notApplicable` (optional): Boolean to get attributes NOT linked to specified categories

**Examples:**
```bash
# Get all attributes
curl "http://localhost:3000/api/v1/attributes"

# Get attributes for a specific category
curl "http://localhost:3000/api/v1/attributes?categoryIds[]=<category-uuid>"

# Get only direct attributes for a category
curl "http://localhost:3000/api/v1/attributes?categoryIds[]=<category-uuid>&linkTypes[]=direct"

# Get attributes not applicable to a category
curl "http://localhost:3000/api/v1/attributes?categoryIds[]=<category-uuid>&notApplicable=true"

# Search attributes with pagination
curl "http://localhost:3000/api/v1/attributes?keyword=size&page=1&limit=5"

# Search by link type
http://localhost:3000/api/v1/attributes?linkTypes[]=inherited
```

##### Get Category Tree
```
GET /api/v1/categories/tree
```

**Query Parameters:**
- `includeAttributeCount` (optional): Include count of direct attributes (default: false)
- `includeProductCount` (optional): Include count of products in each category (default: false)

**Examples:**
```bash
# Get basic category tree
curl "http://localhost:3000/api/v1/categories/tree"

# Get category tree with counts
curl "http://localhost:3000/api/v1/categories/tree?includeAttributeCount=true&includeProductCount=true"
```

#### 3. Link Types Explained
- **Direct**: Attributes directly linked to a category
- **Inherited**: Attributes linked to ancestor categories (parent, grandparent, etc.)
- **Global**: Attributes not linked to any category (apply to all products)

#### 4. Sample Data
The API includes a seeding endpoint to create sample data for testing:

```bash
# Seed sample data
curl -X POST "http://localhost:3000/api/v1/seed"
```

This creates:
- Electronics > Smartphones, Laptops
- Clothing > Shoes
- Various attributes (Brand, Color, Size, Storage, etc.)
- Sample products with attribute values

### Installation & Setup

```bash
./setup-final.sh
```

### API Response Examples

#### Attributes Response
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Brand",
      "description": "Product brand or manufacturer",
      "type": "text",
      "isRequired": true,
      "isActive": true,
      "createdAt": "2025-07-11T07:03:55.925Z",
      "updatedAt": "2025-07-11T07:03:55.925Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Category Tree Response
```json
[
  {
    "id": "uuid",
    "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "parentId": null,
    "children": [
      {
        "id": "uuid",
        "name": "Smartphones",
        "parentId": "parent-uuid",
        "children": []
      }
    ],
    "directAttributeCount": 3,
    "productCount": 2
  }
]
```

### Testing

```bash
# Health check
curl "http://localhost:3000/api/v1/health"

# Seed test data
curl -X POST "http://localhost:3000/api/v1/seed"

# Test endpoints
curl "http://localhost:3000/api/v1/attributes"
curl "http://localhost:3000/api/v1/categories/tree"
```
