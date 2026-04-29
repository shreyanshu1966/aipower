/**
 * Include your custom JavaScript here.
 *
 * We also offer some hooks so you can plug your own logic. For instance, if you want to be notified when the variant
 * changes on product page, you can attach a listener to the document:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   var variant = event.detail.variant; // Gives you access to the whole variant details
 * });
 *
 * You can also add a listener whenever a product is added to the cart:
 *
 * document.addEventListener('product:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 *   var quantity = event.detail.quantity; // Get the quantity that was added
 * });
 *
 * If you are an app developer and requires the theme to re-render the mini-cart, you can trigger your own event. If
 * you are adding a product, you need to trigger the "product:added" event, and make sure that you pass the quantity
 * that was added so the theme can properly update the quantity:
 *
 * document.documentElement.dispatchEvent(new CustomEvent('product:added', {
 *   bubbles: true,
 *   detail: {
 *     quantity: 1
 *   }
 * }));
 *
 * If you just want to force refresh the mini-cart without adding a specific product, you can trigger the event
 * "cart:refresh" in a similar way (in that case, passing the quantity is not necessary):
 *
 * document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
 *   bubbles: true
 * }));
 */


document.addEventListener('DOMContentLoaded', function() {
  const wishlistKey = 'shopify_wishlist';
  let wishlist = JSON.parse(localStorage.getItem(wishlistKey) || '[]');
  
  function updateWishlistUI() {
    // Update counter in header
    const counters = document.querySelectorAll('.wishlist-count');
    counters.forEach(counter => {
      counter.textContent = wishlist.length;
      counter.style.display = wishlist.length > 0 ? 'inline-block' : 'none';
    });

    // Update active states on product cards
    document.querySelectorAll('.wishlist-icon').forEach(btn => {
      const handle = btn.getAttribute('data-product-handle');
      if (wishlist.includes(handle)) {
        btn.classList.add('is-active');
        btn.style.background = 'var(--accent-color, #ff4d4f)';
        btn.style.color = 'white';
      } else {
        btn.classList.remove('is-active');
        btn.style.background = '';
        btn.style.color = '';
      }
    });
  }

  // Toggle wishlist item
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.wishlist-icon');
    if (!btn) return;
    
    e.preventDefault();
    const handle = btn.getAttribute('data-product-handle');
    if (!handle) return;
    
    if (wishlist.includes(handle)) {
      wishlist = wishlist.filter(h => h !== handle);
    } else {
      wishlist.push(handle);
    }
    
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    updateWishlistUI();
  });

  // Initial update
  updateWishlistUI();
});

