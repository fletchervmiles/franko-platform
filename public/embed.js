(function () {
  console.log('[Franko] Embed script initializing...');
  
  // Find the current <script> tag
  var loader = document.currentScript;
  if (!loader) {
    console.error('[Franko] Loader script could not find currentScript');
    return;
  }

  var slug = loader.getAttribute('data-modal-slug');
  if (!slug) {
    console.error('[Franko] data-modal-slug attribute missing');
    return;
  }
  console.log('[Franko] Modal slug:', slug);

  var mode = loader.getAttribute('data-mode') || 'bubble'; // bubble | manual
  var position = loader.getAttribute('data-position') || 'bottom-right';
  console.log('[Franko] Mode:', mode, 'Position:', position);

  // Extract the origin from the script URL
  var scriptUrl = new URL(loader.src);
  var origin = scriptUrl.origin;
  var iframeUrl = origin + '/embed/' + slug;
  console.log('[Franko] Origin:', origin);
  console.log('[Franko] Iframe URL:', iframeUrl);

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.zIndex = '2147483647';
  iframe.style.display = 'none'; // start hidden
  iframe.style.background = 'transparent';
  
  // Add load error handling for iframe
  iframe.onerror = function(e) {
    console.error('[Franko] Failed to load iframe:', e);
  };
  
  iframe.onload = function() {
    console.log('[Franko] Iframe loaded successfully');
  };

  // Ensure iframe is added after DOM is ready
  function addIframe() {
    document.body.appendChild(iframe);
    console.log('[Franko] Iframe added to DOM');
  }
  
  if (document.body) {
    addIframe();
  } else {
    document.addEventListener('DOMContentLoaded', addIframe);
  }

  // Utility to get bubble position styles
  function bubblePositionStyles(pos) {
    var style = {
      position: 'fixed',
      width: '56px',
      height: '56px',
      borderRadius: '9999px',
      background: '#000',
      color: '#fff',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      cursor: 'pointer',
      zIndex: '2147483646',
    };
    var pad = '24px';
    if (pos === 'bottom-left') {
      style.bottom = pad;
      style.left = pad;
    } else {
      // bottom-right default
      style.bottom = pad;
      style.right = pad;
    }
    return style;
  }

  // Create bubble if in bubble mode
  var bubbleBtn = null;
  if (mode !== 'manual') {
    bubbleBtn = document.createElement('button');
    var styles = bubblePositionStyles(position);
    Object.assign(bubbleBtn.style, styles);
    
    // Use a more visible default icon
    bubbleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>';
    bubbleBtn.setAttribute('aria-label', 'Open chat');
    bubbleBtn.onclick = openModal;
    
    // Ensure button is added after DOM is ready
    if (document.body) {
      document.body.appendChild(bubbleBtn);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(bubbleBtn);
      });
    }
  }

  // Modal control funcs
  function openModal() {
    iframe.style.display = 'block';
    iframe.setAttribute('aria-hidden', 'false');
    if (bubbleBtn) bubbleBtn.style.display = 'none';
  }
  function closeModal() {
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    if (bubbleBtn) bubbleBtn.style.display = 'flex';
  }

  // Expose API for manual mode
  window.FrankoModal = {
    open: openModal,
    close: closeModal,
    getState: function () {
      return iframe.style.display === 'block' ? 'open' : 'closed';
    },
  };
  console.log('[Franko] FrankoModal API exposed on window object');

  // Listen for Escape key to close modal
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && iframe.style.display === 'block') {
      closeModal();
    }
  });
})(); 