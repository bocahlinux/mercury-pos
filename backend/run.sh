#!/bin/bash
# Mercury POS - Backend Run Script

cd /root/mercury-pos/backend

# Create venv if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Install deps
pip install -r requirements.txt -q 2>/dev/null

# .env
if [ ! -f ".env" ]; then
    cp .env.example .env
    # Generate a random SECRET_KEY
    SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))")
    sed -i "s|SECRET_KEY=change-me-in-production|SECRET_KEY=$SECRET|" .env
fi

# Install dj-database-url for production DATABASE_URL parsing
pip install dj-database-url -q 2>/dev/null

# Migrations
python manage.py makemigrations 2>/dev/null
python manage.py migrate --run-syncdb 2>/dev/null

echo ""
echo "✅ Mercury POS Backend Siap!"
echo "================================"
echo "🌐 API: http://localhost:8000/api/"
echo "🔧 Admin: http://localhost:8000/admin/"
echo "📚 Dokumentasi API: http://localhost:8000/api/"
echo ""
echo "Default superuser: admin@mercury.pos / admin123"
echo ""
