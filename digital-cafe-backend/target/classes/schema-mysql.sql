-- Run this in MySQL (cafedb) before data.sql if you are not using the app to create tables.
-- Creates all tables to match the JPA entities.

USE cafedb;

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
  id   BIGINT       NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_name (name)
);

-- 2. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id        BIGINT       NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) DEFAULT NULL,
  phone     VARCHAR(255) DEFAULT NULL,
  address   VARCHAR(255) DEFAULT NULL,
  work_experience VARCHAR(255) DEFAULT NULL,
  additional_details TEXT DEFAULT NULL,
  PRIMARY KEY (id)
);

-- 3. cafes (no FK deps)
CREATE TABLE IF NOT EXISTS cafes (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255) NOT NULL,
  address     VARCHAR(255) DEFAULT NULL,
  phone       VARCHAR(255) DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  logo_url VARCHAR(255) DEFAULT NULL,
  image_urls TEXT DEFAULT NULL,
  bank_account VARCHAR(255) DEFAULT NULL,
  bank_account_holder VARCHAR(255) DEFAULT NULL,
  bank_name VARCHAR(255) DEFAULT NULL,
  bank_account_number VARCHAR(255) DEFAULT NULL,
  bank_ifsc_code VARCHAR(255) DEFAULT NULL,
  revenue DECIMAL(19, 2) DEFAULT NULL,
  PRIMARY KEY (id)
);

-- 4. users (profile_id, cafe_id)
CREATE TABLE IF NOT EXISTS users (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  username   VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  profile_id BIGINT       DEFAULT NULL,
  cafe_id    BIGINT       DEFAULT NULL,
  enabled    BIT(1)       NOT NULL DEFAULT b'1',
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email),
  KEY fk_users_profile (profile_id),
  KEY fk_users_cafe (cafe_id),
  CONSTRAINT fk_users_profile FOREIGN KEY (profile_id) REFERENCES profiles (id),
  CONSTRAINT fk_users_cafe    FOREIGN KEY (cafe_id)    REFERENCES cafes (id)
);

-- 5. user_roles (join table)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY fk_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
);

-- 6. cafe_tables
CREATE TABLE IF NOT EXISTS cafe_tables (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  table_number VARCHAR(255) NOT NULL,
  capacity     INT          DEFAULT NULL,
  status       VARCHAR(255) DEFAULT NULL,
  location     VARCHAR(255) DEFAULT NULL,
  cafe_id      BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY fk_cafe_tables_cafe (cafe_id),
  CONSTRAINT fk_cafe_tables_cafe FOREIGN KEY (cafe_id) REFERENCES cafes (id)
);

-- 7. menu
CREATE TABLE IF NOT EXISTS menu (
  id          BIGINT         NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255)   NOT NULL,
  description VARCHAR(255)   DEFAULT NULL,
  image_urls  TEXT           DEFAULT NULL,
  price       DECIMAL(19, 2) DEFAULT NULL,
  category    VARCHAR(255)   DEFAULT NULL,
  available   BIT(1)         NOT NULL DEFAULT b'1',
  cafe_id     BIGINT         NOT NULL,
  PRIMARY KEY (id),
  KEY fk_menu_cafe (cafe_id),
  CONSTRAINT fk_menu_cafe FOREIGN KEY (cafe_id) REFERENCES cafes (id)
);

-- 8. confirmation_tokens (email confirmation flow)
CREATE TABLE IF NOT EXISTS confirmation_tokens (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  token      VARCHAR(255) NOT NULL,
  user_id    BIGINT       NOT NULL,
  type       VARCHAR(50)  NOT NULL,
  expires_at DATETIME(6)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_confirmation_tokens_token (token),
  KEY fk_confirmation_tokens_user (user_id),
  CONSTRAINT fk_confirmation_tokens_user FOREIGN KEY (user_id) REFERENCES users (id)
);
