# Odoo API Relay

Secure serverless API proxy for fetching Odoo product categories without exposing API credentials.

## Endpoint

**GET** `/api/categories`

Returns all product public categories with their images.

## Response Format

```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "Category Name",
      "image_1920": "base64_encoded_image",
      "parent_id": [parent_id, "Parent Name"] | false
    }
  ]
}
```

## Features

- Secure API key storage via environment variables
- CORS protection (restricted origins)
- GET requests only
- Error handling with proper HTTP status codes
- Lightweight serverless function (128MB memory)

## Environment Variables

Required environment variables in Vercel:

- `ODOO_URL` - Odoo JSON-RPC endpoint
- `ODOO_DB` - Odoo database name
- `ODOO_UID` - Odoo user ID
- `ODOO_API_KEY` - Odoo API key

## Deployment

```bash
vercel deploy --prod
```
