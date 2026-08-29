# News & Schemes — Content Workflow

The Home screen has two tabs, fed by two different workflows.

| Tab | Section | Source | Who controls it |
|-----|---------|--------|-----------------|
| **Sarkari Yojana** | `yojana` | You curate it | **Manual** (you decide) |
| **Khedut Samachar** | `samachar` | Agriculture news feed | **Automatic** (fetched + translated) |

Everything is stored in **English + Hindi + Gujarati**, and the app shows whichever language the user has selected.

---

## 1. Sarkari Yojana (schemes) — you manage these

Schemes change slowly and must be accurate, so you curate them.

**To add or edit a scheme:**
1. Open **`data/schemes.js`** and add/edit an entry (write it in **English**).
2. From the `APMC` folder, publish it:
   ```bash
   npm run seed:news
   ```
   (adds new schemes; skips ones that already exist)

   To **replace everything** with exactly what's in the file (after edits/removals):
   ```bash
   npm run seed:news -- --reset
   ```
3. Reload the app → it appears under **Sarkari Yojana**.

Hindi & Gujarati are generated automatically on publish — you only write English.

---

## 2. Khedut Samachar (news) — automatic

Agriculture news is fetched, filtered to farming topics, translated, and stored.

**It runs on its own** every 6 hours (cron, while the backend server is running).

**To refresh manually / on demand** (from `APMC`):
```bash
npm run news:refresh            # add the latest agri news
npm run news:refresh -- --reset # wipe old news first, then fetch fresh
```

**Source:** free **Google News RSS** (agriculture query) by default — no key needed.
To use NewsData.io instead, add to `.env`:
```
NEWS_SOURCE=newsdata
NEWSDATA_API_KEY=your_key
```
(Note: the NewsData **free** tier returns broad news and no article bodies, so Google News RSS is recommended.)

---

## 3. Language / translation

- Content is stored per language: `title/summary/body = { en, hi, gu }`.
- The app requests `GET /news` and shows the user's **selected** language (Profile → Language).
- Translation uses the free Google Translate util. **Schemes** (few items) translate reliably; **auto news** is best-effort — if the free API rate-limits, that item falls back to English.
- For guaranteed translation at scale, switch to the paid **Google Cloud Translation API** (has a free monthly quota).

---

## 4. API reference

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET`  | `/api/v1/news?section=yojana\|samachar` | public | app reads news |
| `POST` | `/api/v1/news` | admin | add one item (auto-translated) |
| `POST` | `/api/v1/news/refresh` | open (cron) | fetch latest agri news |

## 5. Quick recipes

- **Add a scheme:** edit `data/schemes.js` → `npm run seed:news`
- **Fix a wrong scheme:** edit `data/schemes.js` → `npm run seed:news -- --reset`
- **Get fresh news now:** `npm run news:refresh`
- **Clean bad news + refetch:** `npm run news:refresh -- --reset`
