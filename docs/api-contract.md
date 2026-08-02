# Static resume data contract

The Django backend exports the aggregate to `files/public/data/resume.json`.
The production web-image build copies it to `/data/resume.json`; browsers do
not connect to Django or any private API endpoint.

## Loading model

- The homepage renders from approved local content and makes no required API call.
- A navigation or call-to-action click loads the static aggregate once.
- Detail views select their corresponding object or array from that aggregate.
- Empty collections render a friendly empty state.

## Aggregate fields

### `/data/resume.json`

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
