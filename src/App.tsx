/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExtractorInput } from './components/ExtractorInput';
import { ProductDetailView } from './components/ProductDetailView';
import { CatalogTableView } from './components/CatalogTableView';
import { PrintSheetModal } from './components/PrintSheetModal';
import { BrandingSettingsModal } from './components/BrandingSettingsModal';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import { ExtractedProduct, BrandingConfig } from './types/product';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const DEFAULT_BRANDING: BrandingConfig = {
  companyName: 'Comercializadora & Catálogos MX',
  tagline: 'Distribución Mayorista y Fichas Técnicas Oficiales',
  logoUrl: '',
  logoPosition: 'left',
  contactPhone: '+52 55 1234 5678',
  contactEmail: 'ventas@distribuidoramexico.com',
  website: 'www.distribuidoramexico.com',
  accentColor: '#4f46e5',
  footerNote: 'Precios en MXN sujetos a cambios sin previo aviso. Ficha técnica generada para fines comerciales y de cotización.',
};

export default function App() {
  const [products, setProducts] = useState<ExtractedProduct[]>(() => {
    try {
      const stored = localStorage.getItem('fichamaster_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[1]];
  });

  const [branding, setBranding] = useState<BrandingConfig>(() => {
    try {
      const stored = localStorage.getItem('fichamaster_branding');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_BRANDING;
  });

  const [activeProductId, setActiveProductId] = useState<string>(() => {
    return SAMPLE_PRODUCTS[0].id;
  });

  const [activeView, setActiveView] = useState<'single' | 'catalog'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ text: string; showHtmlHint?: boolean } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [printProduct, setPrintProduct] = useState<ExtractedProduct | null>(null);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

  // Sync products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fichamaster_products', JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage products save error:', e);
    }
  }, [products]);

  // Sync branding to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fichamaster_branding', JSON.stringify(branding));
    } catch (e) {
      console.warn('LocalStorage branding save error:', e);
    }
  }, [branding]);

  const activeProduct = products.find(p => p.id === activeProductId) || products[0] || null;

  const handleProductExtracted = (newProduct: ExtractedProduct) => {
    setProducts(prev => {
      const index = prev.findIndex(p => p.sku === newProduct.sku);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = newProduct;
        return updated;
      }
      return [newProduct, ...prev];
    });

    setActiveProductId(newProduct.id);
    setActiveView('single');
    setSuccessToast(`¡Ficha de "${newProduct.title.slice(0, 45)}..." extraída exitosamente con ${newProduct.images.length} fotos HD!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleUpdateProduct = (updated: ExtractedProduct) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('¿Deseas limpiar todos los datos del catálogo y empezar desde cero?')) {
      setProducts([]);
      localStorage.removeItem('fichamaster_products');
      setSuccessToast('Se han limpiado todos los datos del catálogo.');
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleError = (msg: string, showHtmlHint?: boolean) => {
    setErrorMessage({ text: msg, showHtmlHint });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Sticky Header */}
      <Header
        products={products}
        branding={branding}
        onOpenBrandingSettings={() => setIsBrandingModalOpen(true)}
        onClearAll={handleClearAll}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Banner: Toast / Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-xs sm:text-sm text-rose-800 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage.text}</p>
                {errorMessage.showHtmlHint && (
                  <p className="mt-1 text-rose-700 text-xs">
                    💡 <strong>Tip para Amazon:</strong> Si Amazon México activa verificación temporal contra servidores cloud, puedes abrir la página del producto en tu navegador, presionar <kbd className="bg-white px-1 py-0.5 rounded font-mono border border-rose-300">Ctrl + U</kbd>, copiar todo y pegarlo en la pestaña <strong>"Pegar Código HTML"</strong> para extraer el 100% de las fotos HD y especificaciones al instante.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successToast && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-800 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* URL / Batch / HTML Input Form */}
        <ExtractorInput
          onProductExtracted={handleProductExtracted}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onError={handleError}
        />

        {/* View Switch: Single Product Detail vs Full Catalog Table */}
        {activeView === 'single' ? (
          activeProduct ? (
            <ProductDetailView
              product={activeProduct}
              onUpdateProduct={handleUpdateProduct}
              onPrintRequest={p => setPrintProduct(p)}
              onDeleteProduct={handleDeleteProduct}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <p className="text-slate-600 text-sm font-semibold mb-2">
                No hay productos en el catálogo actualmente.
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
                Ingresa una URL o ASIN de Amazon México arriba para extraer una ficha, o restaura los ejemplos para explorar la aplicación.
              </p>
              <button
                onClick={() => {
                  setProducts([SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[1]]);
                  setActiveProductId(SAMPLE_PRODUCTS[0].id);
                  setSuccessToast('Se han restaurado los productos de muestra.');
                  setTimeout(() => setSuccessToast(null), 3000);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Restaurar Productos de Muestra</span>
              </button>
            </div>
          )
        ) : (
          <CatalogTableView
            products={products}
            onSelectProduct={p => {
              setActiveProductId(p.id);
              setActiveView('single');
            }}
            onDeleteProduct={handleDeleteProduct}
            onClearAll={handleClearAll}
            onPrintProduct={p => setPrintProduct(p)}
          />
        )}
      </main>

      {/* Printable / PDF Modal with Corner Logo and Complete Product Sheet */}
      {printProduct && (
        <PrintSheetModal
          product={printProduct}
          branding={branding}
          onOpenBrandingSettings={() => setIsBrandingModalOpen(true)}
          onClose={() => setPrintProduct(null)}
        />
      )}

      {/* Branding & Logo Settings Modal */}
      {isBrandingModalOpen && (
        <BrandingSettingsModal
          branding={branding}
          onSaveBranding={updated => setBranding(updated)}
          onClose={() => setIsBrandingModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">FichaMaster MX</span>
            <span>•</span>
            <span>Amazon México 🇲🇽 y Mercado Libre México 🇲🇽</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span>Ficha PDF con Logo Personalizado</span>
            <span>•</span>
            <span>Exportación a Excel (.xlsx)</span>
            <span>•</span>
            <span>Descarga Fotos HD (.zip)</span>
            <span>•</span>
            <span>100% Sin APIs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
