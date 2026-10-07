# QuickBill - GST Invoice Generator

A simple web app that helps small shops, traders and freelancers create correct, printable GST tax invoices in seconds. It runs entirely in the browser with no backend and no installation.

**Live demo:** https://YOUR-USERNAME.github.io/quickbill

## Problem

Many small businesses still write bills by hand or in Word. This leads to calculation mistakes, wrong GST splits and no record of past invoices. QuickBill automates the maths and keeps a history.

## Features

- Live invoice preview that updates as you type
- Item-wise GST rates (0, 5, 12, 18, 28%)
- Automatic CGST + SGST split, or IGST for interstate sales
- Round-off and amount in words in the Indian system (lakh, crore)
- Print or save as PDF with a clean print layout
- Save, reopen and delete invoices, with auto-incrementing invoice numbers
- Dashboard showing total billed, GST collected and unpaid amount
- Mark invoices as paid (animated PAID stamp)
- Export all invoices to CSV for Excel
- Five colour themes and a dark mode
- Remembers business details between sessions
- Responsive layout and reduced-motion support

## Tech Stack

- HTML5 for structure
- CSS3 for layout, animations, theming with CSS variables and `color-mix()`, and print styles
- Vanilla JavaScript (ES6) for logic, rendering and effects
- Web Storage API (`localStorage`) for saving data in the browser

No frameworks or external libraries.

## Project Structure

```
quickbill/
  index.html   page structure
  style.css    styling, themes, animations, print rules
  script.js    invoice logic, rendering, storage, effects
```

## How It Works

1. The whole invoice is stored in one JavaScript object.
2. Every form field updates that object, and the invoice preview is rebuilt from it.
3. `totals()` calculates subtotal, GST and the rounded total from the item list.
4. Saved invoices and settings are stored in `localStorage` as JSON.
5. `@media print` hides the form so only the invoice is printed.

## Run Locally

1. Download or clone this repository.
2. Open `index.html` in a browser, or use the VS Code Live Server extension.

## Limitations

Data is stored only in the browser it was created in. Clearing browser data removes saved invoices, so use **Export CSV** for backups.

## Future Scope

- User login and a database (Node.js, Express, MongoDB) for cloud sync
- HSN codes, company logo and customer records
- UPI payment QR code on the invoice
- Sharing invoices by WhatsApp or email
- Monthly sales reports and charts
