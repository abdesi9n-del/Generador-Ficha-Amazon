export interface ProductSpec {
  category?: string;
  name: string;
  value: string;
}

export interface ExtractedProduct {
  id: string;
  url: string;
  marketplace: 'Amazon México' | 'Mercado Libre México' | 'Otro';
  sku: string; // ASIN or MLM ID
  title: string;
  brand: string;
  model: string;
  currentPrice: number;
  originalPrice: number | null;
  currency: string;
  discountPercent: number | null;
  rating: number | null;
  reviewsCount: number | null;
  availability: string;
  seller: string | null;
  condition: string;
  mainImage: string;
  images: string[];
  highlights: string[];
  description: string;
  technicalSpecs: ProductSpec[];
  extractedAt: string;
  sourceType: 'auto' | 'html-paste' | 'gemini-fallback';
}

export interface ExtractionResponse {
  success: boolean;
  product?: ExtractedProduct;
  error?: string;
  details?: string;
  needsHtmlPaste?: boolean;
}

export interface BrandingConfig {
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  logoPosition: 'left' | 'right';
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  accentColor: string;
  footerNote?: string;
}

