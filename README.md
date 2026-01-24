# StockPilot Head Admin Dashboard

## Environment variables
Set these in Vercel:

- NEXT_PUBLIC_API_BASE_URL=https://your-railway-app.up.railway.app
- HEAD_ADMIN_KEY=your_head_admin_key
- DASHBOARD_PASSCODE=your_dashboard_passcode

## Local dev
```bash
npm install
npm run dev
```

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import into Vercel.
3. Add the environment variables above.
4. Deploy.

## Notes
- Client never sees HEAD_ADMIN_KEY. It is added by Next.js route handlers.
- Login stores an HttpOnly cookie and redirects to /dashboard.
