export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers - restrict to allowed origin
  const allowedOrigin = 'https://alhasnaa-signature.odoo.com';
  const origin = req.headers.origin;

  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
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
          fields: ['id', 'name', 'image_1920', 'parent_id']
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

    return res.status(200).json({
      success: true,
      categories: data.result || []
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
}
