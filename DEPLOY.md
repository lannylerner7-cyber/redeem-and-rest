# Deploying ScousGiftCardExchange on your own VPS

The whole site runs in one container. The database, member accounts and card
photos stay on the existing cloud backend — the container simply talks to it.

## 1. Requirements

- A VPS with Docker and the Docker Compose plugin
  (`curl -fsSL https://get.docker.com | sh`)
- Your domain pointed at the server's IP
- At least 2 GB RAM for the build step

## 2. Get the code and the settings

```bash
git clone <your-repo-url> scous
cd scous
cp .env.example .env
nano .env        # fill in every value
```

`.env` holds everything the app needs: the database URL and keys, the
Cloudflare mail settings, the sender name and reply-to address, the public site
address and the port.

## 3. Start it

```bash
docker compose up -d --build
docker compose logs -f app       # watch it boot
```

The site is now on `http://your-server-ip:3000`.

## 4. Put it on your domain with HTTPS

Install Nginx and Certbot, then use this site file
(`/etc/nginx/sites-available/scous`):

```nginx
server {
  listen 80;
  server_name scousgiftcardexchange.com www.scousgiftcardexchange.com;

  client_max_body_size 25m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
ln -s /etc/nginx/sites-available/scous /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d scousgiftcardexchange.com -d www.scousgiftcardexchange.com
```

## 5. Day to day

| Task | Command |
| --- | --- |
| Update to the latest code | `git pull && docker compose up -d --build` |
| Restart | `docker compose restart app` |
| Stop | `docker compose down` |
| Logs | `docker compose logs -f app` |
| Health | `docker compose ps` (shows `healthy`) |

## Notes

- Nothing secret is stored inside the image; every credential is read from
  `.env` when the container starts.
- Keep `.env` out of Git (it is already ignored).
- Outbound port 465 must be open on the VPS, otherwise sign-in codes and alert
  emails cannot be sent. Some providers block it by default — ask support to
  open it.
