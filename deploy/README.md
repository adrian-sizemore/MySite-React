# Static EC2 deployment

The EC2 container serves only the compiled React application and the published
`data/resume.json` snapshot. It never proxies `/api` or `/admin` to Django.

Build the application only after placing the serializer-approved export at
`public/data/resume.json`:

```shell
npm ci
npm test
npm run lint
npm run build
```

Copy the contents of `dist/` into `deploy/site/`, then start the static server:

```shell
docker compose -f deploy/docker-compose.yml up -d
```

The container listens only on `127.0.0.1:8080` for the Cloudflare Tunnel.
