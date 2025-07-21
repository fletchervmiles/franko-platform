/*
  Dynamically loads a Franko manual-mode snippet for the given modal slug.
  Ensures only one snippet is present at any time on the page and returns a
  promise that resolves once FrankoModal is ready to open the requested slug.
*/
export async function loadFrankoModal(slug: string): Promise<void> {
  // Cache of in-flight loads on the global object so multiple calls share one request
  const w = window as any;
  w.__frankoLoading = w.__frankoLoading || new Map<string, Promise<void>>();
  if (w.__frankoLoading.has(slug)) {
    return w.__frankoLoading.get(slug)!;
  }

  const loadPromise: Promise<void> = new Promise((resolve, reject) => {
    try {
      // Remove previously injected demo snippets (keeps <nav> snippet untouched)
      document.querySelectorAll('script[data-franko-demo]').forEach((s) => s.remove());

      // Inline snippet identical to the dashboard output, but parametric in slug
      const wrapper = document.createElement('script');
      wrapper.setAttribute('data-franko-demo', slug);
      wrapper.innerHTML = `
      (function(){if(!window.FrankoModal){window.FrankoModal=(...a)=>{window.FrankoModal.q=window.FrankoModal.q||[];window.FrankoModal.q.push(a)};window.FrankoModal=new Proxy(window.FrankoModal,{get:(t,p)=>p==="q"?t.q:(...a)=>t(p,...a)})}const l=()=>{const s=document.createElement("script");s.src="https://franko.ai/embed.js";s.setAttribute("data-modal-slug","${slug}");s.setAttribute("data-mode","manual");s.onload=()=>{if(window.FrankoModal.q){window.FrankoModal.q.forEach(([m,...a])=>window.FrankoModal[m]&&window.FrankoModal[m](...a));window.FrankoModal.q=[]}};document.head.appendChild(s)};document.readyState==="complete"?l():addEventListener("load",l)})();
      `;
      document.body.appendChild(wrapper);

      // Poll until FrankoModal.open exists (embed.js loaded)
      const checkReady = () => {
        if (w.FrankoModal && typeof w.FrankoModal.open === 'function') {
          resolve();
        } else {
          setTimeout(checkReady, 30);
        }
      };
      checkReady();
    } catch (err) {
      reject(err);
    }
  });

  w.__frankoLoading.set(slug, loadPromise);
  return loadPromise;
} 