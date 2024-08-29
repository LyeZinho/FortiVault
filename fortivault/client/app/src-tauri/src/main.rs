// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[macro_use]

use diesel::prelude::*;
use diesel::sqlite::SqliteConnection;
use dotenvy::dotenv;
use std::env;

mod schema;
mod models;

use models::{NewUser, User};

pub fn establish_connection() -> SqliteConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL deve estar no .env");
    SqliteConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Erro ao conectar com {}", database_url))
}

/*
pub struct User {
    pub id: Option<i32>,
    pub username: String,
    pub password_hash: String,
    pub recovery_data: Option<Vec<u8>>,
    pub two_factor_key: Option<String>,
    pub biometric_enabled: Option<bool>,
    pub backup_code_hash: Option<String>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}
*/

fn main() {
    // Função para criar um novo usuário
    pub fn create_user(conn: &SqliteConnection, 
        new_user: NewUser
    ) -> usize {
        use schema::users;

        diesel::insert_into(users::table)
            .values(&new_user)
            .execute(conn)
            .expect("Erro ao inserir novo usuário")
    }

    // Teste para criar um novo usuário
    let connection = establish_connection();
    let new_user = NewUser {
        username: "admin",
        password_hash: "admin",
        recovery_data: None,
        two_factor_key: None,
        biometric_enabled: None,
        backup_code_hash: None,
    };

    let user_id = create_user(&connection, new_user);
    println!("Novo usuário criado com id {}", user_id);

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
