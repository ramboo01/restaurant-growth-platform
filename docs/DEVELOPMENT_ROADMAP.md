# RestruRent Development Roadmap

This roadmap is dependency-aware and documentation-only. It does not authorize building UI, database tables, authentication, or additional frameworks in the current step.

## Phase 0 - Product And Technical Foundation

Modules: Global foundation, role model, audit concept, environment conventions.

Screens: None implemented yet; all 60 screens documented in `SCREEN_MASTER_LIST.md`.

Backend responsibilities: define module boundaries, service ownership, error/retry conventions, audit-event requirements, environment variables, MySQL/XAMPP connection plan for later, and role/sub-role vocabulary.

Frontend responsibilities: preserve scalable folder structure, define route naming conventions only, no screens.

Database areas later required: users/roles, restaurants/locations, audit events, feature flags/configuration.

Dependencies: confirmed stack and functional specification.

Completion criteria: blueprint docs approved; no business UI or schema created.

## Phase 1 - Identity, Tenant, Role, And Audit Foundation

Modules: Role model, tenant/location context, Platform-wide audit, notification preference primitives.

Screens: Supports future access to all screens; no dashboard dependency should be built before this.

Backend responsibilities: future role/sub-role authorization model, restaurant/location scoping, actor context, audit-log write contract, privacy/consent primitives.

Frontend responsibilities: future route protection patterns and role-aware navigation contract, without building the UI screens yet.

Database areas later required: accounts, staff users, guest identifiers, roles, permissions, locations, audit log, consent/preferences.

Dependencies: Phase 0.

Completion criteria: every future action can be assigned to an actor, role, location/legal entity, and audit requirement.

## Phase 2 - Master Menu And Channel Availability Core

Modules: Master Menu & Channel Sync, Scheduled Menus, 86 status.

Screens: `OWN-004`, `OWN-005`, `OWN-006`, `ST-002`; supports `GST-001`, `GST-002`, `GST-003`, `GST-004`.

Backend responsibilities: canonical menu model later, item/category/modifier validation, single item ID across channels, 86 field, scheduled menu activation, price override approval state, channel sync job states.

Frontend responsibilities: later owner menu management, staff 86 operational access, guest menu consumption routes.

Database areas later required: menus, categories, items, modifier groups/options, channel mappings, schedule rules, 86 audit, price override requests, sync status.

Dependencies: Phase 1.

Completion criteria: there is one canonical menu/availability concept that every order and channel can depend on.

## Phase 3 - Core Direct Ordering And Unified Order Queue

Modules: Direct Ordering Site & Branded App, Unified Order Queue, payment authorization flow concept, order status.

Screens: `GST-001` through `GST-006`, `ST-003`, `GST-005`.

Backend responsibilities: cart/order validation against Master Menu, minimum order/delivery radius/business-hours checks, payment-before-order-creation rule, order creation SLA target, order status events, orphaned payment reconciliation requirement.

Frontend responsibilities: later guest menu/cart/checkout/status surfaces and staff order queue; no advanced marketing or reporting yet.

Database areas later required: carts, cart items/modifiers, orders, order items/modifiers, order status events, payment attempts, refunds/reconciliation jobs, guest account links.

Dependencies: Phases 1 and 2.

Completion criteria: guest can eventually browse, configure item, cart, checkout, and staff can see/update the order lifecycle.

## Phase 4 - Guest Graph, Privacy, And Loyalty Ledger

Modules: Guest Graph, Loyalty & Rewards Builder, guest privacy requests.

Screens: `GST-007`, `GST-009`, `OWN-002`, `OWN-003`, `OWN-011`, `ST-001`, `ST-004`, `ADM-001`, `ADM-002`.

Backend responsibilities: deterministic/probabilistic guest matching, 85% merge threshold, reversible merge/split, anonymization workflow, single loyalty ledger, reward redemption validation, reason-coded adjustments.

Frontend responsibilities: later owner guest list/profile, staff limited lookup, guest loyalty/preferences, admin merge/correction queues.

Database areas later required: guest profiles, identifiers, merge candidates, merge history, anonymization requests, loyalty programs, reward catalog, loyalty ledger, manual adjustments.

Dependencies: Phases 1 and 3; loyalty depends on orders.

Completion criteria: unified guest and loyalty state can safely power ordering, POS redemption, campaigns, and reporting.

## Phase 5 - Delivery And Fulfillment

Modules: Delivery & Fulfillment Management.

Screens: `OWN-008`, `OWN-014`, `ST-005`, `DRV-001`, `DRV-002`, `DRV-003`, delivery portions of `GST-004` and `GST-005`.

Backend responsibilities: delivery zone and surcharge rules, fulfillment priority, routing decision records, driver offer/accept/reject, live status/location events, stale driver detection, dispatcher reassignment.

Frontend responsibilities: later owner configuration, dispatcher operational board, driver delivery surfaces, guest status degradation.

Database areas later required: delivery zones, fulfillment partners, driver profiles, delivery assignments, route/status events, reassignment history, surcharge overrides.

Dependencies: Phases 1, 2, and 3.

Completion criteria: delivery status is an attribute of an order and can power guest tracking, dispatcher intervention, and reporting.

## Phase 6 - Messaging, Campaigns, Reviews, And SEO

Modules: Unified Send Engine, Campaign Studio, Marketplace Arbitrage Alerts, AI Website & Local SEO Autopilot, Reputation & Review Engine.

Screens: `OWN-007`, `OWN-009`, `OWN-010`, `OWN-012`, `OWN-013`, `OWN-023`, `ADM-004`.

Backend responsibilities: opt-in and per-channel preference enforcement, quiet hours, frequency caps, campaign templates, attribution window, discount caps, review ingestion, AI draft approval workflow, listing sync/drift states, arbitrage suppression after repeated non-conversion.

Frontend responsibilities: later marketing manager/owner campaign, SEO, listing, and review approval surfaces.

Database areas later required: messages, campaigns, automations, segments, send attempts, opt-outs, discount codes, review records, reply approvals, listing connections, SEO drafts, arbitrage attempts.

Dependencies: Phases 1, 3, and 4. Campaigns depend on Guest Graph and orders; SEO depends on Master Menu/location data.

Completion criteria: outbound guest communication is unified and compliant, with human approval for guest-facing AI content.

## Phase 7 - Staff Operations, Scheduling, Inventory, Recognition, Financial Products

Modules: AI Operations Copilot, Unified 86 & Inventory Prediction Engine, Staff Retention Layer, Guest Financial Products, Onboarding & Micro-Training Layer.

Screens: `OWN-015`, `OWN-016`, `OWN-017`, `OWN-022`, `OWN-025`, `OWN-026`, `OWN-029`, `ST-006`, `ST-007`, `ST-008`, `ST-009`, `ST-010`, `ST-011`, `GST-008`, `ADM-006`.

Backend responsibilities: scheduling constraints, availability, shift-fill eligibility/broadcast, inventory count and prediction inputs, recognition approval, earned-wage verification through financial partner, onboarding milestones and staff invite role assignment.

Frontend responsibilities: later manager scheduling, staff schedule/shift-fill/counts/performance/instant-pay, onboarding checklist, contextual training.

Database areas later required: schedules, shifts, availability, call-outs, shift-fill requests, inventory counts, prediction results, recognition events, staff performance metrics, earned wages, instant-pay requests, onboarding projects/milestones.

Dependencies: Phases 1, 2, 3, and 4. Inventory depends on menu and orders; recognition depends on staff identity and order attribution; financial products depend on partner compliance.

Completion criteria: operational staff workflows can function without exposing admin, pricing, marketing, or financial configuration.

## Phase 8 - Reporting And Revenue Recovery

Modules: Insights & Reporting.

Screens: `OWN-020`, `OWN-021`, reporting portions of `OWN-009`, `OWN-013`, `OWN-023`, `ADM-005`.

Backend responsibilities: order-ledger reconciliation, commission baseline methodology, attribution, data completeness annotations, previous-successful-report retention, legal-entity consolidation boundaries.

Frontend responsibilities: later owner/franchise reporting surfaces and digest configuration.

Database areas later required: reporting aggregates, attribution records, digest subscriptions, report snapshots, data quality flags, baseline configuration.

Dependencies: Phases 3 through 7.

Completion criteria: financial and operational reports reconcile to source transactions and visibly handle data gaps.

## Phase 9 - Franchise, Compliance, Vertical Packs, Autonomous Promotions, Offboarding

Modules: Multi-Location & Franchise Control Center, Franchise Compliance Center, Vertical Packs, Autonomous Promotion Engine, Migration Guarantee.

Screens: `OWN-018`, `OWN-019`, `OWN-024`, `OWN-027`, `OWN-028`, `OWN-030`, `ADM-005`, `ADM-007`.

Backend responsibilities: multi-location hierarchy, legal-entity scoping, guardrails, override approvals, compliance scans/evidence, vertical-pack reversible defaults, autonomous goal budget ceilings, conflict detection, portable export generation.

Frontend responsibilities: later HQ/franchise scorecards, compliance queues, vertical pack selection, autonomous promotion monitoring, export/offboarding flow, admin audit view.

Database areas later required: brands, legal entities, guardrails, override requests, compliance policies, violations, vertical pack selections, autonomous goals, export jobs, support access logs.

Dependencies: Phases 1 through 8.

Completion criteria: multi-location controls, compliance, export guarantees, and advanced automation operate without violating local permissions or legal-entity boundaries.

## Open Questions / Ambiguities

- The specification states server-rendered storefront pages with schema.org markup, but the confirmed frontend is React.js and no additional rendering framework is approved yet.
- Authentication is intentionally not implemented now, but future OTP provider, account/session model, and anonymous-to-authenticated upgrade behavior need product decisions.
- Payment gateway, financial partner, POS providers, delivery/gig partners, and listing/review platforms are not selected.
- MySQL schema is intentionally deferred; later design must decide multi-tenant boundaries and legal-entity data isolation.
- "Staff Member" appears as a sub-role for recognition/instant pay but is not named in the initial Staff role list; it should be clarified as a general staff umbrella or separate sub-role.
- "Franchise Location", "Location Owner/GM", and "Compliance Officer" appear in screen-level applies-to language but are not all listed in the initial role table.
- Delivery Partner screens are derived from module permissions; the specification notes underlying UX documentation does not define those screens in detail.
- The configurable thresholds are unspecified: sync circuit breaker N, campaign spend/discount approval limit, staff manual loyalty adjustment ceiling, recognition thresholds, escalation windows, and export SLA exact values.
- Jurisdictional rules for financial products, labor constraints, consent, and marketplace solicitation require later legal/compliance input.
- The specification does not define whether owner/franchise/admin surfaces are separate apps or route namespaces inside one React frontend.
