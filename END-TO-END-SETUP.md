# Digital Cafe — End-to-End Setup Guide

Follow these steps in order to run the full stack (MySQL → Backend → Frontend) on your machine.

---

## Prerequisites

| Tool | Purpose | How to check |
|------|---------|---------------|
| **Java 17** | Backend (Spring Boot) | `java -version` |
| **Node.js 18+** | Frontend (React) | `node -v` and `npm -v` |
| **MySQL 8** | Database | `mysql --version` or MySQL Workbench |
| **Maven** | Build backend (or use included wrapper) | `mvn -v` or use `mvnw.cmd` |

Install any missing tool before continuing.

---

## Step 1: Start MySQL

1. Start the **MySQL Server** (e.g. from Services on Windows, or `mysql.server start` on Mac/Linux).
2. Ensure you can log in (e.g. MySQL Workbench or command line):
   - **User:** `root` (or a user you create)
   - **Password:** blank or whatever you set

---

## Step 2: Backend — First Run (Creates Tables)

The backend uses **JPA** to create tables. We run it once so that tables exist before loading seed data.

1. Open a terminal and go to the backend folder:
   ```powershell
   cd "c:\Users\bvjay\OneDrive\Documents\integrate\digital-cafe-fullstack\digital-cafe-backend"
   ```

2. **(Optional)** If your MySQL user has a password, set it:
   ```powershell
   $env:MYSQL_PASSWORD = "your_mysql_password"
   ```

3. Run the backend with the **MySQL** profile:
   ```powershell
   .\mvnw.cmd spring-boot:run -Dspring.profiles.active=mysql
   ```

4. Wait until you see something like:
   ```text
   Started CafeApplication in X.XXX seconds
   ```

5. The app will create the database `cafedb` if it does not exist (via the connection URL) and **create all tables** (users, roles, cafes, menu, orders, etc.).

6. Stop the backend (e.g. `Ctrl+C` in the terminal). We’ll start it again after loading seed data.

---

## Step 3: Load Seed Data in MySQL

Seed data = default admin user, roles, sample cafe, tables, and menu.

1. Open **MySQL Workbench** (or any MySQL client) and connect to your MySQL server.

2. Select the **cafedb** database (or create it if it wasn’t created: `CREATE DATABASE cafedb;`).

3. Open this file in your project:
   ```text
   digital-cafe-fullstack\digital-cafe-backend\src\main\resources\data.sql
   ```

4. Run the **entire** `data.sql` script in MySQL (Execute/Run).
   - This inserts: roles, admin user (username: `admin`, password: `admin123`), sample cafe, tables, and menu items.

5. If you get errors about “table doesn’t exist”, go back to **Step 2** and run the backend once so JPA creates the tables, then run `data.sql` again.

---

## Step 4: Backend — Run Again (Normal Use)

1. In the same backend folder:
   ```powershell
   cd "c:\Users\bvjay\OneDrive\Documents\integrate\digital-cafe-fullstack\digital-cafe-backend"
   ```

2. If you use a MySQL password:
   ```powershell
   $env:MYSQL_PASSWORD = "your_mysql_password"
   ```

3. Start the backend:
   ```powershell
   .\mvnw.cmd spring-boot:run -Dspring.profiles.active=mysql
   ```

4. Leave this terminal open. The API should be at **http://localhost:8081**.

5. Quick check: open in browser or with curl:
   ```text
   http://localhost:8081/api/auth/login
   ```
   (You should get 400 or 405, not “connection refused” — that means the backend is up.)

---

## Step 5: Frontend — Install and Run

1. Open a **new** terminal (keep the backend running in the first one).

2. Go to the frontend folder:
   ```powershell
   cd "c:\Users\bvjay\OneDrive\Documents\integrate\digital-cafe-fullstack\digital-cafe-frontend"
   ```

3. Install dependencies (first time only):
   ```powershell
   npm install
   ```

4. Ensure the frontend points to your backend. Check that this file exists and contains:
   ```text
   digital-cafe-frontend\.env
   ```
   Content:
   ```env
   REACT_APP_API_URL=http://localhost:8081
   ```
   If the backend runs on a different port, change `8081` to that port.

5. Start the frontend:
   ```powershell
   npm start
   ```

6. The app should open in the browser at **http://localhost:3000**. If not, open that URL manually.

---

## Step 6: Test End-to-End (Login)

1. In the browser, go to **http://localhost:3000**.

2. Open the **Login** page (e.g. via navbar or `/login`).

3. Log in with the seed admin user:
   - **Username or email:** `admin`
   - **Password:** `admin123`

4. Click **Login**.
   - If everything is connected: you get a JWT, and the app redirects (e.g. to `/admin`).
   - If you see an error: check **Troubleshooting** below.

5. Optional: test **Register** to create a new user, then log in with that user.

---

## Summary: What Runs Where

| Layer      | URL / Location        | Purpose                    |
|-----------|------------------------|----------------------------|
| **MySQL** | localhost:3306         | Database (cafedb)          |
| **Backend** | http://localhost:8081 | REST API + JWT + WebSocket |
| **Frontend** | http://localhost:3000 | React UI                   |

Flow: **Browser (React)** → **Backend (Spring Boot)** → **MySQL**.

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| Backend: “Access denied for user” | Check MySQL user/password. Set `MYSQL_USER` and `MYSQL_PASSWORD` if not using `root` / no password. |
| Backend: “Unknown database 'cafedb'” | Create it: `CREATE DATABASE cafedb;` in MySQL, or rely on `createDatabaseIfNotExist=true` in the URL and try again. |
| Frontend: “Network Error” or “Failed to fetch” | 1) Backend must be running on 8081. 2) `.env` must have `REACT_APP_API_URL=http://localhost:8081`. 3) Restart frontend after changing `.env` (`npm start` again). |
| Login: “Login failed” or 401 | 1) Ensure you ran `data.sql` so user `admin` exists. 2) Use password `admin123`. 3) Try username `admin` (not email). |
| CORS errors in browser console | Backend is already configured to allow `http://localhost:3000`. Ensure you’re using the `mysql` profile and that no other config overrides CORS. |
| Port 8081 already in use | Stop the other process using 8081, or change `server.port` in `application.yml` and set `REACT_APP_API_URL` to the new port. |

---

## Quick Reference: Run Order

Every time you want to work on the project:

1. Start **MySQL** (if not running).
2. Start **backend**:  
   `cd digital-cafe-backend` → `.\mvnw.cmd spring-boot:run -Dspring.profiles.active=mysql`
3. Start **frontend**:  
   `cd digital-cafe-frontend` → `npm start`
4. Use the app at **http://localhost:3000**.

You now have the full stack running end-to-end.
