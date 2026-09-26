// =====================================================
// ROHITH MINI MART - CUSTOMER FRONTEND
// =====================================================

const API_URL = "https://shyam-mini-mart.onrender.com/api/products";
const ORDERS_API_URL = "https://shyam-mini-mart.onrender.com/api/orders";
const SHOP_STATUS_API_URL = "https://shyam-mini-mart.onrender.com/api/shop-status";

let products = [];
let cart = [];
let selectedCategory = "all";
let shopOpen = true;
let lastOrderId = null;


// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadShopStatus();
  updateCartCount();

  const searchInput = document.getElementById("productSearch");

  if (searchInput) {
    searchInput.addEventListener("input", searchProducts);
  }
});


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {
  const productGrid = document.getElementById("productGrid");
  const resultText = document.getElementById("productResultText");

  try {
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="loading">
          Loading products...
        </div>
      `;
    }

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
          <p>Please try again later.</p>
        </div>
      `;
    }
  }
}


// =====================================================
// DISPLAY PRODUCTS
// =====================================================

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

  const filteredProducts = products.filter(product => {

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
    alert("Shop is currently closed.");
    return;
  }

  const overlay = document.getElementById("checkoutOverlay");
  const checkoutTotal = document.getElementById("checkoutTotal");

  if (!overlay) return;

  if (checkoutTotal) {
    checkoutTotal.textContent =
      calculateCartTotal().toFixed(2);
  }

  overlay.classList.add("active");
}


function closeCheckout() {

  const overlay = document.getElementById("checkoutOverlay");

  if (!overlay) return;

  overlay.classList.remove("active");
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

  if (event) {
    event.preventDefault();
  }

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  if (!shopOpen) {
    alert("Shop is currently closed.");
    return;
  }

  const customerName =
    document.getElementById("customerName")?.value.trim();

  const customerPhone =
    document.getElementById("customerPhone")?.value.trim();

  const customerAddress =
    document.getElementById("customerAddress")?.value.trim();

  const paymentMethod =
    document.getElementById("paymentMethod")?.value;

  if (!customerName) {
    alert("Please enter your name.");
    return;
  }

  if (!customerPhone) {
    alert("Please enter your phone number.");
    return;
  }

  if (!/^[0-9]{10}$/.test(customerPhone)) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }

  if (!customerAddress) {
    alert("Please enter your delivery address.");
    return;
  }

  if (!paymentMethod) {
    alert("Please select a payment method.");
    return;
  }

  const orderItems = cart.map(item => ({
    product_id: Number(item.id),
    name: String(item.name),
    price: Number(item.price),
    quantity: Number(item.quantity),
    size: String(item.size || "")
  }));

  const totalAmount = calculateCartTotal();

  const orderData = {
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    payment_method: paymentMethod,
    items: orderItems,
    total_amount: totalAmount
  };

  try {

    const response = await fetch(ORDERS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error("Failed to place order");
    }

    const data = await response.json();

    lastOrderId =
      data.order_id ||
      data.id ||
      data.orderId;

    cart = [];

    updateCartCount();
    closeCheckout();
    closeCart();

    const successOverlay =
      document.getElementById("successOverlay");

    const successOrderId =
      document.getElementById("successOrderId");

    if (successOrderId) {
      successOrderId.textContent =
        lastOrderId ? `Order ID: ${lastOrderId}` : "Order placed successfully";
    }

    if (successOverlay) {
      successOverlay.classList.add("active");
    } else {
      alert(
        lastOrderId
          ? `Order placed successfully! Order ID: ${lastOrderId}`
          : "Order placed successfully!"
      );
    }

    const form =
      document.getElementById("checkoutForm");

    if (form) {
      form.reset();
    }

  } catch (error) {

    console.error("Order error:", error);

    alert(
      "Unable to place order right now. Please try again."
    );
  }
}


// =====================================================
// SUCCESS
// =====================================================

function closeSuccess() {

  const overlay =
    document.getElementById("successOverlay");

  if (!overlay) return;

  overlay.classList.remove("active");
}


function trackSuccessfulOrder() {

  closeSuccess();

  if (!lastOrderId) {
    openTrackOrder();
    return;
  }

  const input =
    document.getElementById("trackOrderId");

  if (input) {
    input.value = lastOrderId;
  }

  openTrackOrder();
  trackOrder();
}


// =====================================================
// ORDER TRACKING
// =====================================================

function openTrackOrder() {

  const overlay =
    document.getElementById("trackOrderOverlay");

  if (!overlay) return;

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


async function trackOrder() {

  const input =
    document.getElementById("trackOrderId");

  const result =
    document.getElementById("trackingResult");

  if (!input || !result) return;

  const orderId = input.value.trim();

  if (!orderId) {
    alert("Please enter your order ID.");
    return;
  }

  result.innerHTML = `
    <div class="loading">
      Loading order...
    </div>
  `;

  try {

    const response =
      await fetch(`${ORDERS_API_URL}/${encodeURIComponent(orderId)}`);

    if (!response.ok) {
      throw new Error("Order not found");
    }

    const order =
      await response.json();

    renderOrderTracking(order);

  } catch (error) {

    console.error("Tracking error:", error);

    result.innerHTML = `
      <div class="empty-message">
        <h3>Order not found</h3>
        <p>Please check your Order ID and try again.</p>
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
    String(
      order.status ||
      order.order_status ||
      "pending"
    ).toLowerCase();

  const statusLabels = {
    pending: "Order Placed",
    confirmed: "Order Confirmed",
    preparing: "Preparing Order",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };

  const statusText =
    statusLabels[status] ||
    status.replaceAll("_", " ");

  result.innerHTML = `
    <div class="tracking-card">

      <h3>
        Order #${escapeHTML(
          String(order.id || order.order_id || "")
        )}
      </h3>

      <div class="tracking-status">
        <strong>
          ${escapeHTML(statusText)}
        </strong>
      </div>

      ${
        order.customer_name
          ? `
            <p>
              <strong>Name:</strong>
              ${escapeHTML(order.customer_name)}
            </p>
          `
          : ""
      }

      ${
        order.customer_phone
          ? `
            <p>
              <strong>Phone:</strong>
              ${escapeHTML(order.customer_phone)}
            </p>
          `
          : ""
      }

      ${
        order.customer_address
          ? `
            <p>
              <strong>Address:</strong>
              ${escapeHTML(order.customer_address)}
            </p>
          `
          : ""
      }

      ${
        order.payment_method
          ? `
            <p>
              <strong>Payment:</strong>
              ${escapeHTML(order.payment_method)}
            </p>
          `
          : ""
      }

      ${
        order.total_amount !== undefined
          ? `
            <p>
              <strong>Total:</strong>
              ₹${Number(order.total_amount).toFixed(2)}
            </p>
          `
          : ""
      }

    </div>
  `;
}


// =====================================================
// SHOP STATUS
// =====================================================

async function loadShopStatus() {

  try {

    const response =
      await fetch(SHOP_STATUS_API_URL);

    if (!response.ok) {
      throw new Error("Failed to load shop status");
    }

    const data =
      await response.json();

    shopOpen = data.shop_open === true;

    updateShopStatusUI();

  } catch (error) {

    console.error(
      "Shop status error:",
      error
    );

    shopOpen = true;
    updateShopStatusUI();
  }
}


function updateShopStatusUI() {

  const statusElements =
    document.querySelectorAll(
      ".shop-status, #shopStatus"
    );

  statusElements.forEach(element => {

    element.textContent =
      shopOpen
        ? "Mini Mart Open"
        : "Mini Mart Closed";

    element.classList.toggle(
      "open",
      shopOpen
    );

    element.classList.toggle(
      "closed",
      !shopOpen
    );
  });
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}