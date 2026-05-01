(function () {
  const STORAGE_KEY = 'aipower-wishlist';

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function saveWishlist(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function toggleWishlist(handle) {
    const list = getWishlist();
    const idx = list.indexOf(handle);
    if (idx === -1) { list.push(handle); } else { list.splice(idx, 1); }
    saveWishlist(list);
    return idx === -1;
  }

  function setButtonState(btn, active) {
    btn.classList.toggle('wishlist-icon--active', active);
    btn.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
    btn.setAttribute('aria-pressed', String(active));
  }

  function syncButtons(handle, active) {
    document.querySelectorAll(`.wishlist-icon[data-product-handle="${handle}"]`)
      .forEach(btn => setButtonState(btn, active));
  }

  function initButtons() {
    const wishlist = getWishlist();
    document.querySelectorAll('.wishlist-icon[data-product-handle]').forEach(btn => {
      const handle = btn.dataset.productHandle;
      setButtonState(btn, wishlist.includes(handle));

      if (btn.dataset.wishlistBound) return;
      btn.dataset.wishlistBound = '1';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWishlist(handle);
        syncButtons(handle, added);
      });
    });
  }

  // ── Wishlist page ────────────────────────────────────────────────────────────

  function formatMoney(cents) {
    const fmt = (window.theme && window.theme.moneyFormat) || '{{amount}}';
    return fmt.replace('{{amount}}', (cents / 100).toFixed(3))
              .replace('{{amount_no_decimals}}', Math.floor(cents / 100));
  }

  function buildCard(p) {
    const img = p.images && p.images[0]
      ? `<img src="${p.images[0]}" alt="${p.title}" loading="lazy" class="product-item__primary-image">`
      : '';
    const isOnSale = p.compare_at_price > p.price;
    const priceHtml = `
      <span class="price ${isOnSale ? 'price--highlight' : ''}">${formatMoney(p.price)}</span>
      ${isOnSale ? `<span class="price price--compare">${formatMoney(p.compare_at_price)}</span>` : ''}`;
    const root = (window.routes && window.routes.rootUrlWithoutSlash) || '';

    return `
      <div class="product-item product-item--vertical">
        <div class="product-item__media-container" style="position:relative">
          <a href="${root}/products/${p.handle}" class="product-item__image-wrapper">
            <div class="aspect-ratio aspect-ratio--square">${img}</div>
          </a>
          <div class="product-item__floating-actions">
            <button type="button"
              class="product-item__action-icon wishlist-icon wishlist-icon--active"
              aria-label="Remove from wishlist"
              aria-pressed="true"
              data-product-handle="${p.handle}">
              <svg focusable="false" viewBox="0 0 17 15" role="presentation">
                <path d="M8.5 13.4C6.3 11.5 1 7.3 1 4.2 1 2.4 2.4 1 4.2 1c1.3 0 2.4.7 3.1 1.7L8.5 4l1.2-1.3C10.4 1.7 11.5 1 12.8 1 14.6 1 16 2.4 16 4.2c0 3.1-5.3 7.3-7.5 9.2z" stroke="currentColor" stroke-width="2" fill="currentColor"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="product-item__info">
          <div class="product-item__info-inner">
            <a href="${root}/products/${p.handle}" class="product-item__title text--strong link">${p.title}</a>
            <div class="product-item__price-list price-list">${priceHtml}</div>
          </div>
        </div>
      </div>`;
  }

  function renderPage() {
    const grid      = document.getElementById('wishlist-grid');
    const empty     = document.getElementById('wishlist-empty');
    const loading   = document.getElementById('wishlist-loading');
    if (!grid) return;

    const handles = getWishlist();

    if (handles.length === 0) {
      if (loading) loading.hidden = true;
      grid.hidden   = true;
      if (empty) empty.hidden = false;
      return;
    }

    const root = (window.routes && window.routes.rootUrlWithoutSlash) || '';

    Promise.all(
      handles.map(h =>
        fetch(`${root}/products/${h}.js`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    ).then(products => {
      if (loading) loading.hidden = true;
      const valid = products.filter(Boolean);

      if (valid.length === 0) {
        grid.hidden = true;
        if (empty) empty.hidden = false;
        return;
      }

      grid.innerHTML = valid.map(buildCard).join('');
      grid.hidden = false;

      // Wire remove buttons
      grid.querySelectorAll('.wishlist-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const handle = btn.dataset.productHandle;
          toggleWishlist(handle);
          const card = btn.closest('.product-item');
          if (card) card.remove();
          if (grid.querySelectorAll('.product-item').length === 0) {
            grid.hidden = true;
            if (empty) empty.hidden = false;
          }
        });
      });
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    initButtons();
    renderPage();
  });

  // Re-run after quick-view or dynamic section rendering
  document.addEventListener('shopify:section:load', initButtons);

  // ── Global styles ────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('wishlist-styles')) return;
    const style = document.createElement('style');
    style.id = 'wishlist-styles';
    style.textContent = `
      .wishlist-icon svg { transition: fill 0.2s, color 0.2s; }
      .wishlist-icon--active svg { fill: currentColor; }
      .wishlist-icon:not(.wishlist-icon--active) svg { fill: none; }
    `;
    document.head.appendChild(style);
  }
})();
