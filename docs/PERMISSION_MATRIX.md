# RestruRent Permission Matrix

Permission labels: `Y` allowed, `Scoped` constrained to the screen/module rule, `View` view-only, `Approval` approval/rejection only, `No` not allowed.

## Global Permission Rules

- Guests only access their own data and orders.
- FOH/Kitchen staff guest access is view-only and task-scoped: name, tier, allergy flags, last order/visit context; no card data or complete order history unless role-elevated.
- Every merge/split is reversible for 30 days and requires a reason code.
- Auto-merge requires at least 85% match confidence; lower confidence goes to Platform Admin review.
- AI-generated guest-facing content is not auto-published without explicit human approval unless Owner/GM enabled a defined low-risk auto-publish category.
- Configuration changes affecting guest-facing pricing, availability, or brand compliance are audit-logged and reversible unless explicitly stated otherwise.
- Platform Admin actions, including sensitive reads, are always audit-logged.

## Core Permissions By Sub-Role

| Sub-Role | View | Create | Edit | Delete / Anonymize | Merge | Split | Export | Approve | Reject | Publish | Configure | Toggle Availability | Manual Override |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Anonymous Guest | Own browsing/cart/order status | Cart/order attempt | Own cart | No | No | No | No | No | No | No | Own preferences only if captured | No | No |
| Authenticated Guest | Own orders, loyalty, preferences | Orders, privacy requests | Own addresses/payment/preferences | Request erasure | No | No | No | No | No | No | Own notification preferences | No | No |
| Owner/GM | Y for own location | Y | Y | Guest anonymize; account offboarding | Y | Y | Y | Y | Y | Y | Y | Y | Y where specified |
| Marketing Manager | Marketing/guest/campaign views | Campaigns, segments, drafts | Campaign content, promo content, AI copy | No guest delete | No | No | Segment export only | Scoped, where owner delegated | Scoped | Scoped; not final where owner approval required | Marketing-scoped only | No | No |
| Franchise HQ / Regional Director | Aggregated and per-location where allowed | National templates, campaigns, policies | Guardrails/templates | No local data delete without local approval | No unless delegated/support flow | No unless delegated/support flow | Scoped to legal permissions | Y for overrides/policies | Y for overrides/policies | National push | Y for guardrails/templates/policies | No direct staff 86 unless acting as location role | Y for guardrail exceptions |
| Franchisee / Location GM | Own location/compliance | Local requests/corrections | Inside guardrails | Own legal entity only | Scoped if Owner/GM | Scoped if Owner/GM | Own legal entity only | Local milestone/content approvals | Local corrections/disputes | Local allowed content | Inside guardrails | Y if role has 86 access | Request exception; not approve out-of-band |
| Compliance Officer | Compliance evidence/status | Policies | Policies/consequence config | No | No | No | Compliance reports only | Y | Y | No guest content publish | Compliance policies | No | Consequence path per policy |
| Shift Manager | Operations, schedule, own/team where allowed | Shift-fill, schedule adjustments, recognition | Schedule suggestions, 86 status | No | No | No | No | Recognition/shift operations | Scoped | Schedule publish where specified | No labor budget targets | Y | Delivery/order status during service if assigned |
| FOH / Kitchen Staff | Task-scoped guest/order/menu views | Orders actions, loyalty redemptions | Cart/order operational state, availability | No | No | No | No | No | No | No | No | Y | Delivery surcharge/status only if specified |
| Dispatcher | Orders/deliveries | Reassignments | Delivery assignment/status | No | No | No | No | No | No | No | No zone/pricing config | No | Y during service |
| Kitchen / Inventory Staff | Inventory predictions/counts | Counts, dismissals with reason | Counts | No | No | No | No | No | No | No | No lead-time/sensitivity config | Y if assigned | No |
| Staff Member | Own schedule/performance/earnings | Instant-pay request | Own availability | No | No | No | No | No | No | No | No | No | No |
| New Staff Member | Role-scoped training | No | No | No | No | No | No | No | No | No | No | No | No |
| Owned Driver | Assigned delivery/route/status | Accept/reject/status updates | Own delivery status | No | No | No | No | No | No | No | No | No | Delivery status only |
| Gig-Network Driver | Same as Owned Driver | Same as Owned Driver | Same as Owned Driver | No | No | No | No | No | No | No | No | No | Delivery status only |
| Platform Admin | Technical/support data | Corrections/support actions | Data-quality corrections | Erasure processing | Y below auto threshold | Y where support process allows | Support/compliance only | Support/admin queues | Support/admin queues | Infrastructure only, not owner content without ticket/permission | Infrastructure/support | No | Circuit-breaker/support interventions |
| Migration/Onboarding Specialist | Onboarding project data | Setup milestones/imports | Setup on owner's behalf | No | No | No | No | Milestone preparation only; owner approves go-live | Flag/reject malformed import for correction | No final guest-facing go-live | Setup within onboarding | No | Flag complex cases |

## Permission Restrictions By Module

| Module | Important Restrictions |
|---|---|
| Guest Graph | Marketing Manager cannot delete or merge guest records. Franchise HQ cannot delete individual location data without local approval. Staff cannot merge/split/export/delete. Platform Admin manual merge is atomic and requires reason code. |
| Master Menu & Channel Sync | Master Menu is canonical. Staff can toggle availability only. Owner/GM has item content/pricing rights. Franchise location price override outside HQ band requires approval. Deleted or 86'd items must gracefully update active carts. |
| Direct Ordering Site & Branded App | Guest checkout validates delivery zone, hours, minimum order, fulfillment availability, modifier rules, and payment before order creation. Marketing Manager cannot change payment/checkout settings. |
| Campaign Studio | Campaigns target Guest Graph segments, not raw lists. Sends must respect opt-in, quiet hours, and frequency caps. Zero eligible recipients blocks send. High-volume deliverability warnings auto-pause. |
| Loyalty & Rewards Builder | Single cross-channel loyalty ledger. Staff cannot edit earn rate/catalog/expiry. Manual balance adjustments require reason codes; above threshold requires owner approval. |
| AI Website & Local SEO Autopilot | AI-generated content requires factual consistency against Master Menu/location data. Owner/GM can approve/reject and override. Marketing Manager cannot change core business fields without owner approval. |
| Reputation & Review Engine | AI replies never auto-post without explicit human approval. Health/safety flagged reviews escalate immediately and require owner-entered resolution note before resolved. |
| Delivery & Fulfillment Management | Owner/GM configures zones/pricing/partners. Dispatcher/FOH can only manually reassign drivers and override order status during service. Drivers only accept/reject, view route, and update status. |
| AI Operations Copilot | Labor-law constraints are hard constraints. Shift Manager cannot change labor budget targets. Insufficient data must be labeled low-confidence. |
| Multi-Location & Franchise Control Center | Overrides inside HQ band auto-apply; outside band requires explicit HQ approval. National push partial failures are isolated per location. |
| Franchise Compliance Center | Violations are queued, not silently auto-blocked. Consequences above low severity require HQ review. Franchisees cannot alter policies. |
| Insights & Reporting | Monetary figures must reconcile to the order ledger. Data gaps must be annotated instead of hidden. Legal entities cannot be blended without consolidation permission. |
| Inventory Prediction | Owner/GM configures tracked items, lead times, sensitivity. Kitchen staff can enter counts and dismiss alerts with reasons only. Confidence must be surfaced. |
| Guest Financial Products | Opt-in per restaurant, explicit terms acceptance, jurisdiction-gated by licensed financial partner. Instant pay cannot exceed verified already-earned wages. |
| Migration Guarantee | Export cannot be blocked or gated by retention offers. Export respects consent, erasure, and legal-entity boundaries. |
