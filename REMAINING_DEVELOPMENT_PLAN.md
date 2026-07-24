# RestruRent: Remaining Development Plan & Screen Tracker
Derived from `finalRestaurant_Growth_Platform_Role_Based_Functional_Spec.md`

This document serves as our master tracking sheet for all remaining features, screens, and integration sprints required to complete the 60-screen role-based specification.

---

## 📊 High-Level Status Dashboard
| Role | Total Screens | Completed | Pending / Placeholder | Progress % |
| :--- | :---: | :---: | :---: | :---: |
| **Guest** | 9 | 7 | 2 | 77.7% |
| **Owner / GM** | 30 | 9 | 21 | 30.0% |
| **Staff** | 11 | 4 | 7 | 36.3% |
| **Delivery Partner** | 3 | 3 | 0 | 100.0% |
| **Platform Admin** | 7 | 0 | 7 | 0.0% |
| **TOTAL** | **60** | **23** | **37** | **38.3%** |

---

## 🗺️ Sprints & Phase Sequencing

### 🌀 Sprint 1: Real-Time Event Sync & Notifications (Phase 2 Core)
- **Goal:** Enable live updates across all active terminals (Owner, Staff, Guest, Driver) without page refreshes.
- [ ] Implement `Socket.io` connection on both backend and frontend.
- [ ] Configure `NEW_ORDER_RECEIVED` event to trigger audible alarm and incremental badge indicator on Kitchen Display.
- [ ] Configure `ORDER_STATUS_CHANGED` events to auto-update Guest Tracking UI (`GST-005`) and Driver Board.
- [ ] Broadcast real-time `MENU_ITEM_availability_CHANGED` (86 Board updates) to all active Guest storefronts.

### ✉️ Sprint 2: Campaign Studio & Segment Builder
- **Goal:** Set up promotional tools, automation triggers, and guest preferences.
- [ ] **OWN-009 (Campaign Builder):** Dashboard to create SMS/Email/WhatsApp campaigns.
- [ ] **OWN-010 (Segment Builder):** Filter customer list by loyalty points, tiers, RFM segments, and opt-ins.
- [ ] **GST-009 (Guest Preference Center):** Guest options to update contact info, notification channels, and opt-out preferences.

### 🤖 Sprint 3: AI Website, Reviews & SEO Autopilot
- **Goal:** Build search presence and review aggregation.
- [ ] **OWN-007 (Site Content Editor):** Simple CMS to edit store hours, banners, and layout settings.
- [ ] **OWN-012 (SEO Listings Hub):** Auto-generated local search index keywords and listing connection dashboard.
- [ ] **OWN-013 (Review Feed):** Fetch Google/Yelp reviews and approve AI-generated reply suggestions.

### 📅 Sprint 4: AI Shift Scheduling & Staff App Extension
- **Goal:** Complete operational staffing modules.
- [ ] **OWN-015 (Schedule Creator):** AI-generated shift planner with drag-and-drop slots.
- [ ] **OWN-016 (Shift Fill Monitor):** Real-time tracking of vacant shifts and broadcast alerts.
- [ ] **ST-006 (My Schedule):** Staff-facing personal calendar and availability selector.
- [ ] **ST-007 (Shift Response):** One-click shift acceptance from SMS/link.

### 💸 Sprint 5: Guest Financial Products & Multi-LocationHQ Controls
- **Goal:** Finish advanced financial and brand guardrail components.
- [ ] **OWN-026 (Financial Settings):** Configure catering deposit rules, interest parameters, or installment milestones.
- [ ] **ST-010 (Instant-Pay Request):** Let staff request early payouts of their processed earnings.
- [ ] **OWN-018 / OWN-019 (Franchise Control Center):** Multi-location scorecards and override approval queue.

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
- [ ] **GST-008 Catering booking & installment payments** (Placeholder)
- [ ] **GST-009 Guest preferences & right-to-be-forgotten** (Placeholder)

### 2. Owner Screens
- [x] **OWN-001 Home Dashboard** (Built)
- [x] **OWN-002 Guest List & Segments** (Built)
- [x] **OWN-003 Guest Profile details** (Built)
- [x] **OWN-004 Menu Category Editor** (Built)
- [x] **OWN-005 86 Board Page** (Built)
- [x] **OWN-011 Loyalty Dashboard** (Built)
- [x] **OWN-020 Revenue Recovery Report** (Built)
- [x] **OWN-021 Live Analytics & Trends** (Built)
- [x] **OWN-025 Inventory Stock Board** (Built)
- [ ] **OWN-006 Scheduled Menus & override approvals** (Placeholder)
- [ ] **OWN-007 Site & App Content Editor** (Placeholder)
- [ ] **OWN-008 Delivery boundary configurator** (Placeholder)
- [ ] **OWN-009 Campaign builder dashboard** (Placeholder)
- [ ] **OWN-010 Guest preference compliance / segment builder** (Placeholder)
- [ ] **OWN-012 Local SEO Autopilot connection** (Placeholder)
- [ ] **OWN-013 Reputation review aggregator** (Placeholder)
- [ ] **OWN-014 Driver fee & zone setup** (Placeholder)
- [ ] **OWN-015 Shift schedules planner** (Placeholder)
- [ ] **OWN-016 Open shifts fill monitor** (Placeholder)
- [ ] **OWN-017 Ops Natural-Language QA bot** (Placeholder)
- [ ] **OWN-018 National brand guidelines** (Placeholder)
- [ ] **OWN-019 HQ scorecard override queue** (Placeholder)
- [ ] **OWN-022 Onboarding milestone dashboard** (Placeholder)
- [ ] **OWN-023 Arbitrage price adjustment** (Placeholder)
- [ ] **OWN-024 Franchise Compliance Center** (Placeholder)
- [ ] **OWN-026 Guest Financial configurations** (Placeholder)
- [ ] **OWN-027 Vertical pack toggles** (Placeholder)
- [ ] **OWN-028 Autonomous promo scheduler** (Placeholder)
- [ ] **OWN-029 Staff recognition controls** (Placeholder)
- [ ] **OWN-030 Data export & export-PII tool** (Placeholder)

### 3. Staff Screens
- [x] **ST-002 86 Board Toggle** (Built)
- [x] **ST-003 Order Queue** (Built)
- [x] **ST-005 Delivery Dispatcher** (Built)
- [x] **ST-008 Inventory Count interface** (Built)
- [ ] **ST-001 Front-of-house guest lookup card** (Basic placeholder)
- [ ] **ST-004 Loyalty lookup at POS** (Placeholder)
- [ ] **ST-006 Availability calendar** (Placeholder)
- [ ] **ST-007 Shift request responder** (Placeholder)
- [ ] **ST-009 Performance metrics scorecard** (Placeholder)
- [ ] **ST-010 Instant pay out slip** (Placeholder)
- [ ] **ST-011 In-context onboarding tips** (Placeholder)

### 4. Delivery Partner Screens
- [x] **DRV-001 Accept-Reject delivery offer** (Built)
- [x] **DRV-002 Active route navigation** (Built)
- [x] **DRV-003 Delivered status selector** (Built)

### 5. Platform Admin Screens
- [ ] **ADM-001 Profile Merge Queue** (Placeholder)
- [ ] **ADM-002 GDPR erasure process console** (Placeholder)
- [ ] **ADM-003 Channel connection sync dashboard** (Placeholder)
- [ ] **ADM-004 SEO Listings partner directory** (Placeholder)
- [ ] **ADM-005 Financial compliance monitor** (Placeholder)
- [ ] **ADM-006 Franchise signup assistance workspace** (Placeholder)
- [ ] **ADM-007 Platform action audit logs** (Placeholder)
