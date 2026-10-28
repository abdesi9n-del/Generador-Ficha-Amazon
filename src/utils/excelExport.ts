import * as XLSX from 'xlsx';
import { ExtractedProduct } from '../types/product';

export function exportProductsToExcel(products: ExtractedProduct[], fileName: string = 'fichas_de_productos.xlsx') {
  if (!products || products.length === 0) return;

  const workbook = XLSX.utils.book_new();

  // Sheet 1: General Product Catalog
  const catalogData = products.map((p, idx) => ({
    'N°': idx + 1,
    'Marketplace': p.marketplace,
    'SKU / ASIN / MLM': p.sku,
    'Título del Producto': p.title,
    'Marca': p.brand,
    'Modelo': p.model,
    'Precio Actual (MXN)': p.currentPrice,
    'Precio Original (MXN)': p.originalPrice || '',
    'Descuento (%)': p.discountPercent ? `${p.discountPercent}%` : '',
    'Moneda': p.currency,
    'Condición': p.condition,
    'Disponibilidad': p.availability,
    'Vendedor': p.seller || 'N/A',
    'Calificación': p.rating ? `${p.rating} / 5` : '',
    'Total Reseñas': p.reviewsCount || '',
    'Foto Principal': p.mainImage,
    'Total Fotos': p.images.length,
    'Enlace al Producto': p.url,
    'Fecha de Extracción': new Date(p.extractedAt).toLocaleString('es-MX'),
    'Resumen / Viñetas': p.highlights.join(' | '),
  }));

  const catalogSheet = XLSX.utils.json_to_sheet(catalogData);
  catalogSheet['!cols'] = [
    { wch: 5 },  // N°
    { wch: 22 }, // Marketplace
    { wch: 18 }, // SKU
    { wch: 45 }, // Título
    { wch: 18 }, // Marca
    { wch: 18 }, // Modelo
    { wch: 18 }, // Precio Actual
    { wch: 18 }, // Precio Original
    { wch: 14 }, // Descuento
    { wch: 10 }, // Moneda
    { wch: 14 }, // Condición
    { wch: 20 }, // Disponibilidad
    { wch: 20 }, // Vendedor
    { wch: 14 }, // Calificación
    { wch: 14 }, // Reseñas
    { wch: 40 }, // Foto Principal
    { wch: 12 }, // Total Fotos
    { wch: 40 }, // Enlace
    { wch: 22 }, // Fecha
    { wch: 50 }, // Resumen
  ];
  XLSX.utils.book_append_sheet(workbook, catalogSheet, 'Catálogo');

  // Sheet 2: Detailed Technical Specifications (Specs Table)
  const specsRows: Array<{
    'SKU / ASIN': string;
    'Producto': string;
    'Categoría': string;
    'Especificación / Atributo': string;
    'Valor': string;
  }> = [];

  products.forEach(p => {
    p.technicalSpecs.forEach(s => {
      specsRows.push({
        'SKU / ASIN': p.sku,
        'Producto': p.title,
        'Categoría': s.category || 'Especificaciones',
        'Especificación / Atributo': s.name,
        'Valor': s.value,
      });
    });
  });

  if (specsRows.length > 0) {
    const specsSheet = XLSX.utils.json_to_sheet(specsRows);
    specsSheet['!cols'] = [
      { wch: 18 },
      { wch: 40 },
      { wch: 25 },
      { wch: 25 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(workbook, specsSheet, 'Datos Técnicos');
  }

  // Sheet 3: High-Res Image Links
  const imageRows: Array<{
    'SKU / ASIN': string;
    'Producto': string;
    'Foto N°': number;
    'URL Imagen Alta Resolución': string;
  }> = [];

  products.forEach(p => {
    p.images.forEach((imgUrl, i) => {
      imageRows.push({
        'SKU / ASIN': p.sku,
        'Producto': p.title,
        'Foto N°': i + 1,
        'URL Imagen Alta Resolución': imgUrl,
      });
    });
  });

  if (imageRows.length > 0) {
    const imagesSheet = XLSX.utils.json_to_sheet(imageRows);
    imagesSheet['!cols'] = [
      { wch: 18 },
      { wch: 40 },
      { wch: 10 },
      { wch: 60 },
    ];
    XLSX.utils.book_append_sheet(workbook, imagesSheet, 'Fotos HD');
  }

  // Generate file and trigger download
  XLSX.writeFile(workbook, fileName);
}

export function exportProductsToCsv(products: ExtractedProduct[], fileName: string = 'fichas_productos.csv') {
  if (!products || products.length === 0) return;

  const headers = [
    'Marketplace',
    'SKU',
    'Título',
    'Marca',
    'Modelo',
    'Precio_Actual_MXN',
    'Precio_Original_MXN',
    'Descuento_Porcentaje',
    'Disponibilidad',
    'URL_Foto_Principal',
    'Total_Fotos',
    'URL_Producto',
    'Especificaciones_Principales',
  ];

  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const clean = String(str).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = products.map(p => {
    const specsSummary = p.technicalSpecs.map(s => `${s.name}: ${s.value}`).slice(0, 8).join(' | ');
    return [
      escapeCsv(p.marketplace),
      escapeCsv(p.sku),
      escapeCsv(p.title),
      escapeCsv(p.brand),
      escapeCsv(p.model),
      p.currentPrice,
      p.originalPrice || '',
      p.discountPercent || '',
      escapeCsv(p.availability),
      escapeCsv(p.mainImage),
      p.images.length,
      escapeCsv(p.url),
      escapeCsv(specsSummary),
    ].join(',');
  });

  // Include UTF-8 BOM (\uFEFF) for proper Spanish character rendering in Microsoft Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
