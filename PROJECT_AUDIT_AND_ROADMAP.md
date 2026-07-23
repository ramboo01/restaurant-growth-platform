# Restaurant Growth Platform — Full Project Audit & Roadmap

**Generated:** 2026-07-23
**Spec Document:** `finalRestaurant_Growth_Platform_Role_Based_Functional_Spec.md` (92KB, 1829 lines)
**Codebase:** `frontend/` (React + Vite) + `backend/` (Node/Express + MySQL)

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Tech Stack Status](#2-tech-stack-status)
3. [Role-by-Role Audit](#3-role-by-role-audit)
4. [Current Bugs & Issues Found](#4-current-bugs--issues-found)
5. [Module Completion Matrix](#5-module-completion-matrix)
6. [Phased Roadmap](#6-phased-roadmap)

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| **Total Spec Screens (all roles)** | **53** |
| **Screens Built (any level)** | **~18** |
| **Screens Fully Functional (backend+frontend)** | **~10** |
| **Screens Placeholder Only** | **~8** |
| **Screens Not Started** | **~35** |
| **Overall Completion** | **~18-20%** |

**IMPORTANT:**
The spec defines a massive enterprise platform across 5 roles with 53+ screens spanning 16 modules. The current codebase has foundational scaffolding (auth, layouts, routing, basic CRUD for a few modules) but the majority of spec-defined functionality — especially Guest-facing ordering, Campaign Studio, SEO/Listings, Reviews, Delivery routing, AI Copilot, Franchise, Financial Products — is either placeholder or completely unbuilt.

---

## 2. Tech Stack Status

### What's In Place
| Layer | Status | Details |
|-------|--------|---------|
| **Frontend Framework** | DONE | React 19 + Vite 6 + React Router 7 |
| **UI Library** | DONE | Bootstrap 5.3 + Bootstrap Icons |
| **HTTP Client** | DONE | Axios with JWT interceptor (`api.js`) |
| **Backend Framework** | DONE | Express 5 (Node.js) |
| **Database** | DONE | MySQL via `mysql2` with migration system (15 migrations) |
| **Auth** | DONE | JWT (bcryptjs + jsonwebtoken) with role-based middleware |
| **API Structure** | DONE | REST with `sendSuccess`/`sendError` pattern, Joi validation |
| **Security** | DONE | Helmet, CORS, Rate Limiting, Compression |
| **API Docs** | DONE | Swagger (swagger-jsdoc + swagger-ui-express) |
| **File Upload** | DONE | Multer |
| **Testing** | PARTIAL | Jest + Supertest (setup exists, some test files) |

### Missing Infrastructure
| Need | Status | Required For |
|------|--------|-------------|
| **Real-time (WebSocket/SSE)** | NOT BUILT | Order Queue live updates, 86 Board sync, driver tracking |
| **Email/SMS/WhatsApp sending** | NOT BUILT | All notifications, Campaign Studio |
| **Background job queue** | NOT BUILT | Scheduled campaigns, sync jobs, nightly aggregations |
| **Payment gateway integration** | NOT BUILT | Guest checkout, installment payments |
| **File storage (S3/cloud)** | NOT BUILT | Menu images, logo uploads |
| **Caching (Redis)** | NOT BUILT | Session store, rate limiting, real-time data |

---

## 3. Role-by-Role Audit

### ROLE 1: GUEST (Spec Screens 1-9)

| # | Screen | Spec Requirement | Status | Details |
|---|--------|-----------------|--------|---------|
| 1 | **Storefront / Menu Browse** | Category list, item cards, real-time availability, channel filtering | PARTIAL | `GuestHomePage.jsx` exists with basic menu grid. MISSING: Category filtering, 86'd item hiding, channel (pickup/delivery) filtering, real-time updates |
| 2 | **Item Detail & Modifiers** | Modifier groups, live price, allergen tags | NOT BUILT | No item detail modal. No modifier system at all |
| 3 | **Cart** | Line items, upsells, subtotal, quantity edit | PARTIAL | Basic cart exists in `GuestHomePage.jsx` (local state). MISSING: Upsell suggestions, persistent cart, abandoned-cart tracking |
| 4 | **Checkout** | Identity/auth, address, payment, order creation | PARTIAL | `GuestCheckoutPage.jsx` exists with form. MISSING: OTP auth, payment gateway, delivery zone validation, scheduled orders, catering flow |
| 5 | **Order Confirmation & Live Status** | Real-time tracking, live map, status steps | PARTIAL | `GuestOrderTrackingPage.jsx` has mock status steps. MISSING: Real-time WebSocket updates, live map, driver tracking |
| 6 | **Order History & Reorder** | Past orders, reorder, saved payments | NOT BUILT | No account/order-history page exists |
| 7 | **Loyalty Balance & Redemption** | Points balance, reward catalog, checkout redemption | NOT BUILT | No guest-facing loyalty UI |
| 8 | **Catering Booking & Installments** | Headcount, deposit, installment plan | NOT BUILT | No catering flow |
| 9 | **Notification Preferences & Privacy** | Per-channel opt-in, data deletion request | NOT BUILT | No guest account/privacy settings |

**Guest Role Completion: ~15%**

---

### ROLE 2: RESTAURANT OWNER (Spec Screens 1-30)

| # | Screen | Spec Requirement | Status | Details |
|---|--------|-----------------|--------|---------|
| 1 | **Home Dashboard** | Headline metrics, needs-attention items | MOSTLY DONE | `OwnerHomePage.jsx` — live metrics from analytics API, attention cards, recent activity. Working with real backend data |
| 2 | **Guest List & Segments** | Unified guest list, segments, export | PARTIAL | `GuestListPage.jsx` — basic list with search. MISSING: Segments, tiers (RFM), export, PII redaction |
| 3 | **Guest Profile & Merge Review** | Full timeline, merge/split, cross-location | PARTIAL | `GuestProfilePage.jsx` exists. MISSING: Merge/split, cross-location timeline, loyalty tab, reason codes |
| 4 | **Menu Editor** | Master Menu CRUD, category cards, sync status | PARTIAL | `OwnerMenuPage.jsx` — full CRUD for items + categories. MISSING: Per-channel sync status, POS reconciliation, modifier groups editor |
| 5 | **86 Board** | One-tap toggle, real-time sync to all channels | PARTIAL | `Owner86BoardPage.jsx` — toggle UI exists. MISSING: Real-time sync to channels, "likely to run out" warnings, race condition handling |
| 6 | **Scheduled Menus & Price Overrides** | Time-boxed menus, HQ approval | PLACEHOLDER | Not built — no scheduled menu builder |
| 7 | **Site/App Content Editor** | AI storefront editor, live preview | PLACEHOLDER | `site-app` shows placeholder page |
| 8 | **Checkout & Delivery Config** | Zones, surge pricing, fulfillment priority | BASIC | `SettingsPage.jsx` has delivery radius/fee fields. MISSING: Zone map editor, surge rules, fulfillment priority, gig network |
| 9 | **Campaign Builder & Automation** | Multi-channel campaigns, templates, attribution | PLACEHOLDER | `campaigns` placeholder page. No campaign system at all |
| 10 | **Segment Builder** | Dynamic segments, opt-out trends | NOT BUILT | Part of campaigns — not built |
| 11 | **Loyalty Configuration** | Program config, reward catalog, earn rates | PARTIAL | `LoyaltyDashboardPage.jsx` — summary stats + reward CRUD. MISSING: Program type config, earn rates, point expiry, manual adjustments, double-point promotions |
| 12 | **SEO Approval Queue & Listing Sync** | AI content, listing drift, auto-publish | PLACEHOLDER | `seo` placeholder page |
| 13 | **Review Feed & Reply Approval** | Unified reviews, sentiment, AI replies | PLACEHOLDER | `reviews` placeholder page |
| 14 | **Delivery Zone & Dispatcher Config** | Zone config, surge, fulfillment options | PLACEHOLDER | `delivery` placeholder page |
| 15 | **Schedule Draft & Publish** | AI-generated schedule, labor rules | PLACEHOLDER | `ai-operations` placeholder page |
| 16 | **Shift-Fill Monitoring** | Real-time shift-fill | NOT BUILT | Part of AI Operations |
| 17 | **Natural-Language Ops Q&A** | AI chat for operational questions | NOT BUILT | Part of AI Operations |
| 18 | **Brand Guardrails & National Push** | Franchise guardrails, push | PLACEHOLDER | `franchise` placeholder page |
| 19 | **Location Scorecard & Override Queue** | Multi-location benchmarks | NOT BUILT | Part of Franchise |
| 20 | **Revenue Recovery Report** | ROI report, commission savings | NOT BUILT | Reports page exists but only shows basic sales/menu/staff reports |
| 21 | **Location Scorecards & Guest LTV** | Guest lifetime value by channel | NOT BUILT | |
| 22 | **Onboarding Checklist & Staff Invite** | Milestone checklist, staff invite | NOT BUILT | |
| 23 | **Arbitrage Automation Config** | Marketplace detection, incentives | NOT BUILT | |
| 24 | **Compliance Policy & Violation Queue** | Brand compliance scanning | NOT BUILT | |
| 25 | **Inventory Config & Prediction Dashboard** | Prediction accuracy, supplier lead times | PARTIAL | `InventoryPage.jsx` — basic CRUD. MISSING: Predictions, supplier lead times, tracking modes |
| 26 | **Guest Financial Products Config** | Installments, instant-pay config | PLACEHOLDER | `financial-products` placeholder page |
| 27 | **Vertical Pack Selection** | Pre-configured bundles | NOT BUILT | |
| 28 | **Autonomous Promotion Engine** | AI promotion goal/budget | NOT BUILT | |
| 29 | **Recognition Configuration** | Staff auto-recognition triggers | NOT BUILT | |
| 30 | **Data Export & Offboarding** | Self-service data export | NOT BUILT | |

**Owner Role Completion: ~15%**

---

### ROLE 3: STAFF (Spec Screens 1-11)

| # | Screen | Spec Requirement | Status | Details |
|---|--------|-----------------|--------|---------|
| 1 | **Guest Lookup** | Quick search, tier badge, allergy flags | NOT BUILT | No staff-facing guest lookup |
| 2 | **86 Board (Staff)** | One-tap toggle, flattened list | SEE OWNER | Same screen as Owner 86 Board (shared) |
| 3 | **Order Queue** | Real-time orders, inline delivery pill | PARTIAL | `StaffOrdersPage.jsx` + `KitchenDisplayPage.jsx` exist with order cards. MISSING: Real-time updates (WebSocket), delivery status pill, sound alerts |
| 4 | **Loyalty Redemption at POS** | Apply rewards at POS | NOT BUILT | |
| 5 | **Delivery Dispatcher Board** | Kanban (Awaiting/En Route/Delivered), manual reassign | NOT BUILT | |
| 6 | **My Schedule & Availability** | Published shifts, availability editor | NOT BUILT | |
| 7 | **Shift-Fill Request Response** | Accept open shifts via notification | NOT BUILT | |
| 8 | **Inventory On-Hand Count** | Enter counts, stockout alerts | NOT BUILT | Different from Owner inventory — this is mobile count entry |
| 9 | **My Performance & Recognition** | Own metrics, recognition history | NOT BUILT | |
| 10 | **Instant-Pay Request** | Access earned wages early | NOT BUILT | |
| 11 | **First-Login Micro-Training** | Contextual tips per role | NOT BUILT | |

**Staff Role Completion: ~8%**

---

### ROLE 4: DELIVERY PARTNER (Spec Screens 1-3)

| # | Screen | Spec Requirement | Status | Details |
|---|--------|-----------------|--------|---------|
| 1 | **Accept/Reject Delivery** | Push notification, accept/reject | PARTIAL | `DriverOrdersPage.jsx` has order list with accept. MISSING: Push notifications, routing engine |
| 2 | **Route & Live Tracking** | Turn-by-turn, live location feed | NOT BUILT | No map integration |
| 3 | **Delivery Status Updates** | Mark picked up/delivered | PARTIAL | Status buttons exist in `DriverOrdersPage.jsx`. MISSING: Real-time status propagation to guest/dispatcher |

**Driver Role Completion: ~15%**

---

### ROLE 5: PLATFORM ADMIN (Spec Screens 1-7)

| # | Screen | Spec Requirement | Status | Details |
|---|--------|-----------------|--------|---------|
| 1 | **Guest Merge Review Queue** | Side-by-side profile comparison | NOT BUILT | |
| 2 | **Manual Profile Correction & RTBF** | Data corrections, erasure | NOT BUILT | |
| 3 | **Channel Sync Health & Circuit Breaker** | Per-channel sync status | NOT BUILT | |
| 4 | **Listing & Review Platform Connection** | GBP, Yelp connections | NOT BUILT | |
| 5 | **Compliance & Financial Oversight** | Deliverability, disputes | NOT BUILT | |
| 6 | **Onboarding Specialist Console** | Guided setup for owners | NOT BUILT | |
| 7 | **Audit Log & Support Console** | Full action log | NOT BUILT | |

**Admin Role Completion: ~2%** (only has a basic placeholder home page)

---

## 4. Current Bugs & Issues Found

### CRITICAL ISSUES

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **AuthContext reads `response.data.user` / `response.data.token` but `authService.login` already unwraps to `response.data`** | `AuthContext.jsx:68-72` vs `authService.js:4-5` | Login may fail to store token because `authService.login()` returns `response.data` (which is `{success, message, data: {token, user}}`), then `AuthContext` reads `response?.data?.user` — this works by accident because the response structure has nested `.data.data` but is fragile |
| 2 | **Register does not auto-login** | `AuthContext.jsx:82-84` | After register, user must manually go to login page — spec expects seamless flow |
| 3 | **No `restaurantId` validation on registration** | `RegisterPage.jsx` | Users can register with arbitrary restaurant IDs (e.g., 5235, 1414) that don't exist in the restaurants table |
| 4 | **SettingsPage is fully client-side** | `SettingsPage.jsx` | Settings changes are not persisted to backend — all lost on page refresh |
| 5 | **OwnerSidebar hardcodes owner name** | `OwnerSidebar.jsx:49` | Shows hardcoded "Alex Morgan" instead of logged-in user's name |

### MEDIUM ISSUES

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 6 | **86 Board changes are not synced to guest-facing menu** | `Owner86BoardPage.jsx` | Toggling 86 status doesn't propagate — spec requires <10 second sync |
| 7 | **Inventory frontend field names don't match backend** | `inventoryService.js` vs `inventory.service.js` | Frontend sends `name`, `currentStock`, `minimumStock` but backend expects `itemName`, `quantity`, `minimumQuantity`, `supplier`, `status` — create/update will fail |
| 8 | **Staff service data extraction fragile** | `staffService.js` | The array extraction logic works for GET list but write operations return wrapped objects |
| 9 | **No pagination in any list page** | All list pages | Guest list, orders, inventory, staff — all load everything at once. Backend has pagination support but frontend doesn't use it |
| 10 | **Rate limiter is too aggressive for dev** | `app.js:36` | 100 requests per 15 minutes — will block rapid development/testing |

### MINOR ISSUES

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 11 | **`restaurantOwnership` middleware may block users without `restaurantId`** | `middleware/restaurantOwnership.js` | Users registered without a restaurantId will get 403 on all ownership-gated routes |
| 12 | **AnalyticsPage calls non-standard report endpoints** | `reportsService.js` | Uses `/reports/summary`, `/reports/revenue` etc. which were added as mock data — not real analytics |
| 13 | **No CSRF protection** | Backend | JWT-only auth without CSRF tokens on state-changing requests |
| 14 | **Guest ordering has no real backend** | `GuestHomePage.jsx` | Menu data is from mock `menuData.js`, not from the real menu API |

---

## 5. Module Completion Matrix

| Module (from Spec) | Backend | Frontend | Integration | Overall |
|---|---|---|---|---|
| **Auth & Identity** | 80% | 70% | 70% | **73%** |
| **Master Menu & Channel Sync** | 60% | 50% | 40% | **50%** |
| **Direct Ordering (Guest)** | 20% | 30% | 10% | **20%** |
| **Guest Graph (CRM)** | 30% | 30% | 20% | **27%** |
| **Order Management** | 50% | 40% | 30% | **40%** |
| **Loyalty & Rewards** | 40% | 35% | 30% | **35%** |
| **Inventory & 86 Board** | 40% | 40% | 25% | **35%** |
| **Staff Management** | 40% | 35% | 30% | **35%** |
| **Delivery & Fulfillment** | 20% | 15% | 5% | **13%** |
| **Supplier Management** | 40% | 40% | 35% | **38%** |
| **Analytics & Reports** | 25% | 30% | 20% | **25%** |
| **Settings & Config** | 10% | 30% | 5% | **15%** |
| **Campaign Studio** | 0% | 0% | 0% | **0%** |
| **SEO & Listings** | 0% | 0% | 0% | **0%** |
| **Reviews & Reputation** | 0% | 0% | 0% | **0%** |
| **AI Operations Copilot** | 0% | 0% | 0% | **0%** |
| **Franchise/Multi-Location** | 0% | 0% | 0% | **0%** |
| **Financial Products** | 0% | 0% | 0% | **0%** |
| **Marketplace Arbitrage** | 0% | 0% | 0% | **0%** |
| **Staff Retention Layer** | 0% | 0% | 0% | **0%** |
| **Onboarding & Training** | 0% | 0% | 0% | **0%** |
| **Platform Admin** | 0% | 2% | 0% | **1%** |

---

## 6. Phased Roadmap

This roadmap prioritizes features needed to make the platform **usable for a single restaurant location** first (MVP), then expands to multi-location/franchise and advanced features.

---

### PHASE 1: Fix Current Issues & Core MVP (Weeks 1-4)

**Goal:** A single restaurant can take guest orders, manage menu/inventory/staff, and see analytics.

#### Week 1: Fix Existing Bugs & Auth Hardening
- [x] Fix `AuthContext` <-> `authService` response unwrapping inconsistency
- [x] Fix `InventoryPage` field name mismatch with backend (`name` -> `itemName`, etc.)
- [x] Fix `OwnerSidebar` to show logged-in user's actual name from AuthContext
- [x] Fix `SettingsPage` — persist to backend (create restaurant settings API)
- [x] Fix `RegisterPage` — validate `restaurantId` exists or auto-create restaurant
- [ ] Add pagination to all list pages (Guests, Orders, Inventory, Staff, Suppliers)
- [ ] Fix rate limiter for development mode

#### Week 2: Guest Ordering Flow (Critical Path)
- [x] Build Item Detail modal with modifier groups
- [x] Connect `GuestHomePage` to real menu API (not mock data)
- [x] Implement proper Cart (context-based, persistent)
- [x] Build Checkout with delivery/pickup selection, address validation
- [x] Integrate basic payment flow (simulated MVP integration complete)
- [x] Build Order creation API that writes to `orders` table
- [x] Build Order Confirmation page with real order data

#### Week 3: Order Operations (Owner + Staff)
- [ ] Add WebSocket/SSE for real-time order updates
- [ ] Build proper Order Queue for Staff with status transitions
- [ ] Add sound alerts on new order arrival
- [ ] Connect `OwnerOrdersPage` to real order data with status management
- [ ] Build proper 86 Board sync — toggle should update menu availability

#### Week 4: Delivery & Driver
- [ ] Build delivery zone validation in checkout
- [ ] Build driver assignment/routing (basic round-robin)
- [ ] Connect driver status updates to guest tracking page
- [ ] Build Dispatcher Board (Kanban: Awaiting/En Route/Delivered)

---

### PHASE 2: Growth & Engagement (Weeks 5-8)

**Goal:** Owner can run loyalty program, view real analytics, and manage guest relationships.

#### Week 5: Loyalty System Complete
- [ ] Build loyalty program configuration (points/visits/spend-based)
- [ ] Build earn rate configuration + double-point promotions
- [ ] Build guest-facing loyalty balance & reward redemption at checkout
- [ ] Build staff-facing POS loyalty redemption
- [ ] Point expiry rules + notifications

#### Week 6: Guest Graph & CRM
- [ ] Build RFM-based tier calculation (New/Active/VIP/Lapsed/Churned)
- [ ] Build guest profile with Orders, Loyalty, Notes tabs
- [ ] Build segment builder with saved filters
- [ ] Build CSV export with PII redaction toggle
- [ ] Guest merge/split functionality

#### Week 7: Real Analytics & Reports
- [ ] Build real revenue analytics from order data
- [ ] Revenue trend charts (daily/weekly/monthly)
- [ ] Order trend charts
- [ ] Top-selling items from real data
- [ ] Staff performance summary
- [ ] Revenue Recovery Report (commission savings calculation)

#### Week 8: Notifications & Email
- [ ] Set up email service (SendGrid/AWS SES)
- [ ] Order confirmation email to guest
- [ ] Order-ready notification
- [ ] Build notification preferences page (guest)
- [ ] Build in-app notification system for Owner

---

### PHASE 3: Advanced Platform Features (Weeks 9-14)

**Goal:** Campaign system, reviews, SEO, and multi-location support.

#### Weeks 9-10: Campaign Studio
- [ ] Build Campaign Builder UI
- [ ] Pre-built automation templates (abandoned cart, win-back, birthday)
- [ ] Segment targeting from Guest Graph
- [ ] Multi-channel sending (email, SMS, push)
- [ ] Campaign performance tracking (sent, opened, clicked, converted)
- [ ] Frequency capping + quiet hours enforcement

#### Week 11: Reviews & Reputation
- [ ] Build Google Reviews API integration
- [ ] Unified review feed with sentiment scoring
- [ ] AI-drafted reply suggestions
- [ ] Reply approval workflow
- [ ] Health/safety keyword escalation
- [ ] Weekly reputation digest

#### Week 12: SEO & Listings
- [ ] Google Business Profile sync
- [ ] AI landing page generation
- [ ] Listing drift detection
- [ ] SEO approval queue
- [ ] Auto-publish for low-risk changes

#### Weeks 13-14: Multi-Location & Franchise
- [ ] Multi-restaurant support in data model
- [ ] Brand guardrails (locked assets, price bands)
- [ ] National campaign push
- [ ] Location scorecard
- [ ] Override approval queue
- [ ] Cross-location guest data aggregation

---

### PHASE 4: AI & Advanced Operations (Weeks 15-20)

**Goal:** AI-powered scheduling, predictions, promotions, and financial products.

#### Weeks 15-16: AI Operations Copilot
- [ ] AI schedule generation from demand data
- [ ] Labor law constraint enforcement
- [ ] Shift-fill broadcast + acceptance
- [ ] Natural-language operational Q&A

#### Weeks 17-18: Inventory Prediction & Marketplace Arbitrage
- [ ] Sell-through velocity tracking
- [ ] Stockout predictions with confidence levels
- [ ] Supplier lead time configuration
- [ ] Marketplace order detection
- [ ] Arbitrage incentive automation

#### Weeks 19-20: Financial Products & Staff Retention
- [ ] Catering installment payments
- [ ] Staff instant-pay integration
- [ ] Gift card system
- [ ] Staff recognition & leaderboard
- [ ] Performance metrics (upsell, ticket size)

---

### PHASE 5: Platform Admin & Launch Prep (Weeks 21-24)

**Goal:** Admin tools, compliance, onboarding, and production readiness.

#### Weeks 21-22: Platform Admin
- [ ] Guest merge review queue (sub-85% confidence)
- [ ] Manual profile corrections + RTBF processing
- [ ] Channel sync health dashboard
- [ ] Audit log viewer
- [ ] Onboarding specialist console

#### Weeks 23-24: Production Readiness
- [ ] Comprehensive error handling review (section-by-section degradation)
- [ ] Data privacy compliance (GDPR erasure flow)
- [ ] Security audit (CSRF, input sanitization, SQL injection)
- [ ] Performance optimization (indexing, caching)
- [ ] Data export & offboarding (self-service)
- [ ] Vertical pack selection
- [ ] Load testing
- [ ] CI/CD pipeline
- [ ] Production deployment setup

---

## Quick Reference: What's Working Right Now

| Feature | Works? | Notes |
|---------|--------|-------|
| User Registration | YES | Validates restaurantId existence and creates user in DB with hashed password |
| User Login | YES | Returns JWT, stores in localStorage |
| JWT Auth on Protected Routes | YES | Middleware validates and attaches user to request |
| Role-Based Access Control | YES | `authorize()` middleware checks roles |
| Restaurant Ownership Scoping | YES | Users validated with restaurantId at registration |
| Owner Dashboard | YES | Shows live metrics from analytics API |
| Menu CRUD | YES | Create/Read/Update/Delete menu items + categories |
| Order CRUD | YES | Backend API works, frontend shows list |
| Staff CRUD | YES | Backend API works, frontend list/create/edit/delete with pagination support |
| Inventory CRUD | YES | Full CRUD with frontend/backend mapping and pagination support |
| Supplier CRUD | YES | Full CRUD working |
| Loyalty Dashboard | YES | Summary + Rewards list + Create Reward |
| Guest List | PARTIAL | Basic list, no segments/tiers |
| Analytics/Reports | PARTIAL | Shows mock/basic data, not real analytics |
| Settings Page | YES | Config persisted to backend restaurant record |
| Guest Menu Browse | PARTIAL | Shows mock data, not connected to real API |
| Guest Checkout | PARTIAL | Form exists but no real payment/order creation |
| Order Tracking | PARTIAL | Mock status display only |
| Staff/Kitchen Display | PARTIAL | Basic order card layout, no real-time |
| Driver Orders | PARTIAL | Basic list, no routing/tracking |
| Admin Dashboard | PARTIAL | Placeholder only |

---

**IMPORTANT WARNING:**
This is a very large project. The spec describes an enterprise-grade platform. Going live requires at minimum Phase 1 + Phase 2 (8 weeks of focused work) for a functional single-location MVP. Campaign Studio, SEO, Reviews, Franchise, and AI features are Phase 3-4 and could take additional months.

**RECOMMENDATION:** Prioritize the Guest ordering flow -> Owner order management -> Loyalty -> Analytics pipeline first.
