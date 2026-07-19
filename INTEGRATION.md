# Digital Cafe — Frontend, Backend & Database Integration

This document describes how the **React frontend**, **Spring Boot backend**, and **MySQL database** are connected and how data flows between them.

---

## Architecture Overview

```
┌─────────────────┐      HTTP (REST)       ┌─────────────────┐      JDBC       ┌─────────────────┐
│  React Frontend │  ◄──────────────────►  │ Spring Boot API │  ◄────────────►  │  MySQL (cafedb)  │
│  localhost:3000 │   REACT_APP_API_URL     │ localhost:8081  │   JPA/Hibernate  │  localhost:3306  │
└─────────────────┘                        └─────────────────┘                  └─────────────────┘
```

- **Frontend** calls the backend using `REACT_APP_API_URL` (default `http://localhost:8081`).
- **Backend** exposes REST endpoints under `/api/*`, uses JWT for auth, and talks to MySQL via Spring Data JPA.
- **Database** stores users, roles, cafes, menu, orders, payments, etc.

---

## 1. Frontend → Backend

| Concern | Implementation |
|--------|----------------|
| **API base URL** | `digital-cafe-frontend/.env`: `REACT_APP_API_URL=http://localhost:8081` |
| **API client** | `digital-cafe-frontend/src/api.js`: `login()`, `register()`, `getToken()`, `setToken()` |
| **CORS** | Backend `WebMvcConfig.java` allows origin `http://localhost:3000` |

### Auth flow

- **Login** (`/login`): User enters username/email + password → `api.login()` → POST `/api/auth/login` → backend returns JWT → frontend stores token and redirects (e.g. to `/admin`).
- **Register** (`/register`): User completes steps 1–5; in step 5 they enter **Username**, **Email**, **Password** → "Register" calls `api.register(username, email, password, "CUSTOMER")` → POST `/api/auth/register` → backend creates user in DB and returns JWT → frontend stores token and redirects.

---

## 2. Backend → Database

| Concern | Implementation |
|--------|----------------|
| **Config** | `application.yml` (default H2 in-memory); `application-mysql.yml` (MySQL). Run with profile: `-Dspring.profiles.active=mysql` |
| **Connection** | MySQL URL: `jdbc:mysql://localhost:3306/cafedb?createDatabaseIfNotExist=true`, user/password from env or defaults |
| **Persistence** | JPA entities in `entity/`, repositories in `repository/`, services in `service/` |

### Auth and data

- **AuthController** receives login/register requests; **AuthService** uses **UserRepository** and **RoleRepository** to read/write users and roles in the database.
- Passwords are hashed with BCrypt before saving.
- Other features (cafes, menu, orders, payments) use their own repositories and services, all backed by the same MySQL database.

---

## 3. Running the Full Stack

1. **MySQL**: Start MySQL; ensure database `cafedb` exists (or let the backend create it).
2. **Backend**: From `digital-cafe-backend`, run:  
   `.\mvnw.cmd spring-boot:run -Dspring.profiles.active=mysql`  
   API: **http://localhost:8081**
3. **Frontend**: From `digital-cafe-frontend`, run:  
   `npm install` then `npm start`  
   App: **http://localhost:3000**
4. **Seed data**: Run `digital-cafe-backend/src/main/resources/data.sql` in MySQL once to create roles and default admin (`admin` / `admin123`).

See **END-TO-END-SETUP.md** for step-by-step and troubleshooting.

---

## 4. Summary

| Layer | Role |
|-------|------|
| **Frontend** | UI (React), calls backend API, stores JWT for authenticated requests |
| **Backend** | REST API, JWT auth, business logic, talks to DB via JPA |
| **Database** | MySQL `cafedb` — users, roles, cafes, menu, orders, payments |

Login and registration are fully integrated: the frontend uses the backend API, and the backend persists users and roles in the database.
