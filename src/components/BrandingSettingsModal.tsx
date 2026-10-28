import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Check,
  Building2,
  Phone,
  Mail,
  Globe,
  Palette,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { BrandingConfig } from '../types/product';

interface BrandingSettingsModalProps {
  branding: BrandingConfig;
  onSaveBranding: (updated: BrandingConfig) => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Índigo Moderno', hex: '#4f46e5' },
  { name: 'Azul Corporativo', hex: '#1e40af' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Negro Minimalista', hex: '#0f172a' },
  { name: 'Ámbar Comercial', hex: '#d97706' },
  { name: 'Vino Tinto', hex: '#9f1239' },
];

const SAMPLE_LOGOS = [
  {
    name: 'TechStore MX',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80',
    company: 'TechStore México S.A. de C.V.',
    tagline: 'Importación y Distribución Mayorista',
  },
  {
    name: 'Logística & Comercio',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop&q=80',
    company: 'Distribuidora Comercial del Norte',
    tagline: 'Catálogo de Productos Oficiales',
  },
];

export const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  branding,
  onSaveBranding,
  onClose,
}) => {
  const [form, setForm] = useState<BrandingConfig>({ ...branding });
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setForm((prev) => ({ ...prev, logoUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogoUrl = () => {
    if (!urlInput.trim()) return;
    setForm((prev) => ({ ...prev, logoUrl: urlInput.trim() }));
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Personalizar Logo y Datos de Empresa para PDF
              </h2>
              <p className="text-xs text-slate-500">
                Aparecerá en la esquina superior de todas las fichas técnicas exportadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Logo Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Logo de la Empresa (Esquina Superior de la Ficha)
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {/* Logo Preview Box */}
              <div className="relative h-24 w-36 bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden shrink-0 group">
                {form.logoUrl ? (
                  <>
                    <img
                      src={form.logoUrl}
                      alt="Logo de la empresa"
                      className="max-h-20 max-w-32 object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-medium gap-1"
                      title="Quitar logo"
                    >
                      <Trash2 className="w-4 h-4 text-rose-300" />
                      <span>Quitar</span>
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2">
                    <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 font-medium">Sin logo cargado</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir imagen desde equipo (PNG/JPG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Pegar URL de imagen
                  </button>
                </div>

                {showUrlInput && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://ejemplo.com/mi-logo.png"
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyLogoUrl}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                )}

                {/* Position selection */}
                <div className="flex items-center gap-3 pt-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Posición en cabecera:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="logoPosition"
                      checked={form.logoPosition === 'left'}
                      onChange={() => setForm((p) => ({ ...p, logoPosition: 'left' }))}
                    />
                    <span>Esquina Superior Izquierda</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="logoPosition"
                      checked={form.logoPosition === 'right'}
                      onChange={() => setForm((p) => ({ ...p, logoPosition: 'right' }))}
                    />
                    <span>Esquina Superior Derecha</span>
                  </label>
                </div>

                {/* Preset quick test logos */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Logos de muestra:</span>
                  {SAMPLE_LOGOS.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          logoUrl: sample.url,
                          companyName: sample.company,
                          tagline: sample.tagline,
                        }))
                      }
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Datos Comerciales de la Empresa / Vendedor
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre de la Empresa o Vendedor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Ej. Distribuidora Electrónica MX"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Slogan o Giro Comercial
                </label>
                <input
                  type="text"
                  value={form.tagline || ''}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Ej. Importación directa y precios de mayoreo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.contactPhone || ''}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="Ej. +52 55 1234 5678"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.contactEmail || ''}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="Ej. ventas@tiendamexico.com"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sitio Web o Red Social
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.website || ''}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="Ej. www.mimarca.mx"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Color & Footer Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Color de Acento y Nota al Pie
            </label>

            <div className="space-y-3">
              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1.5">
                  Color de Acento en Encabezados y Bordes:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setForm({ ...form, accentColor: color.hex })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        form.accentColor === color.hex
                          ? 'border-slate-900 ring-2 ring-slate-400/40 font-bold'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nota al pie del documento PDF
                </label>
                <input
                  type="text"
                  value={form.footerNote || ''}
                  onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
                  placeholder="Ej. Precios en MXN sujetos a cambios sin previo aviso. Ficha generada con fines comerciales."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Configuración de Marca</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
