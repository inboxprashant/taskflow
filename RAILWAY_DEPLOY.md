# Deploy TaskFlow on Railway (Free)

## Prerequisites
- GitHub account
- Railway account → https://railway.app (sign up with GitHub)

---

## Step 1 — Push code to GitHub

On your local machine:

```bash
cd "C:\Users\Prash\Desktop\Project one"
git init
git add .
git commit -m "initial commit"
```

Create a new repo on https://github.com/new (name it `taskflow`, keep it public or private)

```bash
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Create Railway project

1. Go to https://railway.app → **New Project**
2. Choose **Deploy from GitHub repo**
3. Select your `taskflow` repo
4. Railway will detect it — **don't deploy yet**, click **Add services** first

---

## Step 3 — Add MySQL database

1. In your Railway project → click **+ New Service**
2. Choose **Database → MySQL**
3. Railway creates a MySQL instance automatically
4. Click on the MySQL service → **Variables** tab → copy `MYSQL_URL`

---

## Step 4 — Deploy the Backend

1. Click **+ New Service → GitHub Repo → taskflow**
2. When asked for the root directory → set it to **`backend`**
3. Go to the backend service → **Variables** tab → add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | paste the `MYSQL_URL` from step 3 |
| `JWT_SECRET` | any long random string e.g. `xK9#mP2$qL8nR5vT` |
| `FRONTEND_URL` | leave blank for now, fill after step 5 |
| `PORT` | `5000` |

4. Railway auto-deploys. Watch **Deploy Logs** — you should see:
   ```
   Prisma migrate deploy
   Server running on port 5000
   ```

5. Click **Settings → Networking → Generate Domain** — copy this URL e.g.
   `https://taskflow-backend-production.up.railway.app`

---

## Step 5 — Deploy the Frontend

1. Click **+ New Service → GitHub Repo → taskflow**
2. Set root directory to **`frontend`**
3. Go to **Variables** tab → add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend-url.up.railway.app/api` |

4. Railway builds and deploys. Go to **Settings → Networking → Generate Domain**
   Copy the frontend URL e.g. `https://taskflow-frontend-production.up.railway.app`

---

## Step 6 — Update CORS on backend

Go back to the **backend service → Variables** and update:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | `https://taskflow-frontend-production.up.railway.app` |

Railway will redeploy automatically.

---

## Step 7 — Seed demo data (optional)

In the backend service → click **Deploy → Run Command**:
```
node src/seed.js
```

Or use Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway run --service backend node src/seed.js
```

---

## Done!

Open your frontend URL in the browser. Login with:
- **Admin**: alice@demo.com / password123
- **Member**: bob@demo.com / password123

---

## Free Tier Limits

Railway gives **$5 free credit/month** which covers:
- ~500 hours of backend runtime
- MySQL database
- Frontend hosting

The app will sleep after inactivity on the free tier. First request after sleep takes ~5s to wake up.
