# Free Deployment — Render + GitHub Actions

This backend is deployed for **$0** using two free services:

| Piece | Free service | Role |
|-------|--------------|------|
| **REST API** (for the mobile app) | **Render** free web service | Serves `/api/v1/*`. Sleeps after ~15 min idle; wakes on the next request (cold start ~30–60s). |
| **Scheduled jobs** (sync / alerts / news / retention) | **GitHub Actions** | Runs the job scripts on a cron **directly against MongoDB Atlas** — independent of whether Render is awake. |

Because the free Render service sleeps, its in-process `node-cron` can't run reliably, so it's disabled (`ENABLE_AUTO_SYNC=false`) and GitHub Actions does the scheduling instead.

---

## Part 1 — Deploy the API to Render

**Option A (blueprint, easiest):**
1. Push this repo to GitHub (`jaythummar0408/Arrow-Game`).
2. Render dashboard → **New → Blueprint** → pick this repo. It reads [`render.yaml`](render.yaml).
3. When prompted, paste the **secret** env-var values (the `sync: false` keys — see the list in Part 3).
4. Deploy. Your API URL will be `https://apmc-backend.onrender.com` (or similar).

**Option B (manual):** New → **Web Service** → connect repo →
- Build command: `npm ci`
- Start command: `node server.js`
- Plan: **Free**
- Health check path: `/health`
- Add every env var from Part 3.

Verify: open `https://<your-app>.onrender.com/health` → should return `{"success":true,...}`.

---

## Part 2 — Set up the scheduled jobs (GitHub Actions)

The workflows are already in [`.github/workflows/`](.github/workflows/). They run **only after** you:

1. Push this repo to GitHub (workflows run from the **default branch**).
2. Add the repo **Secrets**: GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**. Add each secret from Part 3.
3. (Optional) Trigger any workflow manually the first time: **Actions** tab → pick a workflow → **Run workflow** (they all have `workflow_dispatch`).

### Schedule

| Workflow | When (IST) | Cron (UTC) | Does |
|----------|-----------|------------|------|
| `sync-and-alerts.yml` | 09:00, 12:00, 15:00, 18:00 | `30 3,6,9,12 * * *` | `fastBackfill.js 3` (refresh today + 2 days) → `checkPriceAlertsCron.js` |
| `daily-maintenance.yml` | 01:30 | `30 20 * * *` | `fastBackfill.js 5` → `purgeOldPrices.js` (35-day retention) |
| `news-update.yml` | 06:00 | `30 0 * * *` | `dailyUpdate.js` (news + schemes + 7-day purge + broadcast) |

> GitHub cron is best-effort and can be delayed 5–15 min under load. Scheduled workflows are auto-disabled after **60 days** of no repo activity (GitHub emails you) — a commit re-enables them.

---

## Part 3 — Environment variables / secrets

**On Render** (env vars) set all of these. **On GitHub** (Actions secrets) set the ones marked ✔.

| Key | GitHub secret? | Notes |
|-----|:---:|-------|
| `NODE_ENV` | — | `production` (set as plain value, not a secret) |
| `ENABLE_AUTO_SYNC` | — | `false` on Render (GitHub Actions does the cron) |
| `DB_NAME` | — | `APMC` |
| `API_VERSION` | — | `v1` |
| `DATA_GOV_BASE_URL` | — | `https://api.data.gov.in/resource` |
| `MONGO_URI_PROD` | ✔ | Atlas connection string |
| `MONGO_URI_DEV` | ✔ | (same string is fine) |
| `DATA_GOV_API_KEY` | ✔ | data.gov.in key |
| `FIREBASE_SERVICE_ACCOUNT` | ✔ | full service-account JSON on one line |
| `NEWSDATA_API_KEY` | ✔ | for the news job |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | ✔ | news images |
| `JWT_SECRET` / `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | — (Render only) | auth; not needed by the Action scripts |

The exact current values are in your local `.env` (which is git-ignored and must **never** be committed).

---

## Part 4 — Point the mobile app at the API

Update the app's API base URL to `https://<your-app>.onrender.com/api/v1`. Note the first request after idle is slow (Render cold start) — a splash/loading state covers it.

---

## Security

- `.env` is in `.gitignore` — keep it that way. Never `git add -f .env`.
- These credentials have been copied around locally; **rotate them** before going live: MongoDB Atlas password, the Firebase service-account key, Cloudinary API secret, and the data.gov.in / NewsData keys. Then update the values in Render + GitHub Secrets.

---

## Caveats of the free tier

- **Cold starts:** first request after ~15 min idle waits ~30–60s.
- **No always-on cron in the API process** — that's why GitHub Actions exists here. If you later move to a paid Render instance (~$7/mo), set `ENABLE_AUTO_SYNC=true` and you can delete these workflows (the in-process cron takes over).
- Render free web services also have a monthly instance-hour cap; a single low-traffic API stays within it.
