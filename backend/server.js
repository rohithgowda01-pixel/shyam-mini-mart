const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "admin";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin123";

const JWT_SECRET =
  process.env.JWT_SECRET || "rohith_mini_mart_secret_change_me";


// =========================
// MIDDLEWARE
// =========================

app.use(cors());

app.use(
  express.json({
    limit: "5mb"
  })
);


// =========================
// DATABASE
// =========================

const db = new Database("database.db");

db.pragma("foreign_keys = ON");


// =========================
// TABLES
// =========================

db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    size TEXT,
    price REAL NOT NULL DEFAULT 0,
    category TEXT,
    image TEXT,
    stock TEXT DEFAULT 'available',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();


db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();


db.prepare(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE
  )
`).run();


db.prepare(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`).run();


// =========================
// DEFAULT SHOP SETTINGS
// =========================

const existingShopStatus =
  db
    .prepare(
      "SELECT value FROM settings WHERE key = ?"
    )
    .get("shop_open");


if (!existingShopStatus) {

  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
  `).run(
    "shop_open",
    "true"
  );

}


// =========================
// ADMIN PASSWORD HASH
// =========================
//
// The password comes from .env.
// It is hashed in memory so we can
// use bcrypt for password checking.
//
// Do not store this hash in the frontend.
//

const ADMIN_PASSWORD_HASH =
  bcrypt.hashSync(
    ADMIN_PASSWORD,
    10
  );


// =========================
// ADMIN AUTHENTICATION
// =========================

function authenticateAdmin(req, res, next) {

  try {

    const authHeader =
      req.headers.authorization;


    if (!authHeader) {

      return res.status(401).json({
        message: "Admin authentication required."
      });

    }


    if (
      !authHeader.startsWith("Bearer ")
    ) {

      return res.status(401).json({
        message: "Invalid authentication format."
      });

    }


    const token =
      authHeader.substring(7);


    if (!token) {

      return res.status(401).json({
        message: "Authentication token missing."
      });

    }


    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );


    if (
      decoded.role !== "admin"
    ) {

      return res.status(403).json({
        message: "Admin access required."
      });

    }


    req.admin = decoded;


    next();


  } catch (error) {

    console.error(
      "Admin authentication error:",
      error.message
    );


    return res.status(401).json({
      message: "Invalid or expired admin token."
    });

  }

}


// =========================
// ADMIN LOGIN
// =========================

app.post(
  "/api/admin/login",
  async (req, res) => {

    try {

      const {
        username,
        password
      } = req.body;


      if (
        !username ||
        !password
      ) {

        return res.status(400).json({
          message:
            "Username and password are required."
        });

      }


      const usernameMatches =
        String(username).trim() ===
        ADMIN_USERNAME;


      const passwordMatches =
        await bcrypt.compare(
          String(password),
          ADMIN_PASSWORD_HASH
        );


      if (
        !usernameMatches ||
        !passwordMatches
      ) {

        return res.status(401).json({
          message:
            "Invalid username or password."
        });

      }


      const token =
        jwt.sign(
          {
            username:
              ADMIN_USERNAME,

            role:
              "admin"
          },
          JWT_SECRET,
          {
            expiresIn: "8h"
          }
        );


      res.json({

        message:
          "Admin login successful.",

        token: token,

        username:
          ADMIN_USERNAME

      });


    } catch (error) {

      console.error(
        "Admin login error:",
        error
      );


      res.status(500).json({
        message:
          "Admin login failed."
      });

    }

  }
);


// =========================
// CHECK ADMIN TOKEN
// =========================

app.get(
  "/api/admin/check",
  authenticateAdmin,
  (req, res) => {

    res.json({

      authenticated: true,

      username:
        req.admin.username

    });

  }
);


// =========================
// STARTER PRODUCTS
// =========================

const starterProducts = [

  // GROCERIES

  {
    name: "Rice",
    size: "1 kg",
    price: 70,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Quality rice for everyday cooking"
  },

  {
    name: "Sugar",
    size: "1 kg",
    price: 50,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Fine white sugar"
  },

  {
    name: "Salt",
    size: "1 kg",
    price: 25,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Daily cooking salt"
  },

  {
    name: "Toor Dal",
    size: "1 kg",
    price: 130,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Toor dal for everyday cooking"
  },

  {
    name: "Moong Dal",
    size: "1 kg",
    price: 120,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Yellow moong dal"
  },

  {
    name: "Chana Dal",
    size: "1 kg",
    price: 90,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Split Bengal gram"
  },

  {
    name: "Wheat Flour",
    size: "1 kg",
    price: 55,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Wheat flour for chapati and roti"
  },

  {
    name: "Rava",
    size: "500 g",
    price: 35,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Fine rava"
  },

  {
    name: "Maida",
    size: "500 g",
    price: 35,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Refined wheat flour"
  },

  {
    name: "Cooking Oil",
    size: "1 L",
    price: 150,
    category: "groceries",
    image: "",
    stock: "available",
    description:
      "Cooking oil"
  },


  // DAIRY

  {
    name: "Milk",
    size: "1 L",
    price: 60,
    category: "dairy",
    image: "",
    stock: "available",
    description:
      "Fresh milk"
  },

  {
    name: "Curd",
    size: "500 g",
    price: 40,
    category: "dairy",
    image: "",
    stock: "available",
    description:
      "Fresh curd"
  },

  {
    name: "Butter",
    size: "100 g",
    price: 60,
    category: "dairy",
    image: "",
    stock: "available",
    description:
      "Creamy butter"
  },

  {
    name: "Paneer",
    size: "200 g",
    price: 90,
    category: "dairy",
    image: "",
    stock: "available",
    description:
      "Fresh paneer"
  },

  {
    name: "Cheese",
    size: "200 g",
    price: 120,
    category: "dairy",
    image: "",
    stock: "available",
    description:
      "Cheese slices"
  },


  // SNACKS

  {
    name: "Biscuits",
    size: "100 g",
    price: 20,
    category: "snacks",
    image: "",
    stock: "available",
    description:
      "Tasty biscuits"
  },

  {
    name: "Chips",
    size: "100 g",
    price: 30,
    category: "snacks",
    image: "",
    stock: "available",
    description:
      "Crispy potato chips"
  },

  {
    name: "Namkeen",
    size: "200 g",
    price: 50,
    category: "snacks",
    image: "",
    stock: "available",
    description:
      "Crispy namkeen snack"
  },

  {
    name: "Chocolate",
    size: "50 g",
    price: 40,
    category: "snacks",
    image: "",
    stock: "available",
    description:
      "Milk chocolate"
  },

  {
    name: "Cookies",
    size: "100 g",
    price: 35,
    category: "snacks",
    image: "",
    stock: "available",
    description:
      "Crunchy cookies"
  },


  // DRINKS

  {
    name: "Coca-Cola",
    size: "750 ml",
    price: 45,
    category: "drinks",
    image: "",
    stock: "available",
    description:
      "Refreshing soft drink"
  },

  {
    name: "Pepsi",
    size: "750 ml",
    price: 45,
    category: "drinks",
    image: "",
    stock: "available",
    description:
      "Refreshing cola drink"
  },

  {
    name: "Sprite",
    size: "750 ml",
    price: 45,
    category: "drinks",
    image: "",
    stock: "available",
    description:
      "Lemon-lime soft drink"
  },

  {
    name: "Fanta",
    size: "750 ml",
    price: 45,
    category: "drinks",
    image: "",
    stock: "available",
    description:
      "Orange soft drink"
  },

  {
    name: "Juice",
    size: "1 L",
    price: 100,
    category: "drinks",
    image: "",
    stock: "available",
    description:
      "Refreshing fruit juice"
  },

  {
    name: "Water Bottle",
    size: "1 L",
    price: 20,
    category: "drinks",
    image: "",
    stock: "available",
    description:
      "Packaged drinking water"
  },


  // PERSONAL CARE

  {
    name: "Bath Soap",
    size: "100 g",
    price: 40,
    category: "personal",
    image: "",
    stock: "available",
    description:
      "Daily bathing soap"
  },

  {
    name: "Shampoo",
    size: "180 ml",
    price: 120,
    category: "personal",
    image: "",
    stock: "available",
    description:
      "Hair cleansing shampoo"
  },

  {
    name: "Toothpaste",
    size: "100 g",
    price: 60,
    category: "personal",
    image: "",
    stock: "available",
    description:
      "Daily use toothpaste"
  },

  {
    name: "Toothbrush",
    size: "1 piece",
    price: 40,
    category: "personal",
    image: "",
    stock: "available",
    description:
      "Soft bristle toothbrush"
  },

  {
    name: "Hair Oil",
    size: "100 ml",
    price: 70,
    category: "personal",
    image: "",
    stock: "available",
    description:
      "Hair care oil"
  },


  // HOUSEHOLD

  {
    name: "Detergent",
    size: "1 kg",
    price: 100,
    category: "household",
    image: "",
    stock: "available",
    description:
      "Laundry detergent"
  },

  {
    name: "Dishwash",
    size: "500 ml",
    price: 70,
    category: "household",
    image: "",
    stock: "available",
    description:
      "Dishwashing liquid"
  },

  {
    name: "Floor Cleaner",
    size: "1 L",
    price: 120,
    category: "household",
    image: "",
    stock: "available",
    description:
      "Floor cleaning liquid"
  },

  {
    name: "Washing Soap",
    size: "250 g",
    price: 30,
    category: "household",
    image: "",
    stock: "available",
    description:
      "Laundry washing soap"
  },

  {
    name: "Garbage Bags",
    size: "30 pieces",
    price: 80,
    category: "household",
    image: "",
    stock: "available",
    description:
      "Garbage disposal bags"
  }

];


// =========================
// INSERT STARTER PRODUCTS
// =========================

const checkProduct =
  db.prepare(`
    SELECT id
    FROM products
    WHERE LOWER(name) = LOWER(?)
    AND LOWER(
      COALESCE(size, '')
    ) =
    LOWER(
      COALESCE(?, '')
    )
    LIMIT 1
  `);


const insertProduct =
  db.prepare(`
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
  `);


let addedProducts = 0;


for (
  const product of starterProducts
) {

  const existingProduct =
    checkProduct.get(
      product.name,
      product.size
    );


  if (!existingProduct) {

    insertProduct.run(
      String(product.name),
      String(product.size),
      Number(product.price),
      String(product.category),
      String(product.image),
      String(product.stock),
      String(product.description)
    );


    addedProducts++;

  }

}


console.log(
  `Starter products added: ${addedProducts}`
);


// =========================
// BASIC ROUTE
// =========================

app.get(
  "/",
  (req, res) => {

    res.json({

      message:
        "Rohith Mini Mart backend is running",

      status:
        "success"

    });

  }
);


// =========================
// GET ALL PRODUCTS
// =========================
// PUBLIC
// Customer website needs this.
//

app.get(
  "/api/products",
  (req, res) => {

    try {

      const products =
        db.prepare(`
          SELECT *
          FROM products
          ORDER BY id ASC
        `).all();


      res.json(products);


    } catch (error) {

      console.error(
        "Failed to fetch products:",
        error
      );


      res.status(500).json({
        message:
          "Failed to fetch products"
      });

    }

  }
);


// =========================
// GET SINGLE PRODUCT
// =========================
// PUBLIC
//

app.get(
  "/api/products/:id",
  (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (
        !Number.isInteger(id)
      ) {

        return res.status(400).json({
          message:
            "Invalid product ID"
        });

      }


      const product =
        db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(id);


      if (!product) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }


      res.json(product);


    } catch (error) {

      console.error(
        "Failed to fetch product:",
        error
      );


      res.status(500).json({
        message:
          "Failed to fetch product"
      });

    }

  }
);


// =========================
// ADD PRODUCT
// =========================
// ADMIN ONLY
//

app.post(
  "/api/products",
  authenticateAdmin,
  (req, res) => {

    try {

      const {
        name,
        size,
        price,
        category,
        image,
        stock,
        description
      } = req.body;


      if (
        !name ||
        price === undefined ||
        price === null
      ) {

        return res.status(400).json({
          message:
            "Product name and price are required"
        });

      }


      const productName =
        String(name).trim();


      const productSize =
        size
          ? String(size).trim()
          : "";


      const productPrice =
        Number(price);


      if (!productName) {

        return res.status(400).json({
          message:
            "Product name is required"
        });

      }


      if (
        !Number.isFinite(productPrice) ||
        productPrice < 0
      ) {

        return res.status(400).json({
          message:
            "Invalid product price"
        });

      }


      const result =
        db.prepare(`
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

          productName,

          productSize,

          productPrice,

          category
            ? String(category)
            : "",

          image
            ? String(image)
            : "",

          stock
            ? String(stock)
            : "available",

          description
            ? String(description)
            : ""

        );


      const product =
        db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(
          result.lastInsertRowid
        );


      res.status(201).json(
        product
      );


    } catch (error) {

      console.error(
        "Failed to add product:",
        error
      );


      res.status(500).json({
        message:
          "Failed to add product"
      });

    }

  }
);


// =========================
// UPDATE PRODUCT
// =========================
// ADMIN ONLY
//

app.put(
  "/api/products/:id",
  authenticateAdmin,
  (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (
        !Number.isInteger(id)
      ) {

        return res.status(400).json({
          message:
            "Invalid product ID"
        });

      }


      const existingProduct =
        db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(id);


      if (!existingProduct) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }


      const {
        name,
        size,
        price,
        category,
        image,
        stock,
        description
      } = req.body;


      const updatedName =
        name !== undefined
          ? String(name).trim()
          : existingProduct.name;


      const updatedSize =
        size !== undefined
          ? String(size).trim()
          : existingProduct.size;


      const updatedPrice =
        price !== undefined
          ? Number(price)
          : existingProduct.price;


      const updatedCategory =
        category !== undefined
          ? String(category)
          : existingProduct.category;


      const updatedImage =
        image !== undefined
          ? String(image)
          : existingProduct.image;


      const updatedStock =
        stock !== undefined
          ? String(stock)
          : existingProduct.stock;


      const updatedDescription =
        description !== undefined
          ? String(description)
          : existingProduct.description;


      if (!updatedName) {

        return res.status(400).json({
          message:
            "Product name is required"
        });

      }


      if (
        !Number.isFinite(updatedPrice) ||
        updatedPrice < 0
      ) {

        return res.status(400).json({
          message:
            "Invalid product price"
        });

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

        updatedName,

        updatedSize,

        updatedPrice,

        updatedCategory,

        updatedImage,

        updatedStock,

        updatedDescription,

        id

      );


      const product =
        db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(id);


      res.json(product);


    } catch (error) {

      console.error(
        "Failed to update product:",
        error
      );


      res.status(500).json({
        message:
          "Failed to update product"
      });

    }

  }
);


// =========================
// DELETE PRODUCT
// =========================
// ADMIN ONLY
//

app.delete(
  "/api/products/:id",
  authenticateAdmin,
  (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (
        !Number.isInteger(id)
      ) {

        return res.status(400).json({
          message:
            "Invalid product ID"
        });

      }


      const product =
        db.prepare(`
          SELECT *
          FROM products
          WHERE id = ?
        `).get(id);


      if (!product) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }


      db.prepare(`
        DELETE FROM products
        WHERE id = ?
      `).run(id);


      res.json({

        message:
          "Product deleted successfully"

      });


    } catch (error) {

      console.error(
        "Failed to delete product:",
        error
      );


      res.status(500).json({
        message:
          "Failed to delete product"
      });

    }

  }
);


// =========================
// SHOP STATUS
// =========================
// PUBLIC READ
// Customer website needs this.
//

app.get(
  "/api/shop-status",
  (req, res) => {

    try {

      const setting =
        db.prepare(`
          SELECT value
          FROM settings
          WHERE key = ?
        `).get(
          "shop_open"
        );


      const shopOpen =
        setting
          ? setting.value === "true"
          : true;


      res.json({

        shop_open:
          shopOpen

      });


    } catch (error) {

      console.error(
        "Failed to get shop status:",
        error
      );


      res.status(500).json({
        message:
          "Failed to get shop status"
      });

    }

  }
);


// =========================
// UPDATE SHOP STATUS
// =========================
// ADMIN ONLY
//

app.put(
  "/api/shop-status",
  authenticateAdmin,
  (req, res) => {

    try {

      const shopOpen =
        req.body.shop_open === true;


      db.prepare(`
        INSERT INTO settings
        (
          key,
          value
        )
        VALUES (?, ?)
        ON CONFLICT(key)
        DO UPDATE SET
          value = excluded.value
      `).run(

        "shop_open",

        String(shopOpen)

      );


      res.json({

        shop_open:
          shopOpen

      });


    } catch (error) {

      console.error(
        "Failed to update shop status:",
        error
      );


      res.status(500).json({
        message:
          "Failed to update shop status"
      });

    }

  }
);


// =========================
// CREATE ORDER
// =========================
// PUBLIC
// Customer website needs this.
//

app.post(
  "/api/orders",
  (req, res) => {

    try {

      console.log(
        "\n=============================="
      );

      console.log(
        "NEW ORDER REQUEST"
      );

      console.log(
        "=============================="
      );


      const shopStatus =
        db.prepare(`
          SELECT value
          FROM settings
          WHERE key = ?
        `).get(
          "shop_open"
        );


      const shopOpen =
        shopStatus
          ? shopStatus.value === "true"
          : true;


      if (!shopOpen) {

        return res.status(403).json({
          message:
            "Shop is currently closed."
        });

      }


      const {
        customer_name,
        phone,
        address,
        payment_method,
        total,
        items
      } = req.body;


      console.log(
        "Received order data:",
        req.body
      );


      if (
        !customer_name ||
        !phone ||
        !address ||
        !payment_method ||
        total === undefined ||
        !Array.isArray(items) ||
        items.length === 0
      ) {

        return res.status(400).json({
          message:
            "Missing required order information."
        });

      }


      const cleanCustomerName =
        String(customer_name);


      const cleanPhone =
        String(phone);


      const cleanAddress =
        String(address);


      const cleanPaymentMethod =
        String(payment_method);


      const cleanTotal =
        Number(total);


      if (
        !Number.isFinite(cleanTotal) ||
        cleanTotal < 0
      ) {

        return res.status(400).json({
          message:
            "Invalid order total."
        });

      }


      const cleanItems =
        items.map(
          (item) => ({

            product_id:
              Number(item.product_id),

            product_name:
              String(item.product_name),

            quantity:
              Number(item.quantity),

            price:
              Number(item.price)

          })
        );


      for (
        const item of cleanItems
      ) {

        if (
          !Number.isInteger(
            item.product_id
          ) ||

          !item.product_name ||

          !Number.isInteger(
            item.quantity
          ) ||

          item.quantity <= 0 ||

          !Number.isFinite(
            item.price
          ) ||

          item.price < 0
        ) {

          return res.status(400).json({
            message:
              "Invalid product information in order."
          });

        }

      }


      console.log(
        "Clean order data:",
        {
          customer_name:
            cleanCustomerName,

          phone:
            cleanPhone,

          address:
            cleanAddress,

          payment_method:
            cleanPaymentMethod,

          total:
            cleanTotal,

          items:
            cleanItems
        }
      );


      const createOrder =
        db.transaction(() => {

          const orderResult =
            db.prepare(`
              INSERT INTO orders
              (
                customer_name,
                phone,
                address,
                payment_method,
                total,
                status
              )
              VALUES (?, ?, ?, ?, ?, ?)
            `).run(

              cleanCustomerName,

              cleanPhone,

              cleanAddress,

              cleanPaymentMethod,

              cleanTotal,

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
                quantity,
                price
              )
              VALUES (?, ?, ?, ?, ?)
            `);


          for (
            const item of cleanItems
          ) {

            insertItem.run(

              orderId,

              item.product_id,

              item.product_name,

              item.quantity,

              item.price

            );

          }


          return orderId;

        });


      const orderId =
        createOrder();


      console.log(
        "ORDER CREATED SUCCESSFULLY:",
        orderId
      );


      res.status(201).json({

        message:
          "Order placed successfully.",

        order_id:
          orderId

      });


    } catch (error) {

      console.error(
        "ORDER CREATION ERROR:",
        error
      );


      res.status(500).json({

        message:
          "Failed to place order.",

        error:
          error.message

      });

    }

  }
);


// =========================
// GET ALL ORDERS
// =========================
// ADMIN ONLY
//

app.get(
  "/api/orders",
  authenticateAdmin,
  (req, res) => {

    try {

      const orders =
        db.prepare(`
          SELECT *
          FROM orders
          ORDER BY id DESC
        `).all();


      res.json(orders);


    } catch (error) {

      console.error(
        "Failed to fetch orders:",
        error
      );


      res.status(500).json({
        message:
          "Failed to fetch orders"
      });

    }

  }
);


// =========================
// GET SINGLE ORDER
// =========================
// ADMIN ONLY
//

app.get(
  "/api/orders/:id",
  authenticateAdmin,
  (req, res) => {

    try {

      const orderId =
        Number(req.params.id);


      if (
        !Number.isInteger(orderId)
      ) {

        return res.status(400).json({
          message:
            "Invalid order ID"
        });

      }


      const order =
        db.prepare(`
          SELECT *
          FROM orders
          WHERE id = ?
        `).get(orderId);


      if (!order) {

        return res.status(404).json({
          message:
            "Order not found"
        });

      }


      const items =
        db.prepare(`
          SELECT *
          FROM order_items
          WHERE order_id = ?
          ORDER BY id ASC
        `).all(orderId);


      res.json({

        ...order,

        items:
          items

      });


    } catch (error) {

      console.error(
        "Failed to fetch order:",
        error
      );


      res.status(500).json({
        message:
          "Failed to fetch order"
      });

    }

  }
);


// =========================
// UPDATE ORDER STATUS
// =========================
// ADMIN ONLY
//

app.put(
  "/api/orders/:id/status",
  authenticateAdmin,
  (req, res) => {

    try {

      const orderId =
        Number(req.params.id);


      const status =
        String(
          req.body.status || ""
        );


      const allowedStatuses = [

        "pending",

        "confirmed",

        "preparing",

        "out_for_delivery",

        "delivered",

        "cancelled"

      ];


      if (
        !Number.isInteger(orderId)
      ) {

        return res.status(400).json({
          message:
            "Invalid order ID"
        });

      }


      if (
        !allowedStatuses.includes(
          status
        )
      ) {

        return res.status(400).json({
          message:
            "Invalid order status"
        });

      }


      const order =
        db.prepare(`
          SELECT *
          FROM orders
          WHERE id = ?
        `).get(orderId);


      if (!order) {

        return res.status(404).json({
          message:
            "Order not found"
        });

      }


      db.prepare(`
        UPDATE orders
        SET status = ?
        WHERE id = ?
      `).run(

        status,

        orderId

      );


      const updatedOrder =
        db.prepare(`
          SELECT *
          FROM orders
          WHERE id = ?
        `).get(orderId);


      res.json(
        updatedOrder
      );


    } catch (error) {

      console.error(
        "Failed to update order status:",
        error
      );


      res.status(500).json({
        message:
          "Failed to update order status"
      });

    }

  }
);


// =========================
// DELETE ORDER
// =========================
// ADMIN ONLY
//

app.delete(
  "/api/orders/:id",
  authenticateAdmin,
  (req, res) => {

    try {

      const orderId =
        Number(req.params.id);


      if (
        !Number.isInteger(orderId)
      ) {

        return res.status(400).json({
          message:
            "Invalid order ID"
        });

      }


      const order =
        db.prepare(`
          SELECT *
          FROM orders
          WHERE id = ?
        `).get(orderId);


      if (!order) {

        return res.status(404).json({
          message:
            "Order not found"
        });

      }


      db.prepare(`
        DELETE FROM orders
        WHERE id = ?
      `).run(orderId);


      res.json({

        message:
          "Order deleted successfully"

      });


    } catch (error) {

      console.error(
        "Failed to delete order:",
        error
      );


      res.status(500).json({
        message:
          "Failed to delete order"
      });

    }

  }
);


// =========================
// START SERVER
// =========================

app.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "======================================"
    );

    console.log(
      "  ROHITH MINI MART BACKEND"
    );

    console.log(
      "======================================"
    );

    console.log(
      `  Server running on port ${PORT}`
    );

    console.log(
      `  http://localhost:${PORT}`
    );

    console.log(
      "======================================"
    );

    console.log("");

  }
);