# Adrian Sizemore — React resume site

Responsive React/Vite front end for Adrian Sizemore's professional resume and
portfolio. The homepage uses approved local content and design assets. Detail
pages read published content from a serializer-approved static resume snapshot.

## Local development

```bash
npm install
mkdir -p public/data
cp /path/to/MySite/MySite/files/public/data/resume.json public/data/resume.json
npm run dev
```

The production image performs this copy automatically. To override the
same-origin snapshot location, copy `.env.example` to `.env.local` and change:

```text
VITE_RESUME_DATA_URL=/data/resume.json
```

## Validation

```bash
npm run lint
npm test
npm run build
```

## Content behavior

- The front page does not require the API to render.
- The browser never connects to the private Django API.
- About, experience, military service, projects, and resume content are
  projected from one static `/data/resume.json` aggregate.
- Empty API collections display a content-coming-soon state.
- Failed requests display a retry action.
- Successful responses are cached for the current browser session.
- CI/CD is explicitly filtered from skill responses because it is not an
  approved skill.

The observed API serializer contract and known source-data caveats are recorded
in `docs/api-contract.md`.
