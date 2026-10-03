// ============================================================
// ROHITH MINI MART - FINAL ADMIN PANEL
// ============================================================

const API_URL =
    "https://shyam-mini-mart.onrender.com/api/products";

const ORDERS_API_URL =
    "https://shyam-mini-mart.onrender.com/api/orders";

const SHOP_STATUS_API_URL =
    "https://shyam-mini-mart.onrender.com/api/shop-status";

const LOGIN_API_URL =
    "https://shyam-mini-mart.onrender.com/api/admin/login";

const ADMIN_TOKEN_KEY =
    "rohithAdminToken";


let products = [];
let orders = [];
let shopOpen = true;


// ============================================================
// PAGE START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Always require login when Admin page is opened.
        localStorage.removeItem(
            ADMIN_TOKEN_KEY
        );

        localStorage.removeItem(
            "rohithAdminLoggedIn"
        );

        showAdminLogin();

        setupLogin();

        setupProductForm();

    }
);


// ============================================================
// LOGIN SCREEN
// ============================================================

function showAdminLogin() {

    const loginScreen =
        document.getElementById(
            "adminLoginScreen"
        );

    const adminPanel =
        document.getElementById(
            "adminPanel"
        );

    if (loginScreen) {

        loginScreen.style.display =
            "flex";

    }

    if (adminPanel) {

        adminPanel.style.display =
            "none";

    }

}


// ============================================================
// ADMIN PANEL
// ============================================================

function showAdminPanel() {

    const loginScreen =
        document.getElementById(
            "adminLoginScreen"
        );

    const adminPanel =
        document.getElementById(
            "adminPanel"
        );

    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }

    if (adminPanel) {

        adminPanel.style.display =
            "flex";

    }

}


// ============================================================
// LOGIN SETUP
// ============================================================

function setupLogin() {

    const loginForm =
        document.getElementById(
            "adminLoginForm"
        );

    if (!loginForm) {

        console.error(
            "Admin login form not found."
        );

        return;

    }

    loginForm.addEventListener(
        "submit",
        adminLogin
    );

}


// ============================================================
// ADMIN LOGIN
// ============================================================

async function adminLogin(event) {

    event.preventDefault();

    const usernameInput =
        document.getElementById(
            "adminUsername"
        );

    const passwordInput =
        document.getElementById(
            "adminPassword"
        );

    const loginButton =
        document.getElementById(
            "loginButton"
        );

    const loginError =
        document.getElementById(
            "loginError"
        );


    const username =
        usernameInput
            ? usernameInput.value.trim()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";


    if (loginError) {

        loginError.textContent =
            "";

    }


    if (!username || !password) {

        if (loginError) {

            loginError.textContent =
                "Please enter username and password.";

        }

        return;

    }


    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.textContent =
            "Logging in...";

    }


    try {

        const response =
            await fetch(
                LOGIN_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            username:
                                username,

                            password:
                                password
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Invalid username or password."
            );

        }


        if (!data.token) {

            throw new Error(
                "Login token was not received."
            );

        }


        localStorage.setItem(
            ADMIN_TOKEN_KEY,
            data.token
        );


        localStorage.setItem(
            "rohithAdminLoggedIn",
            "true"
        );


        showAdminPanel();


        await loadProducts();

        await loadOrders();

        await loadShopStatus();


        showAdminSection(
            "products",
            document.querySelector(
                ".nav-item"
            )
        );


    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );


        if (loginError) {

            loginError.textContent =
                error.message ||
                "Login failed.";

        }

    } finally {

        if (loginButton) {

            loginButton.disabled =
                false;

            loginButton.textContent =
                "Login";

        }

    }

}


// ============================================================
// LOGOUT
// ============================================================

function adminLogout() {

    localStorage.removeItem(
        ADMIN_TOKEN_KEY
    );

    localStorage.removeItem(
        "rohithAdminLoggedIn"
    );

    products = [];

    orders = [];

    showAdminLogin();


    const username =
        document.getElementById(
            "adminUsername"
        );

    const password =
        document.getElementById(
            "adminPassword"
        );

    const loginError =
        document.getElementById(
            "loginError"
        );


    if (username) {

        username.value =
            "";

    }

    if (password) {

        password.value =
            "";

    }

    if (loginError) {

        loginError.textContent =
            "";

    }

}


// ============================================================
// ADMIN FETCH
// ============================================================

async function adminFetch(
    url,
    options
) {

    const token =
        localStorage.getItem(
            ADMIN_TOKEN_KEY
        );


    if (!token) {

        showAdminLogin();

        throw new Error(
            "Admin login required."
        );

    }


    const requestOptions =
        options || {};


    const headers = {
        ...(requestOptions.headers || {}),

        Authorization:
            "Bearer " + token
    };


    const response =
        await fetch(
            url,
            {
                ...requestOptions,
                headers: headers
            }
        );


    if (
        response.status ===
        401
    ) {

        localStorage.removeItem(
            ADMIN_TOKEN_KEY
        );

        localStorage.removeItem(
            "rohithAdminLoggedIn"
        );


        showAdminLogin();


        throw new Error(
            "Login expired. Please login again."
        );

    }


    return response;

}


// ============================================================
// SECTION NAVIGATION
// ============================================================

function showAdminSection(
    section,
    button
) {

    const sections = [
        "productsSection",
        "ordersSection",
        "dashboardSection"
    ];


    sections.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.style.display =
                    "none";

            }

        }
    );


    const selectedSection =
        document.getElementById(
            section + "Section"
        );


    if (selectedSection) {

        selectedSection.style.display =
            "block";

    }


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            function (item) {

                item.classList.remove(
                    "active"
                );

            }
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    if (section === "products") {

        loadProducts();

    }


    if (section === "orders") {

        loadOrders();

    }


    if (section === "dashboard") {

        updateDashboard();

        loadOrders();

        loadShopStatus();

    }

}


// ============================================================
// LOAD PRODUCTS
// ============================================================

async function loadProducts() {

    try {

        const response =
            await adminFetch(
                API_URL
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load products."
            );

        }


        products =
            Array.isArray(data)
                ? data
                : [];


        displayProducts(
            products
        );


        updateProductStats();

        updateDashboard();


    } catch (error) {

        console.error(
            "Load products error:",
            error
        );


        const list =
            document.getElementById(
                "adminProductList"
            );


        if (list) {

            list.innerHTML =
                `
                <tr>
                    <td
                        colspan="6"
                        style="text-align:center;"
                    >
                        Unable to load products.
                    </td>
                </tr>
                `;

        }

    }

}


// ============================================================
// DISPLAY PRODUCTS
// ============================================================

function displayProducts(list) {

    const tbody =
        document.getElementById(
            "adminProductList"
        );


    if (!tbody) {

        return;

    }


    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        tbody.innerHTML =
            `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;"
                >
                    No products found.
                </td>
            </tr>
            `;

        return;

    }


    tbody.innerHTML =
        list
            .map(
                function (product) {

                    const available =
                        String(
                            product.stock ||
                            "available"
                        ).toLowerCase() ===
                        "available";


                    const image =
                        product.image ||
                        "";


                    return `
                        <tr>

                            <td>

                                <div class="admin-product">

                                    ${
                                        image
                                            ? `
                                            <img
                                                src="${escapeHTML(image)}"
                                                alt="${escapeHTML(product.name)}"
                                                onerror="this.style.display='none'"
                                            >
                                            `
                                            : ""
                                    }

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                product.name
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeHTML(
                                                product.size ||
                                                ""
                                            )}
                                        </small>

                                    </div>

                                </div>

                            </td>


                            <td>
                                ${escapeHTML(
                                    formatCategory(
                                        product.category
                                    )
                                )}
                            </td>


                            <td>
                                ${escapeHTML(
                                    product.size ||
                                    "-"
                                )}
                            </td>


                            <td>
                                ₹${Number(
                                    product.price ||
                                    0
                                ).toFixed(2)}
                            </td>


                            <td>

                                <span
                                    class="stock-badge ${
                                        available
                                            ? "available"
                                            : "out"
                                    }"
                                >
                                    ${
                                        available
                                            ? "Available"
                                            : "Out of Stock"
                                    }
                                </span>

                            </td>


                            <td>

                                <button
                                    class="edit-btn"
                                    onclick="editProduct(${Number(
                                        product.id
                                    )})"
                                >
                                    ✏️ Edit
                                </button>


                                <button
                                    class="delete-btn"
                                    onclick="deleteProduct(${Number(
                                        product.id
                                    )})"
                                >
                                    🗑️ Delete
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


// ============================================================
// SEARCH PRODUCTS
// ============================================================

function searchAdminProducts() {

    const input =
        document.getElementById(
            "adminSearch"
        );


    if (!input) {

        return;

    }


    const search =
        input.value
            .toLowerCase()
            .trim();


    const filtered =
        products.filter(
            function (product) {

                return (

                    String(
                        product.name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        product.category ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        product.size ||
                        ""
                    )
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    displayProducts(
        filtered
    );

}


// ============================================================
// PRODUCT STATS
// ============================================================

function updateProductStats() {

    const total =
        products.length;


    const available =
        products.filter(
            function (product) {

                return String(
                    product.stock ||
                    "available"
                ).toLowerCase() ===
                "available";

            }
        ).length;


    const outOfStock =
        products.filter(
            function (product) {

                return String(
                    product.stock ||
                    ""
                ).toLowerCase() !==
                "available";

            }
        ).length;


    setText(
        "totalProducts",
        total
    );

    setText(
        "availableProducts",
        available
    );

    setText(
        "outOfStockProducts",
        outOfStock
    );

}


// ============================================================
// OPEN ADD PRODUCT FORM
// ============================================================

function openProductForm() {

    const overlay =
        document.getElementById(
            "productFormOverlay"
        );

    const form =
        document.getElementById(
            "productForm"
        );

    const title =
        document.getElementById(
            "formTitle"
        );

    const productId =
        document.getElementById(
            "productId"
        );


    if (form) {

        form.reset();

    }


    if (productId) {

        productId.value =
            "";

    }


    if (title) {

        title.textContent =
            "Add Product";

    }


    if (overlay) {

        overlay.style.display =
            "flex";

    }

}


// ============================================================
// CLOSE PRODUCT FORM
// ============================================================

function closeProductForm() {

    const overlay =
        document.getElementById(
            "productFormOverlay"
        );


    if (overlay) {

        overlay.style.display =
            "none";

    }

}


// ============================================================
// CLOSE FORM OUTSIDE
// ============================================================

function closeFormOutside(
    event
) {

    if (
        event.target.id ===
        "productFormOverlay"
    ) {

        closeProductForm();

    }

}


// ============================================================
// EDIT PRODUCT
// ============================================================

function editProduct(id) {

    const product =
        products.find(
            function (item) {

                return Number(
                    item.id
                ) ===
                Number(id);

            }
        );


    if (!product) {

        alert(
            "Product not found."
        );

        return;

    }


    setValue(
        "productId",
        product.id
    );

    setValue(
        "productName",
        product.name
    );

    setValue(
        "productSize",
        product.size
    );

    setValue(
        "productPrice",
        product.price
    );

    setValue(
        "productCategory",
        product.category
    );

    setValue(
        "productImage",
        product.image
    );

    setValue(
        "productStock",
        product.stock ===
            "out_of_stock"
            ? "out_of_stock"
            : "available"
    );

    setValue(
        "productDescription",
        product.description
    );


    const title =
        document.getElementById(
            "formTitle"
        );


    if (title) {

        title.textContent =
            "Edit Product";

    }


    const overlay =
        document.getElementById(
            "productFormOverlay"
        );


    if (overlay) {

        overlay.style.display =
            "flex";

    }

}


// ============================================================
// SAVE PRODUCT
// ============================================================

async function saveProduct(
    event
) {

    event.preventDefault();


    const id =
        getValue(
            "productId"
        );


    const name =
        getValue(
            "productName"
        ).trim();


    const size =
        getValue(
            "productSize"
        ).trim();


    const price =
        Number(
            getValue(
                "productPrice"
            )
        );


    const category =
        getValue(
            "productCategory"
        );


    const image =
        getValue(
            "productImage"
        ).trim();


    const stock =
        getValue(
            "productStock"
        );


    const description =
        getValue(
            "productDescription"
        ).trim();


    if (!name) {

        alert(
            "Please enter product name."
        );

        return;

    }


    if (
        Number.isNaN(price) ||
        price < 0
    ) {

        alert(
            "Please enter a valid price."
        );

        return;

    }


    const productData = {

        name:
            name,

        size:
            size,

        price:
            price,

        category:
            category,

        image:
            image,

        stock:
            stock,

        description:
            description

    };


    try {

        let response;


        if (id) {

            response =
                await adminFetch(
                    API_URL +
                    "/" +
                    id,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                productData
                            )
                    }
                );

        } else {

            response =
                await adminFetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                productData
                            )
                    }
                );

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to save product."
            );

        }


        alert(
            id
                ? "Product updated successfully!"
                : "Product added successfully!"
        );


        closeProductForm();


        await loadProducts();


    } catch (error) {

        console.error(
            "Save product error:",
            error
        );


        alert(
            "Unable to save product.\n\n" +
            error.message
        );

    }

}


// ============================================================
// DELETE PRODUCT
// ============================================================

async function deleteProduct(
    id
) {

    const product =
        products.find(
            function (item) {

                return Number(
                    item.id
                ) ===
                Number(id);

            }
        );


    if (!product) {

        return;

    }


    const confirmed =
        confirm(
            "Delete \"" +
            product.name +
            "\"?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await adminFetch(
                API_URL +
                "/" +
                id,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to delete product."
            );

        }


        alert(
            "Product deleted successfully!"
        );


        await loadProducts();


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );


        alert(
            "Unable to delete product.\n\n" +
            error.message
        );

    }

}


// ============================================================
// PRODUCT FORM SETUP
// ============================================================

function setupProductForm() {

    const form =
        document.getElementById(
            "productForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveProduct
        );

    }

}


// ============================================================
// LOAD SHOP STATUS
// ============================================================

async function loadShopStatus() {

    try {

        const response =
            await fetch(
                SHOP_STATUS_API_URL
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to load shop status."
            );

        }


        // Backend returns shopOpen.
        // Also support open and shop_open.
        if (
            data.shopOpen !==
            undefined
        ) {

            shopOpen =
                Boolean(
                    data.shopOpen
                );

        } else if (
            data.open !==
            undefined
        ) {

            shopOpen =
                Boolean(
                    data.open
                );

        } else {

            shopOpen =
                Boolean(
                    data.shop_open
                );

        }


        updateShopStatus();


    } catch (error) {

        console.error(
            "Load shop status error:",
            error
        );

        updateShopStatus();

    }

}


// ============================================================
// TOGGLE SHOP STATUS
// ============================================================

async function toggleShopStatus() {

    const newStatus =
        !shopOpen;


    try {

        const response =
            await adminFetch(
                SHOP_STATUS_API_URL,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            shopOpen:
                                newStatus
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to update shop status."
            );

        }


        if (
            data.shopOpen !==
            undefined
        ) {

            shopOpen =
                Boolean(
                    data.shopOpen
                );

        } else if (
            data.open !==
            undefined
        ) {

            shopOpen =
                Boolean(
                    data.open
                );

        } else {

            shopOpen =
                newStatus;

        }


        updateShopStatus();


        alert(
            shopOpen
                ? "Shop is now OPEN."
                : "Shop is now CLOSED."
        );


    } catch (error) {

        console.error(
            "Shop status error:",
            error
        );


        alert(
            "Unable to update shop status.\n\n" +
            error.message
        );

    }

}


// ============================================================
// UPDATE SHOP STATUS DISPLAY
// ============================================================

function updateShopStatus() {

    const statusText =
        document.getElementById(
            "shopStatusText"
        );

    const statusButton =
        document.getElementById(
            "shopStatusButton"
        );

    const statusIcon =
        document.getElementById(
            "shopStatusIcon"
        );


    if (shopOpen) {

        if (statusText) {

            statusText.textContent =
                "Shop Open";

        }

        if (statusButton) {

            statusButton.textContent =
                "Close Shop";

            statusButton.style.background =
                "#16803c";

        }

        if (statusIcon) {

            statusIcon.textContent =
                "🟢";

        }

    } else {

        if (statusText) {

            statusText.textContent =
                "Shop Closed";

        }

        if (statusButton) {

            statusButton.textContent =
                "Open Shop";

            statusButton.style.background =
                "#d33";

        }

        if (statusIcon) {

            statusIcon.textContent =
                "🔴";

        }

    }

}


// ============================================================
// LOAD ORDERS
// ============================================================

async function loadOrders() {

    try {

        const response =
            await adminFetch(
                ORDERS_API_URL
            );


        const data =
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


        displayOrders(
            orders
        );


        updateOrderStats();

        updateDashboard();


    } catch (error) {

        console.error(
            "Load orders error:",
            error
        );


        const list =
            document.getElementById(
                "adminOrderList"
            );


        if (list) {

            list.innerHTML =
                `
                <tr>
                    <td
                        colspan="6"
                        style="text-align:center;"
                    >
                        Unable to load orders.
                    </td>
                </tr>
                `;

        }

    }

}


// ============================================================
// DISPLAY ORDERS
// ============================================================

function displayOrders(list) {

    const tbody =
        document.getElementById(
            "adminOrderList"
        );


    if (!tbody) {

        return;

    }


    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        tbody.innerHTML =
            `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;"
                >
                    🛍️ No orders yet
                </td>
            </tr>
            `;

        return;

    }


    tbody.innerHTML =
        list
            .map(
                function (order) {

                    return `
                        <tr>

                            <td>
                                <strong>
                                    #${Number(
                                        order.id
                                    )}
                                </strong>
                            </td>


                            <td>

                                <strong>
                                    ${escapeHTML(
                                        order.customer_name ||
                                        ""
                                    )}
                                </strong>

                                <br>

                                <small>
                                    ${escapeHTML(
                                        order.address ||
                                        ""
                                    )}
                                </small>

                            </td>


                            <td>
                                ${escapeHTML(
                                    order.phone ||
                                    ""
                                )}
                            </td>


                            <td>
                                <strong>
                                    ₹${Number(
                                        order.total ||
                                        0
                                    ).toFixed(2)}
                                </strong>
                            </td>


                            <td>

                                <select
                                    class="status-select"
                                    onchange="updateOrderStatus(${Number(
                                        order.id
                                    )}, this.value)"
                                >

                                    <option
                                        value="pending"
                                        ${
                                            order.status ===
                                            "pending"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Pending
                                    </option>


                                    <option
                                        value="confirmed"
                                        ${
                                            order.status ===
                                            "confirmed"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Confirmed
                                    </option>


                                    <option
                                        value="preparing"
                                        ${
                                            order.status ===
                                            "preparing"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Preparing
                                    </option>


                                    <option
                                        value="out_for_delivery"
                                        ${
                                            order.status ===
                                            "out_for_delivery"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Out for Delivery
                                    </option>


                                    <option
                                        value="delivered"
                                        ${
                                            order.status ===
                                            "delivered"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Delivered
                                    </option>


                                    <option
                                        value="cancelled"
                                        ${
                                            order.status ===
                                            "cancelled"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Cancelled
                                    </option>

                                </select>

                            </td>


                            <td>

                                <button
                                    class="edit-btn"
                                    onclick="viewOrderDetails(${Number(
                                        order.id
                                    )})"
                                >
                                    👁️ View
                                </button>

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


// ============================================================
// SEARCH ORDERS
// ============================================================

function searchAdminOrders() {

    const searchInput =
        document.getElementById(
            "orderSearch"
        );

    const filterInput =
        document.getElementById(
            "orderStatusFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const status =
        filterInput
            ? filterInput.value
            : "all";


    const filtered =
        orders.filter(
            function (order) {

                const text =
                    String(
                        order.id
                    ) +
                    " " +
                    String(
                        order.customer_name ||
                        ""
                    ) +
                    " " +
                    String(
                        order.phone ||
                        ""
                    ) +
                    " " +
                    String(
                        order.address ||
                        ""
                    );


                const matchesSearch =
                    text
                        .toLowerCase()
                        .includes(
                            search
                        );


                const matchesStatus =
                    status === "all" ||
                    order.status === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    displayOrders(
        filtered
    );

}


// ============================================================
// ORDER FILTER
// ============================================================

function filterAdminOrders() {

    searchAdminOrders();

}


// ============================================================
// ORDER STATS
// ============================================================

function updateOrderStats() {

    const total =
        orders.length;


    const pending =
        orders.filter(
            function (order) {

                return order.status ===
                    "pending";

            }
        ).length;


    const delivery =
        orders.filter(
            function (order) {

                return order.status ===
                    "out_for_delivery";

            }
        ).length;


    const delivered =
        orders.filter(
            function (order) {

                return order.status ===
                    "delivered";

            }
        ).length;


    setText(
        "totalOrders",
        total
    );

    setText(
        "pendingOrders",
        pending
    );

    setText(
        "deliveryOrders",
        delivery
    );

    setText(
        "deliveredOrders",
        delivered
    );

}


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

async function updateOrderStatus(
    id,
    status
) {

    try {

        const response =
            await adminFetch(
                ORDERS_API_URL +
                "/" +
                id +
                "/status",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status:
                                status
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to update order."
            );

        }


        const order =
            orders.find(
                function (item) {

                    return Number(
                        item.id
                    ) ===
                    Number(id);

                }
            );


        if (order) {

            order.status =
                status;

        }


        updateOrderStats();

        updateDashboard();


        alert(
            "Order #" +
            id +
            " status updated."
        );


    } catch (error) {

        console.error(
            "Order status error:",
            error
        );


        alert(
            "Unable to update order.\n\n" +
            error.message
        );


        await loadOrders();

    }

}


// ============================================================
// VIEW ORDER DETAILS
// ============================================================

async function viewOrderDetails(
    id
) {

    const overlay =
        document.getElementById(
            "orderDetailsOverlay"
        );

    const content =
        document.getElementById(
            "orderDetailsContent"
        );

    const subtitle =
        document.getElementById(
            "orderDetailsSubtitle"
        );


    if (!overlay || !content) {

        return;

    }


    overlay.style.display =
        "flex";


    content.innerHTML =
        `
        <p style="text-align:center;">
            Loading order...
        </p>
        `;


    try {

        const response =
            await adminFetch(
                ORDERS_API_URL +
                "/" +
                id
            );


        const order =
            await response.json();


        if (!response.ok) {

            throw new Error(
                order.message ||
                "Failed to load order."
            );

        }


        if (subtitle) {

            subtitle.textContent =
                "Order #" +
                order.id;

        }


        const items =
            Array.isArray(
                order.items
            )
                ? order.items
                : [];


        let itemsHTML =
            "";


        if (
            items.length ===
            0
        ) {

            itemsHTML =
                "<p>No products found.</p>";

        } else {

            itemsHTML =
                items
                    .map(
                        function (item) {

                            const itemTotal =
                                Number(
                                    item.price ||
                                    0
                                ) *
                                Number(
                                    item.quantity ||
                                    0
                                );


                            return `
                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        padding:10px 0;
                                        border-bottom:1px solid #eee;
                                    "
                                >

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                item.product_name ||
                                                ""
                                            )}
                                        </strong>

                                        <br>

                                        <small>
                                            ${
                                                Number(
                                                    item.quantity ||
                                                    0
                                                )
                                            }
                                            ×
                                            ₹${Number(
                                                item.price ||
                                                0
                                            ).toFixed(2)}
                                        </small>

                                    </div>


                                    <strong>
                                        ₹${itemTotal.toFixed(2)}
                                    </strong>

                                </div>
                            `;

                        }
                    )
                    .join("");

        }


        content.innerHTML =
            `
            <div>

                <h3>
                    Customer Information
                </h3>

                <p>
                    <strong>Name:</strong>
                    ${escapeHTML(
                        order.customer_name ||
                        ""
                    )}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${escapeHTML(
                        order.phone ||
                        ""
                    )}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${escapeHTML(
                        order.address ||
                        ""
                    )}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${formatStatus(
                        order.status
                    )}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${formatDate(
                        order.created_at
                    )}
                </p>

            </div>


            <div>

                <h3>
                    Ordered Products
                </h3>

                ${itemsHTML}

            </div>


            <div
                style="
                    margin-top:20px;
                    padding-top:15px;
                    border-top:2px solid #ddd;
                    display:flex;
                    justify-content:space-between;
                "
            >

                <strong>
                    Total
                </strong>

                <strong>
                    ₹${Number(
                        order.total ||
                        0
                    ).toFixed(2)}
                </strong>

            </div>
            `;


    } catch (error) {

        console.error(
            "View order error:",
            error
        );


        content.innerHTML =
            `
            <p style="text-align:center;">
                Unable to load order details.
            </p>
            `;

    }

}


// ============================================================
// CLOSE ORDER DETAILS
// ============================================================

function closeOrderDetails() {

    const overlay =
        document.getElementById(
            "orderDetailsOverlay"
        );


    if (overlay) {

        overlay.style.display =
            "none";

    }

}


// ============================================================
// CLOSE ORDER DETAILS OUTSIDE
// ============================================================

function closeOrderDetailsOutside(
    event
) {

    if (
        event.target.id ===
        "orderDetailsOverlay"
    ) {

        closeOrderDetails();

    }

}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    const sales =
        orders
            .filter(
                function (order) {

                    return order.status !==
                        "cancelled";

                }
            )
            .reduce(
                function (
                    total,
                    order
                ) {

                    return (
                        total +
                        Number(
                            order.total ||
                            0
                        )
                    );

                },
                0
            );


    setText(
        "dashboardProducts",
        products.length
    );


    setText(
        "dashboardOrders",
        orders.length
    );


    setText(
        "dashboardSales",
        "₹" +
        sales.toFixed(2)
    );

}


// ============================================================
// CATEGORY
// ============================================================

function formatCategory(
    category
) {

    const value =
        String(
            category ||
            ""
        );


    const categories = {

        groceries:
            "Groceries",

        Groceries:
            "Groceries",

        dairy:
            "Dairy",

        Dairy:
            "Dairy",

        snacks:
            "Snacks",

        Snacks:
            "Snacks",

        drinks:
            "Drinks",

        Beverages:
            "Beverages",

        beverages:
            "Beverages",

        personal:
            "Personal Care",

        "Personal Care":
            "Personal Care",

        household:
            "Household",

        Cleaning:
            "Cleaning"

    };


    return (
        categories[value] ||
        value ||
        "Other"
    );

}


// ============================================================
// ORDER STATUS TEXT
// ============================================================

function formatStatus(
    status
) {

    const statuses = {

        pending:
            "Pending",

        confirmed:
            "Confirmed",

        preparing:
            "Preparing",

        out_for_delivery:
            "Out for Delivery",

        delivered:
            "Delivered",

        cancelled:
            "Cancelled"

    };


    return (
        statuses[status] ||
        status ||
        "Unknown"
    );

}


// ============================================================
// DATE
// ============================================================

function formatDate(
    dateString
) {

    if (!dateString) {

        return "-";

    }


    const date =
        new Date(
            String(
                dateString
            ).replace(
                " ",
                "T"
            ) +
            "Z"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateString
        );

    }


    return date.toLocaleString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


// ============================================================
// HELPER - SET TEXT
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// HELPER - SET VALUE
// ============================================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.value =
            value ??
            "";

    }

}


// ============================================================
// HELPER - GET VALUE
// ============================================================

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value
        : "";

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
    )
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