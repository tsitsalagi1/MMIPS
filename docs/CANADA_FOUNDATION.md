# MMIPS Canada foundation

MMIPS Canada is a separate country implementation, not a generalized international form and not a renamed United States site.

## Country boundary

- Proposed public domain: `ca.mmips.com`
- Separate Vercel project: required before public activation
- Separate Supabase project/database/Auth/Storage: required before any Canadian case data exists
- Do not copy United States family, case, alert-subscriber, moderator, or administrator data into the Canadian project
- Do not place Canadian private data in the Global gateway
- Cross-border relay records may use only already-approved public information

## Canadian terminology and scope

The Canadian design distinguishes First Nations, Inuit and Métis Peoples rather than using U.S. Tribal terminology as a catch-all. When possible, MMIPS Canada should display the proper preferred name of a Nation, First Nation, Inuit region/community, or Métis government/community supplied or approved by the family/community.

The system serves Indigenous people of all genders. Canadian MMIWG2S+ terminology and policy context should inform safety and partnership work without narrowing MMIPS Canada to only one gender category.

## Canadian geography

- 10 provinces and 3 territories
- Canada Post postal codes in `ANA NAN` form
- Kilometres for radius/distance interfaces
- Locality/community and province/territory are first-class location fields
- Exact private location data must never be reused as public map coordinates
- Public map points must be moderator-approved approximate coordinates

## Reporting model

MMIPS Canada is not police and does not replace an official missing-person report.

Prelaunch public guidance:

1. If someone is in immediate danger, call 911.
2. Contact the police service of jurisdiction as soon as there are concerns for the person's safety; there is no 24-hour waiting period.
3. The RCMP National Centre for Missing Persons and Unidentified Remains (NCMPUR) supports national coordination, data sharing, analytics, and investigative services. It is not a substitute for the local police report.

## Privacy and data governance

Canadian case data may reveal identity, family relationships, Indigenous affiliation, location, police file information, and other highly sensitive personal information. Canadian privacy review must occur before real intake. Security controls must be proportionate to the sensitivity of the information and should exceed minimum legal requirements where family/community safety requires it.

Country activation requires an Indigenous-led Canadian governance and consultation process. The software should not presume that federal government terminology alone determines how a Nation/community wishes to be named or how information about its citizens should be governed.

## Official-source baseline used for the foundation

- Government of Canada — Provinces and territories: https://www.canada.ca/en/intergovernmental-affairs/services/provinces-territories.html
- Canada Post — Postal code structure: https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/postal-codes.page
- RCMP — Best practices for reporting a missing person: https://www.rcmp-grc.gc.ca/en/news/2023/best-practices-reporting-a-missing-person
- RCMP — National Centre for Missing Persons and Unidentified Remains: https://www.rcmp-grc.gc.ca/en/non-province-division/nhq?page=94%2C
- Library and Archives Canada — First Nations, Inuit and Métis terminology: https://www.canada.ca/en/library-archives/collection/research-help/indigenous-history/indigenous-terminology.html
- Office of the Privacy Commissioner of Canada — PIPEDA safeguards principle: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_safeguards/

## Activation gates

Canada remains `preparing` on the Global gateway until all of the following are complete:

1. Canadian Vercel project is deployed in `MMIPS_SITE_MODE=ca`.
2. `ca.mmips.com` is verified.
3. Separate Canadian Supabase project is created in a deliberately selected region.
4. Canadian schema/security policies are reviewed and applied only to that project.
5. Canadian intake questions and public-profile fields are reviewed with Canadian Indigenous partners/families.
6. English and French public safety, consent, corrections, privacy, and reporting language are ready.
7. Canadian police/reporting resource directory is verified province/territory by province/territory.
8. Synthetic Canadian dataset passes map/search/alert/security/load/accessibility rehearsal.
9. Canadian moderator roles require MFA/AAL2 and are isolated from U.S. administrators by default.
10. Real submissions and real-person publication remain explicitly locked until a separate Canadian release authorization.

## Next implementation slices

1. Canada prelaunch site mode and fail-closed routing.
2. Separate Canada schema blueprint.
3. Canada-specific public profile/search data model.
4. Canadian postal-code/geospatial search in kilometres.
5. Province/territory police/reporting directory.
6. English/French interface and consent copy.
7. Synthetic national rehearsal.
