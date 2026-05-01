#!/bin/sh
# Substitute env vars into nginx config at runtime
PORT=${PORT:-80}
BACKEND_URL=${BACKEND_URL:-"http://localhost:5000"}

sed -i "s|NGINX_PORT|${PORT}|g" /etc/nginx/conf.d/default.conf
sed -i "s|BACKEND_URL|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf

echo "Starting nginx on port ${PORT}, proxying /api to ${BACKEND_URL}"
nginx -g "daemon off;"
