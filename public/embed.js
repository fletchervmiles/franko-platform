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
  var iframeUrl = origin + '/embed/' + slug + '?mode=modal';
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
      height: '40px',
      padding: '0 16px',
      borderRadius: '9999px',
      background: '#000',
      color: '#fff',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      lineHeight: '1',
      cursor: 'pointer',
      zIndex: '2147483646',
      whiteSpace: 'nowrap',
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
    
    // Text for bubble – default "Feedback" or custom via attribute
    var bubbleText = loader.getAttribute('data-bubble-text') || 'Feedback';
    // Icon (paper airplane) SVG
    var iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style="margin-right:6px"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    bubbleBtn.innerHTML = iconSvg + '<span style="font-size:12px;font-weight:500;">' + bubbleText + '</span>';
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
    if (iframe.style.display === 'none') {
      // Tell iframe to reset internal visibility state
      iframe.contentWindow.postMessage({ type: 'RESET_VISIBILITY' }, '*');
    }
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