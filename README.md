# The Curious Empire — Next.js (App Router)

This project is a **Next.js App Router** migration of the provided Vite + React frontend.

## Run locally

```bash
npm install
npm run dev
```

## Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE=https://your-backend-domain.com
```

## Routes

- `/` Home
- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout` (private)
- `/login`, `/register`, `/forgot-password`
- `/profile`, `/favorites`, `/priyo`, `/settings`, `/settings/edit` (private)

Admin:
- `/admin/login`
- `/admin`
- `/admin/products`, `/admin/orders`, `/admin/categories`, `/admin/banners`

## Notes

- React Router has been removed.
- Global CSS is loaded from `src/app/globals.css`.
