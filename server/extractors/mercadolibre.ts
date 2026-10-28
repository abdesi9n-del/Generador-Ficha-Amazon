import * as cheerio from 'cheerio';
import { ExtractedProduct, ProductSpec } from '../../src/types/product';

export function extractMlmId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/MLM-?(\d+)/i) || url.match(/MLM-?(\d+)/i);
    if (match) {
      return `MLM${match[1]}`;
    }
  } catch {
    const match = url.match(/MLM-?(\d+)/i);
    if (match) return `MLM${match[1]}`;
  }
  return null;
}

export function extractTitleFromSlug(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    // Format: /MLM-12345678-slug-del-producto or /slug-del-producto/p/MLM...
    const match = pathname.match(/MLM-?\d+-([^/?#]+)/i) || pathname.match(/\/([^/?#]+)\/p\/MLM/i);
    if (match && match[1]) {
      const slug = decodeURIComponent(match[1]).replace(/[-_]/g, ' ').trim();
      return slug
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  } catch {
    // continue
  }
  return '';
}

export async function extractMercadoLibreProduct(
  url: string,
  rawHtml?: string
): Promise<{ product: ExtractedProduct | null; isBlocked?: boolean }> {
  const mlmId = extractMlmId(url) || '';
  const fallbackSlugTitle = extractTitleFromSlug(url);

  let html = rawHtml || '';
  let isBlocked = false;

  // 1. Fetch page HTML if not provided
  if (!html) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8',
          'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (response.url.includes('account-verification') || response.status === 403 || response.status === 302) {
        isBlocked = true;
      }

      html = await response.text();
      if (html.includes('account-verification') || html.includes('ui-empty-state__title')) {
        isBlocked = true;
      }
    } catch (e) {
      console.warn('Error fetching Mercado Libre HTML:', e);
      isBlocked = true;
    }
  }

  // If blocked and no raw HTML was provided, return base product with isBlocked flag so client can prompt for HTML
  if (isBlocked && !rawHtml) {
    if (fallbackSlugTitle || mlmId) {
      const detectedBrand = fallbackSlugTitle
        ? fallbackSlugTitle.split(' ')[0]
        : 'Mercado Libre';

      const partialProduct: ExtractedProduct = {
        id: `mlm-${mlmId || Date.now()}`,
        url,
        marketplace: 'Mercado Libre México',
        sku: mlmId || 'MLM-MX',
        title: fallbackSlugTitle || `Publicación Mercado Libre (${mlmId})`,
        brand: detectedBrand,
        model: 'N/A',
        currentPrice: 0,
        originalPrice: null,
        currency: 'MXN',
        discountPercent: null,
        rating: 4.8,
        reviewsCount: null,
        availability: 'Disponible en Mercado Libre México',
        seller: 'Mercado Libre México',
        condition: 'Nuevo',
        mainImage: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadolibre/logo__small@2x.png',
        images: [],
        highlights: [
          `Publicación detectada: ${fallbackSlugTitle || mlmId}`,
          'Para importar las fotos en resolución original (-O.webp) y todas las especificaciones técnicas, copia y pega el código HTML (Ctrl+U).',
        ],
        description: `Ficha técnica detectada para ${fallbackSlugTitle || mlmId} en Mercado Libre México.`,
        technicalSpecs: [
          { category: 'Identificadores', name: 'Código de Publicación', value: mlmId || 'MLM' },
          { category: 'Plataforma', name: 'Marketplace', value: 'Mercado Libre México' },
        ],
        extractedAt: new Date().toISOString(),
        sourceType: 'auto',
      };
      return { product: partialProduct, isBlocked: true };
    }
    return { product: null, isBlocked: true };
  }

  const $ = cheerio.load(html || '<div></div>');

  // Title extraction
  let title = $('h1.ui-pdp-title').text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    $('.ui-pdp-header__title').text().trim() ||
    $('title').text().replace(/\| Mercado Libre.*/i, '').trim();

  // If title is just generic "Mercado Libre", use the slug from URL
  if (!title || title.toLowerCase() === 'mercado libre' || title.includes('Acceso | Mercado Libre')) {
    title = fallbackSlugTitle || 'Producto de Mercado Libre México';
  }

  // Price extraction
  let currentPrice = 0;
  let originalPrice: number | null = null;
  const currency = 'MXN';

  // Current price
  const fractionElem = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first();
  const genericFractionElem = $('.andes-money-amount__fraction').first();

  let fractionText = fractionElem.length > 0 ? fractionElem.text().trim() : genericFractionElem.text().trim();
  // Remove dots and commas used as thousands separators in Mexico
  const cleanFraction = fractionText.replace(/[,.\s]/g, '');

  const centsText = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text().trim();
  if (cleanFraction) {
    currentPrice = parseFloat(centsText ? `${cleanFraction}.${centsText}` : cleanFraction) || 0;
  }

  // Original list price
  const origFractionText = $('.ui-pdp-price__original-value .andes-money-amount__fraction').first().text().trim();
  const cleanOrig = origFractionText.replace(/[,.\s]/g, '');
  if (cleanOrig) {
    const parsed = parseFloat(cleanOrig);
    if (!isNaN(parsed) && parsed > currentPrice) {
      originalPrice = parsed;
    }
  }

  // Calculate discount
  let discountPercent: number | null = null;
  const discountText = $('.ui-pdp-price__second-line .ui-pdp-price__discount, .andes-money-amount__discount').first().text().replace(/[-%\s]/g, '').trim();
  if (discountText) {
    discountPercent = parseInt(discountText, 10) || null;
  } else if (originalPrice && currentPrice && originalPrice > currentPrice) {
    discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  // High-Res Image extraction
  const imagesSet = new Set<string>();

  // 1. Regex scan for all Mercado Libre CDN images in the HTML
  const mlImgRegex = /https:\/\/http2\.mlstatic\.com\/D_NQ_NP_[a-zA-Z0-9_.-]+-([A-Z])\.(webp|jpg|jpeg|png)/g;
  let match;
  while ((match = mlImgRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    // Upgrade to -O.webp (Original Maximum Resolution)
    const hd = fullMatch.replace(/-[A-Z]\.(webp|jpg|jpeg|png)/i, '-O.webp');
    imagesSet.add(hd);
  }

  // 2. DOM selectors for gallery
  $('img.ui-pdp-image, .ui-pdp-gallery__figure img, span.ui-pdp-gallery__item img, img.ui-pdp-gallery__image').each((_, el) => {
    const src = $(el).attr('data-zoom') || $(el).attr('data-src') || $(el).attr('src');
    if (src && src.includes('http2.mlstatic.com')) {
      const hd = src.replace(/-[A-Z]\.(jpg|jpeg|webp|png)/i, '-O.webp');
      imagesSet.add(hd);
    }
  });

  // 3. JSON-LD scripts
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const json = JSON.parse(content);
        if (json.image) {
          if (Array.isArray(json.image)) {
            json.image.forEach((img: string) => {
              imagesSet.add(img.replace(/-[A-Z]\.(jpg|jpeg|webp|png)/i, '-O.webp'));
            });
          } else if (typeof json.image === 'string') {
            imagesSet.add(json.image.replace(/-[A-Z]\.(jpg|jpeg|webp|png)/i, '-O.webp'));
          }
        }
        if (json.offers?.price && !currentPrice) {
          currentPrice = parseFloat(json.offers.price) || currentPrice;
        }
      }
    } catch {
      // ignore JSON parse error
    }
  });

  const images = Array.from(imagesSet).filter(Boolean);
  const mainImage = images[0] || $('meta[property="og:image"]').attr('content')?.replace(/-[A-Z]\.(jpg|jpeg|webp|png)/i, '-O.webp') || '';

  // Brand & Model
  let brand = '';
  let model = '';

  // Technical Specs
  const technicalSpecs: ProductSpec[] = [];

  $('.ui-pdp-specs__table tr, .ui-vpp-striped-specs__table tr, table.andes-table tr, .ui-pdp-specs__table__row').each((_, row) => {
    const name = $(row).find('th, .ui-pdp-specs__table__column--bold, td:first-child').text().trim();
    const value = $(row).find('td:last-child, .ui-pdp-specs__table__column:not(.ui-pdp-specs__table__column--bold)').text().trim();
    if (name && value && name !== value) {
      const exists = technicalSpecs.some(s => s.name.toLowerCase() === name.toLowerCase());
      if (!exists) {
        if (name.toLowerCase().includes('marca') && !brand) brand = value;
        if (name.toLowerCase().includes('modelo') && !model) model = value;

        technicalSpecs.push({
          category: 'Ficha Técnica',
          name,
          value,
        });
      }
    }
  });

  // If brand is not found, try meta tags or first word of title
  if (!brand) {
    const brandMeta = $('meta[itemprop="brand"]').attr('content');
    if (brandMeta) brand = brandMeta;
    else if (title) brand = title.split(' ')[0];
  }

  // Description
  const description = $('.ui-pdp-description__content').text().trim() ||
    $('p.ui-pdp-description__content').text().trim() ||
    $('meta[name="description"]').attr('content')?.trim() ||
    'Ficha técnica de Mercado Libre México.';

  // Highlights
  const highlights: string[] = [];
  $('.ui-pdp-features ul li, .ui-pdp-highlighted-specs__striped-specs li, .ui-vpp-highlighted-specs li').each((_, el) => {
    const text = $(el).text().trim();
    if (text && !highlights.includes(text)) {
      highlights.push(text);
    }
  });

  // If no highlights found, derive from specs
  if (highlights.length === 0 && technicalSpecs.length > 0) {
    technicalSpecs.slice(0, 5).forEach(s => {
      highlights.push(`${s.name}: ${s.value}`);
    });
  }

  // Rating & Reviews
  let rating: number | null = null;
  let reviewsCount: number | null = null;
  const ratingText = $('.ui-pdp-review__rating').first().text().trim();
  if (ratingText) {
    rating = parseFloat(ratingText) || null;
  }
  const reviewsText = $('.ui-pdp-review__amount').first().text().replace(/[()]/g, '').trim();
  if (reviewsText) {
    reviewsCount = parseInt(reviewsText, 10) || null;
  }

  // Seller & Condition
  const seller = $('.ui-pdp-seller__link-trigger, .ui-seller-info a').first().text().trim() || 'Mercado Libre México';
  const condition = 'Nuevo';
  const availability = 'Disponible en Mercado Libre';

  // Validation: if no title or price found and no images, mark as blocked
  if (currentPrice === 0 && images.length === 0 && !rawHtml) {
    return { product: null, isBlocked: true };
  }

  return {
    product: {
      id: `mlm-${mlmId || Date.now()}`,
      url,
      marketplace: 'Mercado Libre México',
      sku: mlmId || 'MLM-MX',
      title: title || fallbackSlugTitle || 'Producto Mercado Libre México',
      brand: brand || 'Mercado Libre',
      model: model || 'N/A',
      currentPrice: currentPrice || 0,
      originalPrice,
      currency,
      discountPercent,
      rating,
      reviewsCount,
      availability,
      seller,
      condition,
      mainImage: mainImage || images[0] || '',
      images: images.length > 0 ? images : (mainImage ? [mainImage] : []),
      highlights,
      description,
      technicalSpecs,
      extractedAt: new Date().toISOString(),
      sourceType: rawHtml ? 'html-paste' : 'auto',
    },
    isBlocked: false,
  };
}
