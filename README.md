# Saffron & Stone — restaurant website demo

A responsive, no-build restaurant website made with HTML, CSS and vanilla JavaScript. It uses fictional restaurant details and sample menu content.

## Run locally

1. Open this folder in VS Code.
2. Start a static server from this folder (for example, VS Code Live Server or `python -m http.server 8000`).
3. Visit `http://localhost:8000` and open `http://localhost:8000/admin.html` for the demo dashboard.

No package installation or build step is needed. An internet connection is needed for the sample Unsplash photos, Google Fonts and map embed.

## Demo features

- 17 sample dishes across six menu categories, with instant search, category filters, sorting and a price slider.
- Cart quantities, remove/clear actions, coupon codes (`WELCOME10`, `SASSY50`), tax and delivery calculations.
- Demo checkout, order IDs and status lookup; optional WhatsApp message sharing.
- Reservation requests validated against weekly, holiday and temporary-closure hours.
- Browser-only admin tools for menu, demo orders, reservations, opening hours, coupons, contact details and enquiries.
- Responsive layouts, mobile navigation, dark theme, newsletter form and policy information.

Cart, preferences, orders, reservations and admin changes use this browser's `localStorage`. They are not shared across browsers or devices. WhatsApp opens a message draft only when the customer chooses to share it.

## Important production limitations

This is a presentation/demo frontend—not a production ordering system. The admin page is intentionally not protected by a frontend password; anyone who can open the page can change demo data in that browser. Do not enter real customer information.

No backend, database, authenticated admin accounts, email/SMS delivery, real order dispatch, inventory service or payment gateway is connected. Online payment is disabled; the demo does not charge a customer or claim a successful payment. Before using this for a real restaurant, build a server API and database, secure admin routes and authorization, validate prices/availability/reservations server-side, and integrate Razorpay using backend-verified test/live payment responses. Configure HTTPS, backups, privacy/terms, and production contact, map and social details as well.

## Customize

- Edit the fictional brand, schedule, fees, tax and 17 starter menu items in `config.js`.
- Update page sections and metadata in `index.html`; theme and responsive styles are in `style.css`.
- Demo cart, order, reservation and hours interactions are in `script.js` and `store.js`.
- Admin demo forms and dashboard behavior are in `admin.html` and `admin.js`.
- Use the admin dashboard to make browser-local edits without changing the starter data in `config.js`.
