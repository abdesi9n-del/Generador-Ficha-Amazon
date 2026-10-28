import JSZip from 'jszip';

export async function downloadSingleImage(imageUrl: string, filename: string): Promise<boolean> {
  try {
    // Attempt download via proxy first to prevent cross-origin canvas/taint issues
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    let response = await fetch(proxyUrl);
    if (!response.ok) {
      // Fallback to direct fetch
      response = await fetch(imageUrl, { mode: 'cors' });
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'producto_foto.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (err) {
    console.error('Error downloading image:', err);
    // Ultimate fallback: open in new tab
    const win = window.open(imageUrl, '_blank');
    return !!win;
  }
}

export async function downloadAllImagesAsZip(
  imageUrls: string[],
  baseName: string,
  onProgress?: (current: number, total: number) => void
): Promise<boolean> {
  if (!imageUrls || imageUrls.length === 0) return false;

  const zip = new JSZip();
  const folder = zip.folder(baseName || 'fotos_producto');
  const total = imageUrls.length;

  for (let i = 0; i < total; i++) {
    const url = imageUrls[i];
    if (onProgress) onProgress(i + 1, total);

    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      let response = await fetch(proxyUrl);
      if (!response.ok) {
        response = await fetch(url, { mode: 'cors' });
      }

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const extension = url.includes('.png') ? 'png' : url.includes('.webp') ? 'webp' : 'jpg';
        const photoNum = String(i + 1).padStart(2, '0');
        folder?.file(`foto_${photoNum}.${extension}`, arrayBuffer);
      }
    } catch (e) {
      console.warn(`Failed to add image ${i + 1} to zip:`, e);
    }
  }

  try {
    const content = await zip.generateAsync({ type: 'blob' });
    const blobUrl = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${baseName}_fotos_alta_resolucion.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (err) {
    console.error('Error generating zip file:', err);
    return false;
  }
}
