(function () {
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

  var mode = loader.getAttribute('data-mode') || 'bubble'; // bubble | manual
  var position = loader.getAttribute('data-position') || 'bottom-right';

  var origin = loader.src.split('/embed')[0] || window.location.origin;
  var iframeUrl = origin + '/embed/' + slug;

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

  document.body.appendChild(iframe);

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
    bubbleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M2 8.5A6.5 6.5 0 0 1 8.5 2h7A6.5 6.5 0 0 1 22 8.5v7A6.5 6.5 0 0 1 15.5 22h-7A6.5 6.5 0 0 1 2 15.5v-7Z"/></svg>';
    bubbleBtn.onclick = openModal;
    document.body.appendChild(bubbleBtn);
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

  // Listen for Escape key to close modal
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && iframe.style.display === 'block') {
      closeModal();
    }
  });
})(); 