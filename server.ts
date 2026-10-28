import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractAmazonProduct, extractAmazonAsin, resolveAmazonShortUrl } from './server/extractors/amazon';
import { extractAmazonWithAiSearch, organizeSpecsWithAi } from './server/extractors/aiEnricher';
import { ExtractedProduct, ExtractionResponse } from './src/types/product';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Product Extractor API' });
});

// Image Proxy to bypass CORS for client-side download & ZIP packaging
app.get('/api/proxy-image', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    };

    const response = await fetch(imageUrl, { headers: fetchHeaders });

    if (!response.ok) {
      // Fallback: 1x1 transparent PNG with HTTP 200 so html-to-image never fails on broken images
      const fallbackPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(fallbackPng);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Image proxy error:', error);
    const fallbackPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(fallbackPng);
  }
});

// Main Product Extraction endpoint
app.post('/api/extract', async (req: Request, res: Response) => {
  try {
    let { url, html, forceAi } = req.body;

    if (!url && !html) {
      return res.status(400).json({ success: false, error: 'Se requiere una URL o código HTML del producto.' });
    }

    url = (url || '').trim();

    // Check for short URLs like a.co or amzn.to
    if (url.includes('a.co/') || url.includes('amzn.to/')) {
      url = await resolveAmazonShortUrl(url);
    }

    const isAmazon = url.includes('amazon.com') || (html && (html.includes('amazon.com') || html.includes('a-section')));
    const isMercadoLibre = url.includes('mercadolibre.com') || (html && (html.includes('mercadolibre') || html.includes('ui-pdp')));

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
        // Amazon anti-bot or direct scraping restricted; invoke Gemini AI enrichment fallback
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

    return res.json(response);
  } catch (err: any) {
    console.error('Extraction error:', err);
    return res.status(500).json({
      success: false,
      error: 'Error interno al procesar la ficha del producto.',
      details: err.message,
    });
  }
});

// AI Specs Organizer
app.post('/api/organize-specs', async (req: Request, res: Response) => {
  try {
    const { specs, description, title } = req.body;
    if (!specs || !title) {
      return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos.' });
    }

    const result = await organizeSpecsWithAi(specs, description || '', title);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Specs organization error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Product Extractor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
