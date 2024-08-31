/*
CREATE TABLE passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,  -- Nome para identificar a senha (por exemplo, "Conta do Gmail")
    username TEXT,  -- Nome de utilizador associado à senha (por exemplo, "usuario@gmail.com")
    password_hash TEXT NOT NULL,  -- Senha encriptada
    url TEXT,  -- URL opcional associada à senha
    tags TEXT,  -- Tags para organização, por exemplo, "trabalho, pessoal"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
*/

use rusqlite::{Connection, Result};

#[derive(Debug)]
pub struct Password {
    pub(crate) id: i32,
    pub(crate) user_id: i32,
    pub(crate) name: String,
    pub(crate) username: Option<String>,
    pub(crate) password_hash: String,
    pub(crate) url: Option<String>,
    pub(crate) tags: Option<String>,
    pub(crate) created_at: String,
    pub(crate) updated_at: String,
}

// Create table if not exists
pub fn create_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS passwords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            username TEXT,
            password_hash TEXT NOT NULL,
            url TEXT,
            tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )",
        [],
    )?;
    Ok(())
}

// Create a new password
pub fn create_password(
    conn: &Connection,
    user_id: i32,
    name: &str,
    username: Option<&str>,
    password_hash: &str,
    url: Option<&str>,
    tags: Option<&str>,
) -> Result<()> {
    conn.execute(
        "INSERT INTO passwords (user_id, name, username, password_hash, url, tags) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        &[user_id, name, username, password_hash, url, tags],
    )?;
    Ok(())
}

// Get all passwords
pub fn get_passwords(conn: &Connection) -> Result<Vec<Password>> {
    let mut stmt = conn.prepare("SELECT * FROM passwords")?;
    let password_iter = stmt.query_map([], |row| {
        Ok(Password {
            id: row.get(0)?,
            user_id: row.get(1)?,
            name: row.get(2)?,
            username: row.get(3)?,
            password_hash: row.get(4)?,
            url: row.get(5)?,
            tags: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;
    let mut passwords = Vec::new();
    for password in password_iter {
        passwords.push(password?);
    }
    Ok(passwords)
}

// Get a password by id
pub fn get_password_by_id(conn: &Connection, id: i32) -> Result<Password> {
    let mut stmt = conn.prepare("SELECT * FROM passwords WHERE id = ?1")?;
    let password_iter = stmt.query_map(&[id], |row| {
        Ok(Password {
            id: row.get(0)?,
            user_id: row.get(1)?,
            name: row.get(2)?,
            username: row.get(3)?,
            password_hash: row.get(4)?,
            url: row.get(5)?,
            tags: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;
    for password in password_iter {
        return password;
    }
    Err(rusqlite::Error::QueryReturnedNoRows)
}

// Update a password
pub fn update_password(conn: &Connection, id: i32, user_id: i32, password: Password) -> Result<()> {
    conn.execute(
        "UPDATE passwords SET user_id = ?1, name = ?2, username = ?3, password_hash = ?4, url = ?5, tags = ?6, created_at = ?7, updated_at = ?8 WHERE id = ?9",
        (&user_id, &password.name, &password.username, &password.password_hash, &password.url, &password.tags, &password.created_at, &password.updated_at, &id),
    )?;
    Ok(())
}

// Delete a password
pub fn delete_password(conn: &Connection, id: i32) -> Result<()> {
    conn.execute("DELETE FROM passwords WHERE id = ?1", &[id])?;
    Ok(())
}

// Delete all passwords
pub fn delete_all_passwords(conn: &Connection) -> Result<()> {
    conn.execute("DELETE FROM passwords", [])?;
    Ok(())
}

// Delete all passwords from a user
pub fn delete_all_passwords_from_user(conn: &Connection, user_id: i32) -> Result<()> {
    conn.execute("DELETE FROM passwords WHERE user_id = ?1", &[user_id])?;
    Ok(())
}
