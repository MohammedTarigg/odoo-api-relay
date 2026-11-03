export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers - restrict to allowed origins (comma-separated in env var)
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // The CDN caches this response, so cache a separate copy per origin
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Odoo credentials from environment variables
  const ODOO_URL = process.env.ODOO_URL;
  const ODOO_DB = process.env.ODOO_DB;
  const ODOO_UID = parseInt(process.env.ODOO_UID, 10);
  const ODOO_API_KEY = process.env.ODOO_API_KEY;

  if (!ODOO_URL || !ODOO_DB || !ODOO_UID || !ODOO_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // JSON-RPC payload to fetch product categories
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        ODOO_DB,
        ODOO_UID,
        ODOO_API_KEY,
        'product.public.category',
        'search_read',
        [[]],
        {
          fields: ['id', 'name', 'parent_id']
        }
      ]
    },
    id: Date.now()
  };

  try {
    const response = await fetch(ODOO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Odoo API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({
        error: 'Odoo API error',
        message: data.error.data?.message || 'Unknown error'
      });
    }

    // Sort categories by year in name descending (newest first)
    // Extract year from name, e.g., "Ramadan 2025" -> 2025
    const getYear = (name) => {
      const match = name.match(/\b(20\d{2})\b/);
      return match ? parseInt(match[1], 10) : 0;
    };

    // Build base URL for Odoo image endpoints
    const odooBase = new URL(ODOO_URL).origin;

    const categories = (data.result || []).sort((a, b) => {
      const yearA = getYear(a.name || '');
      const yearB = getYear(b.name || '');
      // Sort by year descending, items without year go to end
      if (yearA !== yearB) return yearB - yearA;
      // If same year, sort alphabetically
      return (a.name || '').localeCompare(b.name || '');
    }).map(cat => ({
      id: cat.id,
      name: cat.name,
      parent_id: cat.parent_id,
      image_url: `${odooBase}/web/image/product.public.category/${cat.id}/image_1920`
    }));

    // Cache at Vercel CDN for 5 min, serve stale while revalidating for up to 1 hour
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');

    return res.status(200).json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
}
