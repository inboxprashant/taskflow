#!/bin/sh
PORT=${PORT:-80}
BACKEND_URL=${BACKEND_URL:-"http://localhost:5000"}

cat > /etc/nginx/conf.d/default.conf << NGINXCONF
server {
    listen ${PORT};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass ${BACKEND_URL};
        proxy_http_version 1.1;
        proxy_set_header Host \$proxy_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript;
}
NGINXCONF

echo "Nginx config written. PORT=${PORT}, BACKEND_URL=${BACKEND_URL}"
nginx -t && nginx -g "daemon off;"
