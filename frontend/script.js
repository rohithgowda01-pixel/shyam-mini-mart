// =====================================================
// VILLAGE MART - CUSTOMER WEBSITE
// =====================================================

// LIVE BACKEND
const API_URL = "https://shyam-mini-mart.onrender.com/api/products";
const ORDERS_API_URL = "https://shyam-mini-mart.onrender.com/api/orders";
const SHOP_STATUS_API_URL = "https://shyam-mini-mart.onrender.com/api/shop-status";


// =====================================================
// VARIABLES
// =====================================================

let products = [];
let cart = [];
let selectedCategory = "all";
let shopOpen = true;
let lastOrderId = null;


// =====================================================
// SAMPLE PRODUCTS
// Used only if backend has no products
// =====================================================

const sampleProducts = [
    {
        id: 1001,
        name: "Rice",
        size: "5 Kg",
        price: 350,
        category: "groceries",
        image: "",
        stock: "available",
        description: "Premium quality rice"
    },
    {
        id: 1002,
        name: "Sugar",
        size: "1 Kg",
        price: 50,
        category: "groceries",
        image: "",
        stock: "available",
        description: "White sugar"
    },
    {
        id: 1003,
        name: "Tata Salt",
        size: "1 Kg",
        price: 30,
        category: "groceries",
        image: "",
        stock: "available",
        description: "Iodized salt"
    },
    {
        id: 1004,
        name: "Toor Dal",
        size: "1 Kg",
        price: 160,
        category: "groceries",
        image: "",
        stock: "available",
        description: "Premium toor dal"
    },
    {
        id: 1005,
        name: "Milk",
        size: "1 Litre",
        price: 60,
        category: "dairy",
        image: "",
        stock: "available",
        description: "Fresh milk"
    },
    {
        id: 1006,
        name: "Biscuits",
        size: "100 g",
        price: 20,
        category: "snacks",
        image: "",
        stock: "available",
        description: "Tasty biscuits"
    },
    {
        id: 1007,
        name: "Coca Cola",
        size: "750 ml",
        price: 40,
        category: "drinks",
        image: "",
        stock: "available",
        description: "Refreshing soft drink"
    },
    {
        id: 1008,
        name: "Bath Soap",
        size: "100 g",
        price: 40,
        category: "personal",
        image: "",
        stock: "available",
        description: "Refreshing bath soap"
    }
];


// =====================================================
// START
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    loadProducts();

    loadShopStatus();

    updateCartCount();

    var searchInput =
        document.getElementById("productSearch");

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            searchProducts
        );
    }

    // Check shop status every 10 seconds
    setInterval(function () {
        loadShopStatus();
    }, 10000);

});


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    var productGrid =
        document.getElementById("productGrid");

    var resultText =
        document.getElementById("productResultText");

    if (productGrid) {

        productGrid.innerHTML =
            '<div class="loading">Loading products...</div>';

    }

    try {

        var response =
            await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load products");
        }

        var data =
            await response.json();

        if (Array.isArray(data) && data.length > 0) {

            products = data;

        } else {

            products = sampleProducts;

        }

        displayProducts(products);

    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        products = sampleProducts;

        displayProducts(products);

        if (resultText) {

            resultText.textContent =
                products.length + " products";

        }

    }

}


// =====================================================
// DISPLAY PRODUCTS
// =====================================================

function displayProducts(productList) {

    var productGrid =
        document.getElementById("productGrid");

    var resultText =
        document.getElementById("productResultText");

    if (!productGrid) {
        return;
    }

    if (resultText) {

        resultText.textContent =
            productList.length +
            " product" +
            (productList.length !== 1 ? "s" : "") +
            " found";

    }

    if (productList.length === 0) {

        productGrid.innerHTML =
            '<div class="empty-message">' +
            '<h3>No products found</h3>' +
            '<p>Try another search or category.</p>' +
            '</div>';

        return;

    }

    var html = "";

    productList.forEach(function (product) {

        var isAvailable =
            String(
                product.stock || "available"
            ).toLowerCase() === "available";

        var imageHTML = "";

        if (product.image) {

            imageHTML =
                '<img src="' +
                escapeHTML(product.image) +
                '" alt="' +
                escapeHTML(product.name) +
                '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' +
                '<div class="product-image-placeholder" style="display:none;">' +
                "🛒" +
                "</div>";

        } else {

            imageHTML =
                '<div class="product-image-placeholder">' +
                "🛒" +
                "</div>";

        }

        var sizeHTML = "";

        if (product.size) {

            sizeHTML =
                '<p class="product-size">' +
                escapeHTML(product.size) +
                "</p>";

        }

        var descriptionHTML = "";

        if (product.description) {

            descriptionHTML =
                '<p class="product-description">' +
                escapeHTML(product.description) +
                "</p>";

        }

        var buttonHTML = "";

        if (isAvailable) {

            buttonHTML =
                '<button class="add-cart-btn" ' +
                'onclick="addToCart(' +
                Number(product.id) +
                ')" type="button">' +
                "Add" +
                "</button>";

        } else {

            buttonHTML =
                '<button class="add-cart-btn" type="button" disabled>' +
                "Out of Stock" +
                "</button>";

        }

        html +=
            '<div class="product-card">' +

            '<div class="product-image">' +
            imageHTML +
            "</div>" +

            '<div class="product-info">' +

            '<span class="product-category">' +
            escapeHTML(product.category || "General") +
            "</span>" +

            "<h3>" +
            escapeHTML(product.name || "Product") +
            "</h3>" +

            sizeHTML +

            descriptionHTML +

            '<div class="product-bottom">' +

            '<strong class="product-price">' +
            "₹" +
            Number(product.price || 0).toFixed(2) +
            "</strong>" +

            buttonHTML +

            "</div>" +

            "</div>" +

            "</div>";

    });

    productGrid.innerHTML = html;

}


// =====================================================
// SEARCH
// =====================================================

function searchProducts() {

    var searchInput =
        document.getElementById("productSearch");

    if (!searchInput) {
        return;
    }

    var searchText =
        searchInput.value.toLowerCase().trim();

    var filteredProducts =
        products.filter(function (product) {

            var name =
                String(product.name || "").toLowerCase();

            var category =
                String(product.category || "").toLowerCase();

            var description =
                String(product.description || "").toLowerCase();

            var size =
                String(product.size || "").toLowerCase();

            var matchesSearch =
                name.includes(searchText) ||
                category.includes(searchText) ||
                description.includes(searchText) ||
                size.includes(searchText);

            var productCategory =
                String(product.category || "").toLowerCase();

            var matchesCategory =
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

    var buttons =
        document.querySelectorAll(".category-btn");

    buttons.forEach(function (btn) {

        btn.classList.remove("active");

    });

    if (button) {

        button.classList.add("active");

    }

    searchProducts();

}


// =====================================================
// ADD TO CART
// =====================================================

function addToCart(productId) {

    if (!shopOpen) {

        alert("Shop is currently closed.");

        return;

    }

    var product =
        products.find(function (item) {

            return Number(item.id) === Number(productId);

        });

    if (!product) {

        alert("Product not found.");

        return;

    }

    var stock =
        String(
            product.stock || "available"
        ).toLowerCase();

    if (stock !== "available") {

        alert(
            "This product is currently out of stock."
        );

        return;

    }

    var existingItem =
        cart.find(function (item) {

            return Number(item.id) ===
                Number(product.id);

        });

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

    alert(
        product.name +
        " added to cart."
    );

}


// =====================================================
// REMOVE FROM CART
// =====================================================

function removeFromCart(productId) {

    cart =
        cart.filter(function (item) {

            return Number(item.id) !==
                Number(productId);

        });

    updateCartCount();

    renderCart();

}


// =====================================================
// INCREASE QUANTITY
// =====================================================

function increaseQuantity(productId) {

    var item =
        cart.find(function (item) {

            return Number(item.id) ===
                Number(productId);

        });

    if (!item) {
        return;
    }

    item.quantity += 1;

    updateCartCount();

    renderCart();

}


// =====================================================
// DECREASE QUANTITY
// =====================================================

function decreaseQuantity(productId) {

    var item =
        cart.find(function (item) {

            return Number(item.id) ===
                Number(productId);

        });

    if (!item) {
        return;
    }

    item.quantity -= 1;

    if (item.quantity <= 0) {

        removeFromCart(productId);

        return;

    }

    updateCartCount();

    renderCart();

}


// =====================================================
// CART COUNT
// =====================================================

function updateCartCount() {

    var cartCount =
        document.getElementById("cartCount");

    if (!cartCount) {
        return;
    }

    var count =
        cart.reduce(function (total, item) {

            return total +
                Number(item.quantity);

        }, 0);

    cartCount.textContent = count;

}


// =====================================================
// CART TOTAL
// =====================================================

function calculateCartTotal() {

    return cart.reduce(function (total, item) {

        return total +
            Number(item.price) *
            Number(item.quantity);

    }, 0);

}


// =====================================================
// OPEN CART
// =====================================================

function openCart() {

    var overlay =
        document.getElementById("cartOverlay");

    if (!overlay) {
        return;
    }

    renderCart();

    overlay.classList.add("active");

}


// =====================================================
// CLOSE CART
// =====================================================

function closeCart() {

    var overlay =
        document.getElementById("cartOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("active");

}


// =====================================================
// CLOSE CART OUTSIDE
// =====================================================

function closeCartOutside(event) {

    if (event.target.id === "cartOverlay") {

        closeCart();

    }

}


// =====================================================
// RENDER CART
// =====================================================

function renderCart() {

    var cartItems =
        document.getElementById("cartItems");

    var cartTotal =
        document.getElementById("cartTotal");

    if (!cartItems) {
        return;
    }

    if (cart.length === 0) {

        cartItems.innerHTML =
            '<div class="empty-cart">' +
            '<div class="empty-cart-icon">🛒</div>' +
            '<h3>Your cart is empty</h3>' +
            '<p>Add some products to continue.</p>' +
            "</div>";

        if (cartTotal) {

            cartTotal.textContent = "0.00";

        }

        return;

    }

    var html = "";

    cart.forEach(function (item) {

        var itemTotal =
            Number(item.price) *
            Number(item.quantity);

        var imageHTML = "";

        if (item.image) {

            imageHTML =
                '<img src="' +
                escapeHTML(item.image) +
                '" alt="' +
                escapeHTML(item.name) +
                '">';

        } else {

            imageHTML = "🛒";

        }

        var sizeHTML = "";

        if (item.size) {

            sizeHTML =
                "<small>" +
                escapeHTML(item.size) +
                "</small>";

        }

        html +=
            '<div class="cart-item">' +

            '<div class="cart-item-image">' +
            imageHTML +
            "</div>" +

            '<div class="cart-item-info">' +

            "<h4>" +
            escapeHTML(item.name) +
            "</h4>" +

            sizeHTML +

            "<p>" +
            "₹" +
            Number(item.price).toFixed(2) +
            "</p>" +

            '<div class="quantity-controls">' +

            '<button onclick="decreaseQuantity(' +
            Number(item.id) +
            ')" type="button">−</button>' +

            "<span>" +
            Number(item.quantity) +
            "</span>" +

            '<button onclick="increaseQuantity(' +
            Number(item.id) +
            ')" type="button">+</button>' +

            "</div>" +

            "</div>" +

            '<div class="cart-item-right">' +

            "<strong>" +
            "₹" +
            itemTotal.toFixed(2) +
            "</strong>" +

            '<button class="remove-cart-btn" ' +
            'onclick="removeFromCart(' +
            Number(item.id) +
            ')" type="button">' +
            "Remove" +
            "</button>" +

            "</div>" +

            "</div>";

    });

    cartItems.innerHTML = html;

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

    var overlay =
        document.getElementById("checkoutOverlay");

    var checkoutTotal =
        document.getElementById("checkoutTotal");

    if (!overlay) {
        return;
    }

    if (checkoutTotal) {

        checkoutTotal.textContent =
            calculateCartTotal().toFixed(2);

    }

    overlay.classList.add("active");

}


// =====================================================
// CLOSE CHECKOUT
// =====================================================

function closeCheckout() {

    var overlay =
        document.getElementById("checkoutOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("active");

}


// =====================================================
// CLOSE CHECKOUT OUTSIDE
// =====================================================

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

    var nameElement =
        document.getElementById("customerName");

    var phoneElement =
        document.getElementById("customerPhone");

    var addressElement =
        document.getElementById("customerAddress");

    var paymentElement =
        document.getElementById("paymentMethod");

    var customerName =
        nameElement
            ? nameElement.value.trim()
            : "";

    var customerPhone =
        phoneElement
            ? phoneElement.value.trim()
            : "";

    var customerAddress =
        addressElement
            ? addressElement.value.trim()
            : "";

    var paymentMethod =
        paymentElement
            ? paymentElement.value
            : "";

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

    var orderItems =
        cart.map(function (item) {

            return {
                product_id: Number(item.id),
                product_name: String(item.name),
                quantity: Number(item.quantity),
                price: Number(item.price)
            };

        });

    var totalAmount =
        calculateCartTotal();

    var orderData = {

        customer_name: customerName,

        phone: customerPhone,

        address: customerAddress,

        payment_method: paymentMethod,

        total: Number(totalAmount),

        items: orderItems

    };

    try {

        var response =
            await fetch(
                ORDERS_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(orderData)
                }
            );

        var data =
            await response.json();

        if (!response.ok) {

    console.log("BACKEND ORDER RESPONSE:", data);

    throw new Error(
        data.message ||
        data.error ||
        "Failed to create order"
    );

}

        lastOrderId =
            data.order_id ||
            data.id ||
            data.orderId;

        cart = [];

        updateCartCount();

        closeCheckout();

        closeCart();

        var successOverlay =
            document.getElementById("successOverlay");

        var successOrderId =
            document.getElementById("successOrderId");

        if (successOrderId) {

            if (lastOrderId) {

                successOrderId.textContent =
                    "Order ID: " +
                    lastOrderId;

            } else {

                successOrderId.textContent =
                    "Order placed successfully";

            }

        }

        if (successOverlay) {

            successOverlay.classList.add("active");

        } else {

            if (lastOrderId) {

                alert(
                    "Order placed successfully! Order ID: " +
                    lastOrderId
                );

            } else {

                alert(
                    "Order placed successfully!"
                );

            }

        }

        var form =
            document.getElementById("checkoutForm");

        if (form) {
            form.reset();
        }

    } catch (error) {

        console.error(
            "Order error:",
            error
        );

        alert(
            error.message ||
            "Unable to place order right now. Please try again."
        );

    }

}


// =====================================================
// CLOSE SUCCESS
// =====================================================

function closeSuccess() {

    var overlay =
        document.getElementById("successOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("active");

}


// =====================================================
// TRACK SUCCESSFUL ORDER
// =====================================================

function trackSuccessfulOrder() {

    closeSuccess();

    if (!lastOrderId) {

        openTrackOrder();

        return;

    }

    var input =
        document.getElementById("trackOrderId");

    if (input) {

        input.value = lastOrderId;

    }

    openTrackOrder();

    trackOrder();

}


// =====================================================
// OPEN TRACK ORDER
// =====================================================

function openTrackOrder() {

    var overlay =
        document.getElementById("trackOrderOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.add("active");

}


// =====================================================
// CLOSE TRACK ORDER
// =====================================================

function closeTrackOrder() {

    var overlay =
        document.getElementById("trackOrderOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.remove("active");

}


// =====================================================
// CLOSE TRACK ORDER OUTSIDE
// =====================================================

function closeTrackOrderOutside(event) {

    if (event.target.id === "trackOrderOverlay") {

        closeTrackOrder();

    }

}


// =====================================================
// TRACK ORDER
// =====================================================

async function trackOrder() {

    var input =
        document.getElementById("trackOrderId");

    var result =
        document.getElementById("trackingResult");

    if (!input || !result) {
        return;
    }

    var orderId =
        input.value.trim();

    if (!orderId) {

        alert(
            "Please enter your order ID."
        );

        return;

    }

    result.innerHTML =
        '<div class="loading">Loading order...</div>';

    try {

        var response =
            await fetch(
                ORDERS_API_URL +
                "/" +
                encodeURIComponent(orderId)
            );

        if (!response.ok) {

            throw new Error(
                "Order not found"
            );

        }

        var order =
            await response.json();

        renderOrderTracking(order);

    } catch (error) {

        console.error(
            "Tracking error:",
            error
        );

        result.innerHTML =
            '<div class="empty-message">' +
            '<h3>Order not found</h3>' +
            '<p>Please check your Order ID and try again.</p>' +
            "</div>";

    }

}


// =====================================================
// RENDER ORDER TRACKING
// =====================================================

function renderOrderTracking(order) {

    var result =
        document.getElementById("trackingResult");

    if (!result) {
        return;
    }

    var status =
        String(
            order.status ||
            order.order_status ||
            "pending"
        ).toLowerCase();

    var statusLabels = {

        pending: "Order Placed",

        confirmed: "Order Confirmed",

        preparing: "Preparing Order",

        out_for_delivery: "Out for Delivery",

        delivered: "Delivered",

        cancelled: "Cancelled"

    };

    var statusText =
        statusLabels[status] ||
        status.replace(/_/g, " ");

    var html = "";

    html +=
        '<div class="tracking-card">';

    html +=
        "<h3>Order #" +
        escapeHTML(
            String(
                order.id ||
                order.order_id ||
                ""
            )
        ) +
        "</h3>";

    html +=
        '<div class="tracking-status">' +
        "<strong>" +
        escapeHTML(statusText) +
        "</strong>" +
        "</div>";

    if (order.customer_name) {

        html +=
            "<p><strong>Name:</strong> " +
            escapeHTML(
                order.customer_name
            ) +
            "</p>";

    }

    if (order.customer_phone) {

        html +=
            "<p><strong>Phone:</strong> " +
            escapeHTML(
                order.customer_phone
            ) +
            "</p>";

    }

    if (order.customer_address) {

        html +=
            "<p><strong>Address:</strong> " +
            escapeHTML(
                order.customer_address
            ) +
            "</p>";

    }

    if (order.payment_method) {

        html +=
            "<p><strong>Payment:</strong> " +
            escapeHTML(
                order.payment_method
            ) +
            "</p>";

    }

    if (order.total_amount !== undefined) {

        html +=
            "<p><strong>Total:</strong> ₹" +
            Number(
                order.total_amount
            ).toFixed(2) +
            "</p>";

    }

    html += "</div>";

    result.innerHTML = html;

}
function updateShopStatusUI() {

    var statusElement = document.getElementById("shopStatus");

    if (!statusElement) {
        console.error("shopStatus element not found");
        return;
    }

    if (shopOpen) {
        statusElement.textContent = "🟢 Shop Open";
        statusElement.className = "shop-status open";
    } else {
        statusElement.textContent = "🔴 Shop Closed";
        statusElement.className = "shop-status closed";
    }
}


// =====================================================
// SHOP STATUS
// =====================================================

async function loadShopStatus() {

    try {

        var response = await fetch(
            SHOP_STATUS_API_URL + "?t=" + Date.now(),
            {
                method: "GET",
                cache: "no-store"
            }
        );

        var data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to get shop status"
            );
        }

        var statusValue = data.shopOpen;

        if (statusValue === undefined) {
            statusValue = data.open;
        }

        shopOpen =
            statusValue === true ||
            statusValue === 1 ||
            statusValue === "1" ||
            statusValue === "true";

        updateShopStatusUI();

        console.log(
            "CUSTOMER SHOP STATUS:",
            shopOpen ? "OPEN" : "CLOSED"
        );

    } catch (error) {

        console.error(
            "Shop status error:",
            error
        );

    }
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}