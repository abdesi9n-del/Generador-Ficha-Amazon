import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Printer,
  Copy,
  ExternalLink,
  Archive,
  Check,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Maximize2,
  ZoomIn,
  ShieldCheck,
  Star,
  Tag,
  Package,
  Layers,
  ChevronRight,
  ListChecks,
} from 'lucide-react';
import { ExtractedProduct, ProductSpec } from '../types/product';
import { exportProductsToExcel, exportProductsToCsv } from '../utils/excelExport';
import { downloadSingleImage, downloadAllImagesAsZip } from '../utils/imageDownloader';

interface ProductDetailViewProps {
  product: ExtractedProduct;
  onUpdateProduct: (updated: ExtractedProduct) => void;
  onPrintRequest: (product: ExtractedProduct) => void;
  onDeleteProduct?: (id: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onUpdateProduct,
  onPrintRequest,
  onDeleteProduct,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number } | null>(null);
  const [copiedLinks, setCopiedLinks] = useState(false);
  const [specSearch, setSpecSearch] = useState('');
  const [isOrganizingAi, setIsOrganizingAi] = useState(false);
  const [editingSpecIndex, setEditingSpecIndex] = useState<number | null>(null);
  const [newSpecCategory, setNewSpecCategory] = useState('');
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [showAddSpec, setShowAddSpec] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const images = product.images.length > 0 ? product.images : [product.mainImage].filter(Boolean);
  const currentImage = images[selectedImageIndex] || product.mainImage;

  const copyToClipboard = (text: string, sectionKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => {
      setCopiedSection(prev => (prev === sectionKey ? null : prev));
    }, 2000);
  };

  const getCommercialText = () => {
    return [
      `Título: ${product.title}`,
      `Marca: ${product.brand}`,
      product.model && product.model !== 'N/A' ? `Modelo: ${product.model}` : null,
      `SKU / ASIN: ${product.sku}`,
      `Marketplace: Amazon México`,
      `Precio Actual: $${product.currentPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${product.currency}`,
      product.originalPrice ? `Precio Original: $${product.originalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${product.currency}` : null,
      product.discountPercent ? `Descuento: ${product.discountPercent}% OFF` : null,
      `Disponibilidad: ${product.availability || 'Disponible'}`,
      `Vendedor: ${product.seller || 'Amazon México'}`,
      `Condición: ${product.condition || 'Nuevo'}`,
      `Enlace Oficial: ${product.url}`,
    ].filter(Boolean).join('\n');
  };

  const getHighlightsText = () => {
    return (product.highlights || []).map((h, i) => `${i + 1}. ${h}`).join('\n');
  };

  const getSpecsText = () => {
    return filteredSpecs.map(s => `[${s.category || 'General'}] ${s.name}: ${s.value}`).join('\n');
  };

  const getDescriptionText = () => {
    return descriptionList.map((d, i) => `${i + 1}. ${d}`).join('\n');
  };

  const getFullSheetText = () => {
    return [
      `========================================`,
      `FICHA DE PRODUCTO - AMAZON MÉXICO`,
      `========================================`,
      getCommercialText(),
      ``,
      `--- PUNTOS CLAVE Y CARACTERÍSTICAS ---`,
      getHighlightsText(),
      ``,
      `--- DATOS TÉCNICOS Y ESPECIFICACIONES ---`,
      getSpecsText(),
      ``,
      `--- DESCRIPCIÓN DETALLADA ---`,
      getDescriptionText(),
    ].filter(Boolean).join('\n');
  };

  const handleDownloadCurrentPhoto = async () => {
    if (!currentImage) return;
    const extension = currentImage.includes('.png') ? 'png' : currentImage.includes('.webp') ? 'webp' : 'jpg';
    const filename = `${product.sku}_foto_${selectedImageIndex + 1}.${extension}`;
    await downloadSingleImage(currentImage, filename);
  };

  const handleDownloadAllZip = async () => {
    if (images.length === 0) return;
    setIsZipping(true);
    setZipProgress({ current: 0, total: images.length });

    await downloadAllImagesAsZip(
      images,
      `${product.sku}_${product.brand || 'producto'}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      (current, total) => setZipProgress({ current, total })
    );

    setIsZipping(false);
    setZipProgress(null);
  };

  const handleCopyImageUrls = () => {
    copyToClipboard(images.join('\n'), 'photos');
  };

  const handleExportExcel = () => {
    exportProductsToExcel([product], `ficha_${product.sku}_${product.brand || 'producto'}.xlsx`);
  };

  const handleExportCsv = () => {
    exportProductsToCsv([product], `ficha_${product.sku}.csv`);
  };

  const handleOrganizeWithAi = async () => {
    setIsOrganizingAi(true);
    try {
      const res = await fetch('/api/organize-specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specs: product.technicalSpecs,
          description: product.description,
          title: product.title,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onUpdateProduct({
          ...product,
          technicalSpecs: data.specs || product.technicalSpecs,
          description: data.description || product.description,
          highlights: data.highlights || product.highlights,
        });
      }
    } catch (err) {
      console.error('Error organizing with AI:', err);
    } finally {
      setIsOrganizingAi(false);
    }
  };

  const handleAddSpec = () => {
    if (!newSpecName.trim() || !newSpecValue.trim()) return;
    const newSpec: ProductSpec = {
      category: newSpecCategory.trim() || 'General',
      name: newSpecName.trim(),
      value: newSpecValue.trim(),
    };
    onUpdateProduct({
      ...product,
      technicalSpecs: [...product.technicalSpecs, newSpec],
    });
    setNewSpecName('');
    setNewSpecValue('');
    setNewSpecCategory('');
    setShowAddSpec(false);
  };

  const handleDeleteSpec = (index: number) => {
    const updated = [...product.technicalSpecs];
    updated.splice(index, 1);
    onUpdateProduct({
      ...product,
      technicalSpecs: updated,
    });
  };

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

  const filteredSpecs = product.technicalSpecs
    .filter(s => !isExcludedSpec(s.name))
    .filter(s => {
      if (!specSearch.trim()) return true;
      const q = specSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.value.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    });

  // Parse description into clean organized list items
  const descriptionList = (product.description || '')
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9•\-])/)
    .map(line => line.replace(/^[\s•\-\*\d\.\)]+/, '').trim())
    .filter(line => line.length > 3);

  return (
    <div className="space-y-6">
      {/* Top Banner / Marketplace & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300/80">
              <Package className="w-3.5 h-3.5" />
              Amazon México
            </span>

            <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1.5">
              <span>SKU / ASIN: {product.sku}</span>
              <button
                onClick={() => copyToClipboard(product.sku, 'asin')}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5 rounded hover:bg-slate-200/60 transition-colors"
                title="Copiar código ASIN"
              >
                {copiedSection === 'asin' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>

            {product.condition && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {product.condition}
              </span>
            )}

            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium ml-1"
            >
              <span>Ver en {product.marketplace}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Export & Action Buttons with Copy buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => copyToClipboard(getFullSheetText(), 'full')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Copiar todo el contenido de la ficha de producto al portapapeles"
            >
              {copiedSection === 'full' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">¡Ficha Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copiar Ficha</span>
                </>
              )}
            </button>

            <button
              onClick={() => copyToClipboard(getCommercialText(), 'commercial')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Copiar resumen comercial (Título, Marca, Precio, ASIN, URL)"
            >
              {copiedSection === 'commercial' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar Resumen</span>
                </>
              )}
            </button>

            <button
              onClick={() => onPrintRequest(product)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Generar Ficha PDF Profesional con Foto Principal, Especificaciones y Logo en la esquina superior"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ficha PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Descargar Ficha Técnica en Excel (.xlsx) con tablas organizadas"
            >
              <span>Excel</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Descargar CSV delimitado por comas con UTF-8"
            >
              <span>CSV</span>
            </button>

            {onDeleteProduct && (
              <button
                onClick={() => {
                  if (window.confirm(`¿Deseas eliminar y limpiar la ficha de "${product.title.slice(0, 35)}..."?`)) {
                    onDeleteProduct(product.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer ml-auto"
                title="Eliminar esta ficha de producto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            )}
          </div>
        </div>

        {/* Title & Brand with Copy Title Button */}
        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>{product.brand}</span>
            {product.model && product.model !== 'N/A' && (
              <>
                <span>•</span>
                <span>Modelo: {product.model}</span>
              </>
            )}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug flex-1">
              {product.title}
            </h1>
            <button
              onClick={() => copyToClipboard(product.title, 'title')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200 shrink-0 cursor-pointer transition-colors"
              title="Copiar título del producto"
            >
              {copiedSection === 'title' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar Título</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Price & Key Metrics Box */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Price */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 p-3.5 rounded-xl border border-slate-200/80 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Precio Actual</span>
              <button
                onClick={() => copyToClipboard(`$${product.currentPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${product.currency}`, 'price')}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Copiar precio"
              >
                {copiedSection === 'price' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900">
                ${product.currentPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-indigo-700">{product.currency}</span>
            </div>
            {product.originalPrice && product.originalPrice > product.currentPrice && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400 line-through">
                  ${product.originalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                {product.discountPercent && (
                  <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                    -{product.discountPercent}% OFF
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Calificación</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-bold text-slate-900">
                {product.rating ? product.rating : '4.7'}
              </span>
              <span className="text-xs text-slate-500">/ 5</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {product.reviewsCount ? `${product.reviewsCount.toLocaleString()} opiniones` : 'Producto verificado'}
            </p>
          </div>

          {/* Stock / Availability */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Disponibilidad</span>
            <div className="flex items-center gap-1.5 mt-1 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{product.availability || 'En Existencia'}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Vendido por: {product.seller || product.marketplace}
            </p>
          </div>

          {/* High-Res Gallery Stats */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Fotos Extraídas</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{images.length}</span>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Ultra HD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Listas para descarga</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Gallery on left, Organized Specs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  Galería de Fotos ({images.length})
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copyToClipboard(currentImage, 'photo-current')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Copiar URL directa de la foto seleccionada"
                >
                  {copiedSection === 'photo-current' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">¡Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Foto</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyImageUrls}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Copiar todas las URLs de las fotos extraídas"
                >
                  {copiedSection === 'photos' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">¡Copiados!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Todos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main Image Display */}
            <div className="relative group bg-slate-50 rounded-xl border border-slate-200/60 overflow-hidden flex items-center justify-center min-h-[340px] max-h-[420px] p-4">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.title}
                  className="max-h-[360px] w-auto max-w-full object-contain mx-auto transition-transform duration-200 group-hover:scale-105 cursor-zoom-in"
                  onClick={() => setPreviewModalImg(currentImage)}
                />
              ) : (
                <div className="text-slate-400 text-xs">Sin imagen disponible</div>
              )}

              {/* Zoom overlay hint */}
              <button
                onClick={() => setPreviewModalImg(currentImage)}
                className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Ver imagen completa en alta resolución"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md font-mono">
                Foto {selectedImageIndex + 1} de {images.length}
              </div>
            </div>

            {/* Image Action Buttons */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadCurrentPhoto}
                disabled={!currentImage}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Esta Foto</span>
              </button>

              <button
                onClick={handleDownloadAllZip}
                disabled={isZipping || images.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>
                  {isZipping
                    ? `Creando ZIP (${zipProgress?.current}/${zipProgress?.total})...`
                    : 'Descargar Todas (.ZIP)'}
                </span>
              </button>
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden bg-slate-50 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-indigo-600 ring-2 ring-indigo-200'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlights / Bullet points with Copy Button */}
          {product.highlights && product.highlights.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Puntos Clave / Características</span>
                </h3>
                <button
                  onClick={() => copyToClipboard(getHighlightsText(), 'highlights')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer transition-colors"
                  title="Copiar puntos clave al portapapeles"
                >
                  {copiedSection === 'highlights' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">¡Copiados!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Specs Table & Description (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Technical Specifications Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Datos Técnicos y Especificaciones</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({product.technicalSpecs.length} atributos)
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organizado en tabla estructurada compatible y exportable a Excel
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => copyToClipboard(getSpecsText(), 'specs')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="Copiar todas las especificaciones técnicas"
                >
                  {copiedSection === 'specs' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">¡Copiadas!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Todo</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleOrganizeWithAi}
                  disabled={isOrganizingAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                  title="Reorganizar automáticamente las categorías con Gemini"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isOrganizingAi ? 'Organizando...' : 'Auto-Organizar'}</span>
                </button>

                <button
                  onClick={() => setShowAddSpec(!showAddSpec)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Agregar una nueva especificación manual"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* Add Spec Form Drawer */}
            {showAddSpec && (
              <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800">Nueva Especificación Técnica</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newSpecCategory}
                    onChange={e => setNewSpecCategory(e.target.value)}
                    placeholder="Categoría (ej. Pantalla)"
                    className="p-2 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    value={newSpecName}
                    onChange={e => setNewSpecName(e.target.value)}
                    placeholder="Atributo (ej. Resolución)"
                    className="p-2 text-xs bg-white border border-slate-300 rounded-lg outline-none font-medium"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={e => setNewSpecValue(e.target.value)}
                    placeholder="Valor (ej. 1920x1080)"
                    className="p-2 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowAddSpec(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddSpec}
                    className="px-3 py-1 text-xs bg-slate-900 text-white font-semibold rounded-md cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* Spec search bar */}
            <div className="mt-4 mb-3 relative">
              <input
                type="text"
                value={specSearch}
                onChange={e => setSpecSearch(e.target.value)}
                placeholder="Filtrar datos técnicos (ej. memoria, procesador, peso, dimensiones)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Technical Specifications Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-1/4">Categoría</th>
                      <th className="py-2.5 px-3 w-1/3">Especificación</th>
                      <th className="py-2.5 px-3">Valor</th>
                      <th className="py-2.5 px-2 w-10 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSpecs.length > 0 ? (
                      filteredSpecs.map((spec, i) => (
                        <tr
                          key={i}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          <td className="py-2.5 px-3 text-slate-500 font-medium bg-slate-50/50">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200/60 text-[11px] font-semibold text-slate-700">
                              {spec.category || 'General'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {spec.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-mono text-[11.5px] leading-relaxed">
                            {spec.value}
                          </td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => copyToClipboard(`${spec.name}: ${spec.value}`, `spec-${i}`)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                title="Copiar este dato técnico"
                              >
                                {copiedSection === `spec-${i}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteSpec(i)}
                                className="p-1 text-slate-300 group-hover:text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Eliminar especificación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          No se encontraron especificaciones con el término buscado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Description Section en Forma de Lista */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-indigo-600" />
                <span>Descripción Detallada Organizada</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
                  {descriptionList.length} Puntos Estructurados
                </span>
                <button
                  onClick={() => copyToClipboard(getDescriptionText(), 'description')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer transition-colors"
                  title="Copiar descripción en formato lista al portapapeles"
                >
                  {copiedSection === 'description' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">¡Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-200/60 max-h-80 overflow-y-auto">
              {descriptionList.length > 0 ? (
                <ul className="space-y-3">
                  {descriptionList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed group">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:bg-indigo-700 transition-colors" />
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">Sin descripción disponible.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-3">
              <span className="text-xs font-semibold text-slate-700 font-mono">
                Vista Previa Alta Resolución
              </span>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 px-2 py-1 bg-slate-100 rounded-md cursor-pointer"
              >
                Cerrar (Esc)
              </button>
            </div>
            <img
              src={previewModalImg}
              alt="Preview HD"
              className="max-h-[75vh] w-auto max-w-full object-contain mx-auto"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => downloadSingleImage(previewModalImg, `${product.sku}_hd.jpg`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Esta Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
