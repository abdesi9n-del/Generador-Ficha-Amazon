import * as cheerio from 'cheerio';
import { ExtractedProduct, ProductSpec } from '../../src/types/product';
import { isExcludedTechnicalSpec } from './aiEnricher';

export function extractAmazonAsin(url: string): string | null {
  const asinRegexes = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i,
    /[?&]asin=([A-Z0-9]{10})/i,
  ];

  for (const regex of asinRegexes) {
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  // Fallback check for 10-char alphanumeric ending
  const genericMatch = url.match(/\b([B0-9][A-Z0-9]{9})\b/i);
  if (genericMatch) {
    return genericMatch[1].toUpperCase();
  }

  return null;
}

export async function resolveAmazonShortUrl(url: string): Promise<string> {
  if (url.includes('a.co/') || url.includes('amzn.to/')) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });
      return res.url || url;
    } catch {
      return url;
    }
  }
  return url;
}

export function cleanAmazonImageUrl(imgUrl: string): string {
  if (!imgUrl) return '';
  // Remove sizing tokens like ._AC_SX679_ or ._AC_SL1500_ to get full resolution
  // Example: https://m.media-amazon.com/images/I/71xyz._AC_SL1500_.jpg -> https://m.media-amazon.com/images/I/71xyz._AC_SL1500_.jpg
  // If it's a small thumbnail, upgrade to SL1500
  if (imgUrl.includes('._') && !imgUrl.includes('_SL1500_')) {
    return imgUrl.replace(/\._[A-Z0-9_,]+_\./i, '._AC_SL1500_.');
  }
  return imgUrl;
}

export function extractImagesFromAmazonHtml(html: string): string[] {
  const imagesSet = new Set<string>();

  // 1. Look for colorImages JSON object
  try {
    const colorImagesMatch = html.match(/'colorImages':\s*\{\s*'initial':\s*(\[.*?\])\s*\},/s) ||
                             html.match(/"colorImages":\s*\{\s*"initial":\s*(\[.*?\])\s*\},/s);
    if (colorImagesMatch && colorImagesMatch[1]) {
      const parsed = JSON.parse(colorImagesMatch[1]);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          if (item.hiRes) imagesSet.add(cleanAmazonImageUrl(item.hiRes));
          else if (item.large) imagesSet.add(cleanAmazonImageUrl(item.large));
          else if (item.main && item.main[0]) imagesSet.add(cleanAmazonImageUrl(item.main[0]));
        });
      }
    }
  } catch {
    // ignore json parse error
  }

  // 2. Look for data-a-dynamic-image
  try {
    const dynamicRegex = /data-a-dynamic-image="([^"]+)"/g;
    let match;
    while ((match = dynamicRegex.exec(html)) !== null) {
      try {
        const decoded = match[1].replace(/&quot;/g, '"');
        const imgObj = JSON.parse(decoded);
        Object.keys(imgObj).forEach(key => {
          if (key && key.startsWith('http')) {
            imagesSet.add(cleanAmazonImageUrl(key));
          }
        });
      } catch {
        // continue
      }
    }
  } catch {
    // continue
  }

  // 3. Fallback: Cheerio DOM query
  const $ = cheerio.load(html);
  $('#main-image, #landingImage, #imgBlkFront, .a-dynamic-image, #altImages img').each((_, el) => {
    const src = $(el).attr('data-old-hires') || $(el).attr('src');
    if (src && src.includes('media-amazon.com')) {
      imagesSet.add(cleanAmazonImageUrl(src));
    }
  });

  return Array.from(imagesSet).filter(Boolean);
}

export async function extractAmazonProduct(url: string, rawHtml?: string): Promise<{ product: ExtractedProduct | null; isBlocked?: boolean }> {
  let resolvedUrl = await resolveAmazonShortUrl(url);
  const asin = extractAmazonAsin(resolvedUrl) || 'B000000000';

  let html = rawHtml || '';
  let isBlocked = false;

  if (!html) {
    try {
      const response = await fetch(resolvedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-MX,es;q=0.9,en-US;q=0.8',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      html = await response.text();
      if (response.status === 503 || html.includes('Robot Check') || html.includes('api-services-support@amazon.com') || html.includes('Type the characters you see in this image')) {
        isBlocked = true;
      }
    } catch (e) {
      console.warn('Direct Amazon fetch failed:', e);
      isBlocked = true;
    }
  }

  // If blocked and no raw HTML was provided, return blocked flag so AI fallback or HTML paste can step in
  if (isBlocked && !rawHtml) {
    return { product: null, isBlocked: true };
  }

  const $ = cheerio.load(html || '<div></div>');

  // Title
  const title = $('#productTitle').text().trim() ||
    $('#title').text().trim() ||
    $('meta[name="title"]').attr('content')?.trim() ||
    $('title').text().replace(/Amazon\.com\.mx.*$/i, '').trim();

  // Price
  let currentPrice = 0;
  let originalPrice: number | null = null;
  const currency = 'MXN';

  const priceSelectors = [
    '#corePrice_feature_div .a-price .a-offscreen',
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.apexPriceToPay .a-offscreen',
    '.a-price .a-offscreen',
  ];

  for (const selector of priceSelectors) {
    const text = $(selector).first().text().replace(/[$,\s]/g, '').trim();
    if (text) {
      const parsed = parseFloat(text);
      if (!isNaN(parsed) && parsed > 0) {
        currentPrice = parsed;
        break;
      }
    }
  }

  // Original list price
  const listPriceSelectors = [
    '#basisPrice .a-offscreen',
    '.basisPrice .a-offscreen',
    '.a-text-price .a-offscreen',
    '#priceblock_ourprice_row .a-text-strike',
  ];

  for (const selector of listPriceSelectors) {
    const text = $(selector).first().text().replace(/[$,\s]/g, '').trim();
    if (text) {
      const parsed = parseFloat(text);
      if (!isNaN(parsed) && parsed > currentPrice) {
        originalPrice = parsed;
        break;
      }
    }
  }

  // Discount
  let discountPercent: number | null = null;
  const discountText = $('.savingsPercentage, .savingPriceOverride').first().text().replace(/[-%\s]/g, '').trim();
  if (discountText) {
    discountPercent = parseInt(discountText, 10) || null;
  } else if (originalPrice && currentPrice && originalPrice > currentPrice) {
    discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  // Images
  const images = extractImagesFromAmazonHtml(html);
  const mainImage = images[0] || $('#landingImage').attr('src') || $('meta[property="og:image"]').attr('content') || '';

  // Brand & Model
  let brand = $('#bylineInfo').text().replace(/Marca:\s*|Visita la tienda de\s*/i, '').trim();
  let model = '';

  // Bullets / Highlights
  const highlights: string[] = [];
  $('#feature-bullets li span.a-list-item').each((_, el) => {
    const text = $(el).text().trim();
    if (text && !highlights.includes(text) && !text.startsWith('Para más información')) {
      highlights.push(text);
    }
  });

  // Technical Specs
  const technicalSpecs: ProductSpec[] = [];

  // Table specs 1: #productDetails_techSpec_section_1
  $('#productDetails_techSpec_section_1 tr, #technicalSpecifications_section_1 tr, .prodDetTable tr').each((_, row) => {
    const name = $(row).find('th').text().trim();
    const value = $(row).find('td').text().trim();
    if (name && value) {
      if (name.toLowerCase().includes('marca') && !brand) brand = value;
      if (name.toLowerCase().includes('modelo') && !model) model = value;

      if (!isExcludedTechnicalSpec(name)) {
        technicalSpecs.push({
          category: 'Especificaciones Técnicas',
          name,
          value,
        });
      }
    }
  });

  // Table specs 2: Detail bullets (ASIN, Fabricante, Dimensiones)
  $('#detailBullets_feature_div li, #detailBulletsWrapper_feature_div li').each((_, el) => {
    const line = $(el).text().replace(/\s+/g, ' ').trim();
    const parts = line.split(':');
    if (parts.length >= 2) {
      const name = parts[0].replace(/[\u200E\u200F]/g, '').trim();
      const value = parts.slice(1).join(':').replace(/[\u200E\u200F]/g, '').trim();
      if (name && value) {
        if (name.toLowerCase().includes('marca') && !brand) brand = value;
        if (name.toLowerCase().includes('modelo') && !model) model = value;

        if (!isExcludedTechnicalSpec(name)) {
          technicalSpecs.push({
            category: 'Detalles del Producto',
            name,
            value,
          });
        }
      }
    }
  });

  // Brand/Model from overview table
  $('#productOverview_feature_div tr').each((_, row) => {
    const name = $(row).find('td.a-span3 span, th').text().trim();
    const value = $(row).find('td.a-span9 span, td:last-child').text().trim();
    if (name && value) {
      if (name.toLowerCase().includes('marca') && !brand) brand = value;
      if (name.toLowerCase().includes('modelo') && !model) model = value;

      if (!isExcludedTechnicalSpec(name)) {
        technicalSpecs.push({
          category: 'Información General',
          name,
          value,
        });
      }
    }
  });

  // Description
  const description = $('#productDescription p').text().trim() ||
    $('#productDescription').text().trim() ||
    $('#aplus').text().replace(/\s+/g, ' ').trim() ||
    highlights.join('\n\n');

  // Rating & Reviews
  let rating: number | null = null;
  const ratingText = $('.a-icon-alt').first().text().match(/([0-9.]+)\s*de\s*5/i);
  if (ratingText && ratingText[1]) {
    rating = parseFloat(ratingText[1]) || null;
  }

  let reviewsCount: number | null = null;
  const reviewsText = $('#acrCustomerReviewText').first().text().replace(/[^0-9]/g, '');
  if (reviewsText) {
    reviewsCount = parseInt(reviewsText, 10) || null;
  }

  // Availability & Seller
  const availability = $('#availability span').first().text().trim() || 'Disponible en Amazon México';
  const seller = $('#merchant-info').text().trim() || 'Amazon México';

  return {
    product: {
      id: `amz-${asin}-${Date.now()}`,
      url: resolvedUrl,
      marketplace: 'Amazon México',
      sku: asin,
      title: title || `Producto Amazon México (ASIN: ${asin})`,
      brand: brand || 'Amazon',
      model: model || 'N/A',
      currentPrice,
      originalPrice,
      currency,
      discountPercent,
      rating,
      reviewsCount,
      availability,
      seller,
      condition: 'Nuevo',
      mainImage: mainImage || images[0] || '',
      images: images.length > 0 ? images : (mainImage ? [mainImage] : []),
      highlights,
      description: description || 'Sin descripción detallada disponible.',
      technicalSpecs,
      extractedAt: new Date().toISOString(),
      sourceType: rawHtml ? 'html-paste' : 'auto',
    },
    isBlocked: false,
  };
}
