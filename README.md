# Supermart Web Application

A full-stack e-commerce web application for a local supermart. Customers browse and purchase groceries online, store staff manage the catalog and orders, delivery staff handle fulfilment, and a super admin oversees the entire platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS v4, React Router v7, TanStack Query v5 |
| Backend | Python 3.11, Django 5, Django REST Framework |
| Database | MySQL 8 |
| Cache / Stock Locking | Redis |
| Authentication | JWT — `djangorestframework-simplejwt` |
| Payments | Flutterwave (Mobile Money + Cards), Stripe (International) |
| File Storage | Cloudinary (product and category images) |
| Email | Django SMTP |
| Build Tool | Vite 8 |

---

## User Roles

| Role | How to get it | Access |
|---|---|---|
| `customer` | Public self-registration | Storefront, cart, checkout, orders, reviews |
| `admin` | Super admin assigns the role | Product catalog, inventory, orders, reports, promotions |
| `delivery` | Super admin assigns the role | Assigned delivery orders, status updates |
| `super_admin` | Created via Django shell (see below) | Everything — user management, analytics, settings |

---

## Project Structure

```
Supermart_web_app/
├── supermart_backend/
│   ├── config/
│   │   ├── settings.py          # DB, Redis, JWT, Cloudinary, CORS config
│   │   ├── urls.py              # Root URL router
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/               # User model, auth views, JWT, addresses
│   │   ├── catalog/             # Category, Product, ProductVariant, Reviews
│   │   ├── cart/                # Cart, CartItem, guest session handling
│   │   ├── orders/              # Order, OrderItem, status history, delivery zones
│   │   ├── payments/            # Payment model, Flutterwave/Stripe integrations
│   │   ├── delivery/            # Delivery staff views
│   │   └── admin_panel/         # Dashboard, inventory, promotions, reports, settings
│   ├── core/
│   │   ├── permissions.py       # Custom DRF role-based permission classes
│   │   ├── pagination.py        # Standard pagination (20 items/page)
│   │   └── utils.py             # SKU generator, order number, shared helpers
│   ├── requirements.txt
│   └── manage.py
│
└── supermart_frontend/
    └── src/
        ├── pages/
        │   ├── storefront/      # Home, Shop, Product, Cart, Checkout, Account
        │   ├── admin/           # Dashboard, Products, Orders, Inventory, Reports
        │   ├── delivery/        # Delivery dashboard and order detail
        │   └── super-admin/     # Users, Settings, Analytics
        ├── components/
        │   ├── cart/            # CartDrawer, CartItem, CartSummary
        │   ├── checkout/        # AddressStep, PaymentStep, OrderReview
        │   ├── layout/          # Navbar, AdminSidebar, DeliveryNav, ProtectedRoute
        │   └── product/         # ProductCard, ProductGrid, VariantSelector
        ├── context/
        │   ├── AuthContext.jsx  # User state, role, JWT management
        │   └── CartContext.jsx  # Cart state and operations
        ├── api/                 # Axios instance + all API call functions
        └── utils/               # Formatters, constants
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- MySQL 8 running with a `supermart_db` database
- Redis server

### MySQL setup (one-time)

```sql
CREATE DATABASE supermart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'supermart_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON supermart_db.* TO 'supermart_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd Supermart_web_app
```

### 2. Backend setup

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r supermart_backend/requirements.txt
```

Create a `.env` file inside `supermart_backend/`:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True

DB_NAME=supermart_db
DB_USER=supermart_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

REDIS_URL=redis://127.0.0.1:6379/1

# Optional — required for image uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional — required for online payments
FLUTTERWAVE_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional — required for password reset emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
```

Run migrations:

```bash
cd supermart_backend
python manage.py migrate
```

### 3. Seed categories (required before adding products)

```bash
python manage.py shell
```

```python
from apps.catalog.models import Category

categories = [
    ("Fresh Produce", "fresh-produce"),
    ("Dairy & Eggs", "dairy-and-eggs"),
    ("Meat & Seafood", "meat-and-seafood"),
    ("Bakery & Bread", "bakery-and-bread"),
    ("Beverages", "beverages"),
    ("Snacks & Confectionery", "snacks-and-confectionery"),
    ("Frozen Foods", "frozen-foods"),
    ("Household & Cleaning", "household-and-cleaning"),
    ("Personal Care", "personal-care"),
    ("Baby & Kids", "baby-and-kids"),
]

for name, slug in categories:
    cat, created = Category.objects.get_or_create(
        slug=slug, defaults={"name": name, "is_active": True}
    )
    print(f"{'Created' if created else 'Exists'}: {name}")
```

### 4. Create a super admin account

```bash
python manage.py shell
```

```python
from apps.users.models import User
User.objects.create_superuser(
    email='admin@supermart.com',
    password='StrongPassword123',
    first_name='Super',
    last_name='Admin'
)
```

Log in at `/login`. From `/super-admin/users` you can change any registered user's role to `admin` or `delivery`.

### 5. Frontend setup

```bash
cd supermart_frontend
npm install
```

---

## Running the Application

### Start Redis

```bash
sudo service redis-server start
# or on WSL2:
redis-server --daemonize yes
```

Verify: `redis-cli ping` should return `PONG`

### Start the Django backend

```bash
source venv/bin/activate
cd supermart_backend
python manage.py runserver --noreload
```

> `--noreload` is required when the `venv` lives on a Windows-mounted drive (`/mnt/d/`) in WSL2. The autoreloader crashes on NTFS-mounted paths.

API available at **http://127.0.0.1:8000/api/v1/**

### Start the React frontend

Open a second terminal:

```bash
cd supermart_frontend
npm run dev
```

App available at **http://localhost:5173**

---

## Frontend Routes

### Customer Storefront

| Route | Description |
|---|---|
| `/` | Homepage — hero banner, categories, featured products |
| `/shop` | Full product catalog — search, filter by category / price / stock |
| `/shop/:categorySlug` | Category-scoped product listing |
| `/product/:slug` | Product detail — images, variant selector, reviews |
| `/cart` | Cart review page |
| `/checkout` | Multi-step: address → payment method → order review |
| `/checkout/success` | Order confirmation |
| `/account/orders` | Order history |
| `/account/orders/:orderNumber` | Order detail with status timeline |
| `/account/profile` | Edit profile, change password, manage saved addresses |
| `/track/:orderNumber` | Public order tracking (no login required) |
| `/login` | Sign in |
| `/register` | Create customer account |
| `/forgot-password` | Request password reset email |

### Admin Panel

| Route | Description |
|---|---|
| `/admin` | Dashboard — revenue stats, order counts, low-stock alerts |
| `/admin/products` | Product list |
| `/admin/products/new` | Create product + variants |
| `/admin/products/:id` | Edit product, manage variants, update stock |
| `/admin/inventory` | Stock levels per SKU with quick adjustment |
| `/admin/orders` | Order management — filter by status, payment, date |
| `/admin/orders/:id` | Order detail — update status, mark payment received |
| `/admin/promotions` | Create and manage discounts and coupon codes |
| `/admin/reports` | Sales report by date range |
| `/admin/reviews` | Moderate customer reviews |

### Delivery Panel

| Route | Description |
|---|---|
| `/delivery` | Assigned orders split into "Out for Delivery" and "Dispatched" |
| `/delivery/orders/:id` | Order detail — address, items, status update button |

### Super Admin

| Route | Description |
|---|---|
| `/super-admin` | Platform analytics — revenue, orders, top products |
| `/super-admin/users` | All users — search, filter by role, change role, deactivate |
| `/super-admin/settings` | Store name, contact, minimum order, delivery toggle |

---

## API Overview

Base URL: `http://127.0.0.1:8000/api/v1/`
Auth header: `Authorization: Bearer <access_token>`

### Authentication
```
POST   /auth/register/
POST   /auth/login/
POST   /auth/logout/
POST   /auth/token/refresh/
POST   /auth/forgot-password/
POST   /auth/reset-password/
```

### Account
```
GET    /account/profile/
PATCH  /account/profile/
POST   /account/change-password/
GET    /account/addresses/
POST   /account/addresses/
PATCH  /account/addresses/:id/
DELETE /account/addresses/:id/
```

### Catalog
```
GET    /categories/
GET    /products/               # ?search= &category= &min_price= &max_price= &in_stock=
GET    /products/:slug/
GET    /products/:slug/reviews/
POST   /products/:slug/reviews/
```

### Cart
```
GET    /cart/
POST   /cart/items/
PUT    /cart/items/:id/
DELETE /cart/items/:id/
DELETE /cart/
POST   /cart/merge/
POST   /cart/apply-coupon/
```

### Orders
```
POST   /orders/
GET    /orders/history/
GET    /orders/:orderNumber/
GET    /track/:orderNumber/
GET    /delivery-zones/
```

### Admin
```
GET    /admin/dashboard/
GET    /admin/orders/
GET    /admin/orders/:id/
PUT    /admin/orders/:id/status/
PUT    /admin/orders/:id/payment-status/
GET    /admin/products/
POST   /admin/products/
GET/PUT/DELETE  /admin/products/:id/
GET    /admin/categories/
POST   /admin/categories/
GET    /admin/inventory/
PATCH  /admin/variants/:id/stock/
GET/POST        /admin/promotions/
PATCH/DELETE    /admin/promotions/:id/
GET    /admin/reports/sales/
GET    /admin/reviews/
DELETE /admin/reviews/:id/
```

### Payments
```
POST   /payments/initiate/
POST   /payments/webhook/flutterwave/
POST   /payments/webhook/stripe/
GET    /payments/:orderId/status/
```

### Super Admin
```
GET    /super-admin/users/
GET/PATCH  /super-admin/users/:id/
GET    /super-admin/analytics/
GET    /super-admin/settings/
PUT    /super-admin/settings/
```

---

## Key Features

### Stock management
- `Add to Cart` is disabled when `stock_qty = 0`
- Cart validates stock on every add and at checkout
- Stock decrements only after a successful payment webhook for online payments
- For Cash on Delivery and Pay in Store, stock decrements immediately on order placement

### Order status flow
```
pending → confirmed → processing → dispatched → out_for_delivery → delivered

pickup:  pending → confirmed → processing → ready → delivered

any stage → cancelled  (before dispatch only)
```
Every transition is logged to `order_status_history` with the staff member and an optional note.

### Payment methods

| Method | Flow |
|---|---|
| Mobile Money | Flutterwave sends USSD prompt → customer confirms → webhook confirms order |
| Card | Flutterwave / Stripe hosted form → 3D Secure → webhook confirms order |
| Cash on Delivery | No gateway — admin marks paid on delivery via the order detail page |
| Pay in Store | No gateway — admin marks paid at the till via the order detail page |

### Snapshot order items
Product names, variant labels, and unit prices are copied to the order at placement time. Future catalog edits never affect past orders.

### Guest cart
Unauthenticated users get a session-based cart. On login, the guest cart is automatically merged with the user's account cart.

---

## What Requires External Service Keys

| Feature | Service | Environment Variables |
|---|---|---|
| Product image uploads | Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Card / Mobile Money payments | Flutterwave | `FLUTTERWAVE_SECRET_KEY` |
| International card payments | Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Password reset emails | SMTP | `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` |

Everything else — browsing, cart, COD and pay-in-store orders, the full admin panel, delivery panel, reviews, promotions, and super admin — works with just MySQL and Redis running locally.

---

## Development Notes

- **WSL2 + Windows drive**: If the `venv` lives on `/mnt/d/` (a Windows NTFS mount), use `python manage.py runserver --noreload` to prevent the autoreloader from crashing.
- **Vite HMR stale modules**: If code changes don't appear after a browser hard-reload (`Ctrl+Shift+R`), fully restart the Vite dev server (`Ctrl+C` then `npm run dev`).
- **Tailwind v4 `space-y-*`**: The global CSS reset is wrapped in `@layer base` so that Tailwind utility classes take precedence. Do not move the reset block outside `@layer base` or margin-based spacing utilities will stop working.
- **DRF pagination**: All list endpoints return `{ count, next, previous, results }`. Frontend components use the pattern `data?.results || data || []` to handle both paginated and non-paginated responses safely.
- **Payment webhooks**: Flutterwave and Stripe webhooks require a publicly accessible URL. Use [ngrok](https://ngrok.com) or similar during local development to expose the Django server.
