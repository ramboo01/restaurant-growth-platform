# RestruRent: Remaining Development Plan & Screen Tracker
Derived from `finalRestaurant_Growth_Platform_Role_Based_Functional_Spec.md`

This document serves as our master tracking sheet for all remaining features, screens, and integration sprints required to complete the 60-screen role-based specification.

---

## 📊 High-Level Status Dashboard
| Role | Total Screens | Completed | Pending / Placeholder | Progress % |
| :--- | :---: | :---: | :---: | :---: |
| **Guest** | 9 | 9 | 0 | 100.0% |
| **Owner / GM** | 30 | 30 | 0 | 100.0% |
| **Staff** | 11 | 11 | 0 | 100.0% |
| **Delivery Partner** | 3 | 3 | 0 | 100.0% |
| **Platform Admin** | 7 | 7 | 0 | 100.0% |
| **TOTAL** | **60** | **60** | **0** | **100.0%** |

---

## 🗺️ Sprints & Phase Sequencing

### 🌀 Sprint 1: Real-Time Event Sync & Notifications (Phase 2 Core) - [COMPLETED]
- [x] Implement `Socket.io` connection on both backend and frontend.
- [x] Configure `NEW_ORDER_RECEIVED` event to trigger audible alarm and incremental badge indicator on Kitchen Display.
- [x] Configure `ORDER_STATUS_CHANGED` events to auto-update Guest Tracking UI (`GST-005`) and Driver Board.
- [x] Broadcast real-time `MENU_ITEM_availability_CHANGED` (86 Board updates) to all active Guest storefronts.

### ✉️ Sprint 2: Campaign Studio & Segment Builder - [COMPLETED]
- [x] **OWN-009 (Campaign Builder):** Dashboard to create SMS/Email/WhatsApp campaigns.
- [x] **OWN-010 (Segment Builder):** Filter customer list by loyalty points, tiers, RFM segments, and opt-ins.
- [x] **GST-009 (Guest Preference Center):** Guest options to update contact info, notification channels, and opt-out preferences.

### 🤖 Sprint 3: AI Website, Staff Roster & Franchise Compliance - [COMPLETED]
- [x] **OWN-007 (Site Content Editor):** Simple CMS to edit store hours, banners, and layout settings.
- [x] **OWN-015 (Schedule Creator):** Shift planner with roster management and role filters.
- [x] **OWN-016 (Shift Fill Monitor):** Real-time tracking of vacant shifts and push broadcast alerts.
- [x] **ST-006 & ST-007 (Availability & Claiming):** Staff personal calendar and open shift claim board.
- [x] **OWN-024 (Franchise Compliance Center):** Multi-location scorecards and regional price override queue.

### 💳 Sprint 4: Financial Compliance & Platform Administration - [COMPLETED]
- [x] **ADM-001 & ADM-002 (Privacy & Merge Queue):** GDPR Right-to-be-forgotten PII erasure & duplicate guest consolidation.
- [x] **ADM-005 (Financial Compliance Monitor):** Weekly store settlement calculation and payout release console.
- [x] **ADM-007 (Platform Audit Logs):** Immutable event audit ledger with role-based filtering.

### 🌟 Sprint 5: Platform Parity Completion - [COMPLETED]
- [x] **ADM-003, ADM-004, ADM-006 (Ecosystem Hub):** Channel sync monitor, Local SEO listings directory, and Franchise application queue.
- [x] **ST-001, ST-009, ST-010 (Staff Operations Hub):** FOH Guest lookup card, Performance Scorecard, and Instant Payout Cash-Out Slip.
- [x] **OWN-022 (Franchise Performance Matrix):** Multi-unit store sales leaderboard, labor cost ratios, and COGS variance.

---

## 📋 Comprehensive Screen-by-Screen Checklist

### 1. Guest Screens
- [x] **GST-001 Storefront / Menu Browse** (Built)
- [x] **GST-002 Item Detail & Modifiers** (Built)
- [x] **GST-003 Cart overlay** (Built)
- [x] **GST-004 Checkout Page** (Built)
- [x] **GST-005 Order Tracking Page** (Built)
- [x] **GST-006 Order History** (Built)
- [x] **GST-007 Loyalty & Reward Catalog** (Built)
- [x] **GST-008 Catering booking & installment payments** (Built)
- [x] **GST-009 Guest preferences & right-to-be-forgotten** (Built)

### 2. Owner Screens
- [x] **OWN-001 Home Dashboard** (Built)
- [x] **OWN-002 Guest List & Segments** (Built)
- [x] **OWN-003 Guest Profile details** (Built)
- [x] **OWN-004 Menu Category Editor** (Built)
- [x] **OWN-005 86 Board Page** (Built)
- [x] **OWN-007 Site & App Content Editor** (Built)
- [x] **OWN-008 Delivery & Surge Pricing Configurator** (Built)
- [x] **OWN-009 Campaign builder dashboard** (Built)
- [x] **OWN-010 Guest preference compliance / segment builder** (Built)
- [x] **OWN-011 Loyalty Dashboard** (Built)
- [x] **OWN-012 Customer RFM Matrix** (Built)
- [x] **OWN-013 Reputation review aggregator & reply** (Built)
- [x] **OWN-014 Driver fee & zone setup** (Built)
- [x] **OWN-015 Shift Schedule Planner** (Built)
- [x] **OWN-016 Open Shift Fill Monitor & Push Alerts** (Built)
- [x] **OWN-017 Dynamic Pricing & Happy Hour Rules** (Built)
- [x] **OWN-018 Waste & Shrinkage Logging** (Built)
- [x] **OWN-019 Supplier Purchase Order Builder** (Built)
- [x] **OWN-020 Revenue Recovery Report** (Built)
- [x] **OWN-021 Live Analytics & Trends** (Built)
- [x] **OWN-022 Multi-Unit Franchise Performance Matrix** (Built)
- [x] **OWN-023 Kitchen Station Load Monitor** (Built)
- [x] **OWN-024 Franchise Compliance Center & HQ Audit Scorecard** (Built)
- [x] **OWN-025 Inventory Stock Board** (Built)
- [x] **OWN-026 Catering Deposit & Installment Configurator** (Built)
- [x] **OWN-027 Table & QR Code Generator** (Built)
- [x] **OWN-028 Gift Card & Voucher Manager** (Built)
- [x] **OWN-029 Staff Payroll & Tip Pool Report** (Built)
- [x] **OWN-030 Data export & export-PII tool** (Built)

### 3. Staff Screens
- [x] **ST-001 Front-of-house guest lookup card** (Built)
- [x] **ST-002 86 Board Toggle** (Built)
- [x] **ST-003 Order Queue** (Built)
- [x] **ST-004 Loyalty lookup & redemption at POS** (Built)
- [x] **ST-005 Delivery Dispatcher** (Built)
- [x] **ST-006 Availability calendar & shift claim board** (Built)
- [x] **ST-007 Shift request responder & open shift alert** (Built)
- [x] **ST-008 Inventory Count interface** (Built)
- [x] **ST-009 Performance metrics scorecard** (Built)
- [x] **ST-010 Instant pay out slip** (Built)
- [x] **ST-011 In-context onboarding tips** (Built)

### 4. Delivery Partner Screens
- [x] **DRV-001 Accept-Reject delivery offer** (Built)
- [x] **DRV-002 Active route navigation** (Built)
- [x] **DRV-003 Delivered status selector** (Built)

### 5. Platform Admin Screens
- [x] **ADM-001 Profile Merge Queue** (Built)
- [x] **ADM-002 GDPR erasure process console** (Built)
- [x] **ADM-003 Channel connection sync dashboard** (Built)
- [x] **ADM-004 SEO Listings partner directory** (Built)
- [x] **ADM-005 Financial compliance monitor & store settlement** (Built)
- [x] **ADM-006 Franchise signup assistance workspace** (Built)
- [x] **ADM-007 Platform action audit logs** (Built)
