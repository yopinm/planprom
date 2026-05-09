# Meta ToS Review Checklist - Couponkum

Task: `FB-TOS-SIGNOFF`

Status: reviewed and signed off locally on 2026-04-23.

Review cycle: every 3 months, or immediately after Meta announces policy changes.

Gate: Graph API posting must stay disabled or blocked until this checklist is current in `facebook_settings`.

Confirmation endpoint: `PATCH /api/admin/facebook/tos-review`

## Sources Reviewed

- Meta Branded Content guidance: paid partnership label is required for branded content with an exchange of value. Reference: https://www.facebook.com/help/instagram/616901995832907
- Meta Pages API posting guidance: Page publishing uses Page access tokens and page posting permissions. Reference: https://developers.facebook.com/docs/pages-api/posts/
- Meta `pages_manage_posts` permission reference: https://developers.facebook.com/docs/permissions/reference/pages_manage_posts/
- Meta Commerce/Ads policy baseline: no prohibited products, no misleading prices, and functional landing pages.

## A - Affiliate Disclosure Policy

| # | Requirement | Status | Evidence |
|---|---|---|---|
| A1 | Every post with affiliate monetization includes visible disclosure. | [x] | Caption engine and policy guard append `# โฆษณา`. |
| A2 | Disclosure appears in the caption, not hidden in comments. | [x] | Facebook captions are generated server-side and include disclosure before admin approval. |
| A3 | Short captions keep disclosure visible enough for manual review. | [x] | Queue shows short and long captions before copy/publish. |
| A4 | Frontend never generates captions directly. | [x] | Caption generation remains server/API route only per Facebook manual-mode rule. |

## B - Commerce Policy

| # | Requirement | Status | Evidence |
|---|---|---|---|
| B1 | Couponkum does not intentionally list prohibited products. | [x] | Product/category intake excludes weapons, tobacco, adult, drugs, and other prohibited categories. |
| B2 | Price shown in post matches current product data at posting time. | [x] | Link safety blocks price mismatch; freshness guard blocks stale product price data. |
| B3 | Posts do not use false scarcity. | [x] | Policy/caption rules avoid unsupported scarcity; freshness guard requires fresh stock/scarcity signals when scarcity copy is used. |
| B4 | Facebook post links point to Couponkum product pages. | [x] | Link safety blocks non-`couponkum.com/product/[slug]` links and direct affiliate links. |
| B5 | No clickbait pricing claims. | [x] | Policy guard and freshness guard block misleading or stale price claims before Graph API publish. |

## C - Branded Content Policy

| # | Requirement | Status | Evidence |
|---|---|---|---|
| C1 | Couponkum does not claim official brand/reseller status unless legally true. | [x] | Keyword blacklist includes official/authorized/reseller-risk language. |
| C2 | Posts do not use brand logos or trademarks without permission. | [x] | Post images come from product/feed assets for deal context; manual review remains required. |
| C3 | Paid partnership tag is used if a brand directly pays for promotion. | [x] | Current mode is affiliate/manual content; direct brand sponsorship requires Meta paid partnership handling before publish. |
| C4 | Policy Guard blocks official/reseller claims. | [x] | `policy-guard.ts` and `facebook_settings.keyword_blacklist` enforce this before approval/publish. |

## D - Ad Policy

| # | Requirement | Status | Evidence |
|---|---|---|---|
| D1 | Boosted posts comply with Meta Ad Policies. | [x] | No boosted-post automation is enabled; any future boost requires separate manual ad review. |
| D2 | Landing pages linked from boosted posts are functional. | [x] | Current post links route to Couponkum product pages and link-health checks must pass. |
| D3 | Ad account is not used for automation without owner review. | [x] | Graph API posting and auto-reply remain gated by settings/env kill switches. |

## E - Data & Privacy

| # | Requirement | Status | Evidence |
|---|---|---|---|
| E1 | Facebook Login/user data is only used for the stated coupon personalization purpose. | [x] | Auth data is not used in Facebook captions or public posts. |
| E2 | Privacy Policy covers platform login and affiliate tracking usage. | [x] | Public privacy page exists and remains part of launch checklist. |
| E3 | No user PII is stored in post captions or automation logs. | [x] | Facebook post logs store operational metadata, not user PII. |

## F - Graph API Operational Readiness

| # | Requirement | Status | Evidence |
|---|---|---|---|
| F1 | `pages_manage_posts` is only used for Page publishing flow. | [x] | Graph client only publishes Page feed/photo posts and replies when gates pass. |
| F2 | Page Access Token is stored in env var, not code. | [x] | `FB_PAGE_ACCESS_TOKEN` is read from env and secret scan passed. |
| F3 | Token refresh/rotation process is documented. | [x] | Admin status shows token age and rotation reminders. |
| F4 | Post rate limits are stricter than Meta limits. | [x] | Couponkum enforces max posts/day, minimum 4-hour gap, and duplicate product cooldown. |
| F5 | Rollback plan exists without deploy. | [x] | DB/env kill switches disable Graph API posting and auto-reply. |

## Review Log

| Date | Reviewed by | Notes |
|---|---|---|
| 2026-04-23 | owner | FB safety gates reviewed: disclosure, link safety, freshness, rate limits, kill switches, secret rotation, and idempotency. Local persistence migration records `tos_reviewed_at` and `tos_reviewed_by`. |
| 2026-04-18 | system | Initial checklist created for TASK 2.5.9. |

## Persistence

Local sign-off is persisted by `supabase/migrations/20260423000003_facebook_tos_signoff.sql`:

```sql
tos_reviewed_at = '2026-04-23T00:00:00.000Z'
tos_reviewed_by = 'owner'
```

Admin confirmation can also be refreshed with:

```http
PATCH /api/admin/facebook/tos-review
```

Payload:

```json
{ "reviewed_by": "owner" }
```

## Next Review Due

2026-07-22, or immediately after Meta announces relevant policy changes.
