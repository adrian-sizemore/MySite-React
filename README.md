# Adrian Sizemore — React resume site

Responsive React/Vite front end for Adrian Sizemore's professional resume and
portfolio. The homepage uses approved local content and design assets. Detail
pages load published content from the Django REST Framework API when opened.

## Local development

```bash
npm install
npm run dev
```

Vite proxies `/api` to `http://172.25.139.9:8080` by default. Override the API
location by copying `.env.example` to `.env.local` and changing:

```text
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://172.25.139.9:8080
```

## Validation

```bash
npm run lint
npm run build
```

## Content behavior

- The front page does not require the API to render.
- About, experience, military service, projects, and resume content load only
  after their links are opened.
- Empty API collections display a content-coming-soon state.
- Failed requests display a retry action.
- Successful responses are cached for the current browser session.
- CI/CD is explicitly filtered from skill responses because it is not an
  approved skill.

The observed API serializer contract and known source-data caveats are recorded
in `docs/api-contract.md`.
