# AduanKonten FE

## Environment

Copy `.env.example` to `.env`.

- `VITE_API_URL` (example: `http://localhost:8000`)
- `VITE_RECAPTCHA_SITE_KEY` (Google reCAPTCHA v2 Checkbox site key)

## Run

- Install: `npm install`
- Dev server: `npm run dev`

## reCAPTCHA v2

The **Kirim Aduan Baru** form requires reCAPTCHA v2 verification. The backend must also be configured with `RECAPTCHA_SECRET_KEY`.
