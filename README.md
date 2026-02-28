# Odoo API Relay

A lightweight serverless proxy that exposes Odoo product catalog data over a simple REST endpoint. Deployed on Vercel, it forwards requests to Odoo's JSON-RPC API.

## API Reference

### `GET /api/categories`

Returns all public product categories sorted by year (newest first), with direct image URLs.

**Response**

```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "Category Name",
      "parent_id": [2, "Parent Name"],
      "image_url": "https://your-odoo-instance.com/web/image/product.public.category/1/image_1920"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Category ID |
| `name` | `string` | Category display name |
| `parent_id` | `[number, string] \| false` | Parent category reference, or `false` if top-level |
| `image_url` | `string` | Direct URL to the category image |

**Error Responses**

| Status | Description |
|--------|-------------|
| `405` | Method not allowed (non-GET request) |
| `500` | Server configuration or upstream Odoo error |

## Architecture

- **Runtime:** Vercel Serverless Functions (Node.js, 128 MB, 10 s timeout)
- **Protocol:** Odoo JSON-RPC over HTTPS
- **Caching:** CDN-level — `s-maxage=300`, `stale-while-revalidate=3600`
- **CORS:** Restricted to origins defined in `ALLOWED_ORIGINS`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ODOO_URL` | Odoo JSON-RPC endpoint URL |
| `ODOO_DB` | Odoo database name |
| `ODOO_UID` | Odoo user ID |
| `ODOO_API_KEY` | Odoo API key |
| `ALLOWED_ORIGINS` | Comma-separated list of permitted CORS origins |

## Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev

# Deploy to production
vercel deploy --prod
```

## License

MIT
