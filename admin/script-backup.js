// ============================================
// ROHITH MINI MART - ADMIN PANEL JAVASCRIPT
// ============================================

const API_URL = "http://localhost:3000/api/products";
const ORDERS_API_URL = "http://localhost:3000/api/orders";

let products = [];
let orders = [];


// ============================================
// SHOP STATUS
// ============================================

let shopOpen = true;

async function loadShopStatus() {

    try {

        const response = await fetch(
            "http://localhost:3000/api/shop-status"
        );

        const data = await response.json();

        shopOpen = data.shop_open;

        updateShopStatus();

    } catch (error) {

        console.error("Failed to load shop status:", error);

        updateShopStatus();
    }
}


async function toggleShopStatus() {

    const newStatus = !shopOpen;

    try {

        const response = await fetch(
            "http://localhost:3000/api/shop-status",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    shop_open: newStatus
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Failed to update shop status"
            );

        }


        shopOpen = data.shop_open;

        updateShopStatus();


    } catch (error) {

        console.error(
            "Failed to update shop status:",
            error
        );

        alert(
            "Unable to update shop status."
        );

    }

}


function updateShopStatus() {

    const statusText =
        document.getElementById("shopStatusText");

    const statusButton =
        document.getElementById("shopStatusButton");

    const statusIcon =
        document.getElementById("shopStatusIcon");


    if (!statusText || !statusButton) {
        return;
    }


    if (shopOpen) {

        statusText.textContent = "Open";

        statusButton.textContent = "Close Shop";

        statusButton.style.background = "#16803c";

        if (statusIcon) {
            statusIcon.textContent = "🟢";
        }

    } else {

        statusText.textContent = "Closed";

        statusButton.textContent = "Open Shop";

        statusButton.style.background = "#d33";

        if (statusIcon) {
            statusIcon.textContent = "🔴";
        }

    }

}


// ============================================
// SECTION NAVIGATION
// ============================================

function showAdminSection(section, button) {

    const sections = [
        "productsSection",
        "ordersSection",
        "dashboardSection"
    ];


    sections.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.style.display = "none";
        }

    });


    const selectedSection =
        document.getElementById(
            section + "Section"
        );


    if (selectedSection) {
        selectedSection.style.display = "block";
    }


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });


    if (button) {
        button.classList.add("active");
    }


    if (section === "products") {
        loadProducts();
    }


    if (section === "orders") {
        loadOrders();
    }


    if (section === "dashboard") {

        updateDashboard();

        loadShopStatus();

    }

}


// ============================================
// PRODUCTS
// ============================================

async function loadProducts() {

    try {

        const response =
            await fetch(API_URL);


        if (!response.ok) {
            throw new Error(
                "Failed to load products"
            );
        }


        products =
            await response.json();


        displayProducts(products);

        updateProductStats();

        updateDashboard();


    } catch (error) {

        console.error(error);


        const list =
            document.getElementById(
                "adminProductList"
            );


        if (list) {

            list.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        style="text-align:center;"
                    >
                        ❌ Unable to connect to backend
                    </td>
                </tr>
            `;

        }

    }

}


// ============================================
// DISPLAY PRODUCTS
// ============================================

function displayProducts(list) {

    const tbody =
        document.getElementById(
            "adminProductList"
        );


    if (!tbody) return;


    if (list.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="text-align:center;"
                >
                    No products found
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        list.map(product => {

            const stockAvailable =
                product.stock === "available";


            return `

                <tr>

                    <td>

                        <div class="admin-product">

                            <img
                                src="${escapeHTML(product.image || "")}"
                                alt="${escapeHTML(product.name)}"
                                onerror="this.style.display='none'"
                            >

                            <div>

                                <strong>
                                    ${escapeHTML(product.name)}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        product.size || ""
                                    )}
                                </small>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${formatCategory(
                            product.category
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            product.size || "-"
                        )}
                    </td>


                    <td>
                        ₹${Number(
                            product.price
                        ).toFixed(2)}
                    </td>


                    <td>

                        <span class="stock-badge ${
                            stockAvailable
                                ? "available"
                                : "out"
                        }">

                            ${
                                stockAvailable
                                    ? "Available"
                                    : "Out of Stock"
                            }

                        </span>

                    </td>


                    <td>

                        <button
                            class="edit-btn"
                            onclick="editProduct(${product.id})"
                        >
                            ✏️ Edit
                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteProduct(${product.id})"
                        >
                            🗑️ Delete
                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


// ============================================
// PRODUCT SEARCH
// ============================================

function searchAdminProducts() {

    const input =
        document.getElementById(
            "adminSearch"
        );


    if (!input) return;


    const search =
        input.value
            .toLowerCase()
            .trim();


    const filtered =
        products.filter(product =>

            (product.name || "")
                .toLowerCase()
                .includes(search)

            ||

            (product.category || "")
                .toLowerCase()
                .includes(search)

            ||

            (product.size || "")
                .toLowerCase()
                .includes(search)

        );


    displayProducts(filtered);

}


// ============================================
// PRODUCT STATS
// ============================================

function updateProductStats() {

    const total =
        products.length;


    const available =
        products.filter(
            product =>
                product.stock === "available"
        ).length;


    const out =
        products.filter(
            product =>
                product.stock === "out"
        ).length;


    const totalElement =
        document.getElementById(
            "totalProducts"
        );


    const availableElement =
        document.getElementById(
            "availableProducts"
        );


    const outElement =
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
        outElement.textContent = out;
    }

}


// ============================================
// OPEN PRODUCT FORM
// ============================================

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


    if (form) {
        form.reset();
    }


    document.getElementById(
        "productId"
    ).value = "";


    if (title) {
        title.textContent = "Add Product";
    }


    if (overlay) {
        overlay.style.display = "flex";
    }

}


// ============================================
// CLOSE PRODUCT FORM
// ============================================

function closeProductForm() {

    const overlay =
        document.getElementById(
            "productFormOverlay"
        );


    if (overlay) {
        overlay.style.display = "none";
    }

}


// ============================================
// CLOSE FORM OUTSIDE
// ============================================

function closeFormOutside(event) {

    if (
        event.target.id ===
        "productFormOverlay"
    ) {

        closeProductForm();

    }

}


// ============================================
// EDIT PRODUCT
// ============================================

function editProduct(id) {

    const product =
        products.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (!product) {

        alert("Product not found.");

        return;

    }


    document.getElementById(
        "productId"
    ).value = product.id;


    document.getElementById(
        "productName"
    ).value = product.name || "";


    document.getElementById(
        "productSize"
    ).value = product.size || "";


    document.getElementById(
        "productPrice"
    ).value = product.price || "";


    document.getElementById(
        "productCategory"
    ).value =
        product.category || "groceries";


    document.getElementById(
        "productImage"
    ).value = product.image || "";


    document.getElementById(
        "productStock"
    ).value =
        product.stock || "available";


    const description =
        document.getElementById(
            "productDescription"
        );


    if (description) {

        description.value =
            product.description || "";

    }


    const title =
        document.getElementById(
            "formTitle"
        );


    if (title) {
        title.textContent = "Edit Product";
    }


    const overlay =
        document.getElementById(
            "productFormOverlay"
        );


    if (overlay) {
        overlay.style.display = "flex";
    }

}


// ============================================
// SAVE PRODUCT
// ============================================

async function saveProduct(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "productId"
        ).value;


    const productData = {

        name:
            document
                .getElementById("productName")
                .value
                .trim(),

        size:
            document
                .getElementById("productSize")
                .value
                .trim(),

        price:
            Number(
                document
                    .getElementById("productPrice")
                    .value
            ),

        category:
            document.getElementById(
                "productCategory"
            ).value,

        image:
            document
                .getElementById("productImage")
                .value
                .trim(),

        stock:
            document.getElementById(
                "productStock"
            ).value,

        description:
            document
                .getElementById(
                    "productDescription"
                )
                ?.value
                .trim() || ""

    };


    try {

        let response;


        if (id) {

            response =
                await fetch(
                    `${API_URL}/${id}`,
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
                await fetch(
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


        if (!response.ok) {

            const error =
                await response.json();


            throw new Error(
                error.message ||
                "Failed to save product"
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

        console.error(error);

        alert(
            "❌ " + error.message
        );

    }

}


// ============================================
// DELETE PRODUCT
// ============================================

async function deleteProduct(id) {

    const product =
        products.find(
            item =>
                Number(item.id) === Number(id)
        );


    if (!product) return;


    const confirmed =
        confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmed) return;


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to delete product"
            );

        }


        alert(
            "Product deleted successfully!"
        );


        await loadProducts();


    } catch (error) {

        console.error(error);


        alert(
            "❌ " + error.message
        );

    }

}


// ============================================
// ORDERS
// ============================================

async function loadOrders() {

    try {

        const response =
            await fetch(
                ORDERS_API_URL
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load orders"
            );

        }


        orders =
            await response.json();


        displayOrders(orders);

        updateOrderStats();

        updateDashboard();


    } catch (error) {

        console.error(error);


        const list =
            document.getElementById(
                "adminOrderList"
            );


        if (list) {

            list.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        style="text-align:center;"
                    >

                        ❌ Unable to load orders

                    </td>

                </tr>

            `;

        }

    }

}


// ============================================
// DISPLAY ORDERS
// ============================================

function displayOrders(list) {

    const tbody =
        document.getElementById(
            "adminOrderList"
        );


    if (!tbody) return;


    if (list.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="text-align:center;"
                >

                    🛍️ No orders yet

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        list.map(order => {

            const date =
                formatDate(
                    order.created_at
                );


            return `

                <tr>

                    <td>

                        <strong>
                            #${order.id}
                        </strong>

                    </td>


                    <td>

                        <strong>
                            ${escapeHTML(
                                order.customer_name
                            )}
                        </strong>

                        <br>

                        <small>
                            ${escapeHTML(
                                order.address
                            )}
                        </small>

                    </td>


                    <td>
                        ${escapeHTML(
                            order.phone
                        )}
                    </td>


                    <td>

                        <strong>
                            ₹${Number(
                                order.total
                            ).toFixed(2)}
                        </strong>

                    </td>


                    <td>

                        ${formatPaymentMethod(
                            order.payment_method
                        )}

                    </td>


                    <td>
                        ${date}
                    </td>


                    <td>

                        <select
                            class="status-select"
                            onchange="updateOrderStatus(
                                ${order.id},
                                this.value
                            )"
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
                            onclick="viewOrderDetails(
                                ${order.id}
                            )"
                        >
                            👁️ View
                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


// ============================================
// ORDER SEARCH
// ============================================

function searchAdminOrders() {

    const searchInput =
        document.getElementById(
            "orderSearch"
        );


    const filterInput =
        document.getElementById(
            "orderStatusFilter"
        );


    if (!searchInput) return;


    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    const status =
        filterInput
            ? filterInput.value
            : "all";


    const filtered =
        orders.filter(order => {

            const matchesSearch =

                String(order.id)
                    .includes(search)

                ||

                (order.customer_name || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (order.phone || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (order.address || "")
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                status === "all"
                ||
                order.status === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    displayOrders(filtered);

}


// ============================================
// ORDER STATUS FILTER
// ============================================

function filterAdminOrders() {

    searchAdminOrders();

}


// ============================================
// ORDER STATS
// ============================================

function updateOrderStats() {

    const total =
        orders.length;


    const pending =
        orders.filter(
            order =>
                order.status === "pending"
        ).length;


    const delivery =
        orders.filter(
            order =>
                order.status ===
                "out_for_delivery"
        ).length;


    const delivered =
        orders.filter(
            order =>
                order.status ===
                "delivered"
        ).length;


    const totalElement =
        document.getElementById(
            "totalOrders"
        );


    const pendingElement =
        document.getElementById(
            "pendingOrders"
        );


    const deliveryElement =
        document.getElementById(
            "deliveryOrders"
        );


    const deliveredElement =
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


// ============================================
// UPDATE ORDER STATUS
// ============================================

async function updateOrderStatus(id, status) {

    try {

        const response =
            await fetch(
                `${ORDERS_API_URL}/${id}/status`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status: status
                        })

                }
            );


        if (!response.ok) {

            const error =
                await response.json();


            throw new Error(
                error.message ||
                "Failed to update order"
            );

        }


        const order =
            orders.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );


        if (order) {
            order.status = status;
        }


        updateOrderStats();

        updateDashboard();


        alert(
            `Order #${id} status updated to ${formatStatus(
                status
            )}`
        );


    } catch (error) {

        console.error(error);


        alert(
            "❌ " + error.message
        );


        await loadOrders();

    }

}


// ============================================
// VIEW ORDER DETAILS
// ============================================

async function viewOrderDetails(id) {

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


    if (!overlay || !content) return;


    content.innerHTML = `
        <p style="text-align:center;">
            Loading order...
        </p>
    `;


    overlay.style.display = "flex";


    try {

        const response =
            await fetch(
                `${ORDERS_API_URL}/${id}`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load order"
            );

        }


        const order =
            await response.json();


        if (subtitle) {

            subtitle.textContent =
                `Order #${order.id}`;

        }


        const items =
            order.items || [];


        const itemsHTML =
            items.length > 0

                ? items.map(item => `

                    <div
                        class="order-item"
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
                                    item.product_name
                                )}
                            </strong>

                            <br>

                            <small>
                                ${item.quantity}
                                ×
                                ₹${Number(
                                    item.price
                                ).toFixed(2)}
                            </small>

                        </div>

                        <strong>
                            ₹${(
                                Number(item.price) *
                                Number(item.quantity)
                            ).toFixed(2)}
                        </strong>

                    </div>

                `).join("")

                : "<p>No products found.</p>";


        content.innerHTML = `

            <div style="margin-bottom:20px;">

                <h3>
                    Customer Information
                </h3>

                <p>
                    <strong>Name:</strong>
                    ${escapeHTML(
                        order.customer_name
                    )}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${escapeHTML(
                        order.phone
                    )}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${escapeHTML(
                        order.address
                    )}
                </p>

                <p>
                    <strong>Payment:</strong>
                    ${formatPaymentMethod(
                        order.payment_method
                    )}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${formatStatus(
                        order.status
                    )}
                </p>

                <p>
                    <strong>Order Date:</strong>
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
                        order.total
                    ).toFixed(2)}
                </strong>

            </div>

        `;


    } catch (error) {

        console.error(error);


        content.innerHTML = `

            <p style="text-align:center;">

                ❌ Unable to load order details.

            </p>

        `;

    }

}


// ============================================
// CLOSE ORDER DETAILS
// ============================================

function closeOrderDetails() {

    const overlay =
        document.getElementById(
            "orderDetailsOverlay"
        );


    if (overlay) {
        overlay.style.display = "none";
    }

}


// ============================================
// CLOSE ORDER DETAILS OUTSIDE
// ============================================

function closeOrderDetailsOutside(event) {

    if (
        event.target.id ===
        "orderDetailsOverlay"
    ) {

        closeOrderDetails();

    }

}


// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {

    const productElement =
        document.getElementById(
            "dashboardProducts"
        );


    const orderElement =
        document.getElementById(
            "dashboardOrders"
        );


    const salesElement =
        document.getElementById(
            "dashboardSales"
        );


    if (productElement) {

        productElement.textContent =
            products.length;

    }


    if (orderElement) {

        orderElement.textContent =
            orders.length;

    }


    const sales =
        orders
            .filter(
                order =>
                    order.status !== "cancelled"
            )
            .reduce(
                (sum, order) =>
                    sum +
                    Number(
                        order.total || 0
                    ),
                0
            );


    if (salesElement) {

        salesElement.textContent =
            `₹${sales.toFixed(2)}`;

    }

}


// ============================================
// FORMAT CATEGORY
// ============================================

function formatCategory(category) {

    const categories = {

        groceries: "Groceries",

        dairy: "Dairy",

        snacks: "Snacks",

        drinks: "Drinks",

        personal: "Personal Care",

        household: "Household"

    };


    return categories[category]
        || category
        || "-";

}


// ============================================
// FORMAT STATUS
// ============================================

function formatStatus(status) {

    const statuses = {

        pending: "Pending",

        confirmed: "Confirmed",

        preparing: "Preparing",

        out_for_delivery:
            "Out for Delivery",

        delivered: "Delivered",

        cancelled: "Cancelled"

    };


    return statuses[status]
        || status
        || "Unknown";

}


// ============================================
// FORMAT PAYMENT
// ============================================

function formatPaymentMethod(method) {

    if (!method) {
        return "-";
    }


    const value =
        method.toLowerCase();


    if (
        value === "cod" ||
        value === "cash on delivery"
    ) {

        return "💵 Cash on Delivery";

    }


    if (value === "upi") {

        return "📱 UPI";

    }


    return escapeHTML(method);

}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }


    const date =
        new Date(
            dateString.replace(
                " ",
                "T"
            ) + "Z"
        );


    if (isNaN(date.getTime())) {
        return dateString;
    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================
// PAGE START
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Product form

        const productForm =
            document.getElementById(
                "productForm"
            );


        if (productForm) {

            productForm.addEventListener(
                "submit",
                saveProduct
            );

        }


        // Load products

        loadProducts();


        // Load orders

        loadOrders();


        // Load shop status

        loadShopStatus();

    }
);