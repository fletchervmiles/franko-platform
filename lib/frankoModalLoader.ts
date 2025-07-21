/*
  Dynamically loads a namespaced Franko manual-mode snippet for the given modal slug.
  Creates isolated FrankoModal_{namespace} objects to avoid global conflicts.
*/

export async function loadAndOpenFrankoModal(slug: string): Promise<void> {
  await loadFrankoModal(slug);
  openFrankoModal(slug);
}

export async function loadFrankoModal(slug: string): Promise<void> {
  const namespace = slug.replace(/[^a-zA-Z0-9]/g, '_');
  const apiName = `FrankoModal_${namespace}`;
  const w = window as any;

  // Cache of in-flight loads
  w.__frankoLoading = w.__frankoLoading || new Map<string, Promise<void>>();
  if (w.__frankoLoading.has(slug)) {
    return w.__frankoLoading.get(slug)!;
  }

  const loadPromise: Promise<void> = new Promise((resolve, reject) => {
    try {
      // Remove previously injected demo snippets for this namespace
      document.querySelectorAll(`script[data-franko-demo="${slug}"]`).forEach((s) => s.remove());

      // Store reference to existing global FrankoModal (likely nav-sidebar) to restore later
      const existingGlobalModal = w.FrankoModal;

      // Temporarily clear global to avoid conflicts during loading
      if (w.FrankoModal && slug !== 'franko-1753006030406') {
        delete w.FrankoModal;
      }

      // Create namespaced proxy
      if (!w[apiName]) {
        w[apiName] = (...args: any[]) => {
          (window as any)[apiName].q = (window as any)[apiName].q || [];
          (window as any)[apiName].q.push(args);
        };
        w[apiName] = new Proxy(w[apiName], {
          get: (t: any, p: string) => (p === 'q' ? t.q : (...args: any[]) => t(p, ...args)),
        });
      }

      // Create and inject the embed script
      const script = document.createElement('script');
      script.src = 'https://franko.ai/embed.js';
      script.setAttribute('data-modal-slug', slug);
      script.setAttribute('data-mode', 'manual');
      
      script.onload = () => {
        // Move the global FrankoModal that was just created to our namespace
        if (w.FrankoModal && !w[apiName].open) {
          w[apiName] = w.FrankoModal;
          
          // Only delete global if this isn't the nav-sidebar modal
          if (slug !== 'franko-1753006030406') {
            delete w.FrankoModal;
            // Restore the original global modal (nav-sidebar)
            if (existingGlobalModal && existingGlobalModal.open) {
              w.FrankoModal = existingGlobalModal;
            }
          }
        }

        // Process any queued calls
        if ((window as any)[apiName].q) {
          (window as any)[apiName].q.forEach(([m, ...params]: any[]) => {
            if ((window as any)[apiName][m]) {
              (window as any)[apiName][m](...params);
            }
          });
          (window as any)[apiName].q = [];
        }
      };

      script.onerror = () => reject(new Error(`Failed to load embed.js for ${slug}`));
      document.head.appendChild(script);

      // Wait for API to be ready with retry logic
      const checkReady = () => {
        if (w[apiName] && typeof w[apiName].open === 'function') {
          // Additional check: try to call getState to ensure API is fully ready
          try {
            w[apiName].getState();
            resolve();
          } catch {
            // API exists but not fully ready, retry
            setTimeout(checkReady, 50);
          }
        } else {
          setTimeout(checkReady, 50);
        }
      };

      // Start checking after a short delay to allow script to load
      setTimeout(checkReady, 200);

      // Safety timeout
      setTimeout(() => reject(new Error(`Modal ${slug} failed to load after 10s`)), 10000);

    } catch (err) {
      reject(err);
    }
  });

  w.__frankoLoading.set(slug, loadPromise);
  return loadPromise;
}

export function openFrankoModal(slug: string): void {
  const namespace = slug.replace(/[^a-zA-Z0-9]/g, '_');
  const apiName = `FrankoModal_${namespace}`;
  const w = window as any;
  
  // Retry logic for opening modal
  const tryOpen = (retries = 3) => {
    if (w[apiName] && typeof w[apiName].open === 'function') {
      try {
        w[apiName].open();
        return true;
      } catch (error) {
        console.warn(`Failed to open modal ${slug}, retries left: ${retries}`, error);
        if (retries > 0) {
          setTimeout(() => tryOpen(retries - 1), 100);
        } else {
          console.error(`Failed to open modal ${slug} after all retries`);
        }
        return false;
      }
    } else {
      if (retries > 0) {
        setTimeout(() => tryOpen(retries - 1), 100);
      } else {
        console.error(`Namespaced FrankoModal not found for ${slug}`);
      }
      return false;
    }
  };
  
  tryOpen();
}