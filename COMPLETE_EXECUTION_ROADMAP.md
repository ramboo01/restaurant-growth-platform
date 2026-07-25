# Restaurant Growth Platform — Master Execution Roadmap & Workflow Specification

**Document Version:** 1.0  
**Based On:** `finalRestaurant_Growth_Platform_Role_Based_Functional_Spec.md`  
**Execution Strategy:** End-to-End Flow-Based Vertical Slices (Lifecycle First Strategy)

---

## 🎯 Executive Strategy & Principles

Instead of building role-by-role in isolation, this roadmap executes the platform via **End-to-End Workflow Lifecycles**. This guarantees that at the end of Phase 1, the platform is **100% operational, fully connected, and testable** across Guest, Owner, Staff, and Driver roles for real restaurant operations.

```
Guest (Places Order) ➔ Owner (Manages Menu/86) ➔ Staff (Kitchen Cooks) ➔ Driver (Delivers) ➔ Guest (Live Tracks)
```

---

## 📑 Phase Breakdown Overview

| Phase | Core Objective | Primary Roles Involved | Key Milestone |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Core Ordering & Fulfillment Engine** | Guest, Owner, Staff, Driver | Real order flows end-to-end through DB & UI |
| **Phase 2** | **Real-Time WebSockets Engine** | Guest, Staff, Driver, Owner | Zero-refresh live sync & kitchen audio alerts |
| **Phase 3** | **Loyalty Rewards & Guest CRM** | Guest, Owner, Staff | Point accrual/redemption & RFM Guest Tiers |
| **Phase 4** | **Inventory & Real Analytics Pipeline** | Owner, Staff | Auto stock deduction & live MySQL sales reports |
| **Phase 5** | **Advanced & AI Operational Modules** | Owner, Marketing, Admin | Campaigns, AI SEO, Reviews & Franchise setup |

---

# 🚀 PHASE 1: Core Food Ordering & Fulfillment Engine (MVP)

**Goal:** Establish a 100% working food ordering lifecycle where a Guest places an order, the Kitchen receives and prepares it, the Driver delivers it, and the Guest tracks it live.

---

### Step 1.1: Owner Master Menu & 86 Board ➔ Guest Storefront Connection
- [x] **Backend API:** Verify `/api/menu` and `/api/menu/categories` endpoints return complete menu hierarchy with modifier groups and availability flags.
- [x] **Guest Storefront (`GuestHomePage.jsx`):** Replace static mock data with real API fetch from backend menu endpoint.
- [x] **Channel & Category Filtering:** Enable category tab selection and filter out items where `isAvailable = false` or item is toggled 86'd.
- [x] **86 Board Sync (`Owner86BoardPage.jsx`):** Ensure toggling 86 status in Owner dashboard updates `isAvailable` in MySQL DB immediately and updates storefront.

### Step 1.2: Item Modifiers, Cart Engine & Real Checkout
- [x] **Item Detail Modal (`ItemDetailModal.jsx`):** Build interactive modal displaying item details, image, description, and required/optional modifier groups (e.g., Size, Toppings, Choice of Sauce) with live price recalculation.
- [x] **Persistent Cart System:** Upgrade cart state management to persist across browser reloads and enforce minimum delivery order rules.
- [x] **Guest Checkout (`GuestCheckoutPage.jsx`):**
  - Connect form to write directly to `/api/orders` table in MySQL.
  - Implement Delivery vs Pickup fulfillment selection with lead time and address validation.
  - Complete simulated/live payment authorization response to generate confirmed Order record.
- [x] **Order Confirmation Page (`GuestOrderSuccessPage.jsx`):** Render order summary, transaction ID, estimated ready time, and redirect link to live tracking.

### Step 1.3: Kitchen Display System (KDS) & Order Status Pipeline
- [x] **Staff Order Queue (`StaffOrdersPage.jsx` / `KitchenDisplayPage.jsx`):**
  - Fetch active orders from backend `/api/orders` API grouped by status (`PENDING`, `PREPARING`, `READY_FOR_PICKUP`).
  - Render line items, selected modifiers, customer notes, and fulfillment type (Pickup/Delivery).
- [x] **Order Status Transitions:** Enable one-tap status updates:
  - `PENDING` ➔ `PREPARING` (Kitchen starts cooking)
  - `PREPARING` ➔ `READY_FOR_PICKUP` / `READY_FOR_DISPATCH`

### Step 1.4: Driver Dispatch Board & Live Guest Tracking
- [x] **Driver Orders Board (`DriverOrdersPage.jsx`):**
  - Display orders with `READY_FOR_DISPATCH` status.
  - Implement driver actions: `ACCEPT_ORDER`, `PICKED_UP / OUT_FOR_DELIVERY`, and `DELIVERED`.
- [x] **Guest Live Order Tracking (`GuestOrderTrackingPage.jsx`):**
  - Connect to backend `/api/orders/:orderId` to display real-time status step indicator (`Order Placed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered`).
  - Calculate estimated delivery time dynamically based on status transitions.

### Step 1.5: End-to-End 4-Role Live Testing Cycle
- [x] Open 4 separate browser windows (Owner, Guest, Kitchen Staff, Driver).
- [x] Perform a full live order cycle:
  1. Owner checks menu item is available.
  2. Guest configures modifiers, places order at Checkout.
  3. Kitchen Staff sees order arrive, changes status to `PREPARING` then `READY`.
  4. Driver accepts order, marks `OUT_FOR_DELIVERY` then `DELIVERED`.
  5. Guest tracking updates accurately across all steps.

---

# ⚡ PHASE 2: Real-Time Synchronization Engine (WebSockets)

**Goal:** Eliminate manual page refreshes across all roles using instant WebSocket event broadcasting.

- [x] **Socket.io Infrastructure:** Set up WebSocket server in Express backend and client socket listener context in React frontend.
- [x] **Live 86 Board Event Broadcast (`ITEM_86_UPDATED`):** Toggling 86 status in Owner/Staff dashboard instantly hides or greys out the item on all connected Guest storefront browsers.
- [x] **Instant Kitchen Order Alert (`NEW_ORDER_RECEIVED`):** Kitchen Display Screen auto-receives new guest orders instantly with an audible chime notification.
- [x] **Live Status Broadcast (`ORDER_STATUS_CHANGED`):** Any status change by Kitchen or Driver instantly updates Guest Tracking UI without requiring polling.

---

# 🎁 PHASE 3: Loyalty Rewards & Guest CRM (Guest Graph)

**Goal:** Driver customer retention, repeat orders, and guest lifetime value tracking.

### Step 3.1: Loyalty Program Configuration & Redemption
- [x] **Owner Loyalty Config (`LoyaltyDashboardPage.jsx`):** Define points accrual rate (e.g., $1 spent = 10 points) and create reward catalog items (e.g., 500 points = Free Drink).
- [x] **Guest Earn & Redeem at Checkout:**
  - Auto-calculate points earned upon order completion.
  - Allow authenticated guests to select and redeem available rewards at checkout, with server-side point validation.

### Step 3.2: Guest Graph & RFM Segmentation
- [x] **RFM Automated Tiers:** Implement automated nightly calculation classifying guests into `New`, `Active`, `VIP`, `Lapsed`, and `Churned`.
- [x] **Unified Guest Profile (`GuestProfilePage.jsx`):** Consolidated timeline view showing complete order history, total spend, average order value (AOV), and loyalty log.

---

# 📊 PHASE 4: Inventory & Real Analytics Pipeline

**Goal:** Automate stock tracking and connect reporting widgets to real database records.

- [x] **Recipe & Stock Auto-Deduction:** Deduct ingredient stock from `InventoryPage.jsx` automatically when guest orders are marked `DELIVERED` or `COMPLETED`.
- [x] **Real Analytics Engine (`AnalyticsPage.jsx`):**
  - Replace mock revenue widgets with SQL queries calculating daily, weekly, and monthly gross revenue.
  - Render top-selling items chart and peak order hours histogram.
- [x] **Persisted Restaurant Settings (`SettingsPage.jsx`):** Store restaurant operating hours, delivery radius, tax rates, and currency settings in MySQL database.

---

# 🤖 PHASE 5: Advanced & AI Operational Modules

**Goal:** Scale the platform with automated marketing, SEO, reviews, and franchise management.

- [x] **Campaign Studio (`CampaignsPage.jsx`):** Abandoned cart recovery, automated win-back SMS/Email triggers, and guest frequency capping.
- [x] **Review Engine & AI Replies (`ReviewsPage.jsx`):** Google Business Profile review aggregation, sentiment analysis, and AI-drafted reply approvals.
- [x] **SEO Autopilot (`SeoPage.jsx`):** Dynamic landing page generator and third-party listing sync.
- [x] **Multi-Location Franchise & Admin Console:** Regional HQ permissions, national menu push, brand compliance guardrails, and Platform Admin support tools.

---

## 🛠️ Verification & Sign-off Protocol
Before advancing to each next step, the implementation will be validated against:
1. **Database Consistency:** Records created/updated with correct foreign key constraints.
2. **Role Security:** APIs validated with JWT role-authorization middleware.
3. **UI/UX Standard:** Smooth micro-animations, loading states, and error boundary handling.
