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
      counter.style.display = wishlist.length > 0 ? 'inline-flex' : 'none';
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

  function showToast(message) {
    let container = document.querySelector('.custom-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'custom-toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-color);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  window.showToast = showToast;

  // Toggle wishlist item
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.wishlist-icon');
    if (!btn) return;
    
    e.preventDefault();
    const handle = btn.getAttribute('data-product-handle');
    if (!handle) return;
    
    if (wishlist.includes(handle)) {
      wishlist = wishlist.filter(h => h !== handle);
      showToast('Removed from wishlist');
    } else {
      wishlist.push(handle);
      showToast('Added to wishlist');
    }
    
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    updateWishlistUI();
  });

  // AJAX Add to Cart for Quick Add Forms
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (!form.classList.contains('product-item__quick-add-form')) return;
    
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.setAttribute('disabled', 'disabled');
      submitBtn.style.opacity = '0.5';
    }
    
    const formData = new FormData(form);
    
    fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      showToast('Item added to cart');
      
      // Dispatch event to update theme mini-cart and cart counter
      document.documentElement.dispatchEvent(new CustomEvent('product:added', {
        bubbles: true,
        detail: {
          quantity: 1,
          variant: data
        }
      }));
      document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
        bubbles: true
      }));
    })
    .catch((error) => {
      console.error('Error:', error);
      showToast('Failed to add item');
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.removeAttribute('disabled');
        submitBtn.style.opacity = '1';
      }
    });
  });

  // Initial update
  updateWishlistUI();
});
