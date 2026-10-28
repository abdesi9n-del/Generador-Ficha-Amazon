import { organizeSpecsWithAi } from '../server/extractors/aiEnricher';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Usa POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { specs, description, title } = body || {};
    if (!specs || !title) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos.' });
    }

    const result = await organizeSpecsWithAi(specs, description || '', title);
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    console.error('Specs organization error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
