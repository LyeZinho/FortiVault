/*
Crud:
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,  -- Hash seguro da senha do usuário
    recovery_data BLOB,  -- Dados de recuperação de conta encriptados (opcional)
    two_factor_key TEXT,  -- Chave secreta para 2FA (opcional)
    biometric_enabled BOOLEAN DEFAULT 0,  -- Indica se a biometria está habilitada
    backup_code_hash TEXT,  -- Hash dos códigos de backup para recuperação (opcional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

use rusqlite::{Connection, Result};
// use crate::Serialize;

// This struct should be public
// struct User {
//     id: i32,
//     username: String,
//     password_hash: String,
//     recovery_data: Option<Vec<u8>>,
//     two_factor_key: Option<String>,
//     biometric_enabled: bool,
//     backup_code_hash: Option<String>,
//     created_at: String,
//     updated_at: String,
// }

#[derive(Debug)]
pub struct User {
    pub(crate) id: i32,
    pub(crate) username: String,
    pub(crate) password_hash: String,
    pub(crate) recovery_data: Option<Vec<u8>>,
    pub(crate) two_factor_key: Option<String>,
    pub(crate) biometric_enabled: bool,
    pub(crate) backup_code_hash: Option<String>,
    pub(crate) created_at: String,
    pub(crate) updated_at: String,
}

// Create table if not exists
pub fn create_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            recovery_data BLOB,
            two_factor_key TEXT,
            biometric_enabled BOOLEAN DEFAULT 0,
            backup_code_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    Ok(())
}

// Create a new user
pub fn create_user(conn: &Connection, username: &str, password_hash: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?1, ?2)",
        &[username, password_hash],
    )?;
    Ok(())
}

// Read a user
pub fn read_user(conn: &Connection, username: &str) -> Result<User> {
    let mut stmt = conn.prepare("SELECT * FROM users WHERE username = ?1")?;
    let user_iter = stmt.query_map(&[username], |row| {
        Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            password_hash: row.get(2)?,
            recovery_data: row.get(3)?,
            two_factor_key: row.get(4)?,
            biometric_enabled: row.get(5)?,
            backup_code_hash: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;

    for user in user_iter {
        return user;
    }

    Err(rusqlite::Error::QueryReturnedNoRows)
}

// Update a user
// User { id, username, password_hash, recovery_data, two_factor_key, biometric_enabled, backup_code_hash, created_at, updated_at }: User
pub fn update_user(conn: &Connection, user: User, username: &str) -> Result<()> {
    conn.execute(
        "UPDATE users SET username = ?1, password_hash = ?2, recovery_data = ?3, two_factor_key = ?4, biometric_enabled = ?5, backup_code_hash = ?6, created_at = ?7, updated_at = ?8 WHERE username = ?9",
        (&user.username, &user.password_hash, &user.recovery_data, &user.two_factor_key, &user.biometric_enabled, &user.backup_code_hash, &user.created_at, &user.updated_at, &username),
    )?;
    Ok(())
}

// Delete a user
pub fn delete_user(conn: &Connection, username: &str) -> Result<()> {
    conn.execute("DELETE FROM users WHERE username = ?1", &[username])?;
    Ok(())
}

// List all users
pub fn list_users(conn: &Connection) -> Result<Vec<User>> {
    let mut stmt = conn.prepare("SELECT * FROM users")?;
    let user_iter = stmt.query_map([], |row| {
        Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            password_hash: row.get(2)?,
            recovery_data: row.get(3)?,
            two_factor_key: row.get(4)?,
            biometric_enabled: row.get(5)?,
            backup_code_hash: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;

    let mut users = Vec::new();
    for user in user_iter {
        users.push(user?);
    }

    Ok(users)
}

// Delete all users
pub fn delete_all_users(conn: &Connection) -> Result<()> {
    conn.execute("DELETE FROM users", [])?;
    Ok(())
}

// Count all users
pub fn count_users(conn: &Connection) -> Result<i32> {
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM users")?;
    let count = stmt.query_row([], |row| row.get(0))?;
    Ok(count)
}