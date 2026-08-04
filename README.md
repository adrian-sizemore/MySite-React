# Adrian Sizemore — React resume site

Responsive React/Vite front end for Adrian Sizemore's professional resume and
portfolio. The homepage uses approved local content and design assets. Detail
pages read the private Django API through the same-origin EC2 proxy.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `DEV_API_PROXY_TARGET` in `.env.local` to an API address reachable from the
development machine. React itself continues to use the same-origin path:

```text
VITE_API_BASE_URL=/api/v1
DEV_API_PROXY_TARGET=http://100.76.5.32:8080
```

## Validation

```bash
npm run lint
npm test
npm run build
```

## Content behavior

- The front page does not require the API to render.
- The browser never connects directly to the private Django API.
- About, experience, military service, projects, and resume content use
  same-origin `/api/v1/*` calls that EC2 proxies to Django.
- Empty API collections display a content-coming-soon state.
- Failed requests display a retry action.
- Successful responses are cached for the current browser session.
- The private Content Studio uses the existing administrator password and
  six-digit authenticator code.
- Draft changes are stored separately from live model records until Publish is
  selected. Draft ordering is also private until the affected records publish.
- Five-minute access tokens renew within the current browser tab for up to
  eight hours; closing the tab clears the studio credentials.
- CI/CD is explicitly filtered from skill responses because it is not an
  approved skill.

The observed API serializer contract and known source-data caveats are recorded
in `docs/api-contract.md`. Production network and proxy instructions are in
`deploy/README.md`.
