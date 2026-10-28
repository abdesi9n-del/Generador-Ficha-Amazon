import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  Building2,
  Phone,
  Mail,
  Globe,
  Upload,
  ShieldCheck,
  Loader2,
  FileText,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { ExtractedProduct, BrandingConfig } from '../types/product';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';

interface PrintSheetModalProps {
  product: ExtractedProduct | null;
  branding: BrandingConfig;
  onOpenBrandingSettings: () => void;
  onClose: () => void;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  product,
  branding,
  onOpenBrandingSettings,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedFullText, setCopiedFullText] = useState(false);

  if (!product) return null;

  const handleCopyFullSheetText = () => {
    if (!product) return;
    const specsText = allSpecs.map(s => `• [${s.category || 'General'}] ${s.name}: ${s.value}`).join('\n');
    const highlightsText = (product.highlights || []).map((h, i) => `${i + 1}. ${h}`).join('\n');

    const fullText = [
      `========================================`,
      `FICHA TÉCNICA OFICIAL (CARTA) - AMAZON MÉXICO`,
      branding.companyName ? `Empresa: ${branding.companyName}` : null,
      `========================================`,
      `Título: ${product.title}`,
      `Marca: ${product.brand}`,
      product.model && product.model !== 'N/A' ? `Modelo: ${product.model}` : null,
      `SKU / ASIN: ${product.sku}`,
      `Precio Actual: $${product.currentPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${product.currency}`,
      product.condition ? `Condición: ${product.condition}` : null,
      `Enlace: ${product.url}`,
      ``,
      `--- PUNTOS CLAVE ---`,
      highlightsText,
      ``,
      `--- DATOS TÉCNICOS Y ESPECIFICACIONES ---`,
      specsText,
      ``,
      `--- DESCRIPCIÓN DETALLADA ---`,
      product.description || '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(fullText);
    setCopiedFullText(true);
    setTimeout(() => setCopiedFullText(false), 2000);
  };

  const accentColor = branding.accentColor || '#4f46e5';
  const logoOnLeft = branding.logoPosition !== 'right';

  // Route images through proxy to prevent cross-origin canvas security exceptions
  const getProxiedImgUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('/api/')) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  };

  // Group specs by category
  const categorizedSpecs = product.technicalSpecs.reduce<Record<string, typeof product.technicalSpecs>>((acc, spec) => {
    const cat = spec.category || 'Especificaciones Generales';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(spec);
    return acc;
  }, {});

  const isExcludedSpec = (name: string) => {
    if (!name) return true;
    const lower = name.toLowerCase().trim();
    return (
      lower.includes('opinión media de los clientes') ||
      lower.includes('opinion media de los clientes') ||
      lower.includes('opinión de los clientes') ||
      lower.includes('opinion de los clientes') ||
      lower.includes('calificación de los clientes') ||
      lower.includes('calificacion de los clientes') ||
      lower.includes('reseñas') ||
      lower.includes('customer reviews') ||
      lower.includes('clasificación en los más vendidos') ||
      lower.includes('clasificacion en los mas vendidos')
    );
  };

  // Filter out customer review and ranking rows from specifications
  const allSpecs = product.technicalSpecs.filter(s => !isExcludedSpec(s.name));
  const SPECS_PER_PAGE = 14;
  const specsPages: (typeof product.technicalSpecs)[] = [];

  if (allSpecs.length <= SPECS_PER_PAGE) {
    specsPages.push(allSpecs);
  } else {
    for (let i = 0; i < allSpecs.length; i += SPECS_PER_PAGE) {
      specsPages.push(allSpecs.slice(i, i + SPECS_PER_PAGE));
    }
  }

  const totalPages = 1 + specsPages.length; // Page 1 = Commercial, Page 2..N = Specs

  // Direct download multi-page Carta PDF using html-to-image & jsPDF
  const handleDownloadDirectPdf = async () => {
    if (!containerRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const container = containerRef.current;

      // Ensure all images are loaded before generating PDF
      const imgElements = container.querySelectorAll('img');
      await Promise.all(
        Array.from(imgElements).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
            setTimeout(() => resolve(true), 1500);
          });
        })
      );

      // Create jsPDF instance in US Letter size (215.9 x 279.4 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter', // 215.9 x 279.4 mm
        compress: true,
      });

      const pageElements = container.querySelectorAll('.letter-page');

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i] as HTMLElement;

        const imgData = await toJpeg(pageEl, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          skipFonts: true,
          cacheBust: false,
        });

        if (i > 0) {
          pdf.addPage('letter', 'portrait');
        }

        // Exact US Letter dimensions: 215.9mm width x 279.4mm height
        pdf.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4, undefined, 'FAST');
      }

      const cleanSku = product.sku.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `ficha_tecnica_${cleanSku}_carta.pdf`;

      // Blob URL download
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch (err) {
      console.error('Error generating direct Letter PDF:', err);
      // Fallback seamlessly to native browser print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-slate-200/90 rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden print:shadow-none print:max-w-none print:p-0 print:max-h-none print:border-none print:bg-white">
        
        {/* Top Control Bar (Hidden when printing or exporting) */}
        <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Ficha Técnica Comercial (Formato Carta Multi-Página)</span>
            </span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold border border-indigo-200/60">
              {totalPages} Páginas Carta
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Customize Logo & Branding button */}
            <button
              onClick={onOpenBrandingSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Cambiar el logo de la esquina superior y los datos de tu empresa"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {branding.logoUrl ? 'Editar Logo / Datos' : '+ Colocar Logo en Esquina'}
              </span>
            </button>

            {/* Direct PDF Download button */}
            <button
              onClick={handleDownloadDirectPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
              title="Descargar archivo PDF en tamaño Carta de múltiples páginas"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando PDF Carta...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Ficha PDF (.pdf)</span>
                </>
              )}
            </button>

            {/* Copy full sheet text button */}
            <button
              onClick={handleCopyFullSheetText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
              title="Copiar todo el contenido de la ficha de producto al portapapeles"
            >
              {copiedFullText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            {/* Native Print button */}
            <button
              onClick={handleNativePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              title="Abrir diálogo de impresión o Guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container with Multi-Page Letter Sheets */}
        <div ref={containerRef} className="overflow-y-auto p-4 sm:p-8 flex flex-col items-center gap-8 print:p-0 print:gap-0 print:overflow-visible">
          
          {/* ========================================================
              PAGE 1: COMMERCIAL SUMMARY, PHOTOS & HIGHLIGHTS
              ======================================================== */}
          <div
            className="letter-page w-full max-w-[816px] bg-white shadow-xl print:shadow-none p-8 sm:p-10 border border-slate-200 print:border-none flex flex-col justify-between"
            style={{ width: '816px', minHeight: '1056px', boxSizing: 'border-box' }}
          >
            <div>
              {/* Top Accent Color Line */}
              <div
                className="h-2.5 w-full rounded-full mb-6 print:mb-4"
                style={{ backgroundColor: accentColor }}
              />

              {/* HEADER: Corporate Logo & Company Info */}
              <header className="pb-5 border-b border-slate-200">
                <div
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    logoOnLeft ? '' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* LOGO IN TOP CORNER (User can place logo here) */}
                  <div className="shrink-0">
                    {branding.logoUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={getProxiedImgUrl(branding.logoUrl)}
                          crossOrigin="anonymous"
                          alt="Logo Empresa"
                          className="h-14 sm:h-16 w-auto max-w-[210px] object-contain"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={onOpenBrandingSettings}
                        className="h-14 px-4 bg-slate-50 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer print:border-slate-300"
                      >
                        <Upload className="w-4 h-4" />
                        <div className="text-left">
                          <span className="block text-xs font-bold leading-tight">
                            Colocar Logo en Esquina
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            (Clic para subir imagen)
                          </span>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* COMPANY INFORMATION & DOCUMENT TITLE */}
                  <div className={`space-y-1 ${logoOnLeft ? 'sm:text-right' : 'sm:text-left'}`}>
                    <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      FICHA TÉCNICA Y COMERCIAL
                    </div>

                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {branding.companyName || 'Catálogo Oficial de Productos'}
                    </h2>

                    {branding.tagline && (
                      <p className="text-xs text-slate-500 font-medium">
                        {branding.tagline}
                      </p>
                    )}

                    <div
                      className={`flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1 font-medium ${
                        logoOnLeft ? 'sm:justify-end' : 'sm:justify-start'
                      }`}
                    >
                      {branding.contactPhone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {branding.contactPhone}
                        </span>
                      )}
                      {branding.contactEmail && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {branding.contactEmail}
                        </span>
                      )}
                      {branding.website && (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Globe className="w-3 h-3 text-slate-400" />
                          {branding.website}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              {/* PRODUCT SUMMARY HERO */}
              <section className="py-6 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* PHOTO SECTION: Solo una foto de producto principal */}
                  <div className="md:col-span-5 space-y-3">
                    <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-center min-h-[320px] max-h-[380px] overflow-hidden shadow-xs">
                      {product.mainImage ? (
                        <img
                          src={getProxiedImgUrl(product.mainImage)}
                          crossOrigin="anonymous"
                          alt={product.title}
                          className="max-h-[340px] w-auto max-w-full object-contain mx-auto"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs">Sin imagen principal</div>
                      )}

                      <div className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs font-semibold">
                        FOTO PRINCIPAL HD
                      </div>
                    </div>
                  </div>

                  {/* COMMERCIAL DETAILS & PRICE (7 cols) */}
                  <div className="md:col-span-7 space-y-4">
                    {/* Brand / SKU Meta Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="text-[11px] font-bold text-white px-2.5 py-0.5 rounded"
                        style={{ backgroundColor: accentColor }}
                      >
                        {product.brand}
                      </span>

                      <span className="text-[11px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        SKU: {product.sku}
                      </span>

                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-amber-50 text-amber-900 border-amber-300">
                        Amazon México
                      </span>

                      {product.condition && (
                        <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {product.condition}
                        </span>
                      )}
                    </div>

                    {/* Product Title */}
                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
                      {product.title}
                    </h1>

                    {/* COMMERCIAL PRICE BOX */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-xl border border-slate-200/90 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Precio Actual Vigente
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900">
                            ${product.currentPrice.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            {product.currency}
                          </span>
                        </div>

                        {product.originalPrice && product.originalPrice > product.currentPrice && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400 line-through">
                              Lista: ${product.originalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                            {product.discountPercent && (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                                -{product.discountPercent}% OFF
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-end gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{product.availability || 'En Existencia'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Vendido por: {product.seller || product.marketplace}
                        </div>
                      </div>
                    </div>

                    {/* Highlights Bullet Points */}
                    {product.highlights && product.highlights.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          Características y Ventajas Principales:
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {product.highlights.slice(0, 6).map((h, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span
                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                style={{ backgroundColor: accentColor }}
                              />
                              <span className="leading-relaxed">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* PAGE 1 FOOTER */}
            <footer className="pt-4 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
              <div>
                <p className="font-semibold text-slate-500">
                  {branding.footerNote ||
                    'Precios e inventario en pesos mexicanos sujetos a cambios sin previo aviso. Ficha generada con fines comerciales.'}
                </p>
                <p className="mt-0.5">
                  Emitido el {new Date(product.extractedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} • Folio: {product.sku}
                </p>
              </div>

              <div className="text-right flex items-center gap-2 shrink-0">
                <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                  Página 1 de {totalPages} • Resumen Comercial
                </span>
              </div>
            </footer>
          </div>

          {/* ========================================================
              PAGE 2 (and subsequent): TECHNICAL SPECIFICATIONS
              ======================================================== */}
          {specsPages.map((pageSpecs, pageIdx) => {
            const currentPageNum = 2 + pageIdx;
            return (
              <div
                key={pageIdx}
                className="letter-page w-full max-w-[816px] bg-white shadow-xl print:shadow-none p-8 sm:p-10 border border-slate-200 print:border-none flex flex-col justify-between"
                style={{ width: '816px', minHeight: '1056px', boxSizing: 'border-box' }}
              >
                <div>
                  {/* Top Accent Color Line */}
                  <div
                    className="h-2 w-full rounded-full mb-5 print:mb-4"
                    style={{ backgroundColor: accentColor }}
                  />

                  {/* Page 2 Header */}
                  <header className="pb-4 border-b border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {branding.logoUrl ? (
                        <img
                          src={getProxiedImgUrl(branding.logoUrl)}
                          crossOrigin="anonymous"
                          alt="Logo Empresa"
                          className="h-10 w-auto max-w-[150px] object-contain"
                        />
                      ) : (
                        <div className="font-bold text-slate-900 text-sm">
                          {branding.companyName || 'Catálogo de Productos'}
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          FICHA TÉCNICA DE ESPECIFICACIONES
                        </div>
                        <div className="text-xs font-bold text-slate-800 line-clamp-1 max-w-md">
                          {product.title}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">
                        SKU: {product.sku}
                      </span>
                    </div>
                  </header>

                  {/* Section Title */}
                  <div className="py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-xs"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span>Tabla Completa de Datos Técnicos</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {product.technicalSpecs.length} atributos técnicos
                    </span>
                  </div>

                  {/* TECHNICAL SPECIFICATIONS TABLE */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700">
                          <th className="py-2.5 px-3 w-1/4 font-bold text-[11px] uppercase">
                            Categoría
                          </th>
                          <th className="py-2.5 px-3 w-1/3 font-bold text-[11px] uppercase">
                            Atributo / Especificación
                          </th>
                          <th className="py-2.5 px-3 font-bold text-[11px] uppercase">
                            Detalle / Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pageSpecs.map((s, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                          >
                            <td className="py-2.5 px-3 text-slate-500 font-medium text-[11px]">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10.5px] font-semibold text-slate-700">
                                {s.category || 'General'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 text-[11.5px]">
                              {s.name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11.5px] text-slate-900 leading-relaxed">
                              {s.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PAGE 2+ FOOTER */}
                <footer className="pt-4 mt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
                  <div>
                    <p className="font-semibold text-slate-500">
                      {branding.footerNote ||
                        'Precios e inventario en pesos mexicanos sujetos a cambios sin previo aviso. Ficha generada con fines comerciales.'}
                    </p>
                    <p className="mt-0.5">
                      Emitido el {new Date(product.extractedAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} • Folio: {product.sku}
                    </p>
                  </div>

                  <div className="text-right flex items-center gap-2 shrink-0">
                    <span className="bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                      Página {currentPageNum} de {totalPages} • Datos Técnicos
                    </span>
                  </div>
                </footer>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
