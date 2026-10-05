const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

const PORT = process.env.PORT || 3000;

const JWT_SECRET =
    process.env.JWT_SECRET || "rohith-mini-mart-secret-2026";

const ADMIN_USERNAME =
    process.env.ADMIN_USERNAME || "admin";

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD || "admin123";


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


/* =========================================================
   DATABASE
========================================================= */

const dbPath = path.join(__dirname, "database.db");

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");


/* =========================================================
   CREATE TABLES
========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        size TEXT DEFAULT '',
        price REAL NOT NULL,
        category TEXT DEFAULT 'Other',
        image TEXT DEFAULT '',
        stock TEXT DEFAULT 'available',
        description TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        address TEXT DEFAULT '',
        total REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        size TEXT DEFAULT '',
        price REAL DEFAULT 0,
        quantity INTEGER DEFAULT 1,
        FOREIGN KEY(order_id)
            REFERENCES orders(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        shop_open INTEGER DEFAULT 1
    );
`);


/* =========================================================
   DEFAULT SHOP STATUS
========================================================= */

const settingsExists = db
    .prepare("SELECT id FROM settings WHERE id = 1")
    .get();

if (!settingsExists) {
    db.prepare(`
        INSERT INTO settings (id, shop_open)
        VALUES (1, 1)
    `).run();
}


/* =========================================================
   DEFAULT PRODUCTS
========================================================= */

const productCount = db
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get();

if (productCount.count === 0) {

    const insertProduct = db.prepare(`
        INSERT INTO products
        (name, size, price, category, image, stock, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const starterProducts = [

        [
            "Rice",
            "1 kg",
            70,
            "Groceries",
            "images/rice.jpg",
            "available",
            "Quality rice"
        ],

        [
            "Sugar",
            "1 kg",
            50,
            "Groceries",
            "images/sugar.jpg",
            "available",
            "White sugar"
        ],

        [
            "Salt",
            "1 kg",
            25,
            "Groceries",
            "images/salt.jpg",
            "available",
            "Table salt"
        ],

        [
            "Wheat Flour",
            "1 kg",
            55,
            "Groceries",
            "images/wheat-flour.jpg",
            "available",
            "Wheat flour"
        ],

        [
            "Toor Dal",
            "1 kg",
            140,
            "Groceries",
            "images/toor-dal.jpg",
            "available",
            "Toor dal"
        ],

        [
            "Cooking Oil",
            "1 litre",
            130,
            "Groceries",
            "images/cooking-oil.jpg",
            "available",
            "Cooking oil"
        ],

        [
            "Tea Powder",
            "250 g",
            110,
            "Beverages",
            "images/tea.jpg",
            "available",
            "Tea powder"
        ],

        [
            "Biscuits",
            "Pack",
            30,
            "Snacks",
            "images/biscuits.jpg",
            "available",
            "Tasty biscuits"
        ],

        [
            "Soap",
            "1 piece",
            35,
            "Personal Care",
            "images/soap.jpg",
            "available",
            "Bath soap"
        ],

        [
            "Shampoo",
            "180 ml",
            120,
            "Personal Care",
            "images/shampoo.jpg",
            "available",
            "Shampoo"
        ],

        [
            "Toothpaste",
            "100 g",
            65,
            "Personal Care",
            "images/toothpaste.jpg",
            "available",
            "Toothpaste"
        ],

        [
            "Detergent Powder",
            "1 kg",
            95,
            "Household",
            "images/detergent.jpg",
            "available",
            "Detergent powder"
        ],

        [
            "Garbage Bags",
            "Pack",
            50,
            "Household",
            "images/garbage-bags.jpg",
            "available",
            "Garbage bags"
        ]

    ];

    const insertMany = db.transaction(() => {

        for (const product of starterProducts) {
            insertProduct.run(...product);
        }

    });

    insertMany();
}


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function sendError(res, status, message) {

    return res.status(status).json({
        success: false,
        message: message
    });

}


function createToken(username) {

    return jwt.sign(
        {
            username: username
        },
        JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

}


/* =========================================================
   ADMIN AUTHENTICATION MIDDLEWARE
========================================================= */

function requireAdmin(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return sendError(
            res,
            401,
            "Admin login required"
        );
    }

    const parts = authHeader.split(" ");

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {
        return sendError(
            res,
            401,
            "Invalid authorization"
        );
    }

    const token = parts[1];

    try {

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        req.admin = decoded;

        next();

    } catch (error) {

        return sendError(
            res,
            401,
            "Session expired. Please login again."
        );

    }

}


/* =========================================================
   ADMIN LOGIN
========================================================= */

app.post("/api/admin/login", async (req, res) => {

    try {

        const username =
            String(req.body.username || "").trim();

        const password =
            String(req.body.password || "");

        if (!username || !password) {

            return sendError(
                res,
                400,
                "Username and password are required"
            );

        }

        if (username !== ADMIN_USERNAME) {

            return sendError(
                res,
                401,
                "Invalid username or password"
            );

        }

        const passwordHash =
            await bcrypt.hash(
                ADMIN_PASSWORD,
                10
            );

        const passwordMatches =
            await bcrypt.compare(
                password,
                passwordHash
            );

        if (!passwordMatches) {

            return sendError(
                res,
                401,
                "Invalid username or password"
            );

        }

        const token =
            createToken(username);

        res.json({
            success: true,
            token: token,
            username: username
        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        return sendError(
            res,
            500,
            "Login failed"
        );

    }

});


/* =========================================================
   CHECK ADMIN LOGIN
========================================================= */

app.get(
    "/api/admin/check",
    requireAdmin,
    (req, res) => {

        res.json({
            success: true,
            loggedIn: true,
            username: req.admin.username
        });

    }
);


/* =========================================================
   GET ALL PRODUCTS
========================================================= */

app.get("/api/products", (req, res) => {

    try {

        const products = db
            .prepare(`
                SELECT *
                FROM products
                ORDER BY id ASC
            `)
            .all();

        res.json(products);

    } catch (error) {

        console.error(
            "Get products error:",
            error
        );

        return sendError(
            res,
            500,
            "Failed to load products"
        );

    }

});


/* =========================================================
   GET SINGLE PRODUCT
========================================================= */

app.get(
    "/api/products/:id",
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(id);

            if (!product) {

                return sendError(
                    res,
                    404,
                    "Product not found"
                );

            }

            res.json(product);

        } catch (error) {

            console.error(
                "Get product error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to load product"
            );

        }

    }
);


/* =========================================================
   ADD PRODUCT
========================================================= */

app.post(
    "/api/products",
    requireAdmin,
    (req, res) => {

        try {

            const name =
                String(req.body.name || "").trim();

            const size =
                String(req.body.size || "").trim();

            const price =
                Number(req.body.price);

            const category =
                String(
                    req.body.category || "Other"
                ).trim();

            const image =
                String(req.body.image || "").trim();

            const stock =
                String(
                    req.body.stock || "available"
                ).trim();

            const description =
                String(
                    req.body.description || ""
                ).trim();


            if (!name) {

                return sendError(
                    res,
                    400,
                    "Product name is required"
                );

            }

            if (
                Number.isNaN(price) ||
                price < 0
            ) {

                return sendError(
                    res,
                    400,
                    "Enter a valid price"
                );

            }


            const result = db.prepare(`
                INSERT INTO products
                (
                    name,
                    size,
                    price,
                    category,
                    image,
                    stock,
                    description
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                name,
                size,
                price,
                category,
                image,
                stock,
                description
            );


            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(result.lastInsertRowid);


            res.status(201).json({
                success: true,
                message: "Product added successfully",
                product: product
            });

        } catch (error) {

            console.error(
                "Add product error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to add product"
            );

        }

    }
);


/* =========================================================
   UPDATE PRODUCT
========================================================= */

app.put(
    "/api/products/:id",
    requireAdmin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const existing =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(id);

            if (!existing) {

                return sendError(
                    res,
                    404,
                    "Product not found"
                );

            }


            const name =
                String(
                    req.body.name ?? existing.name
                ).trim();

            const size =
                String(
                    req.body.size ?? existing.size
                ).trim();

            const price =
                Number(
                    req.body.price ?? existing.price
                );

            const category =
                String(
                    req.body.category ??
                    existing.category
                ).trim();

            const image =
                String(
                    req.body.image ??
                    existing.image
                ).trim();

            const stock =
                String(
                    req.body.stock ??
                    existing.stock
                ).trim();

            const description =
                String(
                    req.body.description ??
                    existing.description
                ).trim();


            if (!name) {

                return sendError(
                    res,
                    400,
                    "Product name is required"
                );

            }

            if (
                Number.isNaN(price) ||
                price < 0
            ) {

                return sendError(
                    res,
                    400,
                    "Enter a valid price"
                );

            }


            db.prepare(`
                UPDATE products
                SET
                    name = ?,
                    size = ?,
                    price = ?,
                    category = ?,
                    image = ?,
                    stock = ?,
                    description = ?
                WHERE id = ?
            `).run(
                name,
                size,
                price,
                category,
                image,
                stock,
                description,
                id
            );


            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(id);


            res.json({
                success: true,
                message: "Product updated successfully",
                product: product
            });

        } catch (error) {

            console.error(
                "Update product error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to update product"
            );

        }

    }
);


/* =========================================================
   DELETE PRODUCT
========================================================= */

app.delete(
    "/api/products/:id",
    requireAdmin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);

            const product =
                db.prepare(`
                    SELECT *
                    FROM products
                    WHERE id = ?
                `).get(id);

            if (!product) {

                return sendError(
                    res,
                    404,
                    "Product not found"
                );

            }


            db.prepare(`
                DELETE FROM products
                WHERE id = ?
            `).run(id);


            res.json({
                success: true,
                message: "Product deleted successfully"
            });

        } catch (error) {

            console.error(
                "Delete product error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to delete product"
            );

        }

    }
);


/* =========================================================
   GET SHOP STATUS
========================================================= */

app.get(
    "/api/shop-status",
    (req, res) => {

        try {

            const settings =
                db.prepare(`
                    SELECT shop_open
                    FROM settings
                    WHERE id = 1
                `).get();


            const shopOpen =
                settings
                    ? Boolean(settings.shop_open)
                    : true;


            res.json({
                success: true,
                shopOpen: shopOpen,
                open: shopOpen
            });

        } catch (error) {

            console.error(
                "Get shop status error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to get shop status"
            );

        }

    }
);


/* =========================================================
   UPDATE SHOP STATUS
========================================================= */

app.put(
    "/api/shop-status",
    requireAdmin,
    (req, res) => {

        try {

            let shopOpen = req.body.shopOpen;

            if (
                shopOpen === undefined &&
                req.body.open !== undefined
            ) {
                shopOpen = req.body.open;
            }

            if (typeof shopOpen === "string") {

                shopOpen =
                    shopOpen.trim().toLowerCase() === "true" ||
                    shopOpen.trim() === "1";

            } else {

                shopOpen = shopOpen === true || shopOpen === 1;

            }


            const result = db.prepare(`
                UPDATE settings
                SET shop_open = ?
                WHERE id = 1
            `).run(
                shopOpen ? 1 : 0
            );


            if (result.changes === 0) {

                db.prepare(`
                    INSERT INTO settings
                    (id, shop_open)
                    VALUES (1, ?)
                    ON CONFLICT(id)
                    DO UPDATE SET shop_open = excluded.shop_open
                `).run(
                    shopOpen ? 1 : 0
                );

            }


            const savedSettings = db.prepare(`
                SELECT shop_open
                FROM settings
                WHERE id = 1
            `).get();


            const savedStatus =
                Boolean(savedSettings.shop_open);


            console.log(
                "SHOP STATUS SAVED:",
                savedStatus
            );


            res.json({
                success: true,
                message: savedStatus
                    ? "Shop opened successfully"
                    : "Shop closed successfully",
                shopOpen: savedStatus,
                open: savedStatus
            });

        } catch (error) {

            console.error(
                "Update shop status error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to update shop status"
            );

        }

    }
);


/* =========================================================
   CREATE ORDER
========================================================= */

app.post(
    "/api/orders",
    (req, res) => {

        try {

            const shopSettings =
                db.prepare(`
                    SELECT shop_open
                    FROM settings
                    WHERE id = 1
                `).get();


            if (
                shopSettings &&
                !Boolean(shopSettings.shop_open)
            ) {

                return sendError(
                    res,
                    403,
                    "Shop is currently closed"
                );

            }


            const customerName =
                String(
                    req.body.customer_name ??
                    req.body.customerName ??
                    req.body.name ??
                    ""
                ).trim();


            const phone =
                String(
                    req.body.phone ?? ""
                ).trim();


            const address =
                String(
                    req.body.address ?? ""
                ).trim();


            const items =
                Array.isArray(req.body.items)
                    ? req.body.items
                    : Array.isArray(req.body.cart)
                        ? req.body.cart
                        : [];


            if (items.length === 0) {

                return sendError(
                    res,
                    400,
                    "Order items are required"
                );

            }


            let total = 0;

            const preparedItems = [];


            for (const item of items) {

                const productId =
                    Number(
                        item.product_id ??
                        item.productId ??
                        item.id
                    );


                const quantity =
                    Number(
                        item.quantity ??
                        item.qty ??
                        1
                    );


                if (
                    !Number.isInteger(productId) ||
                    !Number.isInteger(quantity) ||
                    quantity <= 0
                ) {

                    return sendError(
                        res,
                        400,
                        "Invalid order item"
                    );

                }


                const product =
                    db.prepare(`
                        SELECT *
                        FROM products
                        WHERE id = ?
                    `).get(productId);


                if (!product) {

                    return sendError(
                        res,
                        400,
                        "One of the selected products no longer exists"
                    );

                }


                if (
                    String(product.stock)
                        .toLowerCase() !== "available"
                ) {

                    return sendError(
                        res,
                        400,
                        product.name +
                        " is currently unavailable"
                    );

                }


                const itemTotal =
                    Number(product.price) *
                    quantity;


                total += itemTotal;


                preparedItems.push({
                    productId: product.id,
                    name: product.name,
                    size: product.size,
                    price: Number(product.price),
                    quantity: quantity
                });

            }


            const createOrder =
                db.transaction(() => {

                    const orderResult =
                        db.prepare(`
                            INSERT INTO orders
                            (
                                customer_name,
                                phone,
                                address,
                                total,
                                status
                            )
                            VALUES (?, ?, ?, ?, ?)
                        `).run(
                            customerName,
                            phone,
                            address,
                            total,
                            "pending"
                        );


                    const orderId =
                        Number(
                            orderResult.lastInsertRowid
                        );


                    const insertItem =
                        db.prepare(`
                            INSERT INTO order_items
                            (
                                order_id,
                                product_id,
                                product_name,
                                size,
                                price,
                                quantity
                            )
                            VALUES (?, ?, ?, ?, ?, ?)
                        `);


                    for (
                        const item
                        of preparedItems
                    ) {

                        insertItem.run(
                            orderId,
                            item.productId,
                            item.name,
                            item.size,
                            item.price,
                            item.quantity
                        );

                    }


                    return orderId;

                });


            const order =
                db.prepare(`
                    SELECT *
                    FROM orders
                    WHERE id = ?
                `).get(createOrder);


            const orderItems =
                db.prepare(`
                    SELECT *
                    FROM order_items
                    WHERE order_id = ?
                    ORDER BY id ASC
                `).all(createOrder);


            res.status(201).json({
                success: true,
                message: "Order placed successfully",
                order: {
                    ...order,
                    items: orderItems
                },
                orderId: createOrder
            });

        } catch (error) {

            console.error(
                "Create order error:",
                error
            );
            
            console.error(
    "CREATE ORDER ERROR MESSAGE:",
    error.message
);

            return sendError(
                res,
                500,
                "Failed to create order"
            );

        }

    }
);


/* =========================================================
   GET ALL ORDERS
========================================================= */

app.get(
    "/api/orders",
    requireAdmin,
    (req, res) => {

        try {

            const orders =
                db.prepare(`
                    SELECT *
                    FROM orders
                    ORDER BY id DESC
                `).all();


            for (const order of orders) {

                order.items =
                    db.prepare(`
                        SELECT *
                        FROM order_items
                        WHERE order_id = ?
                        ORDER BY id ASC
                    `).all(order.id);

            }


            res.json(orders);

        } catch (error) {

            console.error(
                "Get orders error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to load orders"
            );

        }

    }
);


/* =========================================================
   GET SINGLE ORDER
========================================================= */

app.get(
    "/api/orders/:id",
    requireAdmin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const order =
                db.prepare(`
                    SELECT *
                    FROM orders
                    WHERE id = ?
                `).get(id);


            if (!order) {

                return sendError(
                    res,
                    404,
                    "Order not found"
                );

            }


            order.items =
                db.prepare(`
                    SELECT *
                    FROM order_items
                    WHERE order_id = ?
                    ORDER BY id ASC
                `).all(id);


            res.json(order);

        } catch (error) {

            console.error(
                "Get order error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to load order"
            );

        }

    }
);


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

app.put(
    "/api/orders/:id/status",
    requireAdmin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const status =
                String(
                    req.body.status || ""
                ).trim();


            const allowedStatuses = [
                "pending",
                "confirmed",
                "preparing",
                "out_for_delivery",
                "delivered",
                "cancelled"
            ];


            if (
                !allowedStatuses.includes(status)
            ) {

                return sendError(
                    res,
                    400,
                    "Invalid order status"
                );

            }


            const order =
                db.prepare(`
                    SELECT id
                    FROM orders
                    WHERE id = ?
                `).get(id);


            if (!order) {

                return sendError(
                    res,
                    404,
                    "Order not found"
                );

            }


            db.prepare(`
                UPDATE orders
                SET status = ?
                WHERE id = ?
            `).run(
                status,
                id
            );


            const updatedOrder =
                db.prepare(`
                    SELECT *
                    FROM orders
                    WHERE id = ?
                `).get(id);


            res.json({
                success: true,
                message: "Order status updated successfully",
                order: updatedOrder
            });

        } catch (error) {

            console.error(
                "Update order status error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to update order status"
            );

        }

    }
);


/* =========================================================
   DELETE ORDER
========================================================= */

app.delete(
    "/api/orders/:id",
    requireAdmin,
    (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const order =
                db.prepare(`
                    SELECT id
                    FROM orders
                    WHERE id = ?
                `).get(id);


            if (!order) {

                return sendError(
                    res,
                    404,
                    "Order not found"
                );

            }


            db.prepare(`
                DELETE FROM orders
                WHERE id = ?
            `).run(id);


            res.json({
                success: true,
                message: "Order deleted successfully"
            });

        } catch (error) {

            console.error(
                "Delete order error:",
                error
            );

            return sendError(
                res,
                500,
                "Failed to delete order"
            );

        }

    }
);


/* =========================================================
   ADMIN PAGE
========================================================= */

app.use(
    "/admin",
    express.static(
        path.join(__dirname, "../admin")
    )
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {

    res.send(`
        <html>
        <head>
            <title>Rohith Mini Mart Backend</title>
        </head>

        <body style="font-family: Arial; padding: 40px;">

            <h1>ROHITH MINI MART BACKEND</h1>

            <p>Backend server is running successfully.</p>

            <p>
                <strong>Server:</strong>
                ${PORT}
            </p>

            <p>
                <a href="/admin/">
                    Open Admin Panel
                </a>
            </p>

        </body>
        </html>
    `);

});


/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API route not found"
    });

});


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "ROHITH MINI MART BACKEND"
        );

        console.log(
            "Server running on port " + PORT
        );

        console.log(
            "http://localhost:" + PORT
        );

        console.log(
            "Admin: http://localhost:" +
            PORT +
            "/admin/"
        );

        console.log(
            "========================================"
        );

    }
);