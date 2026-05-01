# Stage 1 — Build React
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — Nginx
FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY start.sh /start.sh
RUN chmod +x /start.sh
EXPOSE 80
CMD ["/bin/sh", "/start.sh"]
