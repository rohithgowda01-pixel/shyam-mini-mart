// ============================================================
// ROHITH MINI MART - FINAL ADMIN SCRIPT
// ============================================================

const API_BASE = "https://shyam-mini-mart.onrender.com";

const PRODUCTS_API = API_BASE + "/api/products";
const ORDERS_API = API_BASE + "/api/orders";
const SHOP_STATUS_API = API_BASE + "/api/shop-status";
const LOGIN_API = API_BASE + "/api/admin/login";


// ============================================================
// GLOBAL VARIABLES
// ============================================================

var adminToken = localStorage.getItem("rohith_admin_token") || "";

var products = [];
var orders = [];
var shopOpen = true;


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getElement(id) {
    return document.getElementById(id);
}


function showElement(id) {
    var element = getElement(id);

    if (element) {
        element.style.display = "";
    }
}


function hideElement(id) {
    var element = getElement(id);

    if (element) {
        element.style.display = "none";
    }
}


function setText(id, value) {
    var element = getElement(id);

    if (element) {
        element.textContent = value;
    }
}


function showMessage(message) {
    alert(message);
}


function authHeaders() {
    var headers = {
        "Content-Type": "application/json"
    };

    if (adminToken) {
        headers["Authorization"] = "Bearer " + adminToken;
    }

    return headers;
}


// ============================================================
// LOGIN
// ============================================================

function loginAdmin(event) {

    if (event) {
        event.preventDefault();
    }

    var usernameElement = getElement("adminUsername");
    var passwordElement = getElement("adminPassword");

    if (!usernameElement || !passwordElement) {
        showMessage("Login fields were not found.");
        return;
    }

    var username = usernameElement.value.trim();
    var password = passwordElement.value;

    if (username === "" || password === "") {
        showMessage("Please enter username and password.");
        return;
    }

    var loginButton = getElement("loginButton");

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
    }

    fetch(LOGIN_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
        .then(function(response) {

            return response.text().then(function(text) {

                var data = {};

                try {
                    data = JSON.parse(text);
                } catch (error) {
                    data = {};
                }

                return {
                    ok: response.ok,
                    data: data
                };
            });
        })
        .then(function(result) {

            if (!result.ok) {
                var errorMessage =
                    result.data.message ||
                    result.data.error ||
                    "Invalid username or password.";

                throw new Error(errorMessage);
            }

            var data = result.data;

            var token =
                data.token ||
                data.accessToken ||
                data.jwt ||
                "";

            if (!token) {
                throw new Error(
                    "Login succeeded but server did not send a login token."
                );
            }

            adminToken = token;

            localStorage.setItem(
                "rohith_admin_token",
                adminToken
            );

            localStorage.setItem(
                "rohith_admin_logged_in",
                "true"
            );

            openAdminPanel();

        })
        .catch(function(error) {

            console.error("Login error:", error);

            showMessage(
                error.message || "Login failed."
            );

        })
        .finally(function() {

            if (loginButton) {
                loginButton.disabled = false;
                loginButton.textContent = "Login";
            }
        });
}


// ============================================================
// OPEN ADMIN PANEL
// ============================================================

function openAdminPanel() {

    hideElement("adminLoginScreen");

    showElement("adminPanel");

    showElement("adminDashboard");

    loadEverything();
}


// ============================================================
// LOGOUT
// ============================================================

function logoutAdmin() {

    adminToken = "";

    localStorage.removeItem("rohith_admin_token");
    localStorage.removeItem("rohith_admin_logged_in");

    hideElement("adminPanel");

    showElement("adminLoginScreen");

    var usernameElement = getElement("adminUsername");
    var passwordElement = getElement("adminPassword");

    if (usernameElement) {
        usernameElement.value = "";
    }

    if (passwordElement) {
        passwordElement.value = "";
    }
}


// ============================================================
// CHECK SAVED LOGIN
// ============================================================

function checkSavedLogin() {

    if (adminToken) {

        openAdminPanel();

    } else {

        hideElement("adminPanel");
        showElement("adminLoginScreen");
    }
}


// ============================================================
// LOAD EVERYTHING
// ============================================================

function loadEverything() {

    loadProducts();
    loadOrders();
    loadShopStatus();
}


// ============================================================
// LOAD PRODUCTS
// ============================================================

function loadProducts() {

    fetch(PRODUCTS_API, {
        method: "GET",
        headers: authHeaders()
    })
        .then(function(response) {

            if (response.status === 401) {
                logoutAdmin();
                throw new Error("Login session expired.");
            }

            if (!response.ok) {
                throw new Error(
                    "Unable to load products."
                );
            }

            return response.json();
        })
        .then(function(data) {

            if (Array.isArray(data)) {
                products = data;
            } else if (Array.isArray(data.products)) {
                products = data.products;
            } else {
                products = [];
            }

            renderProducts();
            updateDashboard();

        })
        .catch(function(error) {

            console.error("Products error:", error);

            setText(
                "productsTableMessage",
                error.message
            );
        });
}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts() {

    var tableBody =
        getElement("productsTableBody") ||
        getElement("productTableBody") ||
        getElement("productsList");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (products.length === 0) {

        tableBody.innerHTML =
            "<tr>" +
            "<td colspan='8'>No products found.</td>" +
            "</tr>";

        return;
    }

    products.forEach(function(product) {

        var row = document.createElement("tr");

        var id = product.id || "";
        var name = product.name || "";
        var size = product.size || "";
        var price = product.price || 0;
        var category = product.category || "";
        var stock = product.stock || "available";
        var description = product.description || "";
        var image = product.image || "";

        var stockText =
            String(stock).toLowerCase() === "available"
                ? "Available"
                : "Out of Stock";

        var imageHTML = "";

        if (image) {
            imageHTML =
                "<img src='" +
                escapeAttribute(image) +
                "' " +
                "style='width:55px;height:55px;" +
                "object-fit:cover;border-radius:8px;' " +
                "onerror=\"this.style.display='none'\">";
        } else {
            imageHTML = "No Image";
        }

        row.innerHTML =
            "<td>" + escapeHTML(id) + "</td>" +
            "<td>" + imageHTML + "</td>" +
            "<td>" + escapeHTML(name) + "</td>" +
            "<td>" + escapeHTML(size) + "</td>" +
            "<td>₹" + escapeHTML(price) + "</td>" +
            "<td>" + escapeHTML(category) + "</td>" +
            "<td>" + escapeHTML(stockText) + "</td>" +
            "<td>" +
            "<button type='button' onclick='editProduct(" +
            id +
            ")'>Edit</button> " +
            "<button type='button' onclick='deleteProduct(" +
            id +
            ")'>Delete</button>" +
            "</td>";

        tableBody.appendChild(row);
    });
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    var div = document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;
}


function escapeAttribute(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


// ============================================================
// ADD PRODUCT
// ============================================================

function addProduct() {

    var nameElement = getElement("productName");
    var sizeElement = getElement("productSize");
    var priceElement = getElement("productPrice");
    var categoryElement = getElement("productCategory");
    var imageElement = getElement("productImage");
    var stockElement = getElement("productStock");
    var descriptionElement = getElement("productDescription");

    if (!nameElement || !priceElement) {
        showMessage(
            "Product form was not found. Check your HTML IDs."
        );

        return;
    }

    var name = nameElement.value.trim();
    var size = sizeElement ? sizeElement.value.trim() : "";
    var price = priceElement.value;
    var category =
        categoryElement
            ? categoryElement.value.trim()
            : "";

    var image =
        imageElement
            ? imageElement.value.trim()
            : "";

    var stock =
        stockElement
            ? stockElement.value
            : "available";

    var description =
        descriptionElement
            ? descriptionElement.value.trim()
            : "";

    if (name === "") {
        showMessage("Enter product name.");
        return;
    }

    if (price === "" || Number(price) < 0) {
        showMessage("Enter a valid price.");
        return;
    }

    var productData = {
        name: name,
        size: size,
        price: Number(price),
        category: category,
        image: image,
        stock: stock,
        description: description
    };

    fetch(PRODUCTS_API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(productData)
    })
        .then(function(response) {

            if (response.status === 401) {
                logoutAdmin();
                throw new Error("Login session expired.");
            }

            return response.text().then(function(text) {

                var data = {};

                try {
                    data = JSON.parse(text);
                } catch (error) {
                    data = {};
                }

                return {
                    ok: response.ok,
                    data: data
                };
            });
        })
        .then(function(result) {

            if (!result.ok) {
                throw new Error(
                    result.data.message ||
                    result.data.error ||
                    "Unable to add product."
                );
            }

            showMessage("Product added successfully.");

            clearProductForm();

            loadProducts();

        })
        .catch(function(error) {

            console.error("Add product error:", error);

            showMessage(error.message);
        });
}


// ============================================================
// EDIT PRODUCT
// ============================================================

function editProduct(id) {

    var product = products.find(function(item) {

        return Number(item.id) === Number(id);
    });

    if (!product) {
        showMessage("Product not found.");
        return;
    }

    var name = prompt(
        "Product name:",
        product.name || ""
    );

    if (name === null) {
        return;
    }

    var size = prompt(
        "Size:",
        product.size || ""
    );

    if (size === null) {
        return;
    }

    var price = prompt(
        "Price:",
        product.price || ""
    );

    if (price === null) {
        return;
    }

    var category = prompt(
        "Category:",
        product.category || ""
    );

    if (category === null) {
        return;
    }

    var image = prompt(
        "Image URL:",
        product.image || ""
    );

    if (image === null) {
        return;
    }

    var description = prompt(
        "Description:",
        product.description || ""
    );

    if (description === null) {
        return;
    }

    var stock = prompt(
        "Stock status: available or out_of_stock",
        product.stock || "available"
    );

    if (stock === null) {
        return;
    }

    var updatedProduct = {
        name: name.trim(),
        size: size.trim(),
        price: Number(price),
        category: category.trim(),
        image: image.trim(),
        stock: stock.trim(),
        description: description.trim()
    };

    fetch(PRODUCTS_API + "/" + id, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updatedProduct)
    })
        .then(function(response) {

            if (response.status === 401) {
                logoutAdmin();
                throw new Error("Login session expired.");
            }

            return response.text().then(function(text) {

                var data = {};

                try {
                    data = JSON.parse(text);
                } catch (error) {
                    data = {};
                }

                return {
                    ok: response.ok,
                    data: data
                };
            });
        })
        .then(function(result) {

            if (!result.ok) {
                throw new Error(
                    result.data.message ||
                    result.data.error ||
                    "Unable to update product."
                );
            }

            showMessage("Product updated successfully.");

            loadProducts();

        })
        .catch(function(error) {

            console.error("Edit product error:", error);

            showMessage(error.message);
        });
}


// ============================================================
// DELETE PRODUCT
// ============================================================

function deleteProduct(id) {

    var product = products.find(function(item) {

        return Number(item.id) === Number(id);
    });

    var productName =
        product && product.name
            ? product.name
            : "this product";

    var confirmed = confirm(
        "Are you sure you want to delete " +
        productName +
        "?"
    );

    if (!confirmed) {
        return;
    }

    fetch(PRODUCTS_API + "/" + id, {
        method: "DELETE",
        headers: authHeaders()
    })
        .then(function(response) {

            if (response.status === 401) {
                logoutAdmin();
                throw new Error("Login session expired.");
            }

            return response.text().then(function(text) {

                var data = {};

                try {
                    data = JSON.parse(text);
                } catch (error) {
                    data = {};
                }

                return {
                    ok: response.ok,
                    data: data
                };
            });
        })
        .then(function(result) {

            if (!result.ok) {
                throw new Error(
                    result.data.message ||
                    result.data.error ||
                    "Unable to delete product."
                );
            }

            showMessage("Product deleted successfully.");

            loadProducts();

        })
        .catch(function(error) {

            console.error("Delete product error:", error);

            showMessage(error.message);
        });
}


// ============================================================
// CLEAR PRODUCT FORM
// ============================================================

function clearProductForm() {

    var ids = [
        "productName",
        "productSize",
        "productPrice",
        "productCategory",
        "productImage",
        "productDescription"
    ];

    ids.forEach(function(id) {

        var element = getElement(id);

        if (element) {
            element.value = "";
        }
    });

    var stockElement = getElement("productStock");

    if (stockElement) {
        stockElement.value = "available";
    }
}


// ============================================================
// LOAD ORDERS
// ============================================================

function loadOrders() {

    fetch(ORDERS_API, {
        method: "GET",
        headers: authHeaders()
    })
        .then(function(response) {

            if (response.status === 401) {
                logoutAdmin();
                throw new Error("Login session expired.");
            }

            if (!response.ok) {
                throw new Error(
                    "Unable to load orders."
                );
            }

            return response.json();
        })
        .then(function(data) {

            if (Array.isArray(data)) {
                orders = data;
            } else if (Array.isArray(data.orders)) {
                orders = data.orders;
            } else {
                orders = [];
            }

            renderOrders();
            updateDashboard();

        })
        .catch(function(error) {

            console.error("Orders error:", error);

            setText(
                "ordersTableMessage",
                error.message
            );
        });
}


// ============================================================
// RENDER ORDERS
// ============================================================

function renderOrders() {

    var tableBody =
        getElement("ordersTableBody") ||
        getElement("orderTableBody") ||
        getElement("ordersList");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (orders.length === 0) {

        tableBody.innerHTML =
            "<tr>" +
            "<td colspan='10'>No orders found.</td>" +
            "</tr>";

        return;
    }

    orders.forEach(function(order) {

        var row = document.createElement("tr");

        var id = order.id || "";
        var customerName =
            order.customer_name ||
            order.customerName ||
            order.name ||
            "";

        var phone =
            order.phone ||
            order.mobile ||
            "";

        var address =
            order.address ||
            "";

        var total =
            order.total ||
            order.amount ||
            0;

        var status =
            order.status ||
            "pending";

        var created =
            order.created_at ||
            order.createdAt ||
            "";

        var items =
            order.items ||
            order.products ||
            "";

        if (typeof items === "object") {
            items = JSON.stringify(items);
        }

        row.innerHTML =
            "<td>" + escapeHTML(id) + "</td>" +
            "<td>" + escapeHTML(customerName) + "</td>" +
            "<td>" + escapeHTML(phone) + "</td>" +
            "<td>" + escapeHTML(address) + "</td>" +
            "<td>" + escapeHTML(items) + "</td>" +
            "<td>₹" + escapeHTML(total) + "</td>" +
            "<td>" + escapeHTML(created) + "</td>" +
            "<td>" +
            createStatusSelect(id, status) +
            "</td>" +
            "<td>" +
            "<button type='button' " +
            "onclick='updateOrderStatus(" +
            id +
            ")'>" +
            "Update" +
            "</button>" +
            "</td>";

        tableBody.appendChild(row);
    });
}


// ============================================================
// ORDER STATUS SELECT
// ============================================================

function createStatusSelect(id, currentStatus) {

    var statuses = [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled"
    ];

    var html =
        "<select id='orderStatus_" +
        id +
        "'>";

    statuses.forEach(function(status) {

        var selected =
            status === currentStatus
                ? " selected"
                : "";

        html +=
            "<option value='" +
            status +
            "'" +
            selected +
            ">" +
            formatStatus(status) +
            "</option>";
    });

    html += "</select>";

    return html;
}


// ============================================================
// FORMAT STATUS
// ============================================================

function formatStatus(status) {

    return String(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, function(letter) {
            return letter.toUpperCase();
        });
}


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

function updateOrderStatus(id) {

    var select =
        getElement("orderStatus_" + id);

    if (!select) {
        showMessage("Order status selector not found.");
        return;
    }

    var newStatus = select.value;

    fetch(ORDERS_API + "/" + id + "/status", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
            status: newStatus
        })
    })
        .then(function(response) {

            if (response.status === 401) {
                logoutAdmin();
                throw new Error("Login session expired.");
            }

            return response.text().then(function(text) {

                var data = {};

                try {
                    data = JSON.parse(text);
                } catch (error) {
                    data = {};
                }

                return {
                    ok: response.ok,
                    data: data
                };
            });
        })
        .then(function(result) {

            if (!result.ok) {
                throw new Error(
                    result.data.message ||
                    result.data.error ||
                    "Unable to update order status."
                );
            }

            showMessage(
                "Order status updated successfully."
            );

            loadOrders();

        })
        .catch(function(error) {

            console.error(
                "Order status error:",
                error
            );

            showMessage(error.message);
        });
}


// ============================================================
// LOAD SHOP STATUS
// ============================================================

function loadShopStatus() {

    fetch(SHOP_STATUS_API, {
        method: "GET",
        headers: authHeaders()
    })
        .then(function(response) {

            if (!response.ok) {
                throw new Error(
                    "Unable to load shop status."
                );
            }

            return response.json();
        })
        .then(function(data) {

            if (typeof data.open === "boolean") {
                shopOpen = data.open;
            } else if (
                typeof data.shopOpen === "boolean"
            ) {
                shopOpen = data.shopOpen;
            } else if (
                typeof data.isOpen === "boolean"
            ) {
                shopOpen = data.isOpen;
            }

            updateShopStatusUI();
        })
        .catch(function(error) {

            console.error(
                "Shop status error:",
                error
            );
        });
}


// ============================================================
// UPDATE SHOP STATUS UI
// ============================================================

function updateShopStatusUI() {

    var statusText =
        shopOpen
            ? "Shop Open"
            : "Shop Closed";

    var statusElement =
        getElement("shopStatusText");

    if (statusElement) {
        statusElement.textContent = statusText;
    }

    var button =
        getElement("shopStatusButton");

    if (button) {

        button.textContent =
            shopOpen
                ? "Close Shop"
                : "Open Shop";
    }

    var checkbox =
        getElement("shopOpenCheckbox");

    if (checkbox) {
        checkbox.checked = shopOpen;
    }
}


// ============================================================
// TOGGLE SHOP STATUS
// ============================================================

function toggleShopStatus() {

    var newStatus = !shopOpen;

    fetch(SHOP_STATUS_API, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
            open: newStatus
        })
    })
        .then(function(response) {

            if (!response.ok) {
                return fetch(SHOP_STATUS_API, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        open: newStatus
                    })
                });
            }

            return response;
        })
        .then(function(response) {

            if (!response.ok) {
                throw new Error(
                    "Unable to change shop status."
                );
            }

            return response.json();
        })
        .then(function(data) {

            if (typeof data.open === "boolean") {
                shopOpen = data.open;
            } else {
                shopOpen = newStatus;
            }

            updateShopStatusUI();

            showMessage(
                shopOpen
                    ? "Shop is now OPEN."
                    : "Shop is now CLOSED."
            );

        })
        .catch(function(error) {

            console.error(
                "Toggle shop error:",
                error
            );

            showMessage(error.message);
        });
}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    setText(
        "totalProducts",
        products.length
    );

    setText(
        "totalOrders",
        orders.length
    );

    var pendingCount = orders.filter(function(order) {

        return String(order.status).toLowerCase() === "pending";

    }).length;

    setText(
        "pendingOrders",
        pendingCount
    );

    var deliveredCount = orders.filter(function(order) {

        return String(order.status).toLowerCase() === "delivered";

    }).length;

    setText(
        "deliveredOrders",
        deliveredCount
    );
}


// ============================================================
// SECTION NAVIGATION
// ============================================================

function showSection(sectionName) {

    var sections = [
        "adminDashboard",
        "dashboardSection",
        "productsSection",
        "ordersSection",
        "settingsSection"
    ];

    sections.forEach(function(id) {

        var element = getElement(id);

        if (element) {
            element.style.display = "none";
        }
    });

    var target = getElement(sectionName);

    if (target) {
        target.style.display = "";
    }

    if (
        sectionName === "productsSection"
    ) {
        loadProducts();
    }

    if (
        sectionName === "ordersSection"
    ) {
        loadOrders();
    }

    if (
        sectionName === "settingsSection"
    ) {
        loadShopStatus();
    }
}


// ============================================================
// BUTTON ALIASES
// ============================================================

function showDashboard() {
    showSection("adminDashboard");
}


function showProducts() {
    showSection("productsSection");
}


function showOrders() {
    showSection("ordersSection");
}


function showSettings() {
    showSection("settingsSection");
}


// ============================================================
// PAGE START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        var loginForm =
            getElement("adminLoginForm");

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                loginAdmin
            );
        }

        var loginButton =
            getElement("loginButton");

        if (loginButton) {

            loginButton.addEventListener(
                "click",
                loginAdmin
            );
        }

        var logoutButton =
            getElement("logoutButton");

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logoutAdmin
            );
        }

        var addButton =
            getElement("addProductButton");

        if (addButton) {

            addButton.addEventListener(
                "click",
                addProduct
            );
        }

        var shopButton =
            getElement("shopStatusButton");

        if (shopButton) {

            shopButton.addEventListener(
                "click",
                toggleShopStatus
            );
        }

        checkSavedLogin();
    }
);


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;

window.addProduct = addProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;

window.loadProducts = loadProducts;
window.loadOrders = loadOrders;
window.loadShopStatus = loadShopStatus;

window.updateOrderStatus = updateOrderStatus;
window.toggleShopStatus = toggleShopStatus;

window.showSection = showSection;
window.showDashboard = showDashboard;
window.showProducts = showProducts;
window.showOrders = showOrders;
window.showSettings = showSettings;