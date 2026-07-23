# RestruRent Role Module Matrix

Access labels: `Full` = complete role-scoped access, `View` = view-only, `Scoped` = limited task access, `Approve` = approval/rejection authority, `Configure` = settings/template authority.

## Primary Roles And Sub-Roles

| Primary Role | Sub-Roles From Specification |
|---|---|
| Guest | Anonymous Guest; Authenticated Guest; Identified Guest |
| Restaurant Owner | Owner/GM; Marketing Manager; Franchise HQ / Regional Director; Franchisee; Franchise Location; Compliance Officer / Location GM where specified |
| Staff | Shift Manager; FOH / Kitchen Staff; Dispatcher; Kitchen / Inventory Staff; Staff Member; New Staff Member |
| Delivery Partner | Owned Driver; Gig-Network Driver |
| Platform Admin | Platform Admin; Migration/Onboarding Specialist |

## Module Access By Role/Sub-Role

| Role / Sub-Role | Accessible Modules | Access Level And Restrictions |
|---|---|---|
| Guest - Anonymous | Direct Ordering Site & Branded App | Scoped: browse live menu, item detail, cart, guest checkout, order status. No saved payment, loyalty, reorder, admin, configuration, or reporting. |
| Guest - Authenticated | Direct Ordering Site & Branded App; Loyalty & Rewards Builder; Guest Graph privacy/preferences | Scoped: own orders, addresses, saved payments, reorder, loyalty, notification preferences, privacy requests. Access limited to own data. |
| Guest - Identified | Loyalty & Rewards Builder | Scoped: redeem available rewards at checkout only after server-side balance validation. |
| Owner/GM | Global; Guest Graph; Master Menu & Channel Sync; Direct Ordering Site & Branded App; Campaign Studio; Loyalty & Rewards Builder; AI Website & Local SEO Autopilot; Reputation & Review Engine; Delivery & Fulfillment Management; AI Operations Copilot; Insights & Reporting; Onboarding & Micro-Training; Marketplace Arbitrage Alerts; Inventory Prediction; Guest Financial Products; Vertical Packs; Autonomous Promotion Engine; Staff Retention Layer; Migration Guarantee | Full single-location administrative access unless a screen states otherwise. Configuration rights for pricing, availability, delivery, payment, loyalty, inventory, financial products, recognition, exports. Approval rights for AI content, review replies, onboarding milestones, staff invite roles, campaign thresholds, autonomous budget ceiling. |
| Marketing Manager | Home Dashboard; Guest Graph; Direct Ordering content; Campaign Studio; SEO/Listings; Reviews; Insights marketing reports; Marketplace Arbitrage; Autonomous Promotion Engine | Scoped marketing access. Can view/segment/export guests, build segments, create/schedule/report campaigns, edit promo content and featured items, edit AI-suggested copy, draft/edit review replies. Cannot delete/merge guests, change payment/checkout settings, change core business info without owner approval, or access unrestricted financial details unless owner permits. |
| Franchise HQ / Regional Director | Home Dashboard; Guest Graph; Master Menu templates; Price Override Approvals; Campaign Studio national push; SEO guardrails; Review sentiment dashboard; Franchise Control Center; Insights & Reporting; Franchise Compliance Center; Loyalty national templates | Full multi-location visibility where specified. Configure guardrails/templates/price bands, push national campaigns/menu updates, approve/reject overrides, view aggregated/per-location guest data. Cannot delete individual location data without local approval; no review reply rights without delegated access. |
| Franchisee / Location Owner/GM | Master Menu within HQ bands; Brand Guardrails exceptions; Compliance status; Migration Guarantee within legal entity | Scoped location access. Can act freely inside HQ guardrails, request exceptions, view own compliance status, submit corrections/disputes. Cannot alter HQ policies or export another franchisee's data. |
| Compliance Officer / Location GM | Franchise Compliance Center | HQ/Compliance Officer has policy definition and violation review. Franchisee/Location GM can view own status, submit corrections, and request exceptions only. |
| Shift Manager | 86 Board; Order Queue; Schedule Draft/Availability; Shift-Fill Monitoring; Staff Recognition | Scoped operational authority during shift. Can toggle availability, view/adjust scheduling suggestions, publish schedules where specified, initiate/monitor shift-fill, approve recognition. Cannot change labor budget targets, pricing, financial configuration, marketing, or brand settings. |
| FOH / Kitchen Staff | Guest Lookup; 86 Board; Order Queue; Loyalty Redemption; Schedule & Availability; Shift-Fill Response | Task-scoped operational access. Guest data is view-only and PII-limited. Can toggle item availability and process orders. Cannot edit item content/pricing, merge/export/delete guests, or configure loyalty/program rules. |
| Dispatcher | Order Queue; Delivery Dispatcher Board | Scoped delivery operations. Can manually reassign drivers and override order status during service. Cannot configure zones, pricing, fulfillment partners, or admin/reporting. |
| Kitchen / Inventory Staff | Inventory On-Hand Count & Stockout Alerts; 86 Board where assigned | Scoped inventory operations. Can view predictions, enter counts, confirm/dismiss stockout warnings. Cannot configure supplier lead times or prediction sensitivity. |
| Staff Member | My Performance & Recognition; Instant-Pay Request | Scoped self-service. Can view own metrics and recognition history, request earned-wage disbursement. Cannot view coworkers' individual performance unless leaderboard is enabled. |
| New Staff Member | First-Login Micro-Training | Scoped contextual training only for newly accessible features. No exposure to unrelated/admin tutorials. |
| Owned Driver | Delivery & Fulfillment Management | Scoped write access only to accept/reject assigned delivery, view route, update delivery status. |
| Gig-Network Driver | Delivery & Fulfillment Management | Same as Owned Driver. Routing engine determines eligibility; no admin/reporting access. |
| Platform Admin | Guest Graph admin; Channel Sync Health; Listing/Review Platform Connections; Compliance & Financial Oversight; Audit Logs | Full technical/support access, always audit-logged. May correct data-quality issues and maintain shared infrastructure. Must not act on restaurant guest-facing content or brand settings without support ticket or owner-granted permission. |
| Migration/Onboarding Specialist | Onboarding & Micro-Training Layer | Scoped setup on owner's behalf during committed onboarding window. Actions are audit-logged. Go-live requires owner approval of menu, pricing, and payment milestones. |

## Canonical Configuration Rights

| Configuration Area | Canonical Owner | Delegated / Limited Rights |
|---|---|---|
| Master Menu item records | Owner/GM; Franchise HQ for national templates | Franchise locations edit only inside permitted bands; staff toggle availability only. |
| Pricing and price overrides | Owner/GM; Franchise HQ for bands/approval | Location overrides outside band require HQ approval. |
| Delivery zones, surge, fulfillment priority | Owner/GM | Dispatcher/FOH can manually reassign or override during service only. |
| Payment gateway and checkout rules | Owner/GM | Marketing Manager has no payment/checkout setting rights. |
| Campaign content and scheduling | Marketing Manager; Owner/GM | Owner approval required above configurable spend/discount threshold; HQ can national-push. |
| Loyalty program/rules/catalog | Owner/GM; Franchise HQ templates | Staff can redeem and limited manual adjust only inside owner-configured ceiling. |
| AI SEO/review/content publishing | Owner/GM | Marketing Manager can edit/draft; publishing or core business fields may require owner approval. |
| Inventory prediction configuration | Owner/GM | Kitchen staff can count and act on alerts only. |
| Financial products | Owner/GM; licensed financial partner compliance | Staff can request earned wages only after verification. |
| Franchise policies/guardrails | Franchise HQ / Compliance Officer | Franchisees request exceptions/corrections only. |
