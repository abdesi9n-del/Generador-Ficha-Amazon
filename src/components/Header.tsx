import { Download, Sparkles, Layers, RefreshCw, ShoppingBag, Building2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { ExtractedProduct, BrandingConfig } from '../types/product';
import { exportProductsToExcel } from '../utils/excelExport';

interface HeaderProps {
  products: ExtractedProduct[];
  branding: BrandingConfig;
  onOpenBrandingSettings: () => void;
  onClearAll: () => void;
  activeView: 'single' | 'catalog';
  setActiveView: (view: 'single' | 'catalog') => void;
}

export const Header: React.FC<HeaderProps> = ({
  products,
  branding,
  onOpenBrandingSettings,
  onClearAll,
  activeView,
  setActiveView,
}) => {
  const handleExportAll = () => {
    if (products.length === 0) return;
    exportProductsToExcel(products, `catalogo_completo_${products.length}_productos.xlsx`);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">FichaMaster MX</span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                Gratis • Sin API
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Extractor oficial de fichas técnicas, fotos HD y precios de Amazon México
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setActiveView('single')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeView === 'single'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ficha Actual
            </button>
            <button
              onClick={() => setActiveView('catalog')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeView === 'catalog'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Catálogo ({products.length})</span>
            </button>
          </div>

          {/* Logo & Branding Button */}
          <button
            onClick={onOpenBrandingSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Configurar logo de la esquina superior y datos de la empresa para fichas PDF"
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="Logo activo"
                className="w-4 h-4 object-contain rounded-xs"
              />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span className="hidden lg:inline">
              {branding.logoUrl ? 'Logo Activo (PDF)' : 'Colocar Logo PDF'}
            </span>
            <span className="lg:hidden">Logo</span>
          </button>

          {/* Export All button */}
          {products.length > 0 && (
            <button
              onClick={handleExportAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Descargar Excel con todas las fichas y especificaciones"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exportar Catálogo a Excel</span>
              <span className="md:hidden">Excel</span>
            </button>
          )}

          {products.length > 0 && (
            <button
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition-colors cursor-pointer"
              title="Limpiar todos los datos y vaciar catálogo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar Datos</span>
              <span className="sm:hidden">Limpiar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
