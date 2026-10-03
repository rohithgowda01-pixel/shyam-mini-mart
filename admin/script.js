// =====================================================
// ROHITH MINI MART - ADMIN SCRIPT
// =====================================================

// BACKEND URL
const BACKEND_URL = "https://shyam-mini-mart.onrender.com";

// API URLS
const PRODUCTS_API = BACKEND_URL + "/api/products";
const ORDERS_API = BACKEND_URL + "/api/orders";
const SHOP_STATUS_API = BACKEND_URL + "/api/shop-status";

// =====================================================
// ADMIN LOGIN DETAILS
// =====================================================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let products = [];
let orders = [];
let editingProductId = null;

// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    checkAdminLogin();

    setupLogin();

    setupLogout();

    setupNavigation();

    setupProductForm();

    setupShopStatus();

    loadProducts();

    loadOrders();

});


// =====================================================
// ADMIN LOGIN CHECK
// =====================================================

function checkAdminLogin() {

    const loginScreen =
        document.getElementById("adminLoginScreen");

    const adminPanel =
        document.getElementById("adminPanel");

    const loggedIn =
        localStorage.getItem("rohitMiniMartAdminLoggedIn");

    if (loggedIn === "true") {

        if (loginScreen) {
            loginScreen.style.display = "none";
        }

        if (adminPanel) {
            adminPanel.style.display = "block";
        }

    } else {

        if (loginScreen) {
            loginScreen.style.display = "flex";
        }

        if (adminPanel) {
            adminPanel.style.display = "none";
        }

    }

}


// =====================================================
// LOGIN
// =====================================================

function setupLogin() {

    const loginButton =
        document.getElementById("loginButton");

    const usernameInput =
        document.getElementById("adminUsername");

    const passwordInput =
        document.getElementById("adminPassword");

    const loginMessage =
        document.getElementById("loginMessage");

    if (!loginButton) {
        return;
    }

    loginButton.addEventListener("click", function () {

        const username =
            usernameInput ? usernameInput.value.trim() : "";

        const password =
            passwordInput ? passwordInput.value : "";

        if (
            username === ADMIN_USERNAME &&
            password === ADMIN_PASSWORD
        ) {

            localStorage.setItem(
                "rohitMiniMartAdminLoggedIn",
                "true"
            );

            if (loginMessage) {
                loginMessage.textContent = "";
            }

            checkAdminLogin();

            loadProducts();

            loadOrders();

            loadShopStatus();

        } else {

            if (loginMessage) {
                loginMessage.textContent =
                    "Invalid username or password.";
            } else {
                alert("Invalid username or password.");
            }

        }

    });


    if (passwordInput) {

        passwordInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    loginButton.click();

                }

            }
        );

    }

}


// =====================================================
// LOGOUT
// =====================================================

function setupLogout() {

    const logoutButton =
        document.getElementById("logoutButton");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", function () {

        localStorage.removeItem(
            "rohitMiniMartAdminLoggedIn"
        );

        location.reload();

    });

}


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

    const buttons =
        document.querySelectorAll("[data-section]");

    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            const sectionName =
                button.getAttribute("data-section");

            showSection(sectionName);

        });

    });

}


// =====================================================
// SHOW SECTION
// =====================================================

function showSection(sectionName) {

    const sections =
        document.querySelectorAll(".admin-section");

    sections.forEach(function (section) {

        section.style.display = "none";

    });


    const selectedSection =
        document.getElementById(sectionName);

    if (selectedSection) {

        selectedSection.style.display = "block";

    }


    const buttons =
        document.querySelectorAll("[data-section]");

    buttons.forEach(function (button) {

        button.classList.remove("active");

        if (
            button.getAttribute("data-section") ===
            sectionName
        ) {

            button.classList.add("active");

        }

    });


    if (sectionName === "products") {

        loadProducts();

    }


    if (sectionName === "orders") {

        loadOrders();

    }


    if (sectionName === "dashboard") {

        updateDashboard();

    }

}


// =====================================================
// PRODUCT FORM
// =====================================================

function setupProductForm() {

    const form =
        document.getElementById("productForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {

        event.preventDefault();

        saveProduct();

    });

}


// =====================================================
// SAVE PRODUCT
// =====================================================

async function saveProduct() {

    const nameInput =
        document.getElementById("productName");

    const sizeInput =
        document.getElementById("productSize");

    const priceInput =
        document.getElementById("productPrice");

    const categoryInput =
        document.getElementById("productCategory");

    const imageInput =
        document.getElementById("productImage");

    const stockInput =
        document.getElementById("productStock");

    const descriptionInput =
        document.getElementById("productDescription");


    const name =
        nameInput ? nameInput.value.trim() : "";

    const size =
        sizeInput ? sizeInput.value.trim() : "";

    const price =
        priceInput ? priceInput.value : "";

    const category =
        categoryInput ? categoryInput.value.trim() : "";

    const image =
        imageInput ? imageInput.value.trim() : "";

    const stock =
        stockInput ? stockInput.value : "available";

    const description =
        descriptionInput ?
        descriptionInput.value.trim() :
        "";


    if (name === "") {

        alert("Please enter product name.");

        return;

    }


    if (price === "" || isNaN(price)) {

        alert("Please enter a valid price.");

        return;

    }


    const productData = {

        name: name,

        size: size,

        price: Number(price),

        category: category,

        image: image,

        stock: stock,

        description: description

    };


    try {

        let response;


        if (editingProductId !== null) {

            response = await fetch(
                PRODUCTS_API + "/" + editingProductId,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(productData)
                }
            );

        } else {

            response = await fetch(
                PRODUCTS_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(productData)
                }
            );

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to save product."
            );

        }


        if (editingProductId !== null) {

            alert("Product updated successfully.");

        } else {

            alert("Product added successfully.");

        }


        editingProductId = null;

        clearProductForm();

        loadProducts();


    } catch (error) {

        console.error(error);

        alert(
            "Could not save product. Please check the backend."
        );

    }

}


// =====================================================
// LOAD PRODUCTS
// =====================================================

async function loadProducts() {

    try {

        const response =
            await fetch(PRODUCTS_API);

        if (!response.ok) {

            throw new Error(
                "Failed to load products."
            );

        }


        products =
            await response.json();


        if (!Array.isArray(products)) {

            products = [];

        }


        displayProducts();

        updateDashboard();


    } catch (error) {

        console.error(error);

        displayProductError();

    }

}


// =====================================================
// DISPLAY PRODUCTS
// =====================================================

function displayProducts() {

    const container =
        document.getElementById("productsList");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (products.length === 0) {

        container.innerHTML =
            "<p>No products found.</p>";

        return;

    }


    products.forEach(function (product) {

        const card =
            document.createElement("div");

        card.className = "product-card";


        const image =
            product.image || "";


        const stockText =
            product.stock || "available";


        card.innerHTML =

            '<div class="product-image">' +

                (
                    image !== ""
                    ?
                    '<img src="' +
                    escapeHtml(image) +
                    '" alt="' +
                    escapeHtml(product.name) +
                    '">' 
                    :
                    '<div class="no-image">No Image</div>'
                ) +

            "</div>" +

            '<div class="product-info">' +

                "<h3>" +
                escapeHtml(product.name) +
                "</h3>" +

                "<p>Size: " +
                escapeHtml(product.size || "-") +
                "</p>" +

                "<p>Category: " +
                escapeHtml(product.category || "-") +
                "</p>" +

                "<p>Price: ₹" +
                Number(product.price || 0).toFixed(2) +
                "</p>" +

                "<p>Stock: " +
                escapeHtml(stockText) +
                "</p>" +

                "<p>" +
                escapeHtml(
                    product.description || ""
                ) +
                "</p>" +

                '<div class="product-actions">' +

                    '<button type="button" ' +
                    'onclick="editProduct(' +
                    Number(product.id) +
                    ')">' +
                    "Edit" +
                    "</button>" +

                    '<button type="button" ' +
                    'onclick="deleteProduct(' +
                    Number(product.id) +
                    ')">' +
                    "Delete" +
                    "</button>" +

                "</div>" +

            "</div>";


        container.appendChild(card);

    });

}


// =====================================================
// EDIT PRODUCT
// =====================================================

function editProduct(id) {

    const product =
        products.find(function (item) {

            return Number(item.id) === Number(id);

        });


    if (!product) {

        alert("Product not found.");

        return;

    }


    editingProductId =
        Number(product.id);


    const nameInput =
        document.getElementById("productName");

    const sizeInput =
        document.getElementById("productSize");

    const priceInput =
        document.getElementById("productPrice");

    const categoryInput =
        document.getElementById("productCategory");

    const imageInput =
        document.getElementById("productImage");

    const stockInput =
        document.getElementById("productStock");

    const descriptionInput =
        document.getElementById("productDescription");


    if (nameInput) {
        nameInput.value =
            product.name || "";
    }

    if (sizeInput) {
        sizeInput.value =
            product.size || "";
    }

    if (priceInput) {
        priceInput.value =
            product.price || "";
    }

    if (categoryInput) {
        categoryInput.value =
            product.category || "";
    }

    if (imageInput) {
        imageInput.value =
            product.image || "";
    }

    if (stockInput) {
        stockInput.value =
            product.stock || "available";
    }

    if (descriptionInput) {
        descriptionInput.value =
            product.description || "";
    }


    const submitButton =
        document.querySelector(
            "#productForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.textContent =
            "Update Product";

    }


    const cancelButton =
        document.getElementById(
            "cancelEditButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "inline-block";

    }


    const form =
        document.getElementById("productForm");


    if (form) {

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// =====================================================
// DELETE PRODUCT
// =====================================================

async function deleteProduct(id) {

    const product =
        products.find(function (item) {

            return Number(item.id) === Number(id);

        });


    if (!product) {

        alert("Product not found.");

        return;

    }


    const confirmed =
        confirm(
            "Delete " +
            product.name +
            "?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                PRODUCTS_API + "/" + id,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to delete product."
            );

        }


        alert("Product deleted successfully.");

        loadProducts();


    } catch (error) {

        console.error(error);

        alert(
            "Could not delete product."
        );

    }

}


// =====================================================
// CLEAR PRODUCT FORM
// =====================================================

function clearProductForm() {

    const form =
        document.getElementById("productForm");


    if (form) {

        form.reset();

    }


    editingProductId = null;


    const submitButton =
        document.querySelector(
            "#productForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.textContent =
            "Add Product";

    }


    const cancelButton =
        document.getElementById(
            "cancelEditButton"
        );


    if (cancelButton) {

        cancelButton.style.display =
            "none";

    }

}


// =====================================================
// CANCEL EDIT
// =====================================================

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target &&
            event.target.id ===
            "cancelEditButton"
        ) {

            clearProductForm();

        }

    }
);


// =====================================================
// LOAD ORDERS
// =====================================================

async function loadOrders() {

    try {

        const response =
            await fetch(ORDERS_API);


        if (!response.ok) {

            throw new Error(
                "Failed to load orders."
            );

        }


        orders =
            await response.json();


        if (!Array.isArray(orders)) {

            orders = [];

        }


        displayOrders();

        updateDashboard();


    } catch (error) {

        console.error(error);

        displayOrderError();

    }

}


// =====================================================
// DISPLAY ORDERS
// =====================================================

function displayOrders() {

    const container =
        document.getElementById("ordersList");


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (orders.length === 0) {

        container.innerHTML =
            "<p>No orders found.</p>";

        return;

    }


    orders.forEach(function (order) {

        const card =
            document.createElement("div");


        card.className =
            "order-card";


        const orderId =
            order.id || "";


        const customerName =
            order.customer_name ||
            order.customerName ||
            order.name ||
            "Customer";


        const phone =
            order.phone ||
            order.customer_phone ||
            "-";


        const address =
            order.address ||
            "-";


        const total =
            Number(
                order.total ||
                order.total_amount ||
                0
            );


        const status =
            order.status ||
            "pending";


        card.innerHTML =

            "<h3>Order #" +
            escapeHtml(String(orderId)) +
            "</h3>" +

            "<p><strong>Customer:</strong> " +
            escapeHtml(customerName) +
            "</p>" +

            "<p><strong>Phone:</strong> " +
            escapeHtml(phone) +
            "</p>" +

            "<p><strong>Address:</strong> " +
            escapeHtml(address) +
            "</p>" +

            "<p><strong>Total:</strong> ₹" +
            total.toFixed(2) +
            "</p>" +

            "<p><strong>Status:</strong> " +
            escapeHtml(status) +
            "</p>" +

            '<div class="order-actions">' +

                '<select onchange="changeOrderStatus(' +
                Number(orderId) +
                ', this.value)">' +

                    '<option value="pending"' +
                    (
                        status === "pending"
                        ? " selected"
                        : ""
                    ) +
                    ">Pending</option>" +

                    '<option value="confirmed"' +
                    (
                        status === "confirmed"
                        ? " selected"
                        : ""
                    ) +
                    ">Confirmed</option>" +

                    '<option value="preparing"' +
                    (
                        status === "preparing"
                        ? " selected"
                        : ""
                    ) +
                    ">Preparing</option>" +

                    '<option value="out_for_delivery"' +
                    (
                        status === "out_for_delivery"
                        ? " selected"
                        : ""
                    ) +
                    ">Out for Delivery</option>" +

                    '<option value="delivered"' +
                    (
                        status === "delivered"
                        ? " selected"
                        : ""
                    ) +
                    ">Delivered</option>" +

                    '<option value="cancelled"' +
                    (
                        status === "cancelled"
                        ? " selected"
                        : ""
                    ) +
                    ">Cancelled</option>" +

                "</select>" +

            "</div>";


        container.appendChild(card);

    });

}


// =====================================================
// CHANGE ORDER STATUS
// =====================================================

async function changeOrderStatus(
    orderId,
    newStatus
) {

    if (!orderId) {

        alert("Invalid order ID.");

        return;

    }


    try {

        const response =
            await fetch(
                ORDERS_API + "/" + orderId,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: newStatus
                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to update order."
            );

        }


        alert(
            "Order status updated successfully."
        );


        loadOrders();


    } catch (error) {

        console.error(error);

        alert(
            "Could not update order status. " +
            "Please check the backend."
        );

    }

}


// =====================================================
// SHOP STATUS
// =====================================================

function setupShopStatus() {

    const button =
        document.getElementById(
            "shopStatusButton"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        toggleShopStatus
    );


    loadShopStatus();

}


// =====================================================
// LOAD SHOP STATUS
// =====================================================

async function loadShopStatus() {

    try {

        const response =
            await fetch(
                SHOP_STATUS_API
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        updateShopStatusDisplay(
            data
        );


    } catch (error) {

        console.error(error);

    }

}


// =====================================================
// TOGGLE SHOP STATUS
// =====================================================

async function toggleShopStatus() {

    try {

        const currentResponse =
            await fetch(
                SHOP_STATUS_API
            );


        if (!currentResponse.ok) {

            throw new Error(
                "Could not get shop status."
            );

        }


        const currentData =
            await currentResponse.json();


        const currentStatus =
            currentData.open === true ||
            currentData.status === "open";


        const newStatus =
            !currentStatus;


        const response =
            await fetch(
                SHOP_STATUS_API,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        open: newStatus
                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Could not update shop status."
            );

        }


        updateShopStatusDisplay(
            result
        );


        alert(
            newStatus
            ? "Shop is now OPEN."
            : "Shop is now CLOSED."
        );


    } catch (error) {

        console.error(error);

        alert(
            "Could not change shop status."
        );

    }

}


// =====================================================
// UPDATE SHOP STATUS DISPLAY
// =====================================================

function updateShopStatusDisplay(data) {

    const statusText =
        document.getElementById(
            "shopStatusText"
        );


    const button =
        document.getElementById(
            "shopStatusButton"
        );


    const isOpen =
        data &&
        (
            data.open === true ||
            data.status === "open"
        );


    if (statusText) {

        statusText.textContent =
            isOpen
            ? "Shop Open"
            : "Shop Closed";

    }


    if (button) {

        button.textContent =
            isOpen
            ? "Close Shop"
            : "Open Shop";

    }

}


// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {

    const totalProducts =
        document.getElementById(
            "totalProducts"
        );


    const totalOrders =
        document.getElementById(
            "totalOrders"
        );


    const pendingOrders =
        document.getElementById(
            "pendingOrders"
        );


    const deliveredOrders =
        document.getElementById(
            "deliveredOrders"
        );


    if (totalProducts) {

        totalProducts.textContent =
            products.length;

    }


    if (totalOrders) {

        totalOrders.textContent =
            orders.length;

    }


    if (pendingOrders) {

        const count =
            orders.filter(function (order) {

                return (
                    order.status ===
                    "pending"
                );

            }).length;


        pendingOrders.textContent =
            count;

    }


    if (deliveredOrders) {

        const count =
            orders.filter(function (order) {

                return (
                    order.status ===
                    "delivered"
                );

            }).length;


        deliveredOrders.textContent =
            count;

    }

}


// =====================================================
// ERROR DISPLAY
// =====================================================

function displayProductError() {

    const container =
        document.getElementById(
            "productsList"
        );


    if (container) {

        container.innerHTML =
            "<p>Unable to load products. " +
            "Please check the backend.</p>";

    }

}


// =====================================================
// ORDER ERROR
// =====================================================

function displayOrderError() {

    const container =
        document.getElementById(
            "ordersList"
        );


    if (container) {

        container.innerHTML =
            "<p>Unable to load orders. " +
            "Please check the backend.</p>";

    }

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value === null ||
        value === undefined
        ? ""
        : String(value);


    return div.innerHTML;

}


// =====================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// =====================================================

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.changeOrderStatus =
    changeOrderStatus;

window.clearProductForm =
    clearProductForm;