# StockFlow – Multi-Tenant SaaS Inventory Management System

[![Django](https://img.shields.io/badge/Backend-Django%205.1%20%7C%20DRF-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%206-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-indigo.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**StockFlow** is a dynamic, production-ready multi-tenant SaaS inventory management platform. Built strictly with persistent database storage, zero hardcoded numbers, and rigorous organization-level tenant isolation, every transaction, CRUD action, stock adjustment, and setting change reflects immediately across all dashboard statistics and catalog tables.

---

## Table of Contents
1. [Core Architectural Features](#core-architectural-features)
2. [Technology Stack](#technology-stack)
3. [Database Schema & Multi-Tenancy Architecture](#database-schema--multi-tenancy-architecture)
4. [Project Structure](#project-structure)
5. [Installation & Setup](#installation--setup)
6. [Running the Application](#running-the-application)
7. [REST API Documentation](#rest-api-documentation)
8. [Automated Verification & Test Suite](#automated-verification--test-suite)
9. [Production Deployment Guide](#production-deployment-guide)

---

## 1. Core Architectural Features

- **True Tenant Isolation**: Automatic organization association on signup. Every database query, update, and deletion is constrained by the authenticated user's organization foreign key. No user can view, edit, or delete another organization's inventory.
- **Dynamic Authentication**: Secure JWT-based authentication (SimpleJWT), bcrypt/PBKDF2 password hashing, registration with automated tenant workspace initialization, and persistent sessions across browser restarts.
- **Complete Product CRUD**: Real-time product creation, listing, searching by name and SKU, editing, and deletion with confirmation modals.
- **Dynamic Stock Management**: Instant quantity adjustments (relative $+/-$ or absolute set overrides), automatic validation against negative stock, and real-time status recalculation (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).
- **Dynamic Calculation Engine**:
  $$\text{Effective Threshold} = \begin{cases} \text{Product.low\_stock\_threshold} & \text{if specified} \\ \text{Organization.default\_low\_stock\_threshold} & \text{otherwise} \end{cases}$$
  $$\text{Status} = \begin{cases} \text{OUT\_OF\_STOCK} & \text{if } \text{Qty} = 0 \\ \text{LOW\_STOCK} & \text{if } 0 < \text{Qty} \le \text{Effective Threshold} \\ \text{IN\_STOCK} & \text{if } \text{Qty} > \text{Effective Threshold} \end{cases}$$
- **Real-Time Data Synchronization**: State changes (add product, adjust stock, delete, update threshold) immediately sync with the UI without page reload.
- **Organization-Level Low-Stock Settings**: Customizable organization-wide warning threshold that recalculates all inventory metrics immediately upon saving.

---

## 2. Technology Stack

### Backend
- **Python 3.11+**
- **Django 5.1+** & **Django REST Framework (DRF)**
- **djangorestframework-simplejwt**: RFC 7519 JSON Web Token authentication
- **django-cors-headers**: Cross-Origin Resource Sharing middleware
- **psycopg2-binary**: High-performance PostgreSQL database adapter
- **python-dotenv**: Environment configuration

### Frontend
- **React 18** (Functional components, custom hooks, React Context API)
- **Vite 6**: Ultra-fast build tool and development server
- **Tailwind CSS 3.4**: Modern utility-first responsive styling
- **Axios**: Centralized HTTP client with automatic JWT bearer token injection & 401 interception
- **React Router DOM 6.28**: Declarative client-side routing with protected route guards
- **Lucide React**: Clean icons

### Database
- **PostgreSQL**: Production-grade relational database with foreign key constraints, unique composite indexes, and decimal precision for monetary fields. (Supports SQLite for local dev zero-config testing).

---

## 3. Database Schema & Multi-Tenancy Architecture

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : "has members"
    ORGANIZATION ||--o{ PRODUCT : "owns inventory"

    ORGANIZATION {
        bigint id PK
        varchar(255) name
        int default_low_stock_threshold
        datetime created_at
        datetime updated_at
    }

    USER {
        bigint id PK
        varchar(254) email UK
        varchar(128) password
        bigint organization_id FK
        boolean is_active
        boolean is_staff
        datetime created_at
        datetime updated_at
    }

    PRODUCT {
        bigint id PK
        bigint organization_id FK
        varchar(255) name
        varchar(100) sku
        text description
        int quantity_on_hand
        decimal(12,2) cost_price
        decimal(12,2) selling_price
        int low_stock_threshold
        datetime created_at
        datetime updated_at
    }
```

> **Multi-Tenancy Index**: Product table enforces `UniqueConstraint(fields=['organization', 'sku'])`. The same SKU can exist in Organization A and Organization B, but cannot be duplicated within Organization A.

---

## 4. Project Structure

```
stockflow/
├── backend/
│   ├── inventory/
│   │   ├── migrations/
│   │   │   └── 0001_initial.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py             # Organization, User, Product models
│   │   ├── serializers.py        # Validations, tenant scoping, JWT auth
│   │   ├── permissions.py        # HasOrganizationPermission
│   │   ├── views.py              # Auth, ProductViewSet, Dashboard, Settings
│   │   ├── urls.py               # REST API endpoints
│   │   ├── tests.py              # Django TestCase suite (6 tests)
│   │   └── e2e_verification.py   # Full 20-scenario automated verification
│   ├── stockflow/
│   │   ├── __init__.py
│   │   ├── settings.py           # DB, CORS, JWT, Auth configurations
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosClient.js    # JWT bearer interceptor & 401 handling
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── dashboard.js
│   │   │   └── settings.js
│   │   ├── components/
│   │   │   ├── common/           # StatCard, Badge, Modal, ConfirmationModal, Skeletons
│   │   │   ├── layout/           # Sidebar, Header, Layout
│   │   │   └── products/         # ProductModal (Add/Edit), StockAdjustModal (+/-)
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global session state & token management
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .gitignore
└── README.md
```

---

## 5. Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL (optional for local testing, uses SQLite by default if PostgreSQL env is not set)

### Backend Setup
1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables in `backend/.env`:
   ```ini
   SECRET_KEY=your-secure-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1,testserver

   # Optional PostgreSQL configuration (uncomment if connecting to PostgreSQL):
   # DB_ENGINE=django.db.backends.postgresql
   # DB_NAME=stockflow_db
   # DB_USER=postgres
   # DB_PASSWORD=your_password
   # DB_HOST=localhost
   # DB_PORT=5432

   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```

### Frontend Setup
1. Navigate to `frontend/`:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```

---

## 6. Running the Application

### Start the Backend Server
```bash
cd backend
# Windows:
venv\Scripts\activate
python manage.py runserver 8000
```
Backend API will be live at `http://127.0.0.1:8000/`.

### Start the Frontend Dev Server
```bash
cd frontend
npm run dev
```
Frontend application will be live at `http://localhost:5173/`.

---

## 7. REST API Documentation

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup/` | Register new user + automatically initialize tenant organization | No |
| `POST` | `/api/auth/login/` | Authenticate with credentials and receive JWT access/refresh tokens | No |
| `POST` | `/api/auth/logout/` | Invalidate refresh token and clear session | Yes |
| `GET` | `/api/auth/me/` | Fetch current user profile and organization details | Yes |

#### Sample Signup Request:
```json
POST /api/auth/signup/
Content-Type: application/json

{
  "organization_name": "Apex Logistics Ltd",
  "email": "owner@apex.com",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!"
}
```

### Dashboard
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/` | Real-time calculated statistics, stock totals, low stock, and out of stock lists | Yes |

#### Sample Dashboard Response:
```json
{
  "organization": {
    "id": 1,
    "name": "Apex Logistics Ltd",
    "default_low_stock_threshold": 10
  },
  "summary": {
    "total_products": 24,
    "total_stock_quantity": 480,
    "low_stock_products_count": 3,
    "out_of_stock_products_count": 1
  },
  "low_stock_items": [
    {
      "id": 5,
      "name": "Wireless Ergonomic Mouse",
      "sku": "LOGI-MXM-3S",
      "quantity_on_hand": 4,
      "effective_threshold": 10,
      "stock_status": "LOW_STOCK",
      "cost_price": "65.00",
      "selling_price": "99.99"
    }
  ]
}
```

### Products CRUD & Stock Adjustments
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/products/` | List products with optional `?search=` and `?status=` filters | Yes |
| `POST` | `/api/products/` | Create a product scoped to the user's organization | Yes |
| `GET` | `/api/products/{id}/` | Retrieve product details (404 if outside organization) | Yes |
| `PUT` | `/api/products/{id}/` | Full update of product details | Yes |
| `PATCH` | `/api/products/{id}/` | Partial update of product details | Yes |
| `DELETE` | `/api/products/{id}/` | Delete product from database | Yes |
| `POST` | `/api/products/{id}/adjust-stock/` | Dynamic relative (`+`/`-`) or absolute stock change | Yes |

#### Sample Stock Adjustment Request:
```json
POST /api/products/5/adjust-stock/
Content-Type: application/json

{
  "adjustment": -5,
  "note": "Shipment dispatched to customer #1042"
}
```

### Organization Settings
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/settings/` | Get organization configuration & current default low stock threshold | Yes |
| `PATCH` | `/api/settings/` | Update organization default low stock threshold | Yes |

---

## 8. Automated Verification & Test Suite

### Running Django Unit Tests
```bash
cd backend
python manage.py test inventory
```
Output:
```
Creating test database for alias 'default'...
......
Ran 6 tests in 4.379s
OK
```

### Running All 20 End-to-End Scenarios
```bash
python inventory/e2e_verification.py
```
Output:
```
=================================================================
 STOCKFLOW - END-TO-END VERIFICATION: ALL 20 SCENARIOS
=================================================================
[Scenario 1 & 2] Register new user & automatic organization creation... PASSED
[Scenario 3] Login successfully using registered credentials... PASSED
[Scenario 4] Access the dashboard via GET /api/dashboard/... PASSED
[Scenario 5] Create a product via POST /api/products/... PASSED
[Scenario 6] View the created product... PASSED
[Scenario 7] Search products by name and SKU... PASSED
[Scenario 8] Edit product details... PASSED
[Scenario 9] Update stock quantity & prevent negative stock... PASSED
[Scenario 10] Delete a product... PASSED
[Scenario 11, 12, 13] Verify total product, stock, low stock calculations... PASSED
[Scenario 14 & 15] Update default threshold & dynamic recalculation... PASSED
[Scenario 16] Register a second organization... PASSED
[Scenario 17] Verify complete tenant data isolation... PASSED
[Scenario 18] Cross-organization access blocked with 404... PASSED
[Scenario 19] Unauthorized requests rejected with 401... PASSED
[Scenario 20] Data persists after logout and login... PASSED
=================================================================
 ALL 20 SCENARIOS VERIFIED SUCCESSFULLY AND FULLY FUNCTIONAL!
=================================================================
```

---

## 9. Production Deployment Guide

### Database (PostgreSQL)
1. Provision a PostgreSQL instance (e.g., Supabase, Neon, AWS RDS, Railway PostgreSQL).
2. Set `DB_ENGINE=django.db.backends.postgresql` and provide `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` in your environment.
3. Run `python manage.py migrate`.

### Backend Deployment (Render / Railway / Fly.io / AWS ECS)
1. Set the following environment variables:
   - `SECRET_KEY`: Production cryptographic key
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `your-backend.onrender.com`
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
   - `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
2. Start command using Gunicorn or Uvicorn:
   ```bash
   gunicorn stockflow.wsgi:application --bind 0.0.0.0:$PORT --workers 3
   ```

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Environment variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
4. Add single page application rewrite rule (`/* -> /index.html`).

---

## License
MIT License. Built for commercial SaaS inventory management.
