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
    // Get brand color from data attribute, fallback to black
    var brandColor = loader.getAttribute('data-bubble-color') || '#000';
    
    var style = {
      position: 'fixed',
      padding: '8px 12px',
      borderRadius: '9999px',
      background: brandColor,
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '500',
      lineHeight: '16px',
      cursor: 'pointer',
      zIndex: '2147483646',
      whiteSpace: 'nowrap',
      transition: 'transform 0.2s ease, opacity 0.2s ease',
      opacity: '0.95',
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
    // Send icon SVG (filled airplane like Lucide Send)
    var iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 24 24" style="margin-right:6px"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>';
    bubbleBtn.innerHTML = iconSvg + '<span>' + bubbleText + '</span>';
    bubbleBtn.setAttribute('aria-label', 'Open chat');
    
    // Add hover effects
    bubbleBtn.onmouseenter = function() {
      this.style.transform = 'scale(1.05)';
      this.style.opacity = '1';
    };
    bubbleBtn.onmouseleave = function() {
      this.style.transform = 'scale(1)';
      this.style.opacity = '0.95';
    };
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