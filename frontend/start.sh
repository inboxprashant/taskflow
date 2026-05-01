#!/bin/sh
# Replace $BACKEND_URL placeholder in nginx config with actual env var
# then start nginx

# Default to empty string if not set
BACKEND_URL=${BACKEND_URL:-"http://localhost:5000"}

# Write final nginx config with substituted values
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${PORT:-80};
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
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript;
}
EOF

echo "Starting nginx with BACKEND_URL=${BACKEND_URL} on PORT=${PORT:-80}"
nginx -g "daemon off;"
