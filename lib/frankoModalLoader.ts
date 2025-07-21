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

      // Inline snippet modified for namespacing
      const wrapper = document.createElement('script');
      wrapper.setAttribute('data-franko-demo', slug);
      wrapper.innerHTML = `
      (function(){
        const apiName = '${apiName}';
        if(!window[apiName]){
          window[apiName]=(...a)=>{window[apiName].q=window[apiName].q||[];window[apiName].q.push(a)};
          window[apiName]=new Proxy(window[apiName],{get:(t,p)=>p==='q'?t.q:(...a)=>t(p,...a)});
        }
        const l=()=>{
          const s=document.createElement('script');
          s.src='https://franko.ai/embed.js';
          s.setAttribute('data-modal-slug','${slug}');
          s.setAttribute('data-mode','manual');
          s.onload=()=>{
            if(window[apiName].q){window[apiName].q.forEach(([m,...a])=>window[apiName][m]&&window[apiName][m](...a));window[apiName].q=[];}
          };
          document.head.appendChild(s);
        };
        document.readyState==='complete'?l():addEventListener('load',l);
      })();
      `;
      document.body.appendChild(wrapper);

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
      setTimeout(checkReady, 100);

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