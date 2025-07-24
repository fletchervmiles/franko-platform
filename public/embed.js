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
  console.log('[Franko] Mode:', mode);

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
  iframe.style.height = '100dvh';
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

  // Fetch modal configuration for dynamic bubble styling
  function fetchModalConfig(callback) {
    var configUrl = origin + '/api/embed/' + slug;
    console.log('[Franko] Fetching config from:', configUrl);
    
    // Use fetch if available, otherwise fall back to XMLHttpRequest
    if (typeof fetch === 'function') {
      fetch(configUrl)
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Config fetch failed: ' + response.status);
          }
          return response.json();
        })
        .then(function(config) {
          console.log('[Franko] Config loaded:', config);
          callback(null, config);
        })
        .catch(function(error) {
          console.error('[Franko] Config fetch error:', error);
          callback(error, null);
        });
    } else {
      // Fallback for older browsers
      var xhr = new XMLHttpRequest();
      xhr.open('GET', configUrl, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var config = JSON.parse(xhr.responseText);
              console.log('[Franko] Config loaded via XHR:', config);
              callback(null, config);
            } catch (parseError) {
              console.error('[Franko] Config parse error:', parseError);
              callback(parseError, null);
            }
          } else {
            var error = new Error('Config fetch failed: ' + xhr.status);
            console.error('[Franko] Config fetch error:', error);
            callback(error, null);
          }
        }
      };
      xhr.send();
    }
  }

  // Utility to get bubble position styles using config
  function bubblePositionStyles(config) {
    var brandSettings = config.brandSettings || {};
    var interfaceSettings = brandSettings.interface || {};
    
    // Determine effective colors using same logic as the UI
    var theme = interfaceSettings.theme || 'light';
    var themeDefaults = {
      light: { chatIconColor: "#000000" },
      dark: { chatIconColor: "#ffffff" }
    };
    
    var bubbleColor = interfaceSettings.advancedColors
      ? (interfaceSettings.chatIconColor || themeDefaults[theme].chatIconColor)
      : (interfaceSettings.primaryBrandColor || themeDefaults[theme].chatIconColor);

    var style = {
      position: 'fixed',
      padding: '6px 10px',
      borderRadius: '9999px',
      background: bubbleColor,
      color: '#fff',
      border: 'none',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '500',
      lineHeight: '14px',
      cursor: 'pointer',
      zIndex: '2147483646',
      whiteSpace: 'nowrap',
      transition: 'transform 0.2s ease, opacity 0.2s ease',
      opacity: '0.95',
    };
    
    var pad = '24px';
    var position = interfaceSettings.alignChatBubble === 'left' ? 'bottom-left' : 'bottom-right';
    
    if (position === 'bottom-left') {
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
  function createBubble(config) {
    if (mode === 'manual') return;
    
    var brandSettings = config.brandSettings || {};
    var interfaceSettings = brandSettings.interface || {};
    var bubbleText = interfaceSettings.chatIconText || 'Feedback';
    
    bubbleBtn = document.createElement('button');
    var styles = bubblePositionStyles(config);
    Object.assign(bubbleBtn.style, styles);
    
    // Send icon SVG (filled airplane like Lucide Send)
    var iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 24 24" style="margin-right:6px"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>';
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

  // Create bubble with fallback defaults
  function createBubbleWithFallback(config) {
    if (mode === 'manual') return;
    
    // Use defaults if config is null/undefined
    var fallbackConfig = {
      brandSettings: {
        interface: {
          chatIconText: 'Feedback',
          primaryBrandColor: '#000000',
          alignChatBubble: 'right',
          theme: 'light',
          advancedColors: false,
          chatIconColor: '#000000'
        }
      }
    };
    
    createBubble(config || fallbackConfig);
  }

  // Initialize bubble - try to fetch config first, fallback to defaults
  fetchModalConfig(function(error, config) {
    if (error) {
      console.warn('[Franko] Using fallback bubble config due to error:', error);
      createBubbleWithFallback(null);
    } else {
      createBubbleWithFallback(config);
    }
  });

  // Body scroll lock helpers (mobile fix)
  var _frankoScrollPos = 0;
  function lockBodyScroll() {
    _frankoScrollPos = window.scrollY || window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _frankoScrollPos + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }
  function unlockBodyScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, _frankoScrollPos);
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
    lockBodyScroll();
  }
  function closeModal() {
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    if (bubbleBtn) bubbleBtn.style.display = 'flex';
    unlockBodyScroll();
  }

  // Expose API for manual mode with backward compatibility
  // Support both FrankoModal('open') and FrankoModal.open() calling patterns
  function FrankoModalAPI(method) {
    if (method === 'open') return openModal();
    if (method === 'close') return closeModal();
    if (method === 'getState') return iframe.style.display === 'block' ? 'open' : 'closed';
  }
  
  // Add methods as properties for .open() syntax
  FrankoModalAPI.open = openModal;
  FrankoModalAPI.close = closeModal;
  FrankoModalAPI.getState = function() {
    return iframe.style.display === 'block' ? 'open' : 'closed';
  };
  
  // Preserve any existing queue from the proxy script
  if (window.FrankoModal && window.FrankoModal.q) {
    FrankoModalAPI.q = window.FrankoModal.q;
    // Process any queued calls
    if (FrankoModalAPI.q && FrankoModalAPI.q.length > 0) {
      FrankoModalAPI.q.forEach(function(args) {
        var method = args[0];
        if (method === 'open') openModal();
        else if (method === 'close') closeModal();
      });
      FrankoModalAPI.q = []; // Clear the queue
    }
  }
  
  window.FrankoModal = FrankoModalAPI;
  console.log('[Franko] FrankoModal API exposed on window object with backward compatibility');

  // Listen for Escape key to close modal
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && iframe.style.display === 'block') {
      closeModal();
    }
  });

  // Listen for messages from iframe (cross-origin communication)
  window.addEventListener('message', function (e) {
    // Accept messages from any origin for flexibility, but check the message type
    if (e.data && e.data.type === 'FRANKO_CLOSE') {
      closeModal();
    } else if (e.data && e.data.type === 'FRANKO_IDENTITY_REQUEST') {
      // Respond with identity data if available
      var identityData = window.FrankoUser || {};
      iframe.contentWindow.postMessage({
        type: 'FRANKO_IDENTITY_RESPONSE',
        identityData: identityData
      }, '*');
      console.log('[Franko] Sent identity data to iframe:', identityData);
    }
  });
})(); 