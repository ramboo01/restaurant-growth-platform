  
**RESTAURANT GROWTH PLATFORM**

**Role-Based Functional Specification**

**Guest · Restaurant Owner · Staff · Delivery Partner · Platform Admin**

Prepared for: Development Team  
Document Type: Functional Specification (page-by-page / screen-by-screen)  
Version 1.0 — Derived from Product Discovery, PRD, UX Documentation, Architecture and Development Blueprint sources

# **0\. How to Read This Document**

This specification tells developers what to build, organized by who uses it rather than by internal module. Every screen a role can reach is documented once, in one place, with the functionality on that screen, the actions the role can take, the business rules that govern it, the validations that must be enforced, and the system behavior — including edge cases and error handling — that must result.

This document intentionally excludes system architecture, technology choices, coding standards, API contracts, database schemas, and business/market strategy. Where a screen is shared functionality between two roles (for example, the 86 Board used by both Staff and the Owner/GM), it is documented in full once and cross-referenced from the other role's section rather than repeated.

Section 1 defines the role model, including sub-roles. Section 2 states rules that apply across every role and every screen, so they are not repeated on each individual screen entry. Sections 3–7 document each role's screens in the order a user would typically encounter them.

# **1\. Role Model**

This specification documents functionality for five primary roles. Two roles — Restaurant Owner and Staff — contain internal sub-roles that share the same screens but differ in permission level. Every screen entry below states which sub-role(s) it applies to and any permission differences between them.

| Role | Sub-Roles Covered | Definition & Scope |
| :---- | :---- | :---- |
| Guest | — | The end consumer ordering from or interacting with a restaurant, across web, branded app, kiosk, or marketplace. Access is limited to their own data and orders. |
| Restaurant Owner | Owner/GM · Marketing Manager · Franchise HQ / Regional Director · Franchisee | The business-management side of the platform. Owner/GM is the primary account holder for a single location and holds full administrative rights within that location. Marketing Manager is a delegated, marketing-scoped sub-role. Franchise HQ/Regional Director and Franchisee are multi-location sub-roles that apply only to brands with more than one location; where a screen behaves differently for them, this is called out explicitly. |
| Staff | Shift Manager · FOH / Kitchen Staff · Dispatcher · Kitchen / Inventory Staff · New Staff Member | Hourly, task-scoped employees at a single location. Shift Manager holds delegated operational authority during a shift but is not the account owner. All other Staff sub-roles are further scoped to the specific task surface named (front-of-house lookup, 86 board, dispatch, inventory counts). |
| Delivery Partner | Owned Driver · Gig-Network Driver | An individual fulfilling a delivery order, whether directly employed/contracted by the restaurant ("owned") or sourced through a connected gig delivery network. Screens are identical for both; the routing engine decides which pool a delivery is offered to. |
| Platform Admin | — | Internal platform support/engineering staff. Full technical access for support and data-quality operations, always audit-logged. Platform Admin never acts on guest-facing content without an explicit support ticket or an existing owner-configured permission. |

# **2\. Cross-Role Global Rules**

The following rules apply platform-wide, across every role and screen documented in this specification. They are stated once here to avoid repetition and must be treated as implicit requirements on every screen below unless a screen explicitly overrides one.

### **Identity & Guest Matching**

* A guest is matched deterministically first (verified phone number or verified email, normalized to E.164 for phone), then probabilistically (card hash \+ name \+ device fingerprint) only when no deterministic identifier exists.

* Auto-merge of two guest profiles requires a minimum 85% match confidence score. Below that threshold, the match is queued for manual review and is never auto-merged.

* Every merge/split is reversible for 30 days and requires a reason code from the actor performing it.

### **Notifications & Messaging**

* Quiet hours (default 9:00 PM–8:00 AM guest local time) are enforced on all guest-facing marketing sends unless the guest has explicitly opted into time-sensitive alerts (e.g., order status, delivery tracking).

* Frequency capping is enforced at the individual-guest level across all campaigns and automations, not per campaign, to prevent cumulative over-messaging.

* Channel opt-out is per-channel, not global, unless the guest explicitly opts out of all channels. A guest who opts out of SMS continues to receive email/WhatsApp if they remain opted in to those.

* Every automated guest message (order status, campaign, review request, arbitrage incentive) must resolve to a single unified send engine so frequency caps and quiet hours are enforced consistently regardless of which module triggered the send.

### **Approval & Reversibility**

* No AI-generated guest-facing content (review replies, SEO pages, site copy, campaign copy) is ever auto-published without explicit human approval, unless the owner has explicitly enabled an auto-publish setting for a defined low-risk category.

* Every configuration change that could affect guest-facing pricing, availability, or brand compliance is logged with actor, timestamp, and reason where applicable, and is reversible unless explicitly stated otherwise.

* Franchise/location-level overrides that fall within an HQ-permitted band apply immediately; overrides outside the band always enter a Pending Approval state and are never live until approved.

### **Error Handling & Degradation**

* A failure in one dependency (a single marketplace sync, a single review platform, a single data section of a profile) must never block or blank out the rest of a screen. Each screen degrades section-by-section, not as a whole.

* Financial and payment operations never leave a guest or staff member uncertain whether a charge or disbursement occurred. Any downstream failure after a successful payment authorization triggers automatic reconciliation, and a refund if needed, without requiring the guest to notice or report it.

* Retryable failures (sync jobs, message sends, webhook deliveries) use exponential backoff; persistent failures beyond a defined threshold escalate to an alert rather than retrying indefinitely (a circuit breaker disables retries to a channel that has failed more than N consecutive times).

### **Data Privacy & Compliance**

* A guest's right-to-be-forgotten (erasure) request anonymizes PII within 30 days while preserving aggregate reporting figures; any active loyalty balance must be settled or explicitly forfeited before anonymization completes.

* Front-of-house and kitchen staff have view-only, task-scoped access to guest data (name, tier, allergy flags, last order) and cannot see full PII (card data, complete order history) unless explicitly role-elevated by the owner.

* Individual staff performance data is never visible to other non-management staff unless the owner has explicitly enabled a team leaderboard; by default staff see only their own metrics.

# **3\. Guest**

*End-consumer role — ordering and account screens only.*

The Guest role covers every screen an end consumer touches when ordering from or interacting with a restaurant directly (web storefront, branded app, or kiosk). Guests never see any admin, configuration, or reporting screen. Every guest-facing screen must work identically for a guest who checks out anonymously and one who authenticates, except where explicitly noted (e.g., saved payment methods, reorder, loyalty).

## **1\. Storefront / Menu Browse**

**Module:** *Direct Ordering Site & Branded App*    **Applies to:** *Guest (anonymous or authenticated)*

Let the guest browse the restaurant's live, Master-Menu-driven catalog and add items to a cart, on web, branded app, or kiosk.

**Entry Point:**  Direct URL, Google/organic search result, saved app icon, QR code at table, or reorder shortcut from Account.

**DATA DISPLAYED**

* Category list with item cards (photo, name, price)

* Real-time item availability (86'd items are hidden/greyed, not just visually struck through)

* Channel-appropriate menu (e.g., delivery-only items hidden if the guest has selected pickup)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest scrolls/taps a category | Category's items render inline without a full page reload; scroll position is preserved when returning from an item detail view. |
| Guest taps an item | Item Detail view opens as an in-place modal (see Screen 2), not a full page navigation. |
| Guest switches order type (pickup / delivery / scheduled) | Menu re-filters to only items available for that channel/time; cart contents are re-validated against the new selection. |

**BUSINESS RULES**

* The menu shown is always read from the Master Menu's current state for the guest's selected channel — never a cached or stale copy.

* An item is only shown as orderable on a channel it has been explicitly synced to; it is never possible for a channel to display an item it has never been connected to (prevents phantom listings).

* Scheduled menus (e.g., breakfast/lunch/dinner) activate and deactivate automatically at their configured time boundary with no manual guest action required.

**VALIDATION RULES**

* Ordering outside business hours or outside the delivery radius is blocked before menu browsing proceeds to checkout, with a clear reason shown and the nearest valid alternative offered (e.g., "schedule for opening time").

**EDGE CASES & ERROR HANDLING**

* An item is 86'd while the guest is actively browsing: the item card updates or disappears without requiring a manual refresh.

* Guest is on a kiosk (shared/public device): the session auto-expires after a short idle period to prevent the next guest from continuing a stranger's session.

## **2\. Item Detail & Modifiers**

**Module:** *Direct Ordering Site & Branded App*    **Applies to:** *Guest*

Let the guest configure an item (size, modifiers, special instructions) and add it to the cart without losing their place in the menu.

**Entry Point:**  Tapping an item card from the Storefront/Menu Browse screen.

**DATA DISPLAYED**

* Item name, description, photo, price

* Modifier groups with min/max selectable options

* Allergen tags (if configured)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest selects modifiers | Running price updates live as selections change. |
| Guest taps "Add to Cart" | Item is added; the cart icon/count updates in place; the modal closes back to the menu (no forced navigation to the cart). |

**BUSINESS RULES**

* A modifier group's selection is only submittable once the guest has satisfied its configured minimum and not exceeded its configured maximum; a modifier group can never be configured such that its maximum is below its minimum (this is enforced at menu-editor level, not guessed here).

**VALIDATION RULES**

* "Add to Cart" is disabled until every required modifier group has a valid selection.

**EDGE CASES & ERROR HANDLING**

* The item becomes 86'd while its detail view is open: the guest is shown an "item just became unavailable" message and "Add to Cart" is disabled, rather than allowing an add that will fail at checkout.

## **3\. Cart**

**Module:** *Direct Ordering Site & Branded App*    **Applies to:** *Guest*

Let the guest review, edit, and be upsold on their selections before proceeding to checkout.

**Entry Point:**  Tapping the persistent cart icon, or automatically after adding the first item on some layouts.

**DATA DISPLAYED**

* Line items with quantity, modifiers, and price (inline-editable)

* Subtotal (tax/delivery fee shown at checkout, not hidden until then)

* Upsell/cross-sell suggestions generated from frequently-ordered-together item-pairing data

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest adjusts quantity or removes an item | Subtotal and upsell suggestions recalculate immediately. |
| Guest taps an upsell suggestion | Item is added to cart in place; suggestion list updates. |
| Guest taps "Checkout" | Cart state is validated (availability, delivery zone, minimum order value) before advancing to Checkout. |

**BUSINESS RULES**

* Upsell/cross-sell suggestions are only ever shown at cart and pre-checkout — never after payment is submitted.

* Cart state is preserved for a configurable window if the guest leaves without checking out (feeds the abandoned-cart recovery automation in Campaign Studio).

**VALIDATION RULES**

* A minimum order value for delivery, if configured, is enforced and clearly messaged at the cart level — not deferred to a payment-failure surprise at checkout.

**EDGE CASES & ERROR HANDLING**

* An item in the cart is 86'd before checkout: it is automatically removed and the guest is clearly informed of the removal and the recalculated total before they proceed to payment.

## **4\. Checkout**

**Module:** *Direct Ordering Site & Branded App*    **Applies to:** *Guest*

Capture identity (or allow guest checkout), delivery/pickup details, and payment in a single continuous flow, then submit the order.

**Entry Point:**  Tapping "Checkout" from the Cart.

**DATA DISPLAYED**

* Single scrolling flow: identity/auth → address & time → payment → order review (progressive disclosure, not a multi-step wizard)

* Delivery fee (itemized, never silently altered after guest confirms)

* Order type: pickup, delivery, scheduled/future order, or catering/group order

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest authenticates via phone/email OTP, or continues as guest | OTP authentication simultaneously creates or matches a Guest Graph profile; guest checkout does not. |
| Guest selects pickup, delivery, or a future scheduled time | Available time slots are computed from location hours, current load, and (for delivery) fulfillment-option availability. |
| Guest enters or selects a saved payment method and confirms | Payment is authorized before the order is created; on success, an order is created in the Unified Order Queue within 3 seconds and a confirmation is shown. |

**BUSINESS RULES**

* A scheduled order must respect a minimum lead time configured per location (e.g., 2 hours for catering).

* A large catering/group order routes to a dedicated catering form (headcount, delivery window, deposit requirement) instead of the standard cart/checkout, and can offer an installment payment plan (see Screen 8).

* Every page in the storefront, including checkout, is server-rendered with schema.org markup; this has no guest-visible behavior but must not be broken by checkout customizations.

**VALIDATION RULES**

* Delivery address must fall within a configured delivery radius/zone before checkout can proceed to payment.

* Guest phone/email used for OTP must pass basic format and disposable-domain checks.

* An order cannot proceed to payment if no fulfillment option (owned driver, gig network, or marketplace-fulfilled) is available for the requested address and time; the guest is offered pickup or a scheduled delivery slot instead.

**EDGE CASES & ERROR HANDLING**

* Payment authorization succeeds but order creation fails downstream (e.g., a queue-service outage): the guest is never charged without a confirmed order; an automatic reconciliation job refunds any orphaned charge within minutes.

* Payment gateway failure: the guest sees a clear, guest-friendly retry message and is never left uncertain whether they were charged.

## **5\. Order Confirmation & Live Status**

**Module:** *Direct Ordering Site & Branded App · Delivery & Fulfillment Management*    **Applies to:** *Guest*

Confirm the order was placed and give the guest a single, consistent live-status view regardless of which fulfillment option (owned driver, gig network, marketplace) is handling it.

**Entry Point:**  Automatically shown immediately after successful checkout; also reachable from Account → Orders at any time while the order is active.

**DATA DISPLAYED**

* Estimated ready/delivery time

* Live status steps (received → preparing → ready/out for delivery → completed)

* Live map/driver tracking for delivery orders where available

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest opens the confirmation/tracking screen at any point | Status reflects the current state in real time; no manual refresh required. |

**BUSINESS RULES**

* The guest sees one consistent tracking experience no matter which fulfillment option was actually used behind the scenes.

**EDGE CASES & ERROR HANDLING**

* The live driver-tracking data feed fails: the tracker degrades gracefully to a status-based (not live-map) view rather than showing a broken or frozen map.

**NOTIFICATIONS**

* Order confirmation, order-ready/completed, and refund-confirmation emails to the guest.

* Live delivery status updates and, for opted-in guests, WhatsApp order confirmation and tracking (particularly used in UK/Australia/Canada markets).

## **6\. Account — Order History & Reorder**

**Module:** *Direct Ordering Site & Branded App*    **Applies to:** *Guest (authenticated only)*

Let a returning, authenticated guest view past orders and re-order with minimal friction.

**Entry Point:**  Account tab/section of the persistent navigation.

**DATA DISPLAYED**

* Past orders with items, date, and total

* Saved payment methods and addresses

* Notification preferences

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest taps "Reorder" on a past order | The entire past cart is restored instantly and the guest is dropped directly at Checkout, skipping menu browsing entirely. |
| Guest manages saved payment methods/addresses | Changes are available immediately on the next checkout; no admin approval required. |

**BUSINESS RULES**

* A guest's order history and reorder shortcut are unified across every location of the same brand they have ordered from — not siloed per location.

**EDGE CASES & ERROR HANDLING**

* A reordered cart includes an item that has since been 86'd or discontinued: it is removed from the restored cart with a clear message, exactly as in the live Cart screen.

## **7\. Loyalty Balance & Reward Redemption**

**Module:** *Loyalty & Rewards Builder*    **Applies to:** *Guest (authenticated / identified)*

Show the guest their current points/visit/tier balance and let them redeem an available reward at online checkout.

**Entry Point:**  Account → Loyalty, or a reward banner surfaced at checkout when a reward is available.

**DATA DISPLAYED**

* Current balance and progress to next reward/tier

* Reward catalog with point cost

* Points expiry date, if applicable

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest redeems an available reward at checkout | Balance is deducted in real time and the deduction is enforced server-side, not just reflected client-side — the same redemption can never be applied twice across channels (e.g., online and then again at the POS). |

**BUSINESS RULES**

* A single loyalty ledger per guest accrues and redeems identically whether the order is placed online, in the app, or in-store at the POS.

* For a multi-location brand, the guest sees only the reward catalog valid at the location they are currently ordering from, since local catalogs can differ.

* Loyalty balances are portable across all locations of the same brand by default, unless the brand's Franchise HQ has restricted redemption to a single location.

**VALIDATION RULES**

* A reward cannot be redeemed if the guest's balance is below its point cost at the moment of redemption — this is a server-side check even if the client UI appeared to allow it.

**EDGE CASES & ERROR HANDLING**

* A redeemed reward's underlying item is 86'd before the order completes: the guest is offered an equivalent-value substitute, or their points are refunded — the reward is never silently dropped.

**NOTIFICATIONS**

* Real-time balance-update notification after every qualifying transaction.

* Reward-unlocked email and, for opted-in guests, WhatsApp notification.

* Points-about-to-expire reminder email ahead of expiry.

## **8\. Catering Booking & Installment Payment**

**Module:** *Direct Ordering Site & Branded App · Guest Financial Products*    **Applies to:** *Guest / Corporate Buyer*

Let a guest booking a large catering order pay a deposit at booking and complete the remaining balance on a scheduled installment plan rather than paying the full amount upfront.

**Entry Point:**  Catering-specific form, reached from a dedicated catering entry point (not the standard cart).

**DATA DISPLAYED**

* Headcount, delivery/pickup window, total order value

* Deposit amount and remaining installment schedule (dates and amounts)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest selects an installment plan and pays the deposit | Booking is confirmed immediately; a payment schedule is generated and communicated to the guest. |
| Scheduled installment date arrives | System automatically charges the saved payment method and confirms via notification; no guest action is required unless the charge fails. |

**BUSINESS RULES**

* A catering booking is not considered confirmed until the owner-configured minimum deposit percentage has been paid.

* Financial products are opt-in per restaurant and require the guest's explicit acceptance of terms; the platform integrates with a licensed financial partner rather than acting as the lender itself.

**EDGE CASES & ERROR HANDLING**

* A scheduled installment payment fails (e.g., expired card): the system retries with guest notification and a grace period before flagging the booking at-risk to the owner, rather than cancelling immediately.

**NOTIFICATIONS**

* Installment schedule confirmation email; upcoming-payment reminder email and, for opted-in guests, WhatsApp reminder ahead of each scheduled charge.

## **9\. Notification Preferences & Privacy Requests**

**Module:** *Campaign Studio · Guest Graph · Marketplace Arbitrage Alerts*    **Applies to:** *Guest (authenticated / identified)*

Give the guest self-service control over what marketing they receive and the ability to request deletion of their data, without needing to contact the restaurant.

**Entry Point:**  Account → Notifications/Privacy, or an unsubscribe/opt-out link included in any marketing message.

**DATA DISPLAYED**

* Per-channel opt-in status (email, SMS, WhatsApp, push)

* A specific opt-out toggle for the "order direct and save" incentive automation, independent of general marketing opt-in

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Guest opts out of a specific channel | That channel stops receiving sends for the guest while other opted-in channels continue unaffected. |
| Guest opts out of the direct-order incentive automation specifically | No further arbitrage/incentive messages are sent to that guest, independent of their other campaign opt-ins. |
| Guest requests data deletion (right-to-be-forgotten) | The guest's profile is scheduled for anonymization; any active loyalty balance must be settled or explicitly forfeited first. |

**BUSINESS RULES**

* A guest who declines the direct-order incentive three times without converting is automatically suppressed from further attempts, even without an explicit opt-out.

* Deletion anonymizes personally identifying fields within 30 days; aggregate reporting figures are retained and remain unchanged.

# **4\. Restaurant Owner**

*Owner/GM · Marketing Manager · Franchise HQ / Regional Director · Franchisee*

The Restaurant Owner role is the platform's primary administrative surface and spans nearly every module. Owner/GM is the default full-access sub-role for a single location. Marketing Manager, Franchise HQ/Regional Director, and Franchisee are delegated sub-roles with narrower or broader scope as noted per screen — every screen below states any permission difference explicitly rather than assuming Owner/GM's rights apply uniformly.

**COMMAND CENTER**

## **1\. Home Dashboard**

**Module:** *Global*    **Applies to:** *Owner/GM · Marketing Manager · Franchise HQ*

Give the owner a single opinionated landing view rather than a configurable dashboard they have to assemble themselves.

**Entry Point:**  Default screen on login.

**DATA DISPLAYED**

* A small number of headline metrics, not chart clutter

* Items needing attention across modules (pending approvals, sync failures, flagged reviews) surfaced ahead of routine data

**BUSINESS RULES**

* The dashboard is opinionated by default (pre-sorted, pre-filtered to what needs attention) rather than a blank slate the owner must configure before it's useful.

**GUEST GRAPH**

## **2\. Guest List & Segments**

**Module:** *Guest Graph*    **Applies to:** *Owner/GM · Marketing Manager (view/segment/export only) · Franchise HQ (aggregated \+ per-location view)*

Let the owner or marketer browse, segment, and export the unified guest base for use in loyalty and campaigns.

**Entry Point:**  "Guests" tab in primary navigation.

**DATA DISPLAYED**

* List defaults to a "Needs Attention" view (VIPs about to lapse, low-confidence merge candidates) rather than an alphabetical dump

* Top strip: Total Guests, New This Week, VIPs — three numbers, no chart clutter

* Segments as saved filters on the list (tappable chips: Tier, Location, Last Visit), not a separate module or modal

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner exports a segment to CSV | Export includes a PII-redaction toggle. |
| Marketing Manager builds/saves a segment | Segment becomes selectable as a campaign target in Campaign Studio; Marketing Manager cannot delete or merge guest records. |

**BUSINESS RULES**

* Guest tier (New/Active/VIP/Lapsed/Churned) is computed nightly from configurable RFM thresholds, with a per-account override available in Settings → Guest Tiers, shown with a live-updating preview ("with these settings, 340 of your guests would be VIP") before saving.

* Franchise HQ can view aggregated and per-location guest data across the brand but cannot delete individual location data without local approval.

**NOTIFICATIONS**

* In-app alert to Owner/GM when a guest crosses a VIP threshold.

* In-app alert to Marketing Manager when a segment's size changes more than 15% week over week (signals a possible data issue).

**GUEST GRAPH**

## **3\. Guest Profile & Merge Review**

**Module:** *Guest Graph*    **Applies to:** *Owner/GM (full: view, merge, split, export, delete/anonymize) · Franchise HQ (cross-location view)*

Show a guest's complete, unified timeline across every location and channel, and let the owner correct duplicate records.

**Entry Point:**  Tapping a guest from the Guest List, or a one-tap deep link from anywhere a guest is referenced (Order Queue, Reviews, Campaign results) — never requires navigating back to the Guests tab first.

**DATA DISPLAYED**

* Overview (default), Orders, Loyalty, Notes — four tabs maximum, never a hidden fifth behind a menu

* Cross-location order history on one timeline for guests who have visited more than one location of the same brand

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner merges two duplicate profiles | Confirmed via a small toast ("Profiles merged"), the merged profile auto-opens; the action is reversible for 30 days and requires a reason code. |
| Owner issues a right-to-be-forgotten deletion | Profile is anonymized (PII stripped, aggregate stats retained) within 30 days rather than hard-deleted. |

**BUSINESS RULES**

* Every surface referencing a guest links to the same single profile — never a divergent view.

* If loyalty/order data for one section fails to load, that section alone shows an inline "unavailable right now" notice; the rest of the profile is never blocked by one failing dependency.

**EDGE CASES & ERROR HANDLING**

* A guest requests deletion while holding an active loyalty balance: the balance must be settled or explicitly forfeited before anonymization completes.

**MASTER MENU & CHANNEL SYNC**

## **4\. Menu Editor**

**Module:** *Master Menu & Channel Sync*    **Applies to:** *Owner/GM (full CRUD) · Franchise HQ (national template CRUD) · Franchise Location (edit only within HQ-permitted range)*

Maintain the single canonical menu record that propagates to every guest-facing and operational surface.

**Entry Point:**  "Menu" primary navigation item.

**DATA DISPLAYED**

* Menu home: categories as large tappable cards with item counts and an always-visible sync-health indicator (green dot \= all synced)

* Item Editor: three tabs only — Details, Pricing & Channels, Modifiers

* Per-item, per-channel sync status: Synced / Pending / Failed

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner edits an item's price or description and saves | Change writes to the Master Menu record and a sync job is queued per connected channel; propagation is visible via per-channel sync dots on the same screen — no separate status page to check. |
| A price change is made directly on the POS instead of here | System ingests the change, flags it "POS-originated," and asks the owner to confirm it should become the new Master Menu price — preventing silent divergence. |

**BUSINESS RULES**

* The Master Menu is the canonical record; POS-side changes are ingested and reconciled into it, never silently overwritten.

* Every item has one item\_id used across all channels; channel-specific price overrides are always traceable back to the master item.

* Every item must have a non-empty name, a category, and a price greater than 0 before it can publish to any channel.

* A modifier group cannot be configured with a maximum below its minimum.

**VALIDATION RULES**

* A location-level price override cannot exceed the HQ-defined band without an approval record on file.

**EDGE CASES & ERROR HANDLING**

* An item is deleted from the Master Menu while it exists in an active guest's cart: the guest sees a graceful "this item just became unavailable" message at checkout rather than a broken cart.

* A scheduled price increase's effective date arrives mid-service: the change applies at the exact scheduled timestamp, not at the owner's next login.

**NOTIFICATIONS**

* In-app banner if any channel sync fails for more than 5 minutes; daily digest email if any failures occurred in the last 24 hours; a critical-failure WhatsApp alert if a channel is out of sync for over 30 minutes during open hours.

**MASTER MENU & CHANNEL SYNC**

## **5\. 86 Board (Owner/Manager View)**

**Module:** *Master Menu & Channel Sync*    **Applies to:** *Owner/GM · Shift Manager*

Identical operational screen to the Staff 86 Board (see Staff role, Screen 2), with the same one-tap toggle behavior; documented here to note that Owner/GM additionally retains full item-content and pricing edit rights that Staff do not.

**Entry Point:**  Same persistent 86 Board control as Staff.

**BUSINESS RULES**

* See Staff role Screen 2 for the full toggle behavior, sync SLA, and edge cases — identical for Owner/GM and Shift Manager, who additionally may hold price/content edit rights that FOH/Kitchen Staff do not.

**MASTER MENU & CHANNEL SYNC**

## **6\. Scheduled Menus & Price-Override Approvals**

**Module:** *Master Menu & Channel Sync*    **Applies to:** *Owner/GM · Franchise HQ (approves override requests)*

Let the owner define time-boxed menu versions (e.g., breakfast/lunch/dinner) and stage future price changes, and let Franchise HQ approve or reject a location's request to override menu pricing outside its permitted band.

**Entry Point:**  Scheduled Menu Builder within Menu; Price Override Approval queue within Franchise HQ's console.

**DATA DISPLAYED**

* Scheduled menu definitions: name, start/end time, days of week, included items

* Pending price-override requests with requested price, requesting location, and current HQ-approved band

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| A scheduled menu's end time passes | Items are automatically hidden and the next scheduled menu becomes active with no manual action. |
| HQ reviews a pending override request | Approves or rejects; the change is not live until approved. |

**VALIDATION RULES**

* A price change can be staged and scheduled for a future effective date/time rather than only applying instantly.

**DIRECT ORDERING SITE & BRANDED APP**

## **7\. Site / App Content Editor**

**Module:** *Direct Ordering Site & Branded App*    **Applies to:** *Owner/GM (full edit \+ checkout/payment settings) · Marketing Manager (promotional content, featured items, upsell rules — no payment/checkout settings)*

Let the owner edit their AI-generated storefront (built from Master Menu data, brand assets, and a converting default template) without any element being template-locked.

**Entry Point:**  Site/App section of admin navigation.

**DATA DISPLAYED**

* Live preview pane shown beside the edit controls at all times — the owner never edits blind and has to click "preview" separately

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner edits and publishes a section (e.g., the hero banner) | Change is live on the guest-facing site within 60 seconds, with no template lock-in. |

**DIRECT ORDERING SITE & BRANDED APP**

## **8\. Checkout, Delivery Zone & Payment Configuration**

**Module:** *Direct Ordering Site & Branded App · Delivery & Fulfillment Management*    **Applies to:** *Owner/GM only*

Configure the rules that govern every guest checkout: delivery zones, surge rules, minimum order values, lead times, fulfillment-option priority, and payment gateway.

**DATA DISPLAYED**

* Delivery zone/surge-pricing configuration

* Fulfillment-option priority ordering (owned driver / gig network / marketplace-fulfilled) and gig-network partner connections

* Minimum order value, scheduled-order lead time, payment gateway settings

**BUSINESS RULES**

* Delivery fees must be clearly itemized and can never be silently altered after a guest has confirmed checkout.

**CAMPAIGN STUDIO**

## **9\. Campaign Builder & Automation Library**

**Module:** *Campaign Studio*    **Applies to:** *Marketing Manager (full build/schedule/report) · Owner/GM (full, plus approval authority above a configurable spend/discount threshold) · Franchise HQ (national push)*

Build, automate, and measure multi-channel guest campaigns (email/SMS/push/WhatsApp) from one definition, without needing a separate tool per channel.

**Entry Point:**  Campaign Studio primary navigation item.

**DATA DISPLAYED**

* Pre-built automation templates shipped enabled by default with sensible defaults: abandoned cart, win-back, post-visit review request, birthday offer, VIP thank-you

* Campaign performance report: sent, delivered, opened, clicked, converted, revenue attributed, updated in real time

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Marketing Manager selects a goal or template | System auto-generates a target segment from the Guest Graph and a suggested message; manager may edit content/offer. |
| Manager schedules or sets a campaign to "always on" | Sends across configured channels respecting guest opt-in status and platform-wide frequency caps. |
| Franchise HQ pushes a national campaign to all/selected locations | Each location's send uses its own sender identity/local phone number; a local GM can pause the campaign for their location only, with HQ retaining visibility into which locations paused and why — but cannot edit a national campaign at the location level. |

**BUSINESS RULES**

* Campaigns always target Guest Graph segments, never raw contact lists, so targeting reflects current unified behavior.

* Every campaign requires a measurable goal and a tracked attribution model (default 7-day attribution window) linking sends to resulting orders.

* A campaign cannot be sent to a segment with zero eligible (opted-in) recipients — the system blocks the send and explains why.

* Discount codes must have a defined expiry and usage cap, including a per-guest usage cap, before a campaign can be published.

**EDGE CASES & ERROR HANDLING**

* A campaign is scheduled during a location's marked-closed period: the system warns the sender before it goes out.

* A high-volume send triggers a deliverability/spam warning: the campaign auto-pauses and the owner is alerted rather than continuing to send into a damaged sender reputation.

* A partial-send failure (e.g., 80% delivered, 20% failed due to a provider outage): only the failed subset is automatically retried, not a full resend.

**CAMPAIGN STUDIO**

## **10\. Segment Builder & Guest Preference Compliance**

**Module:** *Campaign Studio*    **Applies to:** *Marketing Manager · Owner/GM*

Build reusable, dynamic segments and monitor guest opt-out trends to keep messaging compliant and well-targeted.

**DATA DISPLAYED**

* Segment definitions and live size

* Opt-out trend report by channel

**BUSINESS RULES**

* Quiet hours (default 9pm–8am guest local time) are enforced platform-wide unless the guest has opted into time-sensitive alerts.

* A guest's per-channel opt-out is respected independently — opting out of SMS does not suppress email/WhatsApp sends the guest remains opted into.

**LOYALTY & REWARDS BUILDER**

## **11\. Loyalty Program Configuration & Reward Catalog**

**Module:** *Loyalty & Rewards Builder*    **Applies to:** *Owner/GM (full config \+ manual balance adjustment with reason code) · Franchise HQ (national template; can lock or allow local catalog additions)*

Configure a points, visit-based, or spend-based loyalty program that accrues and redeems identically across every channel.

**DATA DISPLAYED**

* Program type, earn rate, reward catalog

* Redemption rules: minimum balance, catalog, expiry

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner runs a limited-time promotion (e.g., double points) | Time-boxed and automatically reverts to the standard earn rate afterward with no manual action. |
| Owner makes a manual balance adjustment | Requires a reason code; adjustments above a configurable threshold made by staff require owner/GM approval. |

**BUSINESS RULES**

* An account may run more than one program structure simultaneously (e.g., a punch card for casual guests plus a VIP spend tier).

* Loyalty balances are portable across all locations of a brand by default; Franchise HQ can toggle this to single-location redemption only.

* Point-expiry rules must be clearly displayed to the guest ahead of expiry, with a configurable pre-expiry reminder.

**EDGE CASES & ERROR HANDLING**

* An order tied to already-partially-redeemed points is refunded: the system claws back only the un-redeemed portion of the earned points, never the already-redeemed reward.

**NOTIFICATIONS**

* Owner/GM alert when redemption volume spikes unusually (possible abuse signal).

**AI WEBSITE & LOCAL SEO AUTOPILOT**

## **12\. SEO Approval Queue & Listing Sync**

**Module:** *AI Website & Local SEO Autopilot*    **Applies to:** *Owner/GM (approve/reject, full override) · Marketing Manager (edit AI-suggested copy; cannot change core business info fields like address/legal name without owner approval)*

Review and approve AI-generated landing pages and listing updates (Google Business Profile, Apple Maps, Bing Places) before they publish, or manage auto-publish for low-risk changes.

**Entry Point:**  Approval Queue within the SEO/Listings section.

**DATA DISPLAYED**

* Draft content with a preview and a plain-English summary of expected impact

* Listing drift alerts when a third party has edited a public listing

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner approves a draft with one tap from a mobile push notification | Content publishes to the site and connected listing platforms automatically. |
| Owner enables auto-publish for low-risk changes | Those changes publish without manual approval but remain logged and reversible. |

**BUSINESS RULES**

* No AI-generated content publishes without passing a factual-consistency check against the live Master Menu and location data first.

* Franchise HQ can define a locked national SEO template; local AI-generated content must stay within HQ's brand-voice guardrails.

**EDGE CASES & ERROR HANDLING**

* Google Business Profile is claimed under a personal account the platform can't access: a guided reclaim/transfer flow is provided rather than a silent failure.

* A listing platform shows information different from the Master Menu: the reconciliation job flags the discrepancy to the owner with a one-click fix.

**NOTIFICATIONS**

* Weekly SEO performance digest email; urgent listing-drift WhatsApp alert if incorrect hours/closure information is detected live.

**REPUTATION & REVIEW ENGINE**

## **13\. Unified Review Feed & Reply Approval**

**Module:** *Reputation & Review Engine*    **Applies to:** *Owner/GM (full reply approval/posting) · Marketing Manager (draft/edit; posting above a configurable severity threshold requires owner approval) · Franchise HQ (aggregated sentiment dashboard, no reply rights without delegated access)*

Aggregate reviews from every connected platform into one feed with sentiment scoring, and let the owner approve an AI-drafted, on-brand reply before it posts.

**Entry Point:**  Reviews primary navigation item.

**DATA DISPLAYED**

* Unified feed with sentiment score (positive/neutral/negative) and a drafted reply attached to each review

* Theme extraction (e.g., "slow service mentioned in 12 reviews this month")

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner approves a drafted reply | Reply posts to the originating platform via API and the local copy is marked "replied" with a timestamp. |
| A platform doesn't support posted replies via API | System provides copy-ready reply text and a direct link to that platform's native reply interface instead. |

**BUSINESS RULES**

* No AI-drafted reply is ever auto-posted without explicit human approval, regardless of sentiment or severity.

* A review containing a health/safety-flagged keyword bypasses AI auto-drafting and normal digest cadence entirely, escalating immediately to the owner instead.

* A health/safety-flagged review cannot be marked "resolved" without a required owner-entered resolution note.

**EDGE CASES & ERROR HANDLING**

* A guest edits their review after it was already replied to: the system re-scores sentiment and flags that a previously-replied review has materially changed.

* Near-identical reviews appear on two platforms: both are shown but flagged as likely-duplicate to avoid double-counting sentiment metrics.

**NOTIFICATIONS**

* Immediate alert for health/safety-flagged reviews; daily digest of new reviews and pending reply approvals; weekly reputation summary email; WhatsApp alert for a rating drop below a configured threshold.

**DELIVERY & FULFILLMENT MANAGEMENT**

## **14\. Delivery Zone, Pricing & Dispatcher Configuration**

**Module:** *Delivery & Fulfillment Management*    **Applies to:** *Owner/GM only for configuration; see Staff role Screen 5 for the operational dispatcher board*

Configure delivery zones, surge rules, and fulfillment-option priority that the routing engine and guest checkout both enforce.

**DATA DISPLAYED**

* Delivery zone/surge-pricing configuration

* Fulfillment-option priority ordering

* Gig-network partner connections

**BUSINESS RULES**

* Owner/GM holds full delivery zone, pricing, and fulfillment-partner configuration; Dispatcher/FOH staff can only manually reassign drivers or override order status during service, not configure zones or pricing.

**AI OPERATIONS COPILOT**

## **15\. Schedule Draft, Review & Publish**

**Module:** *AI Operations Copilot*    **Applies to:** *Owner/GM (full) · Shift Manager (view/adjust suggestions, initiate shift-fill; cannot change labor budget targets)*

Review an automatically-generated draft schedule (from historical demand and labor budget) and publish it to staff.

**Entry Point:**  Opened by the manager, typically at the start of a scheduling cycle (e.g., Sunday evening for the coming week).

**DATA DISPLAYED**

* Draft schedule optimized to the configured labor budget

* Confidence label if the location has insufficient history for a reliable prediction (falls back to a conservative template, clearly labeled low-confidence)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Manager reviews, adjusts, and publishes | All listed staff receive their schedule via their preferred notification channel. |

**BUSINESS RULES**

* Schedule suggestions must never violate legal labor rules (minor work-hour restrictions, mandated breaks, minimum rest between shifts) — hard constraints, not soft preferences.

* If the forecasting model produces an anomalous suggestion (e.g., recommending zero staff during historically busy hours), a sanity-check guardrail rejects it and falls back to the prior week's schedule, flagging the anomaly for review.

**AI OPERATIONS COPILOT**

## **16\. Shift-Fill Monitoring**

**Module:** *AI Operations Copilot*    **Applies to:** *Owner/GM · Shift Manager*

Monitor automatic shift-fill requests triggered by a staff call-out, and intervene if none are accepted in time.

**DATA DISPLAYED**

* Real-time acceptance status of an in-flight shift-fill broadcast

**EDGE CASES & ERROR HANDLING**

* No staff respond within the configured escalation window: the manager is alerted to intervene manually.

**AI OPERATIONS COPILOT**

## **17\. Natural-Language Ops Q\&A**

**Module:** *AI Operations Copilot*    **Applies to:** *Owner/GM*

Let the owner ask an operational question in plain English and receive a synthesized, plain-English answer drawn from the platform's own sales/staffing/external data — never a raw data dump.

**Entry Point:**  Q\&A chat interface.

**DATA DISPLAYED**

* Conversational answer plus the data sources synthesized (e.g., weather, a competing local event, an 8-week trailing average)

**BUSINESS RULES**

* If the underlying data is insufficient to answer confidently, the response explicitly states that confidence limitation rather than presenting a guess as fact.

**MULTI-LOCATION & FRANCHISE CONTROL CENTER**

## **18\. Brand Guardrails & National Push**

**Module:** *Multi-Location & Franchise Control Center*    **Applies to:** *Franchise HQ / Regional Director (full visibility, sets guardrails, approves overrides) · Location Owner/GM / Franchisee (acts freely within guardrails, can request exceptions)*

Let HQ define brand guardrails (locked assets, price bands, approved promo templates) and push brand-consistent changes to some or all locations in one action.

**DATA DISPLAYED**

* Guardrail definitions per type (pricing bands, brand assets, promo templates)

* Push status per location

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| HQ pushes a national campaign or menu update | Each location updates automatically unless it has already customized that item; any location wanting to diverge submits an override request instead of being blocked outright. |
| HQ pushes an update while a location is mid-service | The change queues to apply at a configurable safe window (e.g., after close) rather than disrupting an active shift, unless explicitly marked urgent. |

**BUSINESS RULES**

* A location-level override can never bypass guardrails silently — it either falls within a pre-approved band (auto-applies) or requires explicit HQ approval; there is no other path.

* If a national push partially fails, the failure is isolated to the affected locations with clear per-location status, and HQ can retry only the failed subset.

**EDGE CASES & ERROR HANDLING**

* A newly-acquired location's legacy menu doesn't cleanly map to the brand's national template: a mapping/reconciliation step is supported rather than forcing an all-or-nothing cutover.

* HQ grants a location full autonomy for a local event (e.g., a city festival) via a time-boxed guardrail exception.

**NOTIFICATIONS**

* HQ alert when a guardrail-exception request is pending; location-level alert when HQ pushes a change affecting them; urgent brand-wide WhatsApp broadcast for critical system-wide issues.

**MULTI-LOCATION & FRANCHISE CONTROL CENTER**

## **19\. Location Scorecard & Override Approval Queue**

**Module:** *Multi-Location & Franchise Control Center*    **Applies to:** *Franchise HQ / Regional Director*

Compare and benchmark every location on revenue, guest sentiment, compliance, and staffing health, and review pending guardrail-exception requests.

**DATA DISPLAYED**

* Location Scorecard: revenue, repeat-rate, review sentiment, staffing health per location

* AI-generated "attention needed" flags with a likely root-cause hypothesis (e.g., staffing gap, sentiment drop, sync failure)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| HQ reviews an override request outside the pre-approved band | Enters a manual approval decision (approve/reject); it is not live until approved. |

**BUSINESS RULES**

* Financial rollup reports must never blend data across legally distinct franchisee entities without explicit consolidation permission.

**NOTIFICATIONS**

* Weekly brand-wide performance rollup email; compliance summary email listing all overrides approved/rejected in the period.

**INSIGHTS & REPORTING**

## **20\. Revenue Recovery Report & Digest**

**Module:** *Insights & Reporting*    **Applies to:** *Owner/GM · Franchise HQ*

Show the platform's flagship, ROI-proving report: direct-channel revenue growth, commissions avoided against a configurable marketplace baseline, and net platform ROI, refreshed daily.

**Entry Point:**  In-app dashboard for deep-dive; pushed digest (SMS/email/WhatsApp) by default weekly, configurable to daily or monthly.

**DATA DISPLAYED**

* 2–3 headline numbers in the pushed digest; full breakdown available in-app

* AI-generated plain-English narrative summary accompanying each digest

**BUSINESS RULES**

* Revenue Recovery calculations must use a documented, consistent commission-baseline methodology, visible to the owner on request.

* Every monetary figure must reconcile to the underlying order ledger; a reporting number that cannot be traced to source transactions is treated as a defect.

**EDGE CASES & ERROR HANDLING**

* A location has a data gap (e.g., a POS outage): the affected report is clearly annotated with a data-completeness disclaimer rather than silently showing an artificially low number.

* A nightly aggregation job fails: the previous successful report is retained and clearly timestamped "last updated X" rather than showing a blank or broken report.

**INSIGHTS & REPORTING**

## **21\. Location Scorecards & Guest Lifetime Value**

**Module:** *Insights & Reporting*    **Applies to:** *Owner/GM · Marketing Manager (campaign/marketing reports; revenue/financial detail may be restricted per owner configuration) · Franchise HQ*

Show Guest Lifetime Value rolled up by acquisition channel and segment, and one-page-per-location scorecards synthesizing revenue, repeat-rate, sentiment, and staffing health.

**EDGE CASES & ERROR HANDLING**

* A new location has less than 30 days of history: reports show available data with a "building baseline" indicator rather than a misleading trend comparison.

**ONBOARDING & MICRO-TRAINING LAYER**

## **22\. Onboarding Milestone Checklist & Staff Invite**

**Module:** *Onboarding & Micro-Training Layer*    **Applies to:** *Owner/GM*

Reduce the owner's role in onboarding to a short series of approval decisions rather than manual data entry, and invite staff with assigned roles.

**Entry Point:**  Onboarding checklist shown until go-live; Staff Invite screen thereafter.

**DATA DISPLAYED**

* Milestones: menu import, site build, loyalty defaults — each with a simple approve/reject checklist item

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner approves a milestone | Moves to the next stage; the platform cannot go fully live (guest-facing ordering enabled) until menu, pricing, and payment-configuration milestones are explicitly approved. |
| Owner invites a staff member | A staff account cannot be created without an assigned role, which determines their training content and permission set. |

**EDGE CASES & ERROR HANDLING**

* The owner's existing POS menu data is malformed (e.g., missing prices): affected items are flagged for manual owner input rather than importing incorrect or blank values.

**NOTIFICATIONS**

* Owner notification at each milestone ready for review; go-live confirmation email with a summary of what was set up; WhatsApp milestone reminders for time-pressed owners.

**MARKETPLACE ARBITRAGE ALERTS**

## **23\. Arbitrage Automation Configuration**

**Module:** *Marketplace Arbitrage Alerts*    **Applies to:** *Owner/GM (enable/disable, configure incentive value/frequency) · Marketing Manager (edit messaging/targeting within owner-approved limits)*

Configure the automation that detects a guest's repeated marketplace ordering and invites them to order direct with a trackable incentive.

**DATA DISPLAYED**

* Marketplace-reliant threshold configuration (e.g., 3+ marketplace orders with 0 direct orders in 60 days)

* Weekly conversion summary

**BUSINESS RULES**

* This module never uses marketplace guest data beyond what the guest has independently made available to the restaurant — it does not scrape or infer contact information the marketplace hasn't exposed.

* Frequency capping (maximum attempts per guest per period) is a hard limit, not a soft default.

* A compliance-restricted mode is available (some marketplace contracts restrict guest solicitation) that limits targeting to guests matched via non-marketplace channels only.

**EDGE CASES & ERROR HANDLING**

* A guest opens but never converts after 3 incentive attempts: the system suppresses further attempts automatically, even without an explicit opt-out.

**FRANCHISE COMPLIANCE CENTER**

## **24\. Compliance Policy & Violation Queue**

**Module:** *Franchise Compliance Center*    **Applies to:** *Franchise HQ / Compliance Officer (full policy definition, violation review, consequence configuration) · Franchisee / Location GM (view own compliance status, submit corrections or exception requests; cannot alter policies)*

Define discrete, auditable brand-compliance policies (pricing, imagery, promotions, operational standards) with severity levels, and continuously scan every location's live state against them.

**DATA DISPLAYED**

* Compliance queue with supporting evidence (e.g., a screenshot of the offending price/asset)

* Franchisee-facing compliance status and correction deadline

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| HQ reviews a flagged violation | Dismisses as a false positive, requests a correction, or escalates per the configured consequence path. |
| Franchisee submits a correction | Violation automatically clears from the queue on the next scan confirming compliance, without requiring manual HQ closure. |
| Franchisee disputes a flagged violation | Submits an exception request with a required justification field, routed to HQ for judgment rather than automatic enforcement. |

**BUSINESS RULES**

* A compliance consequence beyond a warning-level notice cannot be auto-applied without a defined HQ review step for anything above "low" severity.

* Violations are surfaced in a queue, never silently auto-blocked — HQ retains judgment over enforcement, and communication to the franchisee is always transparent, never a silent lockout.

**EDGE CASES & ERROR HANDLING**

* A new HQ policy retroactively puts previously-compliant locations into violation: affected locations receive a grace period before being flagged, rather than an immediate mass-violation event.

* A location is mid-way through an HQ-approved local promotion that technically triggers a general policy rule: the system recognizes the approved exception and does not re-flag it.

**NOTIFICATIONS**

* Franchisee notification of a new violation and correction deadline; HQ notification of a pending exception request; urgent WhatsApp notice for a legal/safety-relevant violation.

**UNIFIED 86 & INVENTORY PREDICTION ENGINE**

## **25\. Inventory Configuration & Prediction Dashboard**

**Module:** *Unified 86 & Inventory Prediction Engine*    **Applies to:** *Owner/GM*

Configure which items are tracked, their supplier lead times, and prediction sensitivity; view prediction accuracy over time.

**DATA DISPLAYED**

* Tracked items with tracking mode (precise on-hand count vs. estimated sell-through trend)

* Prediction accuracy history

**BUSINESS RULES**

* Supplier lead-time entries must be a positive duration; a zero or negative lead time is rejected.

* A prediction's confidence level must always be surfaced alongside the prediction — an estimated-mode prediction is never shown with the same visual confidence as a precise, count-based one.

**EDGE CASES & ERROR HANDLING**

* An implausible model result (e.g., negative time-to-stockout) is suppressed by a sanity-check guardrail and logged for model review rather than sent to staff as a nonsensical alert.

**GUEST FINANCIAL PRODUCTS**

## **26\. Guest Financial Products Configuration**

**Module:** *Guest Financial Products*    **Applies to:** *Owner/GM*

Enable and configure catering installment payments, staff instant-pay, and financed/bulk gift cards.

**DATA DISPLAYED**

* Deposit percentage floor, installment schedule options

* Instant-pay fee/subsidy policy

**BUSINESS RULES**

* All financial products are opt-in per restaurant and require explicit terms acceptance; the platform integrates with a licensed financial partner rather than acting as an unlicensed lender itself.

* Availability and specific terms are gated per jurisdiction via the licensed partner's compliance rules, not assumed to be universally available.

**EDGE CASES & ERROR HANDLING**

* The restaurant closes or terminates its platform account with active installment plans outstanding: the financial partner's servicing continues per the original agreement terms, independent of the restaurant's platform status.

**VERTICAL PACKS**

## **27\. Vertical Pack Selection**

**Module:** *Vertical Packs*    **Applies to:** *Owner/GM*

Apply a pre-configured bundle of defaults (Ghost Kitchen, Bar/Brewery, Food Truck, Catering-Heavy, or Standard) across existing modules, appropriate to the restaurant's format.

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner selects a vertical pack | Pack defaults apply across relevant modules (menu structure, checkout flow, delivery routing, reporting KPIs); any individual default can still be overridden without losing the rest of the pack's configuration. |
| Owner switches back to Standard | All prior data (orders, guests, menu) remains fully intact; only default configuration/UI surfacing changes. |

**BUSINESS RULES**

* Selecting or switching a vertical pack is always a safe, reversible operation that never removes data irreversibly.

* More than one pack's relevant settings can be combined at the location level for a business spanning two verticals (e.g., a brewery that also runs a food truck at events).

**EDGE CASES & ERROR HANDLING**

* A vertical-pack default conflicts with a franchise HQ guardrail: the guardrail takes precedence and the conflict is surfaced to the owner/HQ for resolution rather than silently applying one over the other.

**"SET IT AND FORGET IT" AUTONOMOUS PROMOTION ENGINE**

## **28\. Autonomous Promotion Goal Setup & Monitoring**

**Module:** *Autonomous Promotion Engine*    **Applies to:** *Owner/GM (sets goals, approves budget ceiling, can pause/stop at any time) · Marketing Manager (can propose goals for owner approval, view performance)*

Let the owner state a plain-English business goal and budget ceiling, and have the engine autonomously select, launch, monitor, and iterate a promotion to hit it.

**DATA DISPLAYED**

* Goal definition: target metric, time window/segment, budget/discount ceiling

* Weekly goal-progress report with any autonomous mechanism switch and its rationale

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Engine's initial mechanism underperforms its threshold within the evaluation window | Automatically switches to an alternative mechanism (e.g., a loyalty bonus instead of a discount) within the same approved ceiling, and notifies the owner of the change and rationale. |
| Owner pauses the engine | No new autonomous actions are taken while already-issued offers remain honored per their original terms. |

**BUSINESS RULES**

* The engine can never exceed the owner-approved budget/discount ceiling under any autonomous adjustment.

* A goal cannot be activated without an explicit budget ceiling defined first.

**EDGE CASES & ERROR HANDLING**

* A stated goal isn't achievable within the given ceiling: the engine flags this upfront with a realistic alternative rather than silently underdelivering.

* Two autonomous goals would target overlapping guest segments and conflict: the engine detects the overlap and merges or sequences the offers to avoid guest fatigue/over-discounting.

**STAFF RETENTION LAYER**

## **29\. Recognition Configuration**

**Module:** *Staff Retention Layer*    **Applies to:** *Owner/GM*

Configure automatic recognition triggers, leaderboard visibility, and bonus/perk policy tied to staff performance data.

**DATA DISPLAYED**

* Auto-recognition trigger definitions (e.g., "auto-shoutout for highest upsell rate of the week")

* Leaderboard visibility toggle (off by default)

**BUSINESS RULES**

* Performance data is presented as a coaching/recognition tool, never a punitive surveillance system.

* The owner can exclude specific staff members from tracking, or disable the module entirely, respecting local labor-law and consent norms which vary by market.

**"SWITCH WITHOUT FEAR" MIGRATION GUARANTEE**

## **30\. Data Export & Account Offboarding**

**Module:** *Migration Guarantee*    **Applies to:** *Owner/GM*

Give the owner standing, self-service access to a complete, portable data export at any time, without a support ticket, including during an active cancellation.

**Entry Point:**  Account Settings → Export My Data.

**DATA DISPLAYED**

* Complete export: menu structure, guest records with consent status, full order history, reviews, loyalty ledger, in an open, documented format

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Owner requests an export | Delivered within the committed SLA (e.g., within 24 hours for large accounts) regardless of active or in-cancellation subscription status. |
| Owner proceeds through account cancellation | A data export offer is presented proactively as a required step before final account closure — never hidden or optional-by-omission. |

**BUSINESS RULES**

* An export request can never be blocked, delayed beyond the committed SLA, or gated behind a retention/save offer as a precondition.

* Exported guest data respects each guest's own consent/opt-out status — a guest with a processed erasure request is excluded from any subsequent export.

* For a multi-location franchise account, the export respects legal-entity boundaries — a franchisee cannot export another franchisee's data without appropriate authorization.

**EDGE CASES & ERROR HANDLING**

* An account is cancelled for non-payment rather than voluntary departure: the export guarantee still applies for a defined grace period before data is purged, and the owner is proactively informed of the deadline.

**NOTIFICATIONS**

* Export-ready notification and secure-download-link email; pre-purge deadline reminder if an account was cancelled for non-payment and the export hasn't been claimed.

# **5\. Staff**

*Shift Manager · FOH / Kitchen Staff · Dispatcher · Kitchen / Inventory Staff · New Staff Member*

The Staff role covers hourly, task-scoped employees at a single location: Shift Manager, FOH/Kitchen Staff, Dispatcher, Kitchen/Inventory Staff, and New Staff Member. Staff screens are deliberately flat and fast — they are used mid-service, under time pressure, on shared devices. No Staff sub-role has access to pricing, financial configuration, or brand/marketing settings unless explicitly noted.

## **1\. Guest Lookup**

**Module:** *Guest Graph*    **Applies to:** *FOH / Kitchen Staff (view-only)*

Let front-of-house staff quickly identify a guest at the point of service without navigating the full admin Guest Graph.

**Entry Point:**  A single search-first screen — large search field at top, keyboard opens automatically on mobile — reached from a persistent lookup control, not buried in settings.

**DATA DISPLAYED**

* Name, tier badge (New/Active/VIP/Lapsed), last visit, allergy flags, visit count

* No full PII (card data, complete order history) unless the staff member has been role-elevated by the owner

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Staff searches by name, phone, or email in one field | Results rank exact phone/email matches above fuzzy name matches; no separate field toggles are required. |

**BUSINESS RULES**

* FOH/Kitchen Staff access is strictly view-only lookup; they cannot merge, split, export, or delete guest records.

* Staff never see raw internal identifiers (e.g., "guest\_id: 4471") — always a name, tier, and human-readable context.

## **2\. 86 Board**

**Module:** *Master Menu & Channel Sync*    **Applies to:** *Shift Manager · FOH / Kitchen Staff*

Let staff mark an item unavailable (or restore it) in one tap, with the change propagating to every guest-facing and operational surface within the sync SLA.

**Entry Point:**  A single persistent, always-reachable button — deliberately not nested inside a settings-style menu editor, because it is used under time pressure.

**DATA DISPLAYED**

* A single flattened list of every item regardless of category — intentionally the flattest screen in the product, with zero tabs

* Per-item toggle state and, where available, a "likely to run out soon" advance-warning flag distinct from an actual 86

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Staff taps an item's toggle once | Item is marked 86'd; within a target of under 10 seconds it is removed/greyed on the direct website, branded app, kiosk, and every synced marketplace listing. |
| Staff taps the toggle again to restore | Item becomes orderable again everywhere within the same SLA; the system also auto-suggests restoring at the start of the next scheduled prep window, needing one tap to confirm. |

**BUSINESS RULES**

* 86 status is a single, first-class, real-time field on the item — never a separate per-channel flag that could drift out of sync.

* Staff have toggle-only rights: they can mark availability but cannot edit price or item content.

**VALIDATION RULES**

* An item cannot be marked available on a channel it has never been synced to.

**EDGE CASES & ERROR HANDLING**

* Two staff members toggle the same item within seconds (race condition): last write wins, and both actions remain visible in the audit trail — no action is silently dropped.

* A marketplace's API is down when the 86 fires: the update is queued and retried, and staff see a "Sync Failed — Marketplace Unreachable" warning with a manual-fallback instruction (e.g., update that channel manually until reconnected).

**NOTIFICATIONS**

* Push/in-app alert to the kitchen device when an item is auto-flagged "likely running low" ahead of a guest-facing 86\.

## **3\. Order Queue**

**Module:** *Direct Ordering Site & Branded App · Delivery & Fulfillment Management*    **Applies to:** *FOH / Kitchen Staff · Shift Manager · Dispatcher*

Show kitchen/FOH staff every incoming order in real time and, for orders requiring delivery, an inline delivery-status pill rather than a separate delivery queue to check twice.

**Entry Point:**  Primary operational screen for kitchen/FOH staff; opened automatically or pinned during service.

**DATA DISPLAYED**

* New and in-progress orders with items and modifiers

* Inline delivery-status pill (Awaiting Driver / En Route / Delivered) for orders needing delivery — reachable only by tapping that specific order

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| A new order arrives | Real-time alert (sound \+ visual) fires on the kitchen/FOH device for every new order. |
| Staff taps an order with a delivery pill needing intervention | Delivery Detail opens (driver, route, ETA) — see Screen 5\. |

**BUSINESS RULES**

* Delivery is treated as a state/attribute of an order, not a separate object staff have to think about independently, keeping the operational mental model simple.

## **4\. Loyalty Redemption at POS**

**Module:** *Loyalty & Rewards Builder*    **Applies to:** *FOH Staff*

Let staff apply a guest's loyalty reward at checkout in-store, in sync with the guest's single cross-channel ledger.

**Entry Point:**  Checkout/POS flow, triggered when a guest requests redemption or the system surfaces an available reward for the identified guest.

**DATA DISPLAYED**

* Guest's current balance and available rewards

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Staff applies a redemption | Balance is deducted in real time across all channels; the same reward instance cannot then be redeemed again online. |
| Staff issues a manual point grant/adjustment | Allowed only up to a small, owner-configured ceiling; adjustments above that ceiling require GM/owner approval. |

**BUSINESS RULES**

* Staff cannot edit loyalty program rules (earn rate, catalog, expiry) — configuration is Owner/Franchise-HQ only.

## **5\. Delivery Dispatcher Board**

**Module:** *Delivery & Fulfillment Management*    **Applies to:** *Dispatcher / FOH Staff*

Give a dispatcher a simple at-a-glance view of every active delivery and a fast manual-reassignment tool when the automated routing needs intervention.

**Entry Point:**  Settings → Delivery for configuration; the operational board itself is reached by tapping into an order's delivery pill from the Order Queue, or a dedicated dispatcher view at busier locations.

**DATA DISPLAYED**

* 3-column Kanban board: Awaiting Driver / En Route / Delivered

* Live map view (detail screen only, not the default list view)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Dispatcher taps a stale or delayed order | Sees current driver status and a short list of available replacement drivers. |
| Dispatcher taps a replacement driver | Reassignment confirms in place — no separate confirmation screen. |

**BUSINESS RULES**

* Dispatcher/FOH permission is manual driver reassignment and order-status override during service only; delivery-zone, pricing, and fulfillment-partner configuration remain Owner/GM-only.

**EDGE CASES & ERROR HANDLING**

* A driver accepts a delivery but goes stale (no status update within a configured timeout): the dispatcher is alerted and the order becomes eligible for reassignment rather than silently stalling.

* A delivery address is just outside a configured zone: staff have a manual override to accept with a surcharge rather than a hard rejection.

## **6\. My Schedule & Availability**

**Module:** *AI Operations Copilot*    **Applies to:** *FOH / Kitchen Staff · Shift Manager*

Let staff view their published schedule and keep their availability current for future scheduling and shift-fill eligibility.

**Entry Point:**  Staff app home / Schedule tab.

**DATA DISPLAYED**

* Upcoming published shifts

* Self-service availability editor

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Staff updates their availability | Feeds future draft-schedule generation and eligibility for shift-fill requests. |
| Shift Manager reviews/adjusts a draft schedule | Can view and adjust suggestions and publish; cannot change labor budget targets, which remain Owner/GM-only. |

**BUSINESS RULES**

* Schedule suggestions are hard-constrained by legal labor rules (minor work-hour restrictions, mandated breaks, minimum rest between shifts) — these can never be overridden as a soft preference.

**NOTIFICATIONS**

* Staff receive their published schedule via their preferred notification channel.

## **7\. Shift-Fill Request Response**

**Module:** *AI Operations Copilot*    **Applies to:** *FOH / Kitchen Staff*

Let an eligible, available staff member accept an open shift when a colleague calls out, without a manager coordinating by group text.

**Entry Point:**  Push/SMS/WhatsApp broadcast to eligible, available, qualified staff when a call-out is logged.

**DATA DISPLAYED**

* Shift details (role, time, location)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Staff accepts the shift-fill request | Shift is confirmed to that staff member; the manager sees real-time acceptance status and other broadcasts to remaining staff stop. |

**BUSINESS RULES**

* Shift-fill requests are only ever sent to staff marked available and qualified for the specific role/shift.

**EDGE CASES & ERROR HANDLING**

* No staff respond within a configured escalation window: the manager is alerted to intervene manually rather than the shift silently going unfilled.

**NOTIFICATIONS**

* Shift-fill request broadcast via WhatsApp/SMS; sent/accepted/unfilled-escalation alerts to the manager.

## **8\. Inventory On-Hand Count & Stockout Alerts**

**Module:** *Unified 86 & Inventory Prediction Engine*    **Applies to:** *Kitchen / Inventory Staff*

Let kitchen staff enter/update on-hand counts and act on early stockout warnings before an item is reactively 86'd mid-service.

**Entry Point:**  Mobile-friendly on-hand count entry screen; early-warning alerts pushed directly to the kitchen device.

**DATA DISPLAYED**

* Tracked items with current on-hand count (precise mode) or sell-through trend only (estimated mode)

* Predicted-stockout date/time with a visible confidence level

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Staff enters/updates an on-hand count | Prediction recalculates using the new count against rolling sell-through velocity. |
| Staff confirms or dismisses a stockout prediction (with a reason) | Dismissal reason feeds back into future prediction accuracy; it does not silently suppress future alerts for that item. |

**BUSINESS RULES**

* Kitchen/Inventory Staff can view predictions and enter on-hand counts but cannot change supplier lead-time or prediction-sensitivity configuration — that remains Owner/GM-only.

* The UI must never present an estimated-mode (trend-only) prediction with the same visual confidence as a precise, on-hand-count-based one.

**EDGE CASES & ERROR HANDLING**

* An item has insufficient order history for a reliable prediction: it is flagged "insufficient data" rather than shown with false-confidence.

**NOTIFICATIONS**

* Early-warning stockout alert to kitchen staff before the item would otherwise be reactively 86'd; urgent same-day warning via WhatsApp if the predicted window is only a few hours out and no action has been taken.

## **9\. My Performance & Recognition**

**Module:** *Staff Retention Layer*    **Applies to:** *Staff Member · Shift Manager*

Let a staff member see their own service performance and recognition history, and let a manager issue lightweight recognition, without turning the data into a surveillance or ranking tool by default.

**Entry Point:**  Staff app home / Recognition tab.

**DATA DISPLAYED**

* Own performance metrics only (average ticket size, upsell attach rate, table turn time, linked guest-sentiment score) — never a ranked comparison identifying coworkers unless the owner has explicitly enabled a team leaderboard

* Personal recognition history

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Manager issues manual recognition (free text, not tied to a metric) | Appears in the team recognition feed (if enabled) and the recognized staff member's personal history. |
| An auto-recognition trigger fires (e.g., top upsell performer of the week) | Queued for manager one-tap approval before it posts to the team feed — never posts automatically without that approval. |

**BUSINESS RULES**

* A transaction that cannot be reliably attributed to an individual (e.g., a shared terminal login) is excluded from performance calculations rather than misattributed.

* The owner can exclude specific staff members from tracking entirely, or disable the module account-wide.

**EDGE CASES & ERROR HANDLING**

* Performance data is incomplete for a period (e.g., a POS outage): the summary for that period is clearly marked partial rather than silently skewing a staff member's metrics low.

## **10\. Instant-Pay Request**

**Module:** *Guest Financial Products*    **Applies to:** *Staff Member*

Let a staff member access already-earned wages ahead of the standard payroll cycle for a transparent fee (or owner-subsidized).

**Entry Point:**  Earnings view within the staff app.

**DATA DISPLAYED**

* Verified available (already-earned) amount

* Applicable fee, if any

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Staff requests an instant-pay amount | Request is verified against independently-tracked earned-wage data and processed through the licensed financial partner; funds are disbursed per the partner's settlement timeline. |

**BUSINESS RULES**

* Requests are hard-capped at verified already-earned wages — never an advance against unearned or future wages.

**VALIDATION RULES**

* A request exceeding verified earned wages is rejected with a clear explanation and the maximum available amount is shown instead of a generic denial.

**NOTIFICATIONS**

* Staff confirmation notification and receipt email on disbursement.

## **11\. First-Login Micro-Training**

**Module:** *Onboarding & Micro-Training Layer*    **Applies to:** *New Staff Member (any Staff sub-role)*

Get a new or newly-promoted staff member productive without a formal training session, by surfacing a short contextual tip the first time they open each feature relevant to their role.

**Entry Point:**  Automatically triggered in-context on first encounter with a given feature (e.g., first time opening the 86 Board).

**DATA DISPLAYED**

* A brief, role-scoped contextual tip — never a full tutorial video and never content for a feature the role doesn't touch

**BUSINESS RULES**

* Training content is strictly role-scoped: a server never sees admin-level tutorials; kitchen staff never see marketing tutorials.

* If a staff member's role changes (e.g., promoted to Shift Manager), micro-training re-triggers for the newly-accessible features rather than assuming prior full training.

# **6\. Delivery Partner**

*Owned Driver · Gig-Network Driver*

The Delivery Partner role covers the individual fulfilling a delivery — whether an owned driver directly engaged by the restaurant or a driver sourced through a connected gig delivery network. The platform does not operate a proprietary driver-facing marketplace app UI beyond the functional surfaces below; screens are identical regardless of which pool (owned or gig) the delivery was routed through. Source: PRD Module 8 (Delivery & Fulfillment Management) — the underlying UX documentation does not specify this device's screens in detail, so the entries below are derived directly from the module's stated actor permissions, business logic, and required user controls.

## **1\. Assigned Delivery / Accept-Reject**

**Module:** *Delivery & Fulfillment Management*    **Applies to:** *Delivery Driver (owned or gig)*

Notify a driver of a delivery the routing engine has assigned to them, and let them accept or reject it.

**Entry Point:**  Push notification the moment the routing engine selects the driver as the lowest-cost/fastest available option for a given order.

**DATA DISPLAYED**

* Pickup location, drop-off address, order size/value, estimated payout (where applicable)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Driver accepts the delivery | Delivery status updates to "Awaiting Pickup" and is visible to dispatcher/owner on the Order Queue's delivery pill in real time. |
| Driver rejects the delivery | Order returns to the routing engine, which offers it to the next available option (another owned driver, gig network, or marketplace fallback) rather than stalling. |

**BUSINESS RULES**

* Every direct order requiring delivery is evaluated against available fulfillment options (owned driver, gig network, marketplace-fulfilled) using a routing decision based on cost, distance, and current driver availability — the driver only ever sees deliveries the engine has determined they are eligible and available for.

## **2\. Route & Live Tracking**

**Module:** *Delivery & Fulfillment Management*    **Applies to:** *Delivery Driver*

Give the driver the route to follow and simultaneously power the guest-facing live tracking view.

**Entry Point:**  Opened automatically once a delivery is accepted.

**DATA DISPLAYED**

* Turn-by-turn route to pickup, then to drop-off

* Current delivery status timeline

**BUSINESS RULES**

* The driver's live location feed is what powers the guest's live map/tracking view — the guest always sees one consistent tracking experience regardless of which fulfillment option is actually driving.

**EDGE CASES & ERROR HANDLING**

* The driver's app loses connectivity or crashes mid-route: the system detects the resulting stale status after a configured timeout and alerts the dispatcher for reassignment rather than leaving the guest's tracker frozen indefinitely (the guest's tracker itself degrades to a status-based view, not a broken map).

## **3\. Delivery Status Updates**

**Module:** *Delivery & Fulfillment Management*    **Applies to:** *Delivery Driver*

Let the driver report progress (picked up, en route, delivered) so the guest, dispatcher, and reporting layer all reflect current, accurate status.

**Entry Point:**  Status controls within the active-delivery screen.

**DATA DISPLAYED**

* Simple status controls (e.g., "Picked Up", "Delivered")

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Driver marks the order picked up | Guest-facing status updates from "Preparing" to "Out for Delivery" and dispatcher board moves the order to "En Route." |
| Driver marks the order delivered | Delivery is marked complete; fulfillment cost and time are logged for reporting; guest receives an on-time delivery notification. |

**BUSINESS RULES**

* This is the driver's only write access in the platform — accept/reject a delivery, update its status, and view the route. Drivers cannot see zone/pricing configuration, other drivers' assignments beyond what's needed for a handoff, or any admin/reporting screen.

**EDGE CASES & ERROR HANDLING**

* A driver's status goes stale (no update within a configured timeout): the dispatcher is alerted and the order becomes eligible for reassignment.

# **7\. Platform Admin**

*Internal platform support / engineering staff*

Platform Admin covers internal platform support/engineering staff. Every Platform Admin action, without exception, is audit-logged (actor, timestamp, action, and — where applicable — reason code). Platform Admin exists to correct data-quality issues, unblock support cases, and maintain shared infrastructure (SEO/listing sync, review-platform connections, financial-partner relationships) — it is never used to act on an individual restaurant's guest-facing content or brand settings without an explicit support ticket or an owner-granted permission.

## **1\. Guest Merge Review Queue**

**Module:** *Guest Graph*    **Applies to:** *Platform Admin*

Manually resolve guest-profile match candidates that fell below the auto-merge confidence threshold.

**Entry Point:**  Dedicated admin queue, populated nightly by the duplicate-detection job.

**DATA DISPLAYED**

* Both candidate profiles side-by-side with the conflicting field(s) highlighted

* Match confidence score

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Admin reviews a flagged pair and selects "Merge" or "Keep Separate" | Exactly two outcomes are available — no ambiguous third path. A merge requires a reason code and is reversible for 30 days. |

**BUSINESS RULES**

* Auto-merge only ever happens above an 85% confidence match; anything below that threshold reaches this queue and is never merged automatically.

* A merge cannot combine two profiles that each hold an active, non-zero loyalty balance without an explicit admin confirmation of how the balances are handled.

* If a merge partially fails (e.g., the loyalty-balance transfer fails), the entire merge is rolled back atomically — no partial-merge state is ever left visible.

## **2\. Manual Profile Correction & Right-to-be-Forgotten Processing**

**Module:** *Guest Graph*    **Applies to:** *Platform Admin*

Perform data-quality corrections a restaurant owner cannot make themselves, and process guest erasure requests.

**Entry Point:**  Support-ticket-driven, from the admin console.

**DATA DISPLAYED**

* Full guest record with edit history

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Admin processes an erasure (right-to-be-forgotten) request | All directly-identifying fields are removed within 30 days; aggregate reporting numbers remain unchanged. Any active loyalty balance must be settled or explicitly forfeited first. |
| Admin makes a manual profile correction | Change is written with a full audit trail (who, when, what changed). |

## **3\. Channel Sync Health & Circuit-Breaker Monitoring**

**Module:** *Master Menu & Channel Sync · AI Website & Local SEO Autopilot*    **Applies to:** *Platform Admin*

Monitor cross-channel sync health (menu/86/pricing to website, app, kiosk, POS, marketplaces, and listing platforms) and intervene when a channel adapter is persistently failing.

**Entry Point:**  Admin infrastructure dashboard.

**DATA DISPLAYED**

* Per-channel, per-location sync status and failure logs (full request/response payloads for diagnosis)

**BUSINESS RULES**

* A circuit breaker automatically disables retries to a channel that has failed more than a configured number of consecutive times and alerts platform support, preventing retry storms.

* A failure syncing to one channel (e.g., one marketplace) is isolated and never blocks sync to any other channel.

## **4\. Listing & Review-Platform Connection Management**

**Module:** *AI Website & Local SEO Autopilot · Reputation & Review Engine*    **Applies to:** *Platform Admin*

Maintain the shared technical infrastructure connecting every restaurant's site/listings to Google Business Profile, Apple Maps, Bing Places, and review platforms (Google, Yelp, Facebook, TripAdvisor).

**Entry Point:**  Admin infrastructure dashboard.

**DATA DISPLAYED**

* Listing connection status per location and platform

* Drift-detection alerts (a third party edited a public listing)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Admin assists an owner through a Google Business Profile ownership-mismatch reclaim | Guided reclaim/transfer flow rather than a silent failure. |

## **5\. Compliance & Financial-Partner Oversight**

**Module:** *Guest Financial Products · Franchise Compliance Center · Campaign Studio*    **Applies to:** *Platform Admin*

Provide compliance/audit oversight across financial products, franchise-brand compliance escalations, and marketing deliverability, without holding day-to-day configuration control over any of them.

**Entry Point:**  Admin oversight console.

**DATA DISPLAYED**

* Deliverability/spam-complaint monitoring across all sending accounts

* Financial-partner reconciliation and dispute status

* Data-ethics review queue for marketplace-arbitrage targeting

**BUSINESS RULES**

* Every financial transaction failure is handled through the licensed financial partner's standard reconciliation and dispute process; the platform never silently retries a financial charge without guest/staff visibility.

## **6\. Onboarding Specialist Console**

**Module:** *Onboarding & Micro-Training Layer*    **Applies to:** *Migration/Onboarding Specialist (Platform Admin sub-function)*

Perform guided setup (POS connection, menu import, initial site build) on the owner's behalf during the committed onboarding window.

**Entry Point:**  Admin onboarding project console.

**DATA DISPLAYED**

* Onboarding project status against the committed 5-business-day window

* Flagged data issues (e.g., malformed POS menu export with missing prices)

**FUNCTIONALITY, USER ACTIONS & SYSTEM BEHAVIOR**

| User Action | Expected System Behavior |
| :---- | :---- |
| Specialist completes a milestone | Owner is notified the milestone is ready for review; the platform cannot go fully live (guest-facing ordering enabled) until the owner has explicitly approved menu, pricing, and payment-configuration milestones. |

**BUSINESS RULES**

* Every specialist action performed on an owner's behalf during migration is audit-logged.

**EDGE CASES & ERROR HANDLING**

* A legacy menu is too complex for the standard window: the specialist flags it as a "white-glove complex" case and transparently extends the timeline rather than delivering a rushed, error-prone import.

## **7\. Audit Log & Support Access Console**

**Module:** *Platform-wide*    **Applies to:** *Platform Admin*

Give admin staff a single place to review every logged action across every module for support diagnosis and compliance review.

**Entry Point:**  Admin console.

**DATA DISPLAYED**

* Full action log: actor, role, timestamp, action, reason code where applicable, before/after values where relevant

**BUSINESS RULES**

* Every Platform Admin action against a restaurant's data is itself logged, including read access to sensitive fields, so admin activity is auditable on the same terms as any other role.

