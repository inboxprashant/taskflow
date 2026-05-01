# Deploying TaskFlow on AWS EC2

## 1. Launch EC2 Instance

- **AMI**: Ubuntu 24.04 LTS
- **Instance type**: t2.micro (free tier) or t3.small for better performance
- **Storage**: 20 GB gp3
- **Security Group — open these ports**:

| Port | Protocol | Source      | Purpose          |
|------|----------|-------------|------------------|
| 22   | TCP      | Your IP     | SSH              |
| 80   | TCP      | 0.0.0.0/0   | HTTP (frontend)  |
| 443  | TCP      | 0.0.0.0/0   | HTTPS (optional) |
| 5000 | TCP      | 0.0.0.0/0   | API (optional)   |

---

## 2. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

---

## 3. Install Docker & Docker Compose

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version
docker compose version
```

---

## 4. Upload Project to EC2

**Option A — Git (recommended)**
```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

**Option B — SCP from your local machine**
```bash
# Run this on your LOCAL machine
scp -i your-key.pem -r "C:\Users\Prash\Desktop\Project one" ubuntu@<EC2_PUBLIC_IP>:~/taskflow
```

---

## 5. Configure Environment Variables

```bash
cd ~/taskflow   # or wherever you uploaded the project

# Create the root .env file
cp .env.example .env
nano .env
```

Fill in your values:
```env
MYSQL_ROOT_PASSWORD=YourStrongPassword123!
MYSQL_DATABASE=team_task_manager
JWT_SECRET=a_very_long_random_secret_string_here
```

---

## 6. Build & Start All Containers

```bash
docker compose up -d --build
```

This will:
1. Pull MySQL 8.0 image
2. Build the backend image (installs deps, generates Prisma client, runs migrations)
3. Build the frontend image (builds React app, serves via Nginx)
4. Start all 3 containers

Check they're running:
```bash
docker compose ps
```

Expected output:
```
NAME                 STATUS
taskflow-db          Up (healthy)
taskflow-backend     Up
taskflow-frontend    Up
```

---

## 7. Seed Demo Data (optional)

```bash
docker compose exec backend node src/seed.js
```

---

## 8. Access the App

Open your browser:
```
http://<EC2_PUBLIC_IP>
```

API health check:
```
http://<EC2_PUBLIC_IP>/api/health
```

---

## Useful Commands

```bash
# View logs
docker compose logs -f

# View logs for one service
docker compose logs -f backend

# Restart a service
docker compose restart backend

# Stop everything
docker compose down

# Stop and delete database volume (WARNING: deletes all data)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build
```

---

## Optional: Add a Domain + HTTPS (Let's Encrypt)

If you have a domain pointing to your EC2 IP:

```bash
sudo apt install certbot -y

# Stop frontend container temporarily
docker compose stop frontend

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf to use SSL, then restart
docker compose up -d --build frontend
```

---

## Troubleshooting

**Backend can't connect to DB?**
```bash
docker compose logs db        # check MySQL started
docker compose logs backend   # check migration errors
```

**Port 80 already in use?**
```bash
sudo lsof -i :80
sudo systemctl stop apache2   # if Apache is running
```

**Prisma migration fails?**
```bash
docker compose exec backend npx prisma migrate deploy
```
