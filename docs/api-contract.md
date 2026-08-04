# Resume API contract

The browser calls same-origin `/api/v1/*` paths. In production, EC2 nginx
forwards the allowlisted paths to Django over the private Tailscale connection;
the browser does not connect directly to a private API address.

## Loading model

- The homepage renders from approved local content and makes no required API call.
- A navigation or call-to-action click loads its matching API resource once.
- Detail views render the corresponding API object or array.
- Empty collections render a friendly empty state.

## Aggregate fields

### `/api/v1/resume/`

Returns one aggregate object with:

- `profile`: object
- `about`: object
- `experience`: array
- `volunteering`: array
- `projects`: array
- `education`: array
- `certifications`: array
- `military_service`: array
- `skill_categories`: array

### `profile`

Returns one object with:

- `id`
- `full_name`
- `professional_title`
- `headline`
- `location`
- `email`
- `years_of_experience`
- `resume_summary`
- `full_summary`
- `updated_at`

### `about`

Returns one object with `summary`, `introduction`, `updated_at`, and `sections`.
Each section contains publication and ordering metadata plus `section_type`,
`title`, `slug`, `summary`, and `body`.

### `experience`

Returns an ordered array of roles. Core fields include:

- `company`, `job_title`, `location`, and `employment_type`
- `start_date`, `end_date`, and `is_current`
- `role_summary` and `full_description`
- `sections`: detailed role topics
- `accomplishments`: featured results and optional metrics
- `is_published`, `is_featured`, and `sort_order`

Dates are ISO `YYYY-MM-DD` strings. Current-role `end_date` is null.

### `projects`

Returns an ordered array with `name`, `project_type`, `short_summary`,
`full_description`, `problem_statement`, `solution_summary`, `outcome`,
repository/demo URLs, dates, and publication/feature flags.

### `education`

Returns an ordered array with `institution`, `degree`, `field_of_study`,
`location`, `status`, `start_date`, `completion_date`, `summary`, and
`full_description`.

### `certifications`

Returns an ordered array with `name`, `issuing_organization`,
`credential_number`, `status`, issued/expiration dates, `verification_url`,
`summary`, `full_description`, and feature/publication flags.

### `military_service`

Returns an ordered array with `branch`, `role`, `location`, `start_date`,
`end_date`, `summary`, `full_description`, and feature/publication flags.

### `skill_categories`

Returns ordered skill-category objects with `name`, `slug`, summaries, and a
nested `skills` array. Each skill includes `name`, `slug`, optional proficiency
and years, summaries, and publication/feature flags.

Current categories are Enterprise Architecture, Networking and Infrastructure,
Network Automation and Software, Security and Observability, and Operations
and Leadership.

### `volunteering`

Currently returns an empty array. The frontend must not assume records exist.

## Content issues to resolve at the API source

- The API currently includes CI/CD, but Adrian confirmed that it is not one of
  his skills. The frontend explicitly filters it from skill and aggregate
  responses so it is never displayed.
- Arista AVD is approved for the site and will be added to the API. The static
  homepage already includes it; API-driven views will use the published record
  when available.
- Military-service `start_date` and `end_date` values are currently null.
- Certification `credential_number` is blank, while the profile headline
  contains CCIE #51766.

The frontend should not invent replacements for missing backend values. The
approved static homepage remains stable; API detail views reflect published API
records after these source-data corrections.

## Private content studio

`POST /api/v1/admin/token/` accepts the administrator username, password, and
current TOTP authenticator code. MFA-marked bearer tokens authorize the private
`/api/v1/studio/content/*` routes. Those routes expose every resume model and
its field schema, retain unpublished draft snapshots, validate model fields at
publication time, and apply the selected draft order only when records publish.
