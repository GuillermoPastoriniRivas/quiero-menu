/**
 * Descarga el QR (SVG dentro de `scope`) como PNG de 1024×1024.
 * Compartido por la pantalla de Diseño/Compartir y el Inicio.
 */
export function downloadQrPng(scope: HTMLElement | null, filename: string): Promise<boolean> {
  const svg = scope?.querySelector('svg');
  if (!svg) return Promise.resolve(false);

  const canvas = document.createElement('canvas');
  const size = 1024;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(false);

  const svgData = new XMLSerializer().serializeToString(svg);
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  });
}
