# Digital Cafe Fullstack

Digital Cafe is a full-stack cafe management application with role-based dashboards for customers, admins, owners, chefs, and waiters.

It includes:
- customer registration, login, profile, cafe browsing, ordering, and Razorpay test payments
- admin management for users, cafes, and reports
- owner management for staff, tables, menu, and cafe operations
- chef and waiter dashboards for order handling
- live waiter-side ready-order polling with notifications

## Tech Stack

- Frontend: React, React Router
- Backend: Spring Boot, Spring Security, JWT, Spring Data JPA
- Database: H2 file database by default, MySQL optional
- Payments: Razorpay test checkout

## Project Structure

```text
digital-cafe-fullstack/
|- digital-cafe-frontend/
|- digital-cafe-backend/
|- END-TO-END-SETUP.md
|- INTEGRATION.md
|- run-app.bat
```

## Main Roles

- `CUSTOMER`: browse cafes, place orders, pay, view orders
- `ADMIN`: manage users and cafes
- `OWNER`: manage cafe setup, menu, tables, and staff
- `CHEF`: view kitchen queue and update order status
- `WAITER`: serve ready orders and track table status

## How to Run

### Option 1: Quick start with H2

1. Start backend:

```powershell
cd digital-cafe-backend
.\mvnw.cmd spring-boot:run
```

2. Start frontend:

```powershell
cd digital-cafe-frontend
npm start
```

3. Open:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8081`
- H2 console: `http://localhost:8081/h2-console`

### Option 2: Use MySQL

See [END-TO-END-SETUP.md](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/END-TO-END-SETUP.md) for the full MySQL setup.

## Environment Configuration

Backend configuration is mainly read from:
- [`application.yml`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/digital-cafe-backend/src/main/resources/application.yml)
- [`digital-cafe-backend/.env.bat`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/digital-cafe-backend/.env.bat)
- [`digital-cafe-backend/.env.example.bat`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/digital-cafe-backend/.env.example.bat)

Important variables:
- `MAIL_ENABLED`
- `FRONTEND_URL`
- `JWT_SECRET`
- `RAZORPAY_ENABLED`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_CURRENCY`
- `RAZORPAY_CHECKOUT_NAME`

## Razorpay Test Mode

This project already supports Razorpay test checkout.

Set these in `digital-cafe-backend/.env.bat`:

```bat
set RAZORPAY_ENABLED=true
set RAZORPAY_KEY_ID=rzp_test_your_key_id
set RAZORPAY_KEY_SECRET=your_test_secret
set RAZORPAY_CURRENCY=INR
set RAZORPAY_CHECKOUT_NAME=Digital Cafe
```

Then restart the backend.

### Payment Flow

1. Customer places an order
2. Customer opens `My orders`
3. Customer clicks `Pay`
4. Frontend opens Razorpay Checkout
5. Backend creates Razorpay order
6. Razorpay returns payment success
7. Backend verifies signature
8. Order is marked paid

Relevant files:
- [`UserPaymentPortal.jsx`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/digital-cafe-frontend/src/pages/UserPaymentPortal.jsx)
- [`CustomerController.java`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/digital-cafe-backend/src/main/java/com/cafe/controller/CustomerController.java)
- [`PaymentService.java`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/digital-cafe-backend/src/main/java/com/cafe/service/PaymentService.java)

## Useful Files

- Backend README:
  [`digital-cafe-backend/README.md`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/digital-cafe-backend/README.md)
- Integration notes:
  [`INTEGRATION.md`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/INTEGRATION.md)
- End-to-end setup:
  [`END-TO-END-SETUP.md`](C:/Users/Nikhil%20Sinha/Downloads/integrate%20(2)/integrate/digital-cafe-fullstack/END-TO-END-SETUP.md)

## Current Highlights

- customer login works without old confirmation flow
- waiter dashboard includes ready-order live polling, toast alerts, sound, glow highlight, and notification bell
- customer payment flow uses Razorpay test checkout from the orders section

## Notes

- Use test Razorpay keys only during development
- Keep `RAZORPAY_KEY_SECRET` only on the backend
- Restart backend after changing `.env.bat`
