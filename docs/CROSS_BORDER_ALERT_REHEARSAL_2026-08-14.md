# Synthetic cross-border distance-alert rehearsal

This rehearsal uses fictional case and subscriber records only. The country border is not a delivery boundary: each country keeps its own subscribers private, and a signed relay carries only the approved public alert target to the other country. Each destination applies the subscriber's chosen distance locally.

## Synthetic audience

- Canada: one Windsor-area subscriber inside 10 miles and one Toronto-area subscriber outside 100 miles.
- United States: one Detroit-area subscriber inside 10 miles and one Chicago-area subscriber outside 100 miles.
- All four addresses use the reserved `example.test` domain and cannot receive Internet email.
- The pre-existing real U.S. subscriber is unchanged and excluded from every synthetic target, even if the coordinates or all-alert preference would otherwise match.

The security boundary is an explicit private `synthetic` database column on both the case and subscriber. Names, email domains, and country are not authorization or audience boundaries.

## Migration order

United States:

1. `supabase/urgent_geo_alerts_20260808.sql`
2. `supabase/synthetic_cross_border_alert_rehearsal_20260814.sql`

Canada:

1. `supabase/canada/007_cross_border_alert_delivery.sql`
2. `supabase/canada/008_canada_urgent_alert_events.sql`
3. `supabase/canada/009_moderation_release_guards.sql`
4. `supabase/canada/010_synthetic_cross_border_alert_rehearsal.sql`

## Rehearsal sequence

1. Approve the fictional Canadian profile without a map.
2. Review and approve the deliberately approximate public map point as a separate decision.
3. Mark only that approved fictional profile as urgent.
4. Preview the audience. A Windsor target should match the local Windsor and cross-border Detroit rows, not Toronto, Chicago, or the real U.S. subscriber.
5. Do not execute an email-provider send during the preview rehearsal.
6. Hide the fictional publication and verify profile and map projections are empty for that case.

Canadian public alert sign-up stays locked until Canadian postal-area geocoding, bilingual consent, and privacy review are complete. Canadian postal codes must never be sent to the U.S. Census ZIP lookup.

## Forward-fix rollback

Do not remove the `synthetic` columns or restore name-prefix matching. If the rehearsal audience must be disabled, set only the four reserved `example.test` rows to `status='suppressed'` and `email_enabled=false`. Disable the admin dispatch UI if the signed relay or audience isolation fails; preserve private event and delivery ledgers for audit.
