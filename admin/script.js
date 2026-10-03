/* =========================================================
   ROHITH MINI MART - FINAL ADMIN SCRIPT
   Matches the current admin/index.html and server.js
========================================================= */

var API_BASE = "https://shyam-mini-mart.onrender.com";

var PRODUCTS_API = API_BASE + "/api/products";
var ORDERS_API = API_BASE + "/api/orders";
var SHOP_STATUS_API = API_BASE + "/api/shop-status";
var LOGIN_API = API_BASE + "/api/admin/login";
var CHECK_LOGIN_API = API_BASE + "/api/admin/check";

var TOKEN_KEY = "rohith_admin_token";

var products = [];
var orders = [];
var currentEditingProductId = null;


/* =========================================================
   BASIC HELPERS
========================================================= */

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}


function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}


function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}


function authHeaders() {

    var token = getToken();

    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
    };
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatPrice(value) {

    var number = Number(value);

    if (isNaN(number)) {
        number = 0;
    }

    return "₹" + number.toFixed(2);
}


function formatDate(value) {

    if (!value) {
        return "-";
    }

    var date = new Date(value);

    if (isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-IN");
}


function showElement(id) {

    var element = document.getElementById(id);

    if (element) {
        element.classList.remove("hidden-section");
    }
}


function hideElement(id) {

    var element = document.getElementById(id);

    if (element) {
        element.classList.add("hidden-section");
    }
}


/* =========================================================
   LOGIN SCREEN
========================================================= */

function showLoginScreen() {

    var loginScreen =
        document.getElementById("adminLoginScreen");

    var adminPanel =
        document.getElementById("adminPanel");

    if (loginScreen) {
        loginScreen.style.display = "flex";
    }

    if (adminPanel) {
        adminPanel.style.display = "none";
    }
}


function showAdminPanel() {

    var loginScreen =
        document.getElementById("adminLoginScreen");

    var adminPanel =
        document.getElementById("adminPanel");

    if (loginScreen) {
        loginScreen.style.display = "none";
    }

    if (adminPanel) {
        adminPanel.style.display = "block";
    }
}


/* =========================================================
   LOGIN
========================================================= */

async function adminLogin(event) {

    if (event) {
        event.preventDefault();
    }

    var usernameElement =
        document.getElementById("adminUsername");

    var passwordElement =
        document.getElementById("adminPassword");

    var errorElement =
        document.getElementById("loginError");

    var button =
        document.getElementById("loginButton");

    var username =
        usernameElement
            ? usernameElement.value.trim()
            : "";

    var password =
        passwordElement
            ? passwordElement.value
            : "";

    if (errorElement) {
        errorElement.textContent = "";
    }

    if (!username || !password) {

        if (errorElement) {
            errorElement.textContent =
                "Enter username and password.";
        }

        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Logging in...";
    }

    try {

        var response = await fetch(
            LOGIN_API,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );

        var data = await response.json();

        if (!response.ok || !data.success || !data.token) {

            throw new Error(
                data.message ||
                "Invalid username or password."
            );
        }

        setToken(data.token);

        if (errorElement) {
            errorElement.textContent = "";
        }

        showAdminPanel();

        await initializeAdminPanel();

    } catch (error) {

        console.error("Login error:", error);

        removeToken();

        if (errorElement) {
            errorElement.textContent =
                error.message ||
                "Login failed.";
        }

    } finally {

        if (button) {
            button.disabled = false;
            button.textContent = "Login";
        }
    }
}


/* =========================================================
   CHECK LOGIN
========================================================= */

async function checkAdminLogin() {

    var token = getToken();

    if (!token) {

        showLoginScreen();
        return false;
    }

    try {

        var response = await fetch(
            CHECK_LOGIN_API,
            {
                method: "GET",
                headers: authHeaders()
            }
        );

        if (!response.ok) {

            removeToken();
            showLoginScreen();

            return false;
        }

        var data = await response.json();

        if (!data.success) {

            removeToken();
            showLoginScreen();

            return false;
        }

        showAdminPanel();

        return true;

    } catch (error) {

        console.error(
            "Login check error:",
            error
        );

        removeToken();
        showLoginScreen();

        return false;
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function adminLogout() {

    removeToken();

    products = [];
    orders = [];

    showLoginScreen();

    var username =
        document.getElementById("adminUsername");

    var password =
        document.getElementById("adminPassword");

    var error =
        document.getElementById("loginError");

    if (username) {
        username.value = "";
    }

    if (password) {
        password.value = "";
    }

    if (error) {
        error.textContent = "";
    }
}


/* =========================================================
   ADMIN SECTION NAVIGATION
========================================================= */

function showAdminSection(sectionName, clickedButton) {

    var productsSection =
        document.getElementById("productsSection");

    var ordersSection =
        document.getElementById("ordersSection");

    var dashboardSection =
        document.getElementById("dashboardSection");

    if (productsSection) {
        productsSection.classList.add("hidden-section");
    }

    if (ordersSection) {
        ordersSection.classList.add("hidden-section");
    }

    if (dashboardSection) {
        dashboardSection.classList.add("hidden-section");
    }

    if (sectionName === "products") {

        if (productsSection) {
            productsSection.classList.remove(
                "hidden-section"
            );
        }

        loadProducts();

    } else if (sectionName === "orders") {

        if (ordersSection) {
            ordersSection.classList.remove(
                "hidden-section"
            );
        }

        loadOrders();

    } else if (sectionName === "dashboard") {

        if (dashboardSection) {
            dashboardSection.classList.remove(
                "hidden-section"
            );
        }

        loadDashboard();

    }

    var buttons =
        document.querySelectorAll(
            ".admin-nav button, .sidebar button, nav button"
        );

    buttons.forEach(function(button) {
        button.classList.remove("active");
    });

    if (clickedButton) {
        clickedButton.classList.add("active");
    }
}


/* =========================================================
   INITIALIZE ADMIN
========================================================= */

async function initializeAdminPanel() {

    try {

        await loadProducts();
        await loadOrders();
        await loadShopStatus();
        updateDashboard();

        showAdminSection(
            "products",
            null
        );

    } catch (error) {

        console.error(
            "Admin initialization error:",
            error
        );
    }
}


/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts() {

    try {

        var response =
            await fetch(PRODUCTS_API);

        if (!response.ok) {
            throw new Error(
                "Failed to load products."
            );
        }

        var data =
            await response.json();

        products =
            Array.isArray(data)
                ? data
                : [];

        renderAdminProducts(products);
        updateProductStats();
        updateDashboard();

        return products;

    } catch (error) {

        console.error(
            "Load products error:",
            error
        );

        var tbody =
            document.getElementById(
                "adminProductList"
            );

        if (tbody) {

            tbody.innerHTML =
                '<tr><td colspan="6">Unable to load products.</td></tr>';
        }

        throw error;
    }
}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderAdminProducts(productList) {

    var tbody =
        document.getElementById(
            "adminProductList"
        );

    if (!tbody) {
        console.error(
            "adminProductList not found."
        );
        return;
    }

    if (
        !productList ||
        productList.length === 0
    ) {

        tbody.innerHTML =
            '<tr><td colspan="6">No products found.</td></tr>';

        return;
    }

    var html = "";

    productList.forEach(function(product) {

        var stockText =
            String(product.stock || "available");

        var stockLower =
            stockText.toLowerCase();

        var stockClass =
            stockLower === "available"
                ? "available"
                : "out-of-stock";

        var imageHtml = "";

        if (product.image) {

            var imageUrl =
                String(product.image);

            if (
                !imageUrl.startsWith("http://") &&
                !imageUrl.startsWith("https://")
            ) {

                imageUrl =
                    API_BASE + "/" +
                    imageUrl.replace(/^\/+/, "");
            }

            imageHtml =
                '<img src="' +
                escapeHtml(imageUrl) +
                '" alt="' +
                escapeHtml(product.name) +
                '" style="width:45px;height:45px;object-fit:cover;border-radius:8px;" onerror="this.style.display=\'none\'">';
        }

        html +=
            "<tr>" +

            "<td>" +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                    imageHtml +
                    "<div>" +
                        "<strong>" +
                            escapeHtml(product.name) +
                        "</strong>" +
                        "<br>" +
                        '<small>ID: ' +
                            escapeHtml(product.id) +
                        "</small>" +
                    "</div>" +
                "</div>" +
            "</td>" +

            "<td>" +
                escapeHtml(product.category) +
            "</td>" +

            "<td>" +
                escapeHtml(product.size) +
            "</td>" +

            "<td>" +
                formatPrice(product.price) +
            "</td>" +

            '<td class="' +
                stockClass +
            '">' +
                escapeHtml(stockText) +
            "</td>" +

            "<td>" +

                '<button type="button" onclick="editProduct(' +
                    product.id +
                ')">Edit</button> ' +

                '<button type="button" onclick="deleteProduct(' +
                    product.id +
                ')" style="margin-left:5px;">Delete</button>' +

            "</td>" +

            "</tr>";
    });

    tbody.innerHTML = html;
}


/* =========================================================
   PRODUCT STATS
========================================================= */

function updateProductStats() {

    var total =
        products.length;

    var available =
        products.filter(function(product) {

            return String(product.stock)
                .toLowerCase() === "available";

        }).length;

    var outOfStock =
        total - available;

    var totalElement =
        document.getElementById(
            "totalProducts"
        );

    var availableElement =
        document.getElementById(
            "availableProducts"
        );

    var outElement =
        document.getElementById(
            "outOfStockProducts"
        );

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (availableElement) {
        availableElement.textContent =
            available;
    }

    if (outElement) {
        outElement.textContent =
            outOfStock;
    }
}


/* =========================================================
   SEARCH PRODUCTS
========================================================= */

function searchAdminProducts() {

    var input =
        document.getElementById(
            "adminSearch"
        );

    var query =
        input
            ? input.value.toLowerCase().trim()
            : "";

    if (!query) {

        renderAdminProducts(products);
        return;
    }

    var filtered =
        products.filter(function(product) {

            var text =
                String(product.name || "") +
                " " +
                String(product.category || "") +
                " " +
                String(product.size || "") +
                " " +
                String(product.description || "");

            return text
                .toLowerCase()
                .includes(query);
        });

    renderAdminProducts(filtered);
}


/* =========================================================
   OPEN ADD PRODUCT FORM
========================================================= */

function openProductForm() {

    currentEditingProductId = null;

    var overlay =
        document.getElementById(
            "productFormOverlay"
        );

    var title =
        document.getElementById(
            "formTitle"
        );

    var form =
        document.getElementById(
            "productForm"
        );

    if (title) {
        title.textContent = "Add Product";
    }

    if (form) {
        form.reset();
    }

    var productId =
        document.getElementById(
            "productId"
        );

    if (productId) {
        productId.value = "";
    }

    var stock =
        document.getElementById(
            "productStock"
        );

    if (stock) {
        stock.value = "available";
    }

    if (overlay) {
        overlay.classList.add("show");
        overlay.style.display = "flex";
    }
}


/* =========================================================
   CLOSE PRODUCT FORM
========================================================= */

function closeProductForm() {

    var overlay =
        document.getElementById(
            "productFormOverlay"
        );

    if (overlay) {

        overlay.classList.remove("show");
        overlay.style.display = "none";
    }

    currentEditingProductId = null;
}


function closeFormOutside(event) {

    if (
        event &&
        event.target &&
        event.target.id === "productFormOverlay"
    ) {

        closeProductForm();
    }
}


/* =========================================================
   EDIT PRODUCT
========================================================= */

function editProduct(id) {

    var product =
        products.find(function(item) {

            return Number(item.id) ===
                Number(id);

        });

    if (!product) {

        alert("Product not found.");
        return;
    }

    currentEditingProductId =
        Number(product.id);

    var title =
        document.getElementById(
            "formTitle"
        );

    var productId =
        document.getElementById(
            "productId"
        );

    var name =
        document.getElementById(
            "productName"
        );

    var size =
        document.getElementById(
            "productSize"
        );

    var price =
        document.getElementById(
            "productPrice"
        );

    var category =
        document.getElementById(
            "productCategory"
        );

    var image =
        document.getElementById(
            "productImage"
        );

    var stock =
        document.getElementById(
            "productStock"
        );

    var description =
        document.getElementById(
            "productDescription"
        );

    if (title) {
        title.textContent = "Edit Product";
    }

    if (productId) {
        productId.value = product.id;
    }

    if (name) {
        name.value = product.name || "";
    }

    if (size) {
        size.value = product.size || "";
    }

    if (price) {
        price.value = product.price;
    }

    if (category) {
        category.value =
            product.category || "Other";
    }

    if (image) {
        image.value = product.image || "";
    }

    if (stock) {
        stock.value =
            product.stock || "available";
    }

    if (description) {
        description.value =
            product.description || "";
    }

    var overlay =
        document.getElementById(
            "productFormOverlay"
        );

    if (overlay) {

        overlay.classList.add("show");
        overlay.style.display = "flex";
    }
}


/* =========================================================
   SAVE PRODUCT
========================================================= */

async function saveProduct(event) {

    if (event) {
        event.preventDefault();
    }

    var productId =
        document.getElementById(
            "productId"
        );

    var name =
        document.getElementById(
            "productName"
        );

    var size =
        document.getElementById(
            "productSize"
        );

    var price =
        document.getElementById(
            "productPrice"
        );

    var category =
        document.getElementById(
            "productCategory"
        );

    var image =
        document.getElementById(
            "productImage"
        );

    var stock =
        document.getElementById(
            "productStock"
        );

    var description =
        document.getElementById(
            "productDescription"
        );

    var id =
        productId
            ? productId.value.trim()
            : "";

    var productData = {

        name:
            name
                ? name.value.trim()
                : "",

        size:
            size
                ? size.value.trim()
                : "",

        price:
            price
                ? Number(price.value)
                : 0,

        category:
            category
                ? category.value.trim()
                : "Other",

        image:
            image
                ? image.value.trim()
                : "",

        stock:
            stock
                ? stock.value
                : "available",

        description:
            description
                ? description.value.trim()
                : ""
    };

    if (!productData.name) {

        alert("Enter product name.");
        return;
    }

    if (
        isNaN(productData.price) ||
        productData.price < 0
    ) {

        alert("Enter a valid price.");
        return;
    }

    var url =
        id
            ? PRODUCTS_API + "/" + id
            : PRODUCTS_API;

    var method =
        id
            ? "PUT"
            : "POST";

    try {

        var response =
            await fetch(
                url,
                {
                    method: method,
                    headers: authHeaders(),
                    body: JSON.stringify(productData)
                }
            );

        var data =
            await response.json();

        if (response.status === 401) {

            handleUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to save product."
            );
        }

        alert(
            id
                ? "Product updated successfully."
                : "Product added successfully."
        );

        closeProductForm();

        await loadProducts();

    } catch (error) {

        console.error(
            "Save product error:",
            error
        );

        alert(
            error.message ||
            "Failed to save product."
        );
    }
}


/* =========================================================
   DELETE PRODUCT
========================================================= */

async function deleteProduct(id) {

    var product =
        products.find(function(item) {

            return Number(item.id) ===
                Number(id);

        });

    if (!product) {

        alert("Product not found.");
        return;
    }

    var confirmed =
        confirm(
            "Delete " +
            product.name +
            "?"
        );

    if (!confirmed) {
        return;
    }

    try {

        var response =
            await fetch(
                PRODUCTS_API + "/" + id,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

        var data =
            await response.json();

        if (response.status === 401) {

            handleUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to delete product."
            );
        }

        alert(
            "Product deleted successfully."
        );

        await loadProducts();

    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(
            error.message ||
            "Failed to delete product."
        );
    }
}


/* =========================================================
   ORDERS
========================================================= */

async function loadOrders() {

    try {

        var response =
            await fetch(
                ORDERS_API,
                {
                    method: "GET",
                    headers: authHeaders()
                }
            );

        if (response.status === 401) {

            handleUnauthorized();
            return [];
        }

        var data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load orders."
            );
        }

        orders =
            Array.isArray(data)
                ? data
                : [];

        renderAdminOrders(orders);
        updateOrderStats();
        updateDashboard();

        return orders;

    } catch (error) {

        console.error(
            "Load orders error:",
            error
        );

        var tbody =
            document.getElementById(
                "adminOrderList"
            );

        if (tbody) {

            tbody.innerHTML =
                '<tr><td colspan="6">Unable to load orders.</td></tr>';
        }

        throw error;
    }
}


/* =========================================================
   ORDER STATUS LABEL
========================================================= */

function getStatusLabel(status) {

    var labels = {

        pending: "Pending",

        confirmed: "Confirmed",

        preparing: "Preparing",

        out_for_delivery:
            "Out for Delivery",

        delivered: "Delivered",

        cancelled: "Cancelled"
    };

    return labels[status] || status;
}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderAdminOrders(orderList) {

    var tbody =
        document.getElementById(
            "adminOrderList"
        );

    if (!tbody) {

        console.error(
            "adminOrderList not found."
        );

        return;
    }

    if (
        !orderList ||
        orderList.length === 0
    ) {

        tbody.innerHTML =
            '<tr><td colspan="6">No orders found.</td></tr>';

        return;
    }

    var html = "";

    orderList.forEach(function(order) {

        var status =
            String(
                order.status || "pending"
            );

        html +=
            "<tr>" +

            "<td>" +
                "<strong>Order #" +
                    escapeHtml(order.id) +
                "</strong>" +
                "<br>" +
                "<small>" +
                    escapeHtml(
                        formatDate(
                            order.created_at
                        )
                    ) +
                "</small>" +
            "</td>" +

            "<td>" +
                escapeHtml(
                    order.customer_name ||
                    "-"
                ) +
            "</td>" +

            "<td>" +
                escapeHtml(
                    order.phone ||
                    "-"
                ) +
            "</td>" +

            "<td>" +
                formatPrice(order.total) +
            "</td>" +

            "<td>" +

                '<select onchange="updateOrderStatus(' +
                    order.id +
                    ', this.value)">' +

                    '<option value="pending"' +
                        (status === "pending"
                            ? " selected"
                            : "") +
                    '>Pending</option>' +

                    '<option value="confirmed"' +
                        (status === "confirmed"
                            ? " selected"
                            : "") +
                    '>Confirmed</option>' +

                    '<option value="preparing"' +
                        (status === "preparing"
                            ? " selected"
                            : "") +
                    '>Preparing</option>' +

                    '<option value="out_for_delivery"' +
                        (status === "out_for_delivery"
                            ? " selected"
                            : "") +
                    '>Out for Delivery</option>' +

                    '<option value="delivered"' +
                        (status === "delivered"
                            ? " selected"
                            : "") +
                    '>Delivered</option>' +

                    '<option value="cancelled"' +
                        (status === "cancelled"
                            ? " selected"
                            : "") +
                    '>Cancelled</option>' +

                "</select>" +

            "</td>" +

            "<td>" +

                '<button type="button" onclick="viewOrder(' +
                    order.id +
                ')">View</button> ' +

                '<button type="button" onclick="deleteOrder(' +
                    order.id +
                ')" style="margin-left:5px;">Delete</button>' +

            "</td>" +

            "</tr>";
    });

    tbody.innerHTML = html;
}


/* =========================================================
   ORDER STATS
========================================================= */

function updateOrderStats() {

    var total =
        orders.length;

    var pending =
        orders.filter(function(order) {

            return order.status === "pending";

        }).length;

    var delivery =
        orders.filter(function(order) {

            return order.status ===
                "out_for_delivery";

        }).length;

    var delivered =
        orders.filter(function(order) {

            return order.status === "delivered";

        }).length;

    var totalElement =
        document.getElementById(
            "totalOrders"
        );

    var pendingElement =
        document.getElementById(
            "pendingOrders"
        );

    var deliveryElement =
        document.getElementById(
            "deliveryOrders"
        );

    var deliveredElement =
        document.getElementById(
            "deliveredOrders"
        );

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }

    if (deliveryElement) {
        deliveryElement.textContent =
            delivery;
    }

    if (deliveredElement) {
        deliveredElement.textContent =
            delivered;
    }
}


/* =========================================================
   SEARCH ORDERS
========================================================= */

function searchAdminOrders() {

    var input =
        document.getElementById(
            "orderSearch"
        );

    var query =
        input
            ? input.value.toLowerCase().trim()
            : "";

    if (!query) {

        filterAdminOrders();
        return;
    }

    var filtered =
        orders.filter(function(order) {

            var text =
                String(order.id || "") +
                " " +
                String(
                    order.customer_name || ""
                ) +
                " " +
                String(order.phone || "") +
                " " +
                String(order.address || "") +
                " " +
                String(order.status || "");

            return text
                .toLowerCase()
                .includes(query);
        });

    renderAdminOrders(filtered);
}


/* =========================================================
   FILTER ORDERS
========================================================= */

function filterAdminOrders() {

    var filter =
        document.getElementById(
            "orderStatusFilter"
        );

    var selected =
        filter
            ? filter.value
            : "all";

    var searchInput =
        document.getElementById(
            "orderSearch"
        );

    var search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";

    var filtered =
        orders.filter(function(order) {

            var statusMatches =
                selected === "all" ||
                order.status === selected;

            var searchText =
                String(order.id || "") +
                " " +
                String(
                    order.customer_name || ""
                ) +
                " " +
                String(order.phone || "");

            var searchMatches =
                !search ||
                searchText
                    .toLowerCase()
                    .includes(search);

            return (
                statusMatches &&
                searchMatches
            );
        });

    renderAdminOrders(filtered);
}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateOrderStatus(id, status) {

    try {

        var response =
            await fetch(
                ORDERS_API +
                "/" +
                id +
                "/status",
                {
                    method: "PUT",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        status: status
                    })
                }
            );

        var data =
            await response.json();

        if (response.status === 401) {

            handleUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to update order status."
            );
        }

        await loadOrders();

        alert(
            "Order status updated successfully."
        );

    } catch (error) {

        console.error(
            "Update order status error:",
            error
        );

        alert(
            error.message ||
            "Failed to update order status."
        );

        await loadOrders();
    }
}


/* =========================================================
   VIEW ORDER
========================================================= */

async function viewOrder(id) {

    try {

        var response =
            await fetch(
                ORDERS_API + "/" + id,
                {
                    method: "GET",
                    headers: authHeaders()
                }
            );

        var data =
            await response.json();

        if (response.status === 401) {

            handleUnauthorized();
            return;
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load order."
            );
        }

        showOrderDetails(data);

    } catch (error) {

        console.error(
            "View order error:",
            error
        );

        alert(
            error.message ||
            "Failed to load order."
        );
    }
}


/* =========================================================
   SHOW ORDER DETAILS
========================================================= */

function showOrderDetails(order) {

    var overlay =
        document.getElementById(
            "orderDetailsOverlay"
        );

    var subtitle =
        document.getElementById(
            "orderDetailsSubtitle"
        );

    var content =
        document.getElementById(
            "orderDetailsContent"
        );

    if (!overlay || !content) {
        return;
    }

    if (subtitle) {

        subtitle.textContent =
            "Order #" +
            order.id +
            " - " +
            getStatusLabel(
                order.status
            );
    }

    var items =
        Array.isArray(order.items)
            ? order.items
            : [];

    var itemsHtml = "";

    if (items.length === 0) {

        itemsHtml =
            "<p>No items found.</p>";

    } else {

        itemsHtml =
            '<div style="overflow-x:auto;">' +

                "<table>" +

                    "<thead>" +

                        "<tr>" +

                            "<th>Product</th>" +
                            "<th>Size</th>" +
                            "<th>Price</th>" +
                            "<th>Qty</th>" +
                            "<th>Total</th>" +

                        "</tr>" +

                    "</thead>" +

                    "<tbody>";

        items.forEach(function(item) {

            var itemTotal =
                Number(item.price || 0) *
                Number(item.quantity || 0);

            itemsHtml +=

                "<tr>" +

                    "<td>" +
                        escapeHtml(
                            item.product_name
                        ) +
                    "</td>" +

                    "<td>" +
                        escapeHtml(
                            item.size
                        ) +
                    "</td>" +

                    "<td>" +
                        formatPrice(item.price) +
                    "</td>" +

                    "<td>" +
                        escapeHtml(
                            item.quantity
                        ) +
                    "</td>" +

                    "<td>" +
                        formatPrice(itemTotal) +
                    "</td>" +

                "</tr>";
        });

        itemsHtml +=
                    "</tbody>" +

                "</table>" +

            "</div>";
    }

    content.innerHTML =

        "<div>" +

            "<p><strong>Customer:</strong> " +
                escapeHtml(
                    order.customer_name || "-"
                ) +
            "</p>" +

            "<p><strong>Phone:</strong> " +
                escapeHtml(
                    order.phone || "-"
                ) +
            "</p>" +

            "<p><strong>Address:</strong> " +
                escapeHtml(
                    order.address || "-"
                ) +
            "</p>" +

            "<p><strong>Status:</strong> " +
                escapeHtml(
                    getStatusLabel(
                        order.status
                    )
                ) +
            "</p>" +

            "<p><strong>Order Date:</strong> " +
                escapeHtml(
                    formatDate(
                        order.created_at
                    )
                ) +
            "</p>" +

            "<hr>" +

            "<h3>Items</h3>" +

            itemsHtml +

            "<hr>" +

            '<h3>Total: ' +
                formatPrice(order.total) +
            "</h3>" +

        "</div>";

    overlay.classList.add("show");
    overlay.style.display = "flex";
}


/* =========================================================
   CLOSE ORDER DETAILS
========================================================= */

function closeOrderDetails() {

    var overlay =
        document.getElementById(
            "orderDetailsOverlay"
        );

    if (overlay) {

        overlay.classList.remove("show");
        overlay.style.display = "none";
    }
}


function closeOrderDetailsOutside(event) {

    if (
        event &&
        event.target &&
        event.target.id ===
            "orderDetailsOverlay"
    ) {

        closeOrderDetails();
    }
}


/* =========================================================
   DELETE ORDER
========================================================= */

async function deleteOrder(id) {

    var confirmed =
        confirm(
            "Delete Order #" +
            id +
            "?"
        );

    if (!confirmed) {
        return;
    }

    try {

        var response =
            await fetch(
                ORDERS_API + "/" + id,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

        var data =
            await response.json();

        if (response.status === 401) {

            handleUnauthorized();
            return;
        }

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to delete order."
            );
        }

        alert(
            "Order deleted successfully."
        );

        await loadOrders();

    } catch (error) {

        console.error(
            "Delete order error:",
            error
        );

        alert(
            error.message ||
            "Failed to delete order."
        );
    }
}


/* =========================================================
   SHOP STATUS
========================================================= */

async function loadShopStatus() {

    try {

        var response =
            await fetch(
                SHOP_STATUS_API
            );

        var data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load shop status."
            );
        }

        var isOpen =
            data.shopOpen === true ||
            data.open === true;

        updateShopStatusUI(isOpen);

    } catch (error) {

        console.error(
            "Load shop status error:",
            error
        );
    }
}


/* =========================================================
   UPDATE SHOP STATUS UI
========================================================= */

function updateShopStatusUI(isOpen) {

    var icon =
        document.getElementById(
            "shopStatusIcon"
        );

    var text =
        document.getElementById(
            "shopStatusText"
        );

    var button =
        document.getElementById(
            "shopStatusButton"
        );

    if (isOpen) {

        if (icon) {
            icon.textContent = "🟢";
        }

        if (text) {
            text.textContent = "Shop Open";
        }

        if (button) {
            button.textContent =
                "Close Shop";
        }

    } else {

        if (icon) {
            icon.textContent = "🔴";
        }

        if (text) {
            text.textContent = "Shop Closed";
        }

        if (button) {
            button.textContent =
                "Open Shop";
        }
    }
}


/* =========================================================
   TOGGLE SHOP STATUS
========================================================= */

async function toggleShopStatus() {

    var button = document.getElementById("shopStatusButton");

    if (button) {
        button.disabled = true;
    }

    try {

        var response = await fetch(
            SHOP_STATUS_API,
            {
                method: "GET",
                headers: authHeaders(),
                cache: "no-store"
            }
        );

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        var currentData = await response.json();

        if (!response.ok) {
            throw new Error(
                currentData.message ||
                "Could not read shop status."
            );
        }

        var currentStatus =
            currentData.shopOpen === true ||
            currentData.open === true;

        var newStatus = !currentStatus;

        var confirmed = confirm(
            newStatus
                ? "Open the shop?"
                : "Close the shop?"
        );

        if (!confirmed) {
            return;
        }


        var updateResponse = await fetch(
            SHOP_STATUS_API,
            {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({
                    shopOpen: newStatus
                })
            }
        );


        if (updateResponse.status === 401) {
            handleUnauthorized();
            return;
        }


        var updateData =
            await updateResponse.json();


        if (
            !updateResponse.ok ||
            updateData.success !== true
        ) {

            throw new Error(
                updateData.message ||
                "Failed to update shop status."
            );

        }


        var savedStatus =
            updateData.shopOpen === true ||
            updateData.open === true;


        updateShopStatusUI(savedStatus);


        alert(
            savedStatus
                ? "Shop is now OPEN."
                : "Shop is now CLOSED."
        );


        /* Refresh status from backend */
        await loadShopStatus();


    } catch (error) {

        console.error(
            "Shop status error:",
            error
        );

        alert(
            error.message ||
            "Failed to update shop status."
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    var productElement =
        document.getElementById(
            "dashboardProducts"
        );

    var orderElement =
        document.getElementById(
            "dashboardOrders"
        );

    var salesElement =
        document.getElementById(
            "dashboardSales"
        );

    var sales = 0;

    orders.forEach(function(order) {

        sales += Number(
            order.total || 0
        );

    });

    if (productElement) {
        productElement.textContent =
            products.length;
    }

    if (orderElement) {
        orderElement.textContent =
            orders.length;
    }

    if (salesElement) {
        salesElement.textContent =
            formatPrice(sales);
    }
}


async function loadDashboard() {

    try {

        await loadProducts();
        await loadOrders();
        await loadShopStatus();

        updateDashboard();

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );
    }
}


/* =========================================================
   UNAUTHORIZED HANDLER
========================================================= */

function handleUnauthorized() {

    removeToken();

    alert(
        "Your admin login has expired. Please login again."
    );

    showLoginScreen();
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        /* -----------------------------------------
           LOGIN FORM
        ----------------------------------------- */

        var loginForm =
            document.getElementById(
                "adminLoginForm"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                adminLogin
            );
        }


        /* -----------------------------------------
           PRODUCT FORM
        ----------------------------------------- */

        var productForm =
            document.getElementById(
                "productForm"
            );

        if (productForm) {

            productForm.addEventListener(
                "submit",
                saveProduct
            );
        }


        /* -----------------------------------------
           START LOGIN CHECK
        ----------------------------------------- */

        var loggedIn =
            await checkAdminLogin();

        if (loggedIn) {

            await initializeAdminPanel();

        } else {

            showLoginScreen();
        }

    }
);


/* =========================================================
   MAKE FUNCTIONS AVAILABLE TO HTML onclick
========================================================= */

window.adminLogin =
    adminLogin;

window.adminLogout =
    adminLogout;

window.showAdminSection =
    showAdminSection;

window.openProductForm =
    openProductForm;

window.closeProductForm =
    closeProductForm;

window.closeFormOutside =
    closeFormOutside;

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.searchAdminProducts =
    searchAdminProducts;

window.searchAdminOrders =
    searchAdminOrders;

window.filterAdminOrders =
    filterAdminOrders;

window.updateOrderStatus =
    updateOrderStatus;

window.viewOrder =
    viewOrder;

window.closeOrderDetails =
    closeOrderDetails;

window.closeOrderDetailsOutside =
    closeOrderDetailsOutside;

window.deleteOrder =
    deleteOrder;

window.toggleShopStatus =
    toggleShopStatus;