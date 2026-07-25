# ⚡ Page Pulse

> A professional, production-quality URL audit tool. Enter any public webpage URL and receive a structured health report in seconds.

---

## Features

| Metric | Description |
|---|---|
| **HTTP Status** | The HTTP status code returned by the target page |
| **Response Time** | Time (ms) from request to first byte |
| **Page Title** | Contents of the `<title>` tag |
| **Meta Description** | Contents of `<meta name="description">`, or `null` if missing |
| **H1 Count** | Number of `<h1>` elements (SEO: exactly 1 is ideal) |
| **Images Missing Alt** | Count of `<img>` tags with no `alt` or empty `alt=""` |
| **Approximate Word Count** | Estimated visible word count (scripts/styles excluded) |

---

## Project Structure

```
page-pulse/
├── server/
│   ├── index.js              # Express entry point
│   ├── routes/
│   │   └── audit.js          # POST /api/audit — thin route handler
│   ├── services/
│   │   └── auditor.js        # Fetch + cheerio parse logic
│   └── utils/
│       ├── errors.js         # AuditError class + error-shape builder
│       └── validate.js       # URL validation (before any network call)
├── public/
│   ├── index.html            # Single-page frontend
│   ├── style.css             # All styles
│   └── app.js                # Frontend logic
├── .gitignore
├── package.json
└── README.md
```

---

## API Contract

### `POST /api/audit`

**Request body**
```json
{ "url": "https://example.com" }
```

**Success — `200 OK`**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "auditedAt": "2026-07-25T06:00:00.000Z",
    "httpStatus": 200,
    "responseTimeMs": 432,
    "pageTitle": "Example Domain",
    "metaDescription": "An example page for illustration.",
    "h1Count": 1,
    "imagesMissingAlt": 0,
    "approximateWordCount": 312
  }
}
```

**Error — `4xx / 5xx`**
```json
{
  "success": false,
  "error": {
    "code": "TIMEOUT",
    "message": "The target page did not respond within 9 seconds."
  }
}
```

**Error codes**

| Code | HTTP Status | Trigger |
|---|---|---|
| `INVALID_URL` | 400 | Missing, malformed, or non-http(s) URL |
| `NOT_HTML` | 422 | `Content-Type` is not `text/html` |
| `TIMEOUT` | 504 | Fetch exceeded 9-second limit |
| `UNREACHABLE` | 502 | DNS failure, connection refused |
| `FETCH_ERROR` | 502 | Other network failure |
| `INTERNAL_ERROR` | 500 | Unexpected catch-all |

---

## Local Development

### Prerequisites
- Node.js ≥ 18

### Install & run

```bash
# Clone and enter the project
git clone https://github.com/YOUR_USERNAME/page-pulse.git
cd page-pulse

# Install dependencies
npm install

# Start development server (auto-restarts on file changes)
npm run dev

# Or start the production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment — Render (free tier)

**Why Render?** Render natively hosts Node.js web services with persistent URLs, environment variable management, and zero-config deploys from GitHub. Unlike Vercel/Netlify (optimised for serverless/static), it runs Express as a long-lived process exactly as it runs locally.

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/page-pulse.git
   git push -u origin main
   ```

2. **Create a Render account** at [render.com](https://render.com) (free, no credit card required).

3. **New Web Service**
   - Dashboard → **New → Web Service**
   - Connect your GitHub repo

4. **Configure the service**

   | Setting | Value |
   |---|---|
   | **Environment** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |

5. **Deploy** — Click **Create Web Service**. Render will build and deploy automatically. You'll get a URL like `https://page-pulse.onrender.com`.

> **Note**: Free Render instances spin down after 15 minutes of inactivity. The first request after a cold start may take ~30 seconds. Upgrade to a paid plan to avoid this.

---

## Environment Variables

No secrets or credentials required. The app uses `process.env.PORT` (set automatically by Render) and falls back to `3000` locally.

---

## License

MIT
