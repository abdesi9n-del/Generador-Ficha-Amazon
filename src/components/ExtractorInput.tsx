import React, { useState } from 'react';
import { Search, Globe, FileCode, ListPlus, ArrowRight, Loader2, Sparkles, CheckCircle2, AlertCircle, Copy, HelpCircle } from 'lucide-react';
import { ExtractedProduct } from '../types/product';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

interface ExtractorInputProps {
  onProductExtracted: (product: ExtractedProduct) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onError: (msg: string, needsHtmlPaste?: boolean) => void;
}

export const ExtractorInput: React.FC<ExtractorInputProps> = ({
  onProductExtracted,
  isLoading,
  setIsLoading,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'html'>('single');
  const [url, setUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [sourceMarketplace, setSourceMarketplace] = useState<'auto' | 'amazon' | 'mercadolibre'>('auto');
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentUrl?: string } | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const detectedMarketplace = (inputUrl: string) => {
    if (inputUrl.includes('amazon') || inputUrl.includes('a.co') || inputUrl.includes('amzn.to') || /[B0-9][A-Z0-9]{9}/i.test(inputUrl)) {
      return 'Amazon México';
    }
    return null;
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('http')) {
        setUrl(text.trim());
      }
    } catch {
      // ignore
    }
  };

  const extractSingleUrl = async (targetUrl: string, rawHtml?: string) => {
    setLoadingStep('Conectando con el marketplace...');
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetUrl,
        html: rawHtml,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success || !data.product) {
      throw new Error(data.error || 'No se pudo extraer la información del producto.');
    }
    return data.product as ExtractedProduct;
  };

  const handleSingleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      onError('Por favor ingresa una URL válida o código ASIN de Amazon México.');
      return;
    }

    setIsLoading(true);
    try {
      setLoadingStep('Extrayendo título, fotos en alta resolución y precios...');
      const product = await extractSingleUrl(url.trim());
      setLoadingStep('Finalizando estructuración de la ficha...');
      onProductExtracted(product);
      setUrl('');
    } catch (err: any) {
      console.error(err);
      onError(
        err.message || 'Error al extraer la ficha.',
        url.includes('amazon') || url.includes('a.co')
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = batchUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.startsWith('http'));

    if (urls.length === 0) {
      onError('Por favor ingresa al menos una URL válida (una por línea).');
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    setBatchProgress({ current: 0, total: urls.length });

    for (let i = 0; i < urls.length; i++) {
      const currentUrl = urls[i];
      setBatchProgress({ current: i + 1, total: urls.length, currentUrl });
      setLoadingStep(`Extrayendo producto ${i + 1} de ${urls.length}...`);

      try {
        const product = await extractSingleUrl(currentUrl);
        onProductExtracted(product);
        successCount++;
      } catch (err) {
        console.warn(`Error al extraer ${currentUrl}:`, err);
      }
    }

    setIsLoading(false);
    setBatchProgress(null);
    setLoadingStep('');
    setBatchUrls('');

    if (successCount === 0) {
      onError('No se pudo extraer ningún producto del lote. Revisa las URLs ingresadas.');
    }
  };

  const handleHtmlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!htmlContent.trim()) {
      onError('Por favor pega el código HTML fuente del producto.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Analizando código HTML y extrayendo fotos HD...');
    try {
      const product = await extractSingleUrl(url.trim() || 'https://www.amazon.com.mx/dp/custom', htmlContent);
      onProductExtracted(product);
      setHtmlContent('');
      setUrl('');
      setActiveTab('single');
    } catch (err: any) {
      onError(err.message || 'Error al procesar el código HTML.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleLoadSample = (sample: ExtractedProduct) => {
    setIsLoading(true);
    setLoadingStep(`Cargando ficha de muestra: ${sample.brand}...`);
    setTimeout(() => {
      onProductExtracted({
        ...sample,
        extractedAt: new Date().toISOString(),
      });
      setIsLoading(false);
      setLoadingStep('');
    }, 400);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 mb-8">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('single')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'single'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Extraer por URL Directa</span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'batch'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ListPlus className="w-3.5 h-3.5" />
          <span>Extracción por Lote (Multi-URLs)</span>
        </button>

        <button
          onClick={() => setActiveTab('html')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'html'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Pegar Código HTML (Bypass 100%)</span>
        </button>
      </div>

      {/* Single URL Form */}
      {activeTab === 'single' && (
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Pega la URL de Amazon México (amazon.com.mx / a.co / amzn.to o ASIN)..."
                  disabled={isLoading}
                  className="w-full pl-11 pr-24 py-3 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />

                <button
                  type="button"
                  onClick={handlePasteUrl}
                  disabled={isLoading}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium"
                >
                  Pegar
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Extrayendo...</span>
                  </>
                ) : (
                  <>
                    <span>Extraer Ficha</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Detected badge */}
            {url && (
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600">
                <span>Detectado:</span>
                {detectedMarketplace(url) ? (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md font-semibold">
                    {detectedMarketplace(url)}
                  </span>
                ) : (
                  <span className="text-slate-400">Enlace de Amazon</span>
                )}
              </div>
            )}
          </div>
        </form>
      )}

      {/* Batch Form */}
      {activeTab === 'batch' && (
        <form onSubmit={handleBatchSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">
            Ingresa una URL de Amazon México por línea:
          </label>
          <textarea
            rows={4}
            value={batchUrls}
            onChange={e => setBatchUrls(e.target.value)}
            disabled={isLoading}
            placeholder={`https://www.amazon.com.mx/dp/B098RKWHHZ\nhttps://www.amazon.com.mx/dp/B09TMN58KL\nhttps://www.amazon.com.mx/dp/B09XS7JWHH`}
            className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {batchUrls.split('\n').filter(u => u.trim().startsWith('http')).length} URLs detectadas
            </span>
            <button
              type="submit"
              disabled={isLoading || !batchUrls.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando lote...</span>
                </>
              ) : (
                <>
                  <span>Extraer Lote Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* HTML Paste Form */}
      {activeTab === 'html' && (
        <form onSubmit={handleHtmlSubmit} className="space-y-3">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">¿Por qué usar este método?</span> Si Amazon activa un captcha temporal hacia servidores en la nube, puedes abrir la página en tu navegador, presionar <kbd className="px-1 py-0.5 bg-white border border-amber-200 rounded font-mono font-bold text-[10px]">Ctrl + U</kbd> (Ver código fuente), seleccionar todo (<kbd className="px-1 py-0.5 bg-white border border-amber-200 rounded font-mono font-bold text-[10px]">Ctrl + A</kbd>), copiar y pegar aquí. Nuestro extractor extraerá al instante todas las fotos en alta resolución, precio y ficha técnica.
            </div>
          </div>

          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="URL del producto (opcional, para guardar enlace de origen)"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
          />

          <textarea
            rows={5}
            value={htmlContent}
            onChange={e => setHtmlContent(e.target.value)}
            disabled={isLoading}
            placeholder="Pega aquí el código HTML (<html...>...</html>)..."
            className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 outline-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !htmlContent.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando HTML...</span>
                </>
              ) : (
                <>
                  <span>Extraer Ficha desde HTML</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Loading Step Banner */}
      {isLoading && loadingStep && (
        <div className="mt-4 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs text-indigo-900 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
          <span className="font-medium">{loadingStep}</span>
          {batchProgress && (
            <span className="ml-auto font-mono font-semibold bg-indigo-200/60 px-2 py-0.5 rounded text-indigo-800">
              {batchProgress.current} / {batchProgress.total}
            </span>
          )}
        </div>
      )}

      {/* 1-Click Test Samples */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Probar con 1 clic (ejemplos reales con fotos HD y especificaciones):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {SAMPLE_PRODUCTS.map(sample => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="text-amber-600 font-bold">
                  AMZ
                </span>
                <span className="truncate max-w-[140px]">{sample.title.split('-')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
