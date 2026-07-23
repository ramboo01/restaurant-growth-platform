# RestruRent Screen Master List

Source of truth: RestruRent Role-Based Functional Specification v1.0. This file preserves the role and screen names from the specification and assigns internal screen codes for planning only.

Screen type legend: `page`, `modal`, `detail`, `operational`, `shared`.

## Guest Screens

| Code | Screen Name | Primary Role | Applicable Sub-Roles | Module | Entry Point | Suggested Frontend Route | Type | Shared / Cross-Reference |
|---|---|---|---|---|---|---|---|---|
| GST-001 | Storefront / Menu Browse | Guest | Anonymous or authenticated | Direct Ordering Site & Branded App | Direct URL, Google/organic search, app icon, QR code, reorder shortcut | `/r/:restaurantSlug/menu` | page | Opens GST-002 |
| GST-002 | Item Detail & Modifiers | Guest | Guest | Direct Ordering Site & Branded App | Tapping an item card | `/r/:restaurantSlug/menu/items/:itemId` | modal | Opened from GST-001 |
| GST-003 | Cart | Guest | Guest | Direct Ordering Site & Branded App | Persistent cart icon or after first item | `/r/:restaurantSlug/cart` | page | Validates against Master Menu/86 |
| GST-004 | Checkout | Guest | Guest | Direct Ordering Site & Branded App | Tapping Checkout from Cart | `/r/:restaurantSlug/checkout` | page | Routes catering/group order to GST-008 |
| GST-005 | Order Confirmation & Live Status | Guest | Guest | Direct Ordering Site & Branded App; Delivery & Fulfillment Management | After successful checkout; Account -> Orders | `/orders/:orderId/status` | page | Uses delivery status from ST-005 and DRV-002/003 |
| GST-006 | Account - Order History & Reorder | Guest | Authenticated only | Direct Ordering Site & Branded App | Account navigation | `/account/orders` | page | Reorder restores GST-003/GST-004 |
| GST-007 | Loyalty Balance & Reward Redemption | Guest | Authenticated / identified | Loyalty & Rewards Builder | Account -> Loyalty or checkout reward banner | `/account/loyalty` | page | Shared ledger with ST-004 |
| GST-008 | Catering Booking & Installment Payment | Guest | Guest | Guest Financial Products; Direct Ordering Site & Branded App | Large catering/group order route | `/r/:restaurantSlug/catering` | page | Depends on OWN-026 financial configuration |
| GST-009 | Notification Preferences & Privacy Requests | Guest | Guest | Guest Graph; Campaign Studio | Account settings/privacy | `/account/preferences` | page | Triggers erasure processing in ADM-002 |

## Restaurant Owner Screens

| Code | Screen Name | Primary Role | Applicable Sub-Roles | Module | Entry Point | Suggested Frontend Route | Type | Shared / Cross-Reference |
|---|---|---|---|---|---|---|---|---|
| OWN-001 | Home Dashboard | Restaurant Owner | Owner/GM; Marketing Manager; Franchise HQ | Global | Default screen on login | `/owner/dashboard` | page | Attention items across modules |
| OWN-002 | Guest List & Segments | Restaurant Owner | Owner/GM; Marketing Manager; Franchise HQ | Guest Graph | Guests tab | `/owner/guests` | page | Opens OWN-003 |
| OWN-003 | Guest Profile & Merge Review | Restaurant Owner | Owner/GM; Franchise HQ | Guest Graph | Guest List or guest deep link | `/owner/guests/:guestId` | detail | Admin merge queue is ADM-001 |
| OWN-004 | Menu Editor | Restaurant Owner | Owner/GM; Franchise HQ; Franchise Location | Master Menu & Channel Sync | Menu navigation | `/owner/menu` | page | Source of truth for GST-001, ST-002 |
| OWN-005 | 86 Board (Owner/Manager View) | Restaurant Owner | Owner/GM; Shift Manager | Master Menu & Channel Sync | Persistent 86 Board control | `/owner/86-board` | shared | Same operational behavior as ST-002 |
| OWN-006 | Scheduled Menus & Price-Override Approvals | Restaurant Owner | Owner/GM; Franchise HQ | Master Menu & Channel Sync | Scheduled Menu Builder; HQ approval queue | `/owner/menu/schedules` | page | Price overrides feed OWN-018/019 |
| OWN-007 | Site / App Content Editor | Restaurant Owner | Owner/GM; Marketing Manager | Direct Ordering Site & Branded App | Site/App admin navigation | `/owner/site-app` | page | Publishes to guest storefront |
| OWN-008 | Checkout, Delivery Zone & Payment Configuration | Restaurant Owner | Owner/GM only | Direct Ordering Site & Branded App; Delivery & Fulfillment Management | Checkout/delivery/payment settings | `/owner/checkout-settings` | page | Governs GST-004 and ST-005 |
| OWN-009 | Campaign Builder & Automation Library | Restaurant Owner | Marketing Manager; Owner/GM; Franchise HQ | Campaign Studio | Campaign Studio navigation | `/owner/campaigns` | page | Uses OWN-002/010 segments |
| OWN-010 | Segment Builder & Guest Preference Compliance | Restaurant Owner | Marketing Manager; Owner/GM | Campaign Studio | Campaign Studio segment/compliance area | `/owner/campaigns/segments` | page | Uses GST-009 opt-outs |
| OWN-011 | Loyalty Program Configuration & Reward Catalog | Restaurant Owner | Owner/GM; Franchise HQ | Loyalty & Rewards Builder | Loyalty settings | `/owner/loyalty` | page | Governs GST-007 and ST-004 |
| OWN-012 | SEO Approval Queue & Listing Sync | Restaurant Owner | Owner/GM; Marketing Manager; Franchise HQ guardrails | AI Website & Local SEO Autopilot | SEO/Listings approval queue | `/owner/seo-listings` | page | Platform infrastructure in ADM-004 |
| OWN-013 | Unified Review Feed & Reply Approval | Restaurant Owner | Owner/GM; Marketing Manager; Franchise HQ | Reputation & Review Engine | Reviews navigation | `/owner/reviews` | page | AI replies require approval |
| OWN-014 | Delivery Zone, Pricing & Dispatcher Configuration | Restaurant Owner | Owner/GM only | Delivery & Fulfillment Management | Delivery settings | `/owner/delivery-settings` | page | Operational board is ST-005 |
| OWN-015 | Schedule Draft, Review & Publish | Restaurant Owner | Owner/GM; Shift Manager | AI Operations Copilot | Scheduling cycle | `/owner/scheduling` | page | Staff schedule view is ST-006 |
| OWN-016 | Shift-Fill Monitoring | Restaurant Owner | Owner/GM; Shift Manager | AI Operations Copilot | Shift-fill monitor | `/owner/shift-fill` | operational | Staff response is ST-007 |
| OWN-017 | Natural-Language Ops Q&A | Restaurant Owner | Owner/GM | AI Operations Copilot | Q&A chat interface | `/owner/ops-qa` | page | Synthesizes reporting/operations data |
| OWN-018 | Brand Guardrails & National Push | Restaurant Owner | Franchise HQ / Regional Director; Location Owner/GM; Franchisee | Multi-Location & Franchise Control Center | Franchise control center | `/owner/franchise/guardrails` | page | Drives override rules for OWN-006/019/024 |
| OWN-019 | Location Scorecard & Override Approval Queue | Restaurant Owner | Franchise HQ / Regional Director | Multi-Location & Franchise Control Center | Franchise scorecard/approval queue | `/owner/franchise/scorecards` | page | Approves out-of-band overrides |
| OWN-020 | Revenue Recovery Report & Digest | Restaurant Owner | Owner/GM; Franchise HQ | Insights & Reporting | Reporting dashboard; pushed digest | `/owner/reports/revenue-recovery` | page | Reconciles to order ledger |
| OWN-021 | Location Scorecards & Guest Lifetime Value | Restaurant Owner | Owner/GM; Marketing Manager; Franchise HQ | Insights & Reporting | Reporting area | `/owner/reports/location-scorecards` | page | Marketing financial detail may be restricted |
| OWN-022 | Onboarding Milestone Checklist & Staff Invite | Restaurant Owner | Owner/GM | Onboarding & Micro-Training Layer | Onboarding checklist; staff invite | `/owner/onboarding` | page | Admin setup in ADM-006 |
| OWN-023 | Arbitrage Automation Configuration | Restaurant Owner | Owner/GM; Marketing Manager | Marketplace Arbitrage Alerts | Arbitrage automation settings | `/owner/arbitrage` | page | Uses Campaign Studio and Guest Graph |
| OWN-024 | Compliance Policy & Violation Queue | Restaurant Owner | Franchise HQ / Compliance Officer; Franchisee / Location GM | Franchise Compliance Center | Compliance center | `/owner/franchise/compliance` | page | Related admin oversight ADM-005 |
| OWN-025 | Inventory Configuration & Prediction Dashboard | Restaurant Owner | Owner/GM | Unified 86 & Inventory Prediction Engine | Inventory settings/dashboard | `/owner/inventory` | page | Staff count screen is ST-008 |
| OWN-026 | Guest Financial Products Configuration | Restaurant Owner | Owner/GM | Guest Financial Products | Financial products settings | `/owner/financial-products` | page | Governs GST-008 and ST-010 |
| OWN-027 | Vertical Pack Selection | Restaurant Owner | Owner/GM | Vertical Packs | Vertical pack settings | `/owner/vertical-packs` | page | Applies defaults across modules |
| OWN-028 | Autonomous Promotion Goal Setup & Monitoring | Restaurant Owner | Owner/GM; Marketing Manager | Autonomous Promotion Engine | Promotion engine settings | `/owner/promotions/autonomous` | page | Uses Campaign Studio/Loyalty |
| OWN-029 | Recognition Configuration | Restaurant Owner | Owner/GM | Staff Retention Layer | Recognition settings | `/owner/recognition` | page | Staff view is ST-009 |
| OWN-030 | Data Export & Account Offboarding | Restaurant Owner | Owner/GM | Migration Guarantee | Account Settings -> Export My Data | `/owner/account/export` | page | Export respects privacy/erasure |

## Staff Screens

| Code | Screen Name | Primary Role | Applicable Sub-Roles | Module | Entry Point | Suggested Frontend Route | Type | Shared / Cross-Reference |
|---|---|---|---|---|---|---|---|---|
| ST-001 | Guest Lookup | Staff | FOH / Kitchen Staff | Guest Graph | Persistent lookup control | `/staff/guest-lookup` | operational | View-only subset of OWN-003 |
| ST-002 | 86 Board | Staff | Shift Manager; FOH / Kitchen Staff | Master Menu & Channel Sync | Persistent 86 button | `/staff/86-board` | shared | Same toggle behavior as OWN-005 |
| ST-003 | Order Queue | Staff | FOH / Kitchen Staff; Shift Manager; Dispatcher | Direct Ordering Site & Branded App; Delivery & Fulfillment Management | Primary operational screen | `/staff/orders` | operational | Receives GST-004 orders |
| ST-004 | Loyalty Redemption at POS | Staff | FOH Staff | Loyalty & Rewards Builder | Checkout/POS flow | `/staff/loyalty-redemption` | operational | Same ledger as GST-007 |
| ST-005 | Delivery Dispatcher Board | Staff | Dispatcher; FOH Staff | Delivery & Fulfillment Management | Order delivery pill or dispatcher view | `/staff/delivery-dispatch` | operational | Configured by OWN-014 |
| ST-006 | My Schedule & Availability | Staff | FOH / Kitchen Staff; Shift Manager | AI Operations Copilot | Staff app Schedule tab | `/staff/schedule` | page | Published by OWN-015 |
| ST-007 | Shift-Fill Request Response | Staff | FOH / Kitchen Staff | AI Operations Copilot | Push/SMS/WhatsApp broadcast | `/staff/shift-fill/:requestId` | operational | Monitored in OWN-016 |
| ST-008 | Inventory On-Hand Count & Stockout Alerts | Staff | Kitchen / Inventory Staff | Unified 86 & Inventory Prediction Engine | Count entry screen; alerts | `/staff/inventory-counts` | operational | Configured by OWN-025 |
| ST-009 | My Performance & Recognition | Staff | Staff Member; Shift Manager | Staff Retention Layer | Staff app Recognition tab | `/staff/recognition` | page | Configured by OWN-029 |
| ST-010 | Instant-Pay Request | Staff | Staff Member | Guest Financial Products | Earnings view | `/staff/instant-pay` | page | Configured by OWN-026 |
| ST-011 | First-Login Micro-Training | Staff | New Staff Member, any Staff sub-role | Onboarding & Micro-Training Layer | First encounter with a feature | `/staff/training/contextual` | modal | Role-scoped overlay on accessible screens |

## Delivery Partner Screens

| Code | Screen Name | Primary Role | Applicable Sub-Roles | Module | Entry Point | Suggested Frontend Route | Type | Shared / Cross-Reference |
|---|---|---|---|---|---|---|---|---|
| DRV-001 | Assigned Delivery / Accept-Reject | Delivery Partner | Owned Driver; Gig-Network Driver | Delivery & Fulfillment Management | Push notification from routing engine | `/driver/deliveries/:deliveryId/offer` | operational | Feeds ST-005 |
| DRV-002 | Route & Live Tracking | Delivery Partner | Delivery Driver | Delivery & Fulfillment Management | Automatically after acceptance | `/driver/deliveries/:deliveryId/route` | operational | Powers GST-005 live tracking |
| DRV-003 | Delivery Status Updates | Delivery Partner | Delivery Driver | Delivery & Fulfillment Management | Active delivery status controls | `/driver/deliveries/:deliveryId/status` | operational | Updates GST-005 and ST-005 |

## Platform Admin Screens

| Code | Screen Name | Primary Role | Applicable Sub-Roles | Module | Entry Point | Suggested Frontend Route | Type | Shared / Cross-Reference |
|---|---|---|---|---|---|---|---|---|
| ADM-001 | Guest Merge Review Queue | Platform Admin | Platform Admin | Guest Graph | Dedicated admin queue populated nightly | `/admin/guest-merge-review` | operational | Related to OWN-003 merge review |
| ADM-002 | Manual Profile Correction & Right-to-be-Forgotten Processing | Platform Admin | Platform Admin | Guest Graph | Support-ticket-driven admin console | `/admin/guest-profile-corrections` | detail | Processes GST-009 requests |
| ADM-003 | Channel Sync Health & Circuit-Breaker Monitoring | Platform Admin | Platform Admin | Master Menu & Channel Sync; AI Website & Local SEO Autopilot | Admin infrastructure dashboard | `/admin/channel-sync-health` | operational | Supports OWN-004/012 |
| ADM-004 | Listing & Review-Platform Connection Management | Platform Admin | Platform Admin | AI Website & Local SEO Autopilot; Reputation & Review Engine | Admin infrastructure dashboard | `/admin/platform-connections` | operational | Supports OWN-012/013 |
| ADM-005 | Compliance & Financial-Partner Oversight | Platform Admin | Platform Admin | Guest Financial Products; Franchise Compliance Center; Campaign Studio | Admin oversight console | `/admin/compliance-financial-oversight` | page | Supports OWN-024/026 |
| ADM-006 | Onboarding Specialist Console | Platform Admin | Migration/Onboarding Specialist | Onboarding & Micro-Training Layer | Admin onboarding project console | `/admin/onboarding-projects` | operational | Supports OWN-022 |
| ADM-007 | Audit Log & Support Access Console | Platform Admin | Platform Admin | Platform-wide | Admin console | `/admin/audit-log` | page | Audit source for all privileged actions |

## Verification Counts

| Primary Role | Screen Count |
|---|---:|
| Guest | 9 |
| Restaurant Owner | 30 |
| Staff | 11 |
| Delivery Partner | 3 |
| Platform Admin | 7 |
| Total | 60 |

## Shared Screens And Cross-References

- `OWN-005` and `ST-002` are the same 86 Board behavior with different surrounding permissions.
- `GST-005`, `ST-005`, `DRV-002`, and `DRV-003` share delivery status/tracking state.
- `GST-007` and `ST-004` share the single loyalty ledger governed by `OWN-011`.
- `GST-009` privacy requests are fulfilled through `ADM-002`.
- `OWN-022` onboarding approvals are supported by `ADM-006`.
- `OWN-014` configures the operational delivery permissions used by `ST-005`.
- `OWN-025` configures prediction behavior acted on by `ST-008`.
