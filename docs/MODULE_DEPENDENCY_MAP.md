# RestruRent Module Dependency Map

This map documents cross-module relationships from the functional specification. It is not an API design and does not create database tables.

## Canonical Sources Of Truth

| Source Of Truth | Owns | Used By |
|---|---|---|
| Master Menu | Items, categories, modifiers, item IDs, pricing, channel eligibility, scheduled menus, 86 status | Storefront/menu browse, cart, checkout, POS/order queue, marketplace sync, SEO content consistency, inventory prediction, franchise guardrails |
| Guest Graph | Unified guest profile, identifiers, tiers, consent, segments, merge/split state | Checkout identity, account/reorder, loyalty, campaigns, reviews, staff lookup, reporting, privacy/erasure |
| Unified Order Queue / Order Ledger | Orders, order status, items/modifiers, payment/order linkage, fulfillment state | Staff order queue, guest order tracking, delivery dispatch, loyalty accrual/redemption, revenue reporting, inventory prediction, recognition/performance |
| Loyalty Ledger | Earned points/visits/tiers, redemptions, adjustments, expiry | Guest loyalty, POS redemption, campaigns, refunds, guest profile, reporting |
| Unified Send Engine | All automated guest/staff messages, opt-in checks, quiet hours, frequency caps | Order status notifications, campaigns, review requests, arbitrage incentives, shift-fill, schedule notifications |
| Audit Log | Actor, role, timestamp, action, reason code, before/after values | Admin console, compliance, support, reversibility, Platform Admin oversight |
| Franchise Guardrails | Price bands, brand assets, promo templates, exceptions | Menu editor, scheduled price overrides, campaigns, SEO, compliance, vertical packs |
| Licensed Financial Partner | Installments, earned-wage access, financial reconciliation/disputes | Guest catering installments, staff instant pay, Platform Admin oversight |

## Major Cross-Module Flows

### Guest Checkout

Guest Checkout -> Master Menu availability/modifiers/pricing validation -> Delivery zone/fulfillment availability -> Payment authorization -> Unified Order Queue within 3 seconds -> Guest Graph profile match when authenticated -> Loyalty Ledger accrual/redemption -> Unified Send Engine confirmation -> Staff Order Queue -> Delivery Routing if delivery -> Reporting -> Inventory Prediction.

Failure rule: if payment authorization succeeds but order creation fails, reconciliation/refund runs automatically and the guest is not left uncertain.

### Storefront And Menu Availability

Master Menu -> Scheduled Menus -> Channel Sync -> Storefront/Menu Browse -> Cart validation -> Checkout validation.

86 Board updates -> Master Menu real-time availability field -> Direct website, branded app, kiosk, POS, marketplaces -> Active cart/order validation. Marketplace sync failures are queued/retried and surfaced to staff/owner without blocking other channels.

### Guest Graph And Identity

Checkout OTP / saved account / deterministic identifiers -> Guest Graph matching -> probabilistic matching only when deterministic match is unavailable -> auto-merge only above 85% confidence -> below threshold to Admin Guest Merge Review Queue.

Guest Graph -> Guest List/Segments -> Campaign Studio -> Loyalty targeting -> Reviews/campaign attribution -> Insights/GLV. Guest erasure requests -> Platform Admin processing -> anonymized PII while aggregate reporting is preserved.

### Loyalty

Owner Loyalty Configuration -> Loyalty Ledger rules/catalog -> Guest reward display -> Online redemption and POS redemption -> Server-side balance validation -> Order Ledger/refund handling -> Reporting.

Manual adjustments -> reason code -> threshold approval if configured -> audit log. Refunds claw back only unredeemed earned points.

### Campaigns, Notifications, And Arbitrage

Guest Graph segments -> Campaign Builder/Automation Library -> Unified Send Engine -> channel opt-in/quiet hours/frequency caps -> conversion attribution through Order Ledger -> Campaign reports and Revenue Recovery.

Abandoned cart -> Campaign automation. Marketplace arbitrage -> matched guest/order behavior -> incentive attempt cap -> suppression after three declined/non-converting attempts.

### SEO, Listings, And Reviews

Master Menu/location data -> AI Website & Local SEO Autopilot factual consistency check -> SEO Approval Queue -> listing platforms. Listing drift -> owner alert -> one-click fix or Platform Admin connection support.

Review platform connections -> Unified Review Feed -> sentiment/health-safety detection -> AI reply draft -> human approval -> platform reply or copy-ready fallback -> reporting/reputation summaries.

### Delivery And Fulfillment

Checkout delivery request -> Delivery Zone/Pricing/Partner Configuration -> routing engine evaluates owned driver, gig network, marketplace fulfillment -> Assigned Delivery offer -> Driver accept/reject -> Route/live tracking -> Guest Live Status and Dispatcher Board -> Delivery completion -> fulfillment cost/time reporting.

Stale driver status -> dispatcher alert -> reassignment eligibility -> guest tracker degrades to status-only if live location feed fails.

### Scheduling And Staff Operations

Historical demand/order data + labor budget + legal labor constraints -> Schedule Draft -> Owner/Shift Manager review -> Publish -> Staff Schedule notifications -> Staff availability updates -> future draft scheduling and shift-fill eligibility.

Call-out -> eligible/available/qualified staff broadcast -> Staff acceptance -> Shift-Fill Monitoring -> manager escalation if no response.

### Inventory Prediction

Order Ledger sell-through + Master Menu tracked items + Owner inventory configuration + Staff on-hand counts -> Prediction engine -> early warning alerts -> Staff confirm/dismiss with reason -> 86 Board suggested action -> Master Menu availability update.

Insufficient history or implausible model output is labeled/suppressed rather than shown as confident prediction.

### Franchise And Compliance

Franchise Guardrails -> Master Menu, campaigns, SEO, price bands, vertical packs -> local changes inside bands auto-apply -> out-of-band changes to approval queue -> HQ approve/reject -> audit/compliance summary.

Compliance policies -> scans against live state -> violation queue with evidence -> franchisee correction/dispute -> HQ review -> next scan clears confirmed correction.

### Reporting

Order Ledger + payment/fulfillment costs + campaign attribution + loyalty + reviews + staffing + sync health -> Revenue Recovery Report, Location Scorecards, GLV.

Reports must show data completeness disclaimers for outages and retain last successful report with timestamp if aggregation fails.

### Onboarding And Offboarding

Onboarding Specialist Console -> POS connection/menu import/site build -> Owner Milestone Checklist -> owner approval of menu, pricing, payment milestones -> go-live enablement -> Staff invites with assigned roles -> role-scoped micro-training.

Account offboarding -> proactive data export -> consent/erasure/legal-entity filtering -> secure download -> purge deadline reminders where applicable.

## Section-By-Section Degradation Rules

- Guest Profile sections degrade independently if loyalty/order data fails.
- Listing/review/channel sync failures do not blank entire screens.
- One marketplace sync failure does not block other channel syncs.
- Live map failure degrades to status-based tracking.
- Reporting aggregation failure retains the last successful report.
- Financial failures use partner reconciliation/dispute processes and never silently retry charges without visibility.
