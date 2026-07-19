# Digital Cafe Backend

Spring Boot REST API for a digital cafe: auth (JWT), cafes, menu, tables, orders, payments, and WebSocket order updates.

## Stack

- Java 17, Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA (H2 in-memory or MySQL)
- WebSocket (STOMP) for order status

## Run

**Default (H2 file-based — data persists when backend stops):**
```bash
mvn spring-boot:run
```

- **Start the backend first** so the database file is created. Data is stored in `./cafedb.mv.db` (in the backend project directory). All admin dashboard data (users, cafes, owners, assignments, etc.) is saved and remains after restart.
- First run: roles, default admin user, and a sample cafe are seeded automatically. Later runs do not overwrite your data.
- API: http://localhost:8081
- **Password reset:** The app sends reset links by email (Gmail SMTP in `application.yml`) and also returns the link in the API response so the frontend can show it on the page. Start the backend before the frontend so the reset endpoint is available.
- **H2 Console:** http://localhost:8081/h2-console  
  Use these settings (do **not** use `jdbc:h2:mem:cafedb`):
  - **JDBC URL:** `jdbc:h2:file:./cafedb`
  - **User Name:** `sa`
  - **Password:** (leave empty)  
  Or open http://localhost:8081/h2-console-help.html for a copy-paste helper.

**With MySQL** (after installing MySQL and creating a database):
```bash
# Optional: set password if your MySQL user has one
# set MYSQL_PASSWORD=yourpassword   (Windows)
# export MYSQL_PASSWORD=yourpassword (Linux/Mac)

mvn spring-boot:run -Dspring.profiles.active=mysql
```

- Database: create `cafedb` in MySQL (or let the app create it via `createDatabaseIfNotExist=true`).
- First run: JPA creates tables. Seed data is not auto-loaded with MySQL; run `src/main/resources/data.sql` once in MySQL if you want the default admin and sample cafe.
- API: http://localhost:8081
- H2 console (when not using MySQL): http://localhost:8081/h2-console — use JDBC URL: `jdbc:h2:file:./cafedb` (see above).

## Clear the database and run fresh

To reset the H2 database and start with a clean state:

1. **Stop the backend** (Ctrl+C if running in a terminal).
2. **Delete the database files** in the backend project folder:
   - `cafedb.mv.db`
   - `cafedb.trace.db` (if present)
   On Windows (PowerShell):  
   `Remove-Item -Path cafedb.mv.db, cafedb.trace.db -ErrorAction SilentlyContinue`
3. **Start the backend again:** `mvn spring-boot:run`  
   The database will be recreated and seed data (admin user, sample cafe, etc.) will run again.

## Default users (password: `admin123` for all)

| Username  | Role     | Email                     |
|-----------|----------|---------------------------|
| admin     | ADMIN    | admin@digitalcafe.local   |
| customer  | CUSTOMER | customer@digitalcafe.local|
| waiter    | WAITER   | waiter@digitalcafe.local  |
| chef      | CHEF     | chef@digitalcafe.local   |

Use `POST /api/auth/login` with `{"usernameOrEmail":"admin","password":"admin123"}` (or customer/waiter/chef) to get a JWT. Send it in the `Authorization: Bearer <token>` header for protected endpoints.

## API overview

| Role     | Base path         | Notes                          |
|----------|-------------------|--------------------------------|
| Public   | `/api/auth/**`    | Login                          |
| Admin    | `/api/admin/**`   | Cafes CRUD, user management    |
| Owner    | `/api/owner/**`   | Cafe details, tables, menu    |
| Customer | `/api/customer/**`| List cafes, menu, place order, pay |
| Chef     | `/api/chef/**`    | List/update order status      |
| Waiter   | `/api/waiter/**`  | Create orders, update status  |

## WebSocket

- Endpoint: `/ws`
- Subscribe to order updates: `/topic/orders/{cafeId}`

## Email (registration & login confirmation)

After **registration** and after **login**, the app can send a confirmation email to the user's address. By default this is **off**.

To enable:

1. Set **MAIL_ENABLED=true**
2. Set SMTP settings, e.g. for Gmail:
   - **MAIL_HOST=smtp.gmail.com**
   - **MAIL_PORT=587**
   - **MAIL_USERNAME=your@gmail.com**
   - **MAIL_PASSWORD=** your [App Password](https://support.google.com/accounts/answer/185833) (not your normal password)
   - **MAIL_FROM=noreply@yourdomain.com** (optional; default `noreply@digitalcafe.local`)
   - **MAIL_STARTTLS=true** (default)

Example (Windows):  
`set MAIL_ENABLED=true && set MAIL_HOST=smtp.gmail.com && set MAIL_USERNAME=you@gmail.com && set MAIL_PASSWORD=xxxx && mvn spring-boot:run`

If mail is disabled or not configured, registration and login still work; no email is sent.

## Config

- JWT: `app.jwt.secret`, `app.jwt.expiration-ms` in `application.yml` (override with env `JWT_SECRET` in production).
- Razorpay: set `RAZORPAY_ENABLED=true`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` before testing checkout. Full project setup is documented in `../RAZORPAY-SETUP.md`.
