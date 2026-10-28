import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  CheckSquare,
  Square,
  Search,
  Filter,
  Package,
  Layers,
  ArrowUpDown,
  Printer,
} from 'lucide-react';
import { ExtractedProduct } from '../types/product';
import { exportProductsToExcel, exportProductsToCsv } from '../utils/excelExport';

interface CatalogTableViewProps {
  products: ExtractedProduct[];
  onSelectProduct: (product: ExtractedProduct) => void;
  onDeleteProduct: (id: string) => void;
  onClearAll: () => void;
  onPrintProduct?: (product: ExtractedProduct) => void;
}

export const CatalogTableView: React.FC<CatalogTableViewProps> = ({
  products,
  onSelectProduct,
  onDeleteProduct,
  onClearAll,
  onPrintProduct,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState<'all' | 'Amazon México' | 'Mercado Libre México'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price-asc' | 'price-desc' | 'title'>('date');

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMarketplace =
      marketplaceFilter === 'all' || p.marketplace === marketplaceFilter;
    return matchesSearch && matchesMarketplace;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.currentPrice - b.currentPrice;
    if (sortBy === 'price-desc') return b.currentPrice - a.currentPrice;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime();
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProducts.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExportSelected = () => {
    const itemsToExport = products.filter(p => selectedIds.has(p.id));
    if (itemsToExport.length === 0) return;
    exportProductsToExcel(itemsToExport, `catalogo_seleccion_${itemsToExport.length}_productos.xlsx`);
  };

  const handleExportSelectedCsv = () => {
    const itemsToExport = products.filter(p => selectedIds.has(p.id));
    if (itemsToExport.length === 0) return;
    exportProductsToCsv(itemsToExport, `catalogo_seleccion_${itemsToExport.length}_productos.csv`);
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => onDeleteProduct(id));
    setSelectedIds(new Set());
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No hay productos en el catálogo</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Ingresa una URL de Amazon México arriba o prueba con uno de los ejemplos listos para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Catálogo Consolidado de Fichas de Producto</span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200/60">
              {products.length} productos
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabla relacional exportable directamente a hojas de cálculo de Microsoft Excel (.xlsx) y CSV
          </p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleExportSelected}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar ({selectedIds.size}) a Excel</span>
              </button>

              <button
                onClick={handleExportSelectedCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <span>CSV</span>
              </button>

              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar ({selectedIds.size})</span>
              </button>
            </>
          )}

          <button
            onClick={() => exportProductsToExcel(products, 'catalogo_completo.xlsx')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Todo a Excel</span>
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, SKU, ASIN o marca..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl">
            Amazon México
          </span>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none font-medium"
          >
            <option value="date">Más recientes primero</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="title">Título: A - Z</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {selectedIds.size === sortedProducts.length && sortedProducts.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 w-16">Foto</th>
              <th className="py-3 px-3 w-32">Marketplace</th>
              <th className="py-3 px-3 w-28">SKU / ASIN</th>
              <th className="py-3 px-3 min-w-[220px]">Título y Marca</th>
              <th className="py-3 px-3 w-28 text-right">Precio Actual</th>
              <th className="py-3 px-3 w-24 text-center">Descuento</th>
              <th className="py-3 px-3 w-28 text-center">Datos Técnicos</th>
              <th className="py-3 px-3 w-20 text-center">Fotos</th>
              <th className="py-3 px-3 w-28 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedProducts.map(p => {
              const isSelected = selectedIds.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => toggleSelectOne(p.id)}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  <td className="py-3 px-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-0.5">
                      {p.mainImage ? (
                        <img
                          src={p.mainImage}
                          alt={p.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-medium">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300/60">
                      Amazon MX
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    {p.sku}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 line-clamp-1 max-w-md">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-medium text-indigo-600">{p.brand}</span>
                      {p.model && p.model !== 'N/A' && <span>• {p.model}</span>}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="font-extrabold text-slate-900">
                      ${p.currentPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400">{p.currency}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {p.discountPercent ? (
                      <span className="inline-block bg-rose-50 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[11px] border border-rose-200">
                        -{p.discountPercent}%
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {p.technicalSpecs.length} specs
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-slate-700">
                    {p.images.length} HD
                  </td>

                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectProduct(p)}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                        title="Ver ficha técnica completa y galería"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {onPrintProduct && (
                        <button
                          onClick={() => onPrintProduct(p)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
                          title="Generar Ficha PDF Profesional con Logo"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => exportProductsToExcel([p], `ficha_${p.sku}.xlsx`)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                        title="Exportar a Excel"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar de catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
