import { extractAmazonProduct, extractAmazonAsin, resolveAmazonShortUrl } from '../server/extractors/amazon';
import { extractAmazonWithAiSearch } from '../server/extractors/aiEnricher';
import { ExtractedProduct, ExtractionResponse } from '../src/types/product';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido. Usa POST.' });
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

    let { url, html, forceAi } = body || {};

    if (!url && !html) {
      return res.status(400).json({ success: false, error: 'Se requiere una URL o código HTML del producto.' });
    }

    url = (url || '').trim();

    // Check for short URLs like a.co or amzn.to
    if (url.includes('a.co/') || url.includes('amzn.to/')) {
      url = await resolveAmazonShortUrl(url);
    }

    let product: ExtractedProduct | null = null;
    let needsHtmlPaste = false;
    const asin = extractAmazonAsin(url);

    if (html) {
      // Direct HTML provided
      const result = await extractAmazonProduct(url, html);
      product = result.product;
    } else if (forceAi) {
      // Explicit AI search requested
      product = await extractAmazonWithAiSearch(url, asin || undefined);
    } else {
      // Direct fetch attempt
      const result = await extractAmazonProduct(url);
      if (result.product && result.product.title && result.product.currentPrice > 0) {
        product = result.product;
      } else {
        // Amazon anti-bot or direct scraping restricted; invoke Gemini AI fallback
        console.log(`Direct scraping restricted for ${asin || url}. Invoking Gemini search fallback...`);
        try {
          const aiProduct = await extractAmazonWithAiSearch(url, asin || undefined);
          if (aiProduct) {
            product = aiProduct;
          } else {
            needsHtmlPaste = true;
          }
        } catch {
          needsHtmlPaste = true;
        }
      }
    }

    if (!product) {
      return res.status(422).json({
        success: false,
        error: 'No se pudo extraer la información del producto de Amazon México.',
        needsHtmlPaste: true,
        details: 'Amazon puede requerir ingresar el código fuente HTML o verificar la URL.',
      });
    }

    const response: ExtractionResponse = {
      success: true,
      product,
      needsHtmlPaste,
    };

    return res.status(200).json(response);
  } catch (err: any) {
    console.error('Vercel API Extraction error:', err);
    return res.status(500).json({
      success: false,
      error: 'Error interno al procesar la ficha del producto.',
      details: err.message,
    });
  }
}
