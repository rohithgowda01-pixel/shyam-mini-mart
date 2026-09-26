const API_URL = "http://localhost:3000/api/products";
const ORDERS_API_URL = "http://localhost:3000/api/orders";
const SHOP_STATUS_API_URL = "http://localhost:3000/api/shop-status";

let products = [];
let cart = [];
let selectedCategory = "all";
let shopOpen = true;
let lastOrderId = null;


// =====================================================
// INITIAL LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadShopStatus();
  updateCartCount();
});


// =====================================================
// SHOP STATUS
// =====================================================

async function loadShopStatus() {
  try {
    const response = await fetch(SHOP_STATUS_API_URL);
    const data = await response.json();

    shopOpen = data.shop_open === true;

    updateCustomerShopStatus();
  } catch (error) {
    console.error("Failed to load shop status:", error);

    shopOpen = true;
    updateCustomerShopStatus();
  }
}


function updateCustomerShopStatus() {
  const statusElement = document.getElementById("shopStatus");

  if (!statusElement) return;

  if (shopOpen) {
    statusElement.textContent = "🟢 Shop Open";
    statusElement.classList.remove("closed");
    statusElement.classList.add("open");
  } else {
    statusElement.textContent = "🔴 Shop Closed";
    statusElement.classList.remove("open");
    statusElement.classList.add("closed");
  }
}


// =====================================================
// PRODUCTS
// =====================================================

async function loadProducts() {
  const productGrid = document.getElementById("productGrid");
  const resultText = document.getElementById("productResultText");

  try {
    productGrid.innerHTML = `
      <div class="loading">
        Loading products...
      </div>
    `;

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    products = await response.json();

    displayProducts(products);

  } catch (error) {
    console.error("Product loading error:", error);

    if (resultText) {
      resultText.textContent = "Unable to load products";
    }

    if (productGrid) {
      productGrid.innerHTML = `
        <div class="empty-message">
          <h3>Unable to load products</h3>
          <p>Please make sure the backend is running.</p>
        </div>
      `;
    }
  }
}


function displayProducts(productList) {
  const productGrid = document.getElementById("productGrid");
  const resultText = document.getElementById("productResultText");

  if (!productGrid) return;

  if (resultText) {
    resultText.textContent =
      `${productList.length} product${productList.length !== 1 ? "s" : ""} found`;
  }

  if (productList.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-message">
        <h3>No products found</h3>
        <p>Try another search or category.</p>
      </div>
    `;

    return;
  }

  productGrid.innerHTML = productList.map(product => {

    const isAvailable =
      String(product.stock || "available").toLowerCase() === "available";

    const imageHTML = product.image
      ? `
        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />

        <div class="product-image-placeholder" style="display:none;">
          🛒
        </div>
      `
      : `
        <div class="product-image-placeholder">
          🛒
        </div>
      `;

    return `
      <div class="product-card">

        <div class="product-image">
          ${imageHTML}
        </div>

        <div class="product-info">

          <span class="product-category">
            ${escapeHTML(product.category || "General")}
          </span>

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          ${
            product.size
              ? `<p class="product-size">${escapeHTML(product.size)}</p>`
              : ""
          }

          ${
            product.description
              ? `<p class="product-description">${escapeHTML(product.description)}</p>`
              : ""
          }

          <div class="product-bottom">

            <strong class="product-price">
              ₹${Number(product.price || 0).toFixed(2)}
            </strong>

            ${
              isAvailable
                ? `
                  <button
                    class="add-cart-btn"
                    onclick="addToCart(${Number(product.id)})"
                    type="button"
                  >
                    Add
                  </button>
                `
                : `
                  <button
                    class="add-cart-btn"
                    type="button"
                    disabled
                  >
                    Out of Stock
                  </button>
                `
            }

          </div>

        </div>

      </div>
    `;
  }).join("");
}


// =====================================================
// SEARCH
// =====================================================

function searchProducts() {
  const searchInput = document.getElementById("productSearch");

  if (!searchInput) return;

  const searchText = searchInput.value.toLowerCase().trim();

  let filteredProducts = products.filter(product => {

    const name = String(product.name || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();
    const description = String(product.description || "").toLowerCase();
    const size = String(product.size || "").toLowerCase();

    const matchesSearch =
      name.includes(searchText) ||
      category.includes(searchText) ||
      description.includes(searchText) ||
      size.includes(searchText);

    const productCategory =
      String(product.category || "").toLowerCase();

    const matchesCategory =
      selectedCategory === "all" ||
      productCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  displayProducts(filteredProducts);
}


// =====================================================
// CATEGORY FILTER
// =====================================================

function filterCategory(category, button) {
  selectedCategory = category;

  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }

  searchProducts();
}


// =====================================================
// CART
// =====================================================

function addToCart(productId) {

  const product = products.find(
    item => Number(item.id) === Number(productId)
  );

  if (!product) {
    alert("Product not found.");
    return;
  }

  const stock =
    String(product.stock || "available").toLowerCase();

  if (stock !== "available") {
    alert("This product is currently out of stock.");
    return;
  }

  const existingItem = cart.find(
    item => Number(item.id) === Number(product.id)
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: Number(product.id),
      name: String(product.name || ""),
      price: Number(product.price || 0),
      size: String(product.size || ""),
      image: String(product.image || ""),
      quantity: 1
    });
  }

  updateCartCount();

  alert(`${product.name} added to cart.`);
}


function removeFromCart(productId) {
  cart = cart.filter(
    item => Number(item.id) !== Number(productId)
  );

  updateCartCount();
  renderCart();
}


function increaseQuantity(productId) {

  const item = cart.find(
    item => Number(item.id) === Number(productId)
  );

  if (!item) return;

  item.quantity += 1;

  updateCartCount();
  renderCart();
}


function decreaseQuantity(productId) {

  const item = cart.find(
    item => Number(item.id) === Number(productId)
  );

  if (!item) return;

  item.quantity -= 1;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  updateCartCount();
  renderCart();
}


function updateCartCount() {

  const cartCount = document.getElementById("cartCount");

  if (!cartCount) return;

  const count = cart.reduce(
    (total, item) => total + Number(item.quantity),
    0
  );

  cartCount.textContent = count;
}


function calculateCartTotal() {

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price) * Number(item.quantity),
    0
  );
}


// =====================================================
// CART PANEL
// =====================================================

function openCart() {

  const overlay = document.getElementById("cartOverlay");

  if (!overlay) return;

  renderCart();

  overlay.classList.add("active");
}


function closeCart() {

  const overlay = document.getElementById("cartOverlay");

  if (!overlay) return;

  overlay.classList.remove("active");
}


function closeCartOutside(event) {

  if (event.target.id === "cartOverlay") {
    closeCart();
  }
}


function renderCart() {

  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  if (!cartItems) return;

  if (cart.length === 0) {

    cartItems.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to continue.</p>
      </div>
    `;

    if (cartTotal) {
      cartTotal.textContent = "0.00";
    }

    return;
  }


  cartItems.innerHTML = cart.map(item => {

    const itemTotal =
      Number(item.price) * Number(item.quantity);

    return `
      <div class="cart-item">

        <div class="cart-item-image">

          ${
            item.image
              ? `
                <img
                  src="${escapeHTML(item.image)}"
                  alt="${escapeHTML(item.name)}"
                />
              `
              : "🛒"
          }

        </div>

        <div class="cart-item-info">

          <h4>
            ${escapeHTML(item.name)}
          </h4>

          ${
            item.size
              ? `<small>${escapeHTML(item.size)}</small>`
              : ""
          }

          <p>
            ₹${Number(item.price).toFixed(2)}
          </p>

          <div class="quantity-controls">

            <button
              onclick="decreaseQuantity(${Number(item.id)})"
              type="button"
            >
              −
            </button>

            <span>
              ${Number(item.quantity)}
            </span>

            <button
              onclick="increaseQuantity(${Number(item.id)})"
              type="button"
            >
              +
            </button>

          </div>

        </div>

        <div class="cart-item-right">

          <strong>
            ₹${itemTotal.toFixed(2)}
          </strong>

          <button
            class="remove-cart-btn"
            onclick="removeFromCart(${Number(item.id)})"
            type="button"
          >
            Remove
          </button>

        </div>

      </div>
    `;
  }).join("");


  if (cartTotal) {
    cartTotal.textContent =
      calculateCartTotal().toFixed(2);
  }
}


// =====================================================
// CHECKOUT
// =====================================================

function openCheckout() {

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  if (!shopOpen) {
    alert("Sorry, the shop is currently closed.");
    return;
  }

  closeCart();

  const checkoutOverlay =
    document.getElementById("checkoutOverlay");

  const checkoutTotal =
    document.getElementById("checkoutTotal");

  if (checkoutTotal) {
    checkoutTotal.textContent =
      calculateCartTotal().toFixed(2);
  }

  if (checkoutOverlay) {
    checkoutOverlay.classList.add("active");
  }
}


function closeCheckout() {

  const checkoutOverlay =
    document.getElementById("checkoutOverlay");

  if (!checkoutOverlay) return;

  checkoutOverlay.classList.remove("active");
}


function closeCheckoutOutside(event) {

  if (event.target.id === "checkoutOverlay") {
    closeCheckout();
  }
}


// =====================================================
// PLACE ORDER
// =====================================================

async function placeOrder(event) {

  event.preventDefault();

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  if (!shopOpen) {
    alert("Sorry, the shop is currently closed.");
    return;
  }


  const customerName =
    document.getElementById("customerName")?.value.trim();

  const phone =
    document.getElementById("customerPhone")?.value.trim();

  const address =
    document.getElementById("customerAddress")?.value.trim();

  const paymentMethod =
    document.getElementById("paymentMethod")?.value;


  if (!customerName || !phone || !address || !paymentMethod) {
    alert("Please fill in all checkout details.");
    return;
  }


  if (!/^[0-9]{10}$/.test(phone)) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }


  const orderData = {

    customer_name: String(customerName),

    phone: String(phone),

    address: String(address),

    payment_method: String(paymentMethod),

    total: Number(
      calculateCartTotal().toFixed(2)
    ),

    items: cart.map(item => ({
      product_id: Number(item.id),
      product_name: String(item.name),
      quantity: Number(item.quantity),
      price: Number(item.price)
    }))

  };


  const placeOrderButton =
    document.querySelector(
      "#checkoutForm .place-order-btn"
    );


  try {

    if (placeOrderButton) {
      placeOrderButton.disabled = true;
      placeOrderButton.textContent = "Placing Order...";
    }


    console.log("Sending order:", orderData);


    const response = await fetch(
      ORDERS_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(orderData)
      }
    );


    const responseText =
      await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        message:
          responseText || "Unknown server response"
      };
    }


    if (!response.ok) {

      throw new Error(
        data.message ||
        `Order failed. Server returned ${response.status}`
      );

    }


    console.log(
      "Order placed successfully:",
      data
    );


    lastOrderId =
      data.order_id ||
      data.order?.id ||
      null;


    cart = [];

    updateCartCount();

    closeCheckout();


    const successOverlay =
      document.getElementById("successOverlay");

    const successOrderId =
      document.getElementById("successOrderId");


    if (successOrderId) {
      successOrderId.textContent =
        lastOrderId || "-";
    }


    if (successOverlay) {
      successOverlay.classList.add("active");
    }


    document.getElementById("checkoutForm")?.reset();


  } catch (error) {

    console.error("PLACE ORDER ERROR:", error);

    alert(
      error.message ||
      "Unable to place order. Please try again."
    );

  } finally {

    if (placeOrderButton) {
      placeOrderButton.disabled = false;
      placeOrderButton.textContent = "Place Order";
    }

  }
}


// =====================================================
// ORDER SUCCESS
// =====================================================

function closeSuccess() {

  const successOverlay =
    document.getElementById("successOverlay");

  if (!successOverlay) return;

  successOverlay.classList.remove("active");
}


function trackSuccessfulOrder() {

  if (!lastOrderId) {
    alert("Order ID is not available.");
    return;
  }

  closeSuccess();

  const trackInput =
    document.getElementById("trackOrderId");

  if (trackInput) {
    trackInput.value = lastOrderId;
  }

  openTrackOrder();

  setTimeout(() => {
    trackOrder();
  }, 100);
}


// =====================================================
// ORDER TRACKING
// =====================================================

function openTrackOrder() {

  const overlay =
    document.getElementById("trackOrderOverlay");

  if (!overlay) return;

  const result =
    document.getElementById("trackingResult");

  if (result) {
    result.innerHTML = "";
  }

  overlay.classList.add("active");

}


function closeTrackOrder() {

  const overlay =
    document.getElementById("trackOrderOverlay");

  if (!overlay) return;

  overlay.classList.remove("active");
}


function closeTrackOrderOutside(event) {

  if (event.target.id === "trackOrderOverlay") {
    closeTrackOrder();
  }
}


async function trackOrder(event) {

  if (event) {
    event.preventDefault();
  }


  const input =
    document.getElementById("trackOrderId");

  const result =
    document.getElementById("trackingResult");


  if (!input || !result) return;


  const orderId =
    input.value.trim();


  if (!orderId) {
    result.innerHTML = `
      <div class="tracking-error">
        Please enter your Order ID.
      </div>
    `;

    return;
  }


  if (!/^[0-9]+$/.test(orderId)) {

    result.innerHTML = `
      <div class="tracking-error">
        Please enter a valid Order ID.
      </div>
    `;

    return;
  }


  result.innerHTML = `
    <div class="tracking-loading">
      Checking your order...
    </div>
  `;


  try {

    const response =
      await fetch(
        `${ORDERS_API_URL}/${Number(orderId)}`
      );


    const responseText =
      await response.text();


    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {};
    }


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Order not found."
      );

    }


    const order =
      data.order || data;


    renderOrderTracking(order);


  } catch (error) {

    console.error(
      "TRACK ORDER ERROR:",
      error
    );


    result.innerHTML = `
      <div class="tracking-error">

        <div class="tracking-error-icon">
          ❌
        </div>

        <h3>Order Not Found</h3>

        <p>
          ${escapeHTML(
            error.message ||
            "Please check your Order ID and try again."
          )}
        </p>

      </div>
    `;
  }
}


// =====================================================
// RENDER ORDER TRACKING
// =====================================================

function renderOrderTracking(order) {

  const result =
    document.getElementById("trackingResult");

  if (!result) return;


  const status =
    String(order.status || "pending").toLowerCase();


  const statusLabels = {

    pending: {
      title: "Order Received",
      icon: "📝"
    },

    confirmed: {
      title: "Order Confirmed",
      icon: "✅"
    },

    preparing: {
      title: "Preparing",
      icon: "👨‍🍳"
    },

    out_for_delivery: {
      title: "Out for Delivery",
      icon: "🚚"
    },

    delivered: {
      title: "Delivered",
      icon: "🎉"
    },

    cancelled: {
      title: "Order Cancelled",
      icon: "❌"
    }

  };


  if (status === "cancelled") {

    result.innerHTML = `
      <div class="tracking-order">

        <div class="tracking-order-header">

          <div>
            <span>Order ID</span>
            <strong>#${Number(order.id)}</strong>
          </div>

          <span class="tracking-cancelled">
            ❌ Cancelled
          </span>

        </div>


        <div class="tracking-cancelled-box">

          <div class="tracking-status-icon">
            ❌
          </div>

          <div>
            <h3>Order Cancelled</h3>
            <p>
              This order has been cancelled.
            </p>
          </div>

        </div>

      </div>
    `;

    return;
  }


  const steps = [
    {
      key: "pending",
      title: "Order Received",
      description: "We received your order.",
      icon: "📝"
    },
    {
      key: "confirmed",
      title: "Order Confirmed",
      description: "Your order has been confirmed.",
      icon: "✅"
    },
    {
      key: "preparing",
      title: "Preparing",
      description: "Your items are being prepared.",
      icon: "👨‍🍳"
    },
    {
      key: "out_for_delivery",
      title: "Out for Delivery",
      description: "Your order is on the way.",
      icon: "🚚"
    },
    {
      key: "delivered",
      title: "Delivered",
      description: "Your order has been delivered.",
      icon: "🎉"
    }
  ];


  const statusIndex =
    steps.findIndex(
      step => step.key === status
    );


  result.innerHTML = `
    <div class="tracking-order">

      <div class="tracking-order-header">

        <div>
          <span>Order ID</span>
          <strong>#${Number(order.id)}</strong>
        </div>

        <div class="tracking-current-status">

          ${
            statusLabels[status]?.icon || "📦"
          }

          ${
            statusLabels[status]?.title ||
            "Order Status"
          }

        </div>

      </div>


      <div class="tracking-timeline">

        ${steps.map((step, index) => {

          let stepClass = "";

          if (statusIndex > index) {
            stepClass = "completed";
          } else if (statusIndex === index) {
            stepClass = "current";
          }

          return `
            <div class="tracking-step ${stepClass}">

              <div class="tracking-step-icon">
                ${step.icon}
              </div>

              <div class="tracking-step-content">

                <h4>
                  ${step.title}
                </h4>

                <p>
                  ${step.description}
                </p>

              </div>

            </div>
          `;

        }).join("")}

      </div>


      <div class="tracking-order-info">

        ${
          order.customer_name
            ? `
              <div>
                <span>Customer</span>
                <strong>
                  ${escapeHTML(
                    String(order.customer_name)
                  )}
                </strong>
              </div>
            `
            : ""
        }

        <div>
          <span>Total</span>
          <strong>
            ₹${Number(order.total || 0).toFixed(2)}
          </strong>
        </div>

      </div>

    </div>
  `;
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =====================================================
// ESC KEY
// =====================================================

document.addEventListener("keydown", event => {

  if (event.key !== "Escape") return;

  closeCart();
  closeCheckout();
  closeSuccess();
  closeTrackOrder();

});