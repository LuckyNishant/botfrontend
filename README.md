# Lucky Mobile Admin Panel (Vercel)

Frontend admin panel for Lucky Mobile AI Spare Parts System.

## Configure API URL

Create `.env` file:

```bash
VITE_API_BASE_URL=https://luckymobilebackend.onrender.com
VITE_ADMIN_PASSCODE=your-secure-passcode
```

## Run Local

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Import `frontend` folder as Vercel project.
2. Framework preset: **Vite**.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://luckymobilebackend.onrender.com`
   - `VITE_ADMIN_PASSCODE=<secure-passcode>`
4. Deploy.

## Vercel Routing

`vercel.json` is added so all routes fallback to `index.html` (SPA-safe refresh).
# botfrontend
