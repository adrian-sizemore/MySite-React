# Landing and About-site deployment

Production EC2 target: `ec2-user@100.112.25.79` (Tailscale). Use this address
for deployment and verification instead of the instance's public hostname.

The same nginx container serves the personal landing page at
`adriansizemore.net`, the React résumé at `about.adriansizemore.net`, and a
permanent redirect from the former `resume.adriansizemore.net` hostname.

The browser calls same-origin `/api/v1/*` URLs. Public content endpoints are
read-only. The private `/api/v1/admin/token/*` and `/api/v1/studio/*` routes use
the backend's existing password-plus-authenticator MFA. The nginx container
forwards these routes to the private backend over Tailscale; the backend address
is never included in the browser bundle.

The public path is:

```text
browser -> Cloudflare Tunnel -> EC2 nginx -> Tailscale -> Django API
```

## 1. Restrict the tailnet

Merge `tailscale-policy.hujson` into the policy in the Tailscale admin console.
Do not replace unrelated policy sections. Remove or narrow broader grants that
would also let other sources reach `tag:resume-api` on port 8080; grants are
additive.

Register or retag the nodes so that:

- the EC2 web server has `tag:react-ec2`;
- the backend server has `tag:resume-api`.

The backend must expose port 8080 only on its Tailscale interface (or otherwise
block port 8080 on its public/LAN interfaces). Keep Django authentication and
authorization enabled; the network policy authenticates the server, not the
person using the site.

## 2. Configure the EC2 proxy

On EC2, create the deployment environment from the example:

```shell
cd /opt/resume-stack/app/deploy
cp .env.example .env
```

Set `BACKEND_ORIGIN` in `.env` to the backend's Tailscale address, including its
scheme and port. Do not add a trailing path:

```text
BACKEND_ORIGIN=http://100.76.5.32:8080
```

Test private connectivity from EC2 before starting the site:

```shell
tailscale ping 100.76.5.32
curl --fail --show-error http://100.76.5.32:8080/api/v1/resume/
```

## 3. Build and run

The React production build defaults to `/api/v1`; no private address is compiled
into JavaScript.

```shell
npm ci
npm test
npm run lint
npm run build
mkdir -p deploy/site
cp -R dist/. deploy/site/
docker compose -f deploy/docker-compose.yml config
docker compose -f deploy/docker-compose.yml up -d
```

The container listens only on `127.0.0.1:8080` for the existing Cloudflare
Tunnel. `/admin`, unknown API paths, and public content mutation methods return
an error rather than being proxied. Studio mutations require a short-lived JWT
whose claims prove both password and authenticator verification.

## 4. Verify the boundary

From EC2, verify the landing page, About site, API, and legacy redirect:

```shell
curl --fail --show-error --header 'Host: adriansizemore.net' \
  http://127.0.0.1:8080/
curl --fail --show-error --header 'Host: about.adriansizemore.net' \
  http://127.0.0.1:8080/
curl --fail --show-error --header 'Host: about.adriansizemore.net' \
  http://127.0.0.1:8080/api/v1/resume/
curl --head --header 'Host: resume.adriansizemore.net' \
  http://127.0.0.1:8080/
```

The final command must return `301` with a location under
`https://about.adriansizemore.net`. From another tailnet device, a direct
connection to the backend's port 8080 must fail.
