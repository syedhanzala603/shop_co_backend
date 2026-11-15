# Shop-Co E-Commerce Backend API 🛍️

A clean, beginner-friendly, and production-ready REST API backend built with **Node.js**, **Express.js**, and **MongoDB Atlas** using **Mongoose** and **modern ES Modules**.

This backend powers both components of the Shop-Co project:
1. **Customer Shopping Website**: `https://shop-co-assignment.vercel.app/`
2. **Admin Dashboard**: `https://shop-co-assignment-dashbord.vercel.app/`

---

## 🌟 Highlights & Features

- **Pure JavaScript ES Modules (`import`/`export`)**: 100% pure `.js` backend files without TypeScript syntax.
- **MongoDB Atlas + Mongoose**: Complete schemas with automatic slug generation, bcrypt password hashing, data validation, and indexes.
- **JWT Authentication & Role Separation**: Separate Admin (`admin`/`superadmin`) and Customer (`customer`) authentication flows with strict role boundaries (`403 Forbidden` for customers attempting admin endpoints).
- **CORS Configured**: Pre-configured to accept requests from your customer website, admin dashboard, and localhost.
- **Central Error Handling**: Clean error responses for 404s, invalid ObjectIds, duplicate keys, validation errors, and database connectivity checks.
- **Health-Check Endpoint**: Live diagnostic endpoint at `/api/health` reporting server uptime and MongoDB Atlas connection state.
- **1-Click Database Seeder**: Populate your MongoDB Atlas cluster with realistic Shop-Co clothing items in one API call.

---

## 📁 Clean, Beginner-Friendly Folder Structure

```
shop-co-backend/
├── .env.example              # Environment variables template
├── server.js                 # Central Express server entry point (Pure JS ESM)
├── package.json              # Project dependencies & scripts
├── README.md                 # Documentation and setup guide
└── src/
    └── backend/
        ├── app.js            # Express application configuration & middleware
        ├── config/
        │   └── db.js         # MongoDB Atlas connection logic via Mongoose
        ├── controllers/      # Request handlers & business logic
        │   ├── authController.js      # Admin login, registration & profile
        │   ├── customerController.js  # Customer register, login, profile & orders
        │   ├── productController.js   # Product CRUD, filters, search, sort
        │   ├── orderController.js     # Checkout & admin status updates
        │   ├── categoryController.js  # Category CRUD & live product counts
        │   ├── dashboardController.js # Admin revenue & inventory metrics
        │   └── seedController.js      # Database seeding & reset
        ├── models/           # Mongoose Data Schemas
        │   ├── Admin.js      # Admin user model (bcrypt hashing & JWT)
        │   ├── Customer.js   # Customer user model (bcrypt hashing & JWT)
        │   ├── Product.js    # Product model (name, price, sizes, colors, etc.)
        │   ├── Category.js   # Category model (name, slug, image, order)
        │   ├── Order.js      # Order model (customer, items, total, status)
        │   └── Review.js     # Review model (ratings, comments)
        ├── routes/           # Express Route definitions
        │   ├── healthRoutes.js    # /api/health
        │   ├── authRoutes.js      # /api/auth
        │   ├── customerRoutes.js  # /api/customer
        │   ├── productRoutes.js   # /api/products
        │   ├── categoryRoutes.js  # /api/categories
        │   ├── orderRoutes.js     # /api/orders
        │   ├── dashboardRoutes.js # /api/dashboard
        │   └── seedRoutes.js      # /api/seed
        ├── middleware/       # Custom Express middlewares
        │   ├── authMiddleware.js    # JWT verification & role boundary checks
        │   ├── validateProduct.js   # Product payload validation
        │   ├── validateCustomer.js  # Customer register/login/profile validation
        │   ├── errorHandler.js      # Central error handler & 404 handler
        │   └── corsConfig.js      # Cross-Origin Resource Sharing rules
        └── utils/
            ├── jwt.js             # JWT sign & verify helpers
            └── seedData.js        # Sample Shop-Co catalog & orders
```

---

## 🚀 Quick Start Guide (How to Run Locally)

### 1. Prerequisites
- **Node.js** (version 18 or higher recommended)
- **npm** (comes with Node.js)
- A free **MongoDB Atlas** account (or local MongoDB)

### 2. Install Dependencies
Open your terminal in the backend root directory and run:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```
Open `.env` in your text editor and fill in your variables:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/shopco?retryWrites=true&w=majority
CORS_ORIGIN=https://shop-co-assignment.vercel.app,https://shop-co-assignment-dashbord.vercel.app,http://localhost:3000,http://localhost:5173
```

### 4. Start the Backend Server
For development with auto-reloading:
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

Your server will be running at `http://localhost:3000`!

---

## 🍃 Step-by-Step: Setting Up MongoDB Atlas (Free M0 Cluster)

1. **Sign Up**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register a free account.
2. **Create Cluster**: Click **Create a Deployment**, select **M0 Free**, pick any cloud provider/region close to you, and click **Create Deployment**.
3. **Create Database User**:
   - Username: e.g. `shopco_admin`
   - Password: Choose a secure password (make sure to save this!).
4. **Network Access (IP Whitelist)**:
   - Go to **Security** > **Network Access** in the left sidebar.
   - Click **Add IP Address**.
   - Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so your backend can connect from your local computer and cloud hosting services.
   - Click **Confirm**.
5. **Get Connection String**:
   - Go to **Database** in the sidebar and click **Connect**.
   - Choose **Drivers** (Node.js).
   - Copy the connection URI:
     ```
     mongodb+srv://shopco_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - In `.env`, paste this string into `MONGODB_URI`, replacing `<password>` with your database password and appending `/shopco` before the query string:
     ```
     MONGODB_URI=mongodb+srv://shopco_admin:YourSecretPass123@cluster0.xxxxx.mongodb.net/shopco?retryWrites=true&w=majority
     ```
6. **Seed Initial Products**:
   Once connected, make a `POST` request to `http://localhost:3000/api/seed` or click the **"Seed Catalog"** button in the Web Hub interface to populate your database with Shop-Co items!

---

## 🛡️ Security: Never Expose MongoDB Credentials in Frontend!

⚠️ **Crucial Rule**:
- **NEVER** put `MONGODB_URI` or database passwords inside your React/Vite/Next.js frontend code or `.env` files.
- The frontend should **ONLY** communicate with this backend via standard HTTP REST requests (e.g. `fetch('https://your-api.com/api/products')`).
- The backend acts as a secure shield between your public users and your private MongoDB database.

---

## 📡 API Reference

### 1. Health Check
- **`GET /api/health`**
  - Returns server status, uptime, environment, and MongoDB Atlas connection details.

### 2. Products API (Public Browsing & Admin Protected Management)

#### Mongoose Product Model Fields:
- **`name`** *(String, required)*: Product title (2-150 characters).
- **`slug`** *(String, auto-generated)*: URL-friendly identifier derived from name.
- **`description`** *(String, required)*: Detailed product overview (minimum 5 characters).
- **`price`** *(Number, required)*: Active selling price (must be positive).
- **`originalPrice`** *(Number, optional)*: Original retail price before discount.
- **`discount` / `discountPercentage`** *(Number, optional)*: Percentage discount (0-100%).
- **`category`** *(String, required)*: Category (`t-shirts`, `shirts`, `jeans`, `hoodies`, `shorts`, `jackets`).
- **`stockQuantity` / `stock`** *(Number, required)*: Available inventory units (non-negative integer).
- **`images`** *(Array of Strings, required)*: Array of image URLs (at least 1 image required).
- **`colors`** *(Array of Strings, optional)*: Color codes / names.
- **`sizes`** *(Array of Strings, optional)*: Available sizes (`Small`, `Medium`, `Large`, etc.).
- **`dressStyle`** *(String, enum)*: `casual`, `formal`, `party`, `gym`.
- **`rating`** *(Number)*: Average customer rating (0-5, default 4.5).
- **`reviewsCount`** *(Number)*: Total count of customer reviews.
- **`createdAt` & `updatedAt`** *(Date, auto-managed)*: Managed automatically via Mongoose `{ timestamps: true }`.

---

#### 🟢 `GET /api/products` (Public - Listing & Pagination)
- **Query Parameters**:
  - `page`: Page number (default: `1`, minimum: `1`)
  - `limit`: Items per page (default: `10`, maximum: `100`)
  - `category`: Filter by category (e.g. `t-shirts`, `shirts`, `jeans`)
  - `dressStyle`: Filter by dress style (`casual`, `formal`, `party`, `gym`)
  - `minPrice` & `maxPrice`: Numeric price range
  - `rating`: Minimum star rating
  - `search` / `q`: Case-insensitive search across name, description, and category
  - `sort`: `price-asc`, `price-desc`, `rating`, `popular`, `newest`
  - `inStock`: `true` to filter items with `stockQuantity > 0`
  - `discounted`: `true` to filter items with `discount > 0`
- **Response**:
  ```json
  {
    "success": true,
    "count": 10,
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 45,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false,
      "nextPage": 2,
      "prevPage": null
    },
    "data": [ ... ]
  }
  ```

---

#### 🟢 `GET /api/products/:id` (Public - Single Product)
- Retrieve a single product by its 24-character MongoDB `_id` or unique `slug`.
- Returns `200 OK` with product document, or `404 Not Found` if missing.

---

#### 🔒 `POST /api/products` (Admin Only - Create Product)
- **Security**: Requires header `Authorization: Bearer <token>` or `x-admin-key: <ADMIN_SECRET_KEY>`.
- **Input Validation**: Enforces required fields, positive price, valid image URLs, and non-negative stock quantity.
- **Sample Request**:
  ```json
  {
    "name": "Classic Black Polo Shirt",
    "description": "Timeless pique cotton black polo with tipped collar.",
    "price": 135,
    "category": "shirts",
    "stockQuantity": 35,
    "discount": 10,
    "images": ["https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80"]
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "status": 401,
    "message": "Access denied: Admin authentication required. Only authenticated admins are allowed to perform this action."
  }
  ```
- **Error Response (400 Validation Error)**:
  ```json
  {
    "success": false,
    "status": 400,
    "message": "Validation failed: Please check the required product fields.",
    "errors": [
      { "field": "price", "message": "Product price must be a valid number." }
    ]
  }
  ```

---

#### 🔒 `PUT /api/products/:id` (Admin Only - Update Product)
- **Security**: Requires admin authentication header.
- **Validation**: Enforces numeric checks and non-empty body.
- Updates specified fields and automatically refreshes `updatedAt`.

---

#### 🔒 `DELETE /api/products/:id` (Admin Only - Delete Product)
- **Security**: Requires admin authentication header.
- Removes product by `_id` or `slug` from catalog. Returns `200 OK` or `404 Not Found`.

### 3. Admin Authentication & JWT Cookie API

Admin accounts store **only** `email` and a bcrypt-hashed `password` in MongoDB Atlas. Public admin registration is disabled; the first admin account is created securely via `npm run seed:admin`.

#### 🌱 Seeding the First Admin Account
1. Configure `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`.
2. Run:
   ```bash
   npm run seed:admin
   ```

#### 🔑 `POST /api/admin/login` (Public)
- Verifies `email` and `password` against the `Admin` collection in MongoDB Atlas.
- Generates a signed JWT, sets a secure **HTTP-only cookie** (`shopco_admin_token`), and returns the token and admin info (`id`, `email`).
- **Request Body**:
  ```json
  {
    "email": "admin@shopco.com",
    "password": "your_secure_admin_password"
  }
  ```

#### 🔒 `GET /api/admin/me` (Admin Only)
- Retrieves current authenticated admin (`id`, `email`) using HTTP-only cookie or Bearer JWT.

#### 🚪 `POST /api/admin/logout`
- Clears the HTTP-only `shopco_admin_token` cookie.

### 3b. Customer Authentication & Profile API

- **`POST /api/customer/auth/register`** *(Public)*: Registers a customer with bcrypt-hashed password and returns JWT (`role: 'customer'`).
- **`POST /api/customer/auth/login`** *(Public)*: Authenticates customer with email & password and returns JWT.
- **`GET /api/customer/profile`** *(🔒 Customer JWT)*: Fetches authenticated customer's profile.
- **`PUT /api/customer/profile`** *(🔒 Customer JWT)*: Updates customer's name, phone, address, or password.
- **`GET /api/customer/orders`** *(🔒 Customer JWT)*: Fetches authenticated customer's paginated order history.
- **Role Protection**: Customer JWTs are strictly rejected with `403 Forbidden` (`FORBIDDEN_CUSTOMER_ACCESS_TO_ADMIN`) on all admin endpoints.

---

### 4. Customer Orders API

- **`POST /api/orders`** *(Public - Customer Checkout)*:
  - Place a new order during checkout on the Customer Shopping Website.
  - Automatically calculates subtotal, delivery fee, and generates a unique `orderNumber` (e.g. `ORD-2026-8941`).
- **`GET /api/orders`** *(🔒 Admin Only - Listing & Filters)*:
  - List all orders for the Admin Dashboard with pagination.
  - Query parameters: `status` (`pending`, `processing`, `shipped`, `delivered`, `cancelled`), `search` (customer name/email/orderNumber), `page`, `limit`.
- **`GET /api/orders/:id`** *(Public/Admin)*:
  - Get order details by ID or `orderNumber`.
- **`PUT /api/orders/:id/status`** *(🔒 Admin Only)*:
  - Update status (`pending` ➔ `processing` ➔ `shipped` ➔ `delivered` ➔ `cancelled`) and payment status.
  - Body: `{ "status": "shipped", "paymentStatus": "paid" }`
- **`PUT /api/orders/:id`** *(🔒 Admin Only)*:
  - Update full order details (customer address, shipping notes).
- **`DELETE /api/orders/:id`** *(🔒 Admin Only)*:
  - Cancel or remove an order.

---

### 5. Categories Management API

- **`GET /api/categories`** *(Public)*:
  - Returns all product categories (`t-shirts`, `shirts`, `jeans`, `hoodies`, `shorts`, `jackets`) and dress styles (`casual`, `formal`, `party`, `gym`) with live product counts.
- **`POST /api/categories`** *(🔒 Admin Only - Create Category)*:
  - Body: `{ "name": "Sweaters", "description": "Knitwear & pullovers" }`
- **`PUT /api/categories/:id`** *(🔒 Admin Only - Update Category)*:
  - Update category name, description, or image.
- **`DELETE /api/categories/:id`** *(🔒 Admin Only - Delete Category)*:
  - Remove category from store.

---

### 6. Admin Dashboard Statistics API

#### 🔒 `GET /api/dashboard/stats` (Admin Only)
- Returns aggregated real-time analytics for the Admin Dashboard:
  - `totalRevenue`: Gross sales from completed/paid orders
  - `totalOrders`: Overall order volume
  - `totalProducts`: Total catalog inventory count
  - `totalCustomers`: Count of unique customer buyers
  - `averageOrderValue`: Mean spend per order
  - `statusCounts`: Object with live counts of `{ pending, processing, shipped, delivered, cancelled }`
  - `recentOrders`: Latest 8 customer orders
  - `lowStockProducts`: Products with stock quantity ≤ 10
  - `categorySales`: Breakdown of items sold and revenue grouped by category

---

### 7. Database Catalog Seeder

- **`POST /api/seed`**: Seeds initial Shop-Co catalog and sample orders if database is empty. Pass `{ "force": true }` to reset.
- **`POST /api/seed/reset`**: Resets all collections to default sample data.

---

## 🔗 How to Connect Your Frontends to This Backend

### In Customer Website (`https://shop-co-assignment.vercel.app/`):

1. Set the backend URL in your frontend's `.env.local` or Vercel Environment Variables:
   ```env
   VITE_API_URL=https://your-backend-app.run.app/api
   # Or if using Next.js:
   # NEXT_PUBLIC_API_URL=https://your-backend-app.run.app/api
   ```

2. Fetching products in React:
   ```javascript
   const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

   // Get all products or filter by category
   export async function fetchProducts(category = '', sort = 'newest') {
     const params = new URLSearchParams();
     if (category) params.append('category', category);
     if (sort) params.append('sort', sort);

     const res = await fetch(`${API_BASE}/products?${params.toString()}`);
     const data = await res.json();
     return data.data; // array of products
   }

   // Place order on checkout
   export async function submitOrder(orderPayload) {
     const res = await fetch(`${API_BASE}/orders`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(orderPayload),
     });
     return res.json();
   }
   ```

### In Admin Dashboard (`https://shop-co-assignment-dashbord.vercel.app/`):

1. Fetching dashboard stats:
   ```javascript
   const res = await fetch(`${API_BASE}/dashboard/stats`);
   const { data } = await res.json();
   console.log('Total Revenue:', data.metrics.totalRevenue);
   console.log('Total Orders:', data.metrics.totalOrders);
   ```

2. Updating order status:
   ```javascript
   export async function updateStatus(orderId, newStatus) {
     const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ status: newStatus }),
     });
     return res.json();
   }
   ```

---

## 🚢 Deployment Options

- **Render / Railway / Fly.io**:
  - Build command: `npm install`
  - Start command: `node server.js` or `npm start`
  - Environment variables: Add `MONGODB_URI`, `PORT=10000`, `JWT_SECRET`, and `CORS_ORIGIN`.
