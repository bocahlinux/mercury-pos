# 🚀 Deployment Guide — Mercury POS

## Overview

Mercury POS can be deployed using **Docker Compose** (recommended) or **manual setup**.

## Option 1: Docker Compose (Recommended)

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2

### Quick Deploy

```bash
# 1. Clone the repo
git clone https://github.com/bocahlinux/mercury-pos.git
cd mercury-pos

# 2. Create .env file
cp backend/.env.example backend/.env
# Edit backend/.env → set SECRET_KEY, DB_PASSWORD, etc.

# 3. Build and start all services
docker compose up -d --build

# 4. Create superuser (optional)
docker compose exec backend python manage.py createsuperuser

# 5. Check status
docker compose ps
```

### Services

| Service | Port | Description |
|---|---|---|
| nginx | 80 | Reverse proxy (entry point) |
| backend | 8000 | Django API (internal) |
| web | 5173 | React frontend (internal) |
| db | 5432 | PostgreSQL database (internal) |

### Access

- **Web App**: `http://your-server/`
- **API Docs**: `http://your-server/api/docs/`
- **Admin**: `http://your-server/admin/`

### Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f web
docker compose logs -f nginx

# Restart a service
docker compose restart backend

# Stop all
docker compose down

# Stop and remove data
docker compose down -v

# Run migrations
docker compose exec backend python manage.py migrate

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Shell into backend
docker compose exec backend bash

# Database backup
docker compose exec db pg_dump -U mercury mercury_pos > backup.sql

# Database restore
docker compose exec -T db psql -U mercury mercury_pos < backup.sql
```

## Option 2: Manual Setup (VPS)

### Server Requirements

- Ubuntu 22.04+ / Debian 12+
- 2 GB RAM minimum (4 GB recommended)
- 20 GB disk

### Step 1: Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.11 python3.11-venv python3-pip \
    postgresql postgresql-contrib nginx nodejs npm git
```

### Step 2: Setup Database

```bash
sudo -u postgres psql -c "CREATE USER mercury WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE mercury_pos OWNER mercury;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mercury_pos TO mercury;"
```

### Step 3: Setup Backend

```bash
cd /opt
sudo git clone https://github.com/bocahlinux/mercury-pos.git
cd mercury-pos/backend

python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your settings
nano .env
```

`.env` file:
```env
DEBUG=False
SECRET_KEY=your-very-long-random-secret-key-here
DATABASE_URL=postgres://mercury:your_password@localhost:5432/mercury_pos
ALLOWED_HOSTS=your-domain.com,localhost
CORS_ALLOWED_ORIGINS=https://your-domain.com
JWT_ACCESS_TOKEN_MINUTES=60
```

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### Step 4: Setup Gunicorn (systemd)

Create `/etc/systemd/system/mercury-pos.service`:

```ini
[Unit]
Description=Mercury POS Gunicorn
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/mercury-pos/backend
Environment="PATH=/opt/mercury-pos/backend/venv/bin"
ExecStart=/opt/mercury-pos/backend/venv/bin/gunicorn \
    mercury_pos.wsgi:application \
    --bind unix:/run/mercury-pos.sock \
    --workers 2 --threads 4 --timeout 60

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable mercury-pos
sudo systemctl start mercury-pos
```

### Step 5: Build & Deploy Web Frontend

```bash
cd /opt/mercury-pos/web
npm install
npm run build

# Copy dist to nginx web root
sudo cp -r dist/* /var/www/mercury-pos/
```

### Step 6: Configure Nginx

Create `/etc/nginx/sites-available/mercury-pos`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API
    location /api/ {
        proxy_pass http://unix:/run/mercury-pos.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static & Media
    location /static/ { alias /opt/mercury-pos/backend/staticfiles/; }
    location /media/ { alias /opt/mercury-pos/backend/media/; }

    # Frontend
    location / {
        root /var/www/mercury-pos;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mercury-pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `DEBUG` | Debug mode | `False` |
| `SECRET_KEY` | Django secret key | (required) |
| `DATABASE_URL` | Database connection URL | `sqlite:///db.sqlite3` |
| `ALLOWED_HOSTS` | Comma-separated hostnames | `*` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | (empty) |
| `JWT_ACCESS_TOKEN_MINUTES` | JWT access token lifetime | `60` |

## Troubleshooting

### 502 Bad Gateway
```bash
# Check gunicorn is running
sudo systemctl status mercury-pos
# Check logs
sudo journalctl -u mercury-pos -f
```

### Static files not loading
```bash
cd /opt/mercury-pos/backend
source venv/bin/activate
python manage.py collectstatic --noinput
sudo chown -R www-data:www-data staticfiles/
```

### Database connection error
```bash
# Test connection
psql -h localhost -U mercury -d mercury_pos
# Check postgresql is running
sudo systemctl status postgresql
```
