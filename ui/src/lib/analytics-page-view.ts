/** Espera la inicialización de gtag y evita duplicar la vista por hidratación. */
export function createPageViewTracker() {
  let lastPath: string | undefined;
  return (path: string, ready: boolean, enabled: boolean, send: () => void) => {
    if (!enabled) {
      lastPath = undefined;
      return;
    }
    if (!ready || path === lastPath) return;
    send();
    lastPath = path;
  };
}
