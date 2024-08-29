use super::schema::*;
use serde::{Deserialize, Serialize};
use diesel::prelude::*;

/*
diesel::table! {
    client_server_settings (id) {
        id -> Nullable<Integer>,
        user_id -> Integer,
        server_ip -> Text,
        server_port -> Integer,
        auto_sync -> Bool,
        preferred_encryption -> Text,
        theme -> Text,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    configurations (id) {
        id -> Nullable<Integer>,
        user_id -> Nullable<Integer>,
        device_id -> Nullable<Integer>,
        server_id -> Nullable<Integer>,
        name -> Text,
        value -> Text,
        scope -> Text,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    devices (id) {
        id -> Nullable<Integer>,
        user_id -> Integer,
        name -> Text,
        os -> Nullable<Text>,
        version -> Nullable<Text>,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    logs (id) {
        id -> Nullable<Integer>,
        user_id -> Integer,
        action -> Text,
        status -> Text,
        message -> Nullable<Text>,
        data -> Nullable<Binary>,
        ip -> Nullable<Text>,
        device_id -> Nullable<Integer>,
        server_id -> Nullable<Integer>,
        password_id -> Nullable<Integer>,
        sync_id -> Nullable<Integer>,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    passwords (id) {
        id -> Nullable<Integer>,
        user_id -> Integer,
        name -> Text,
        username -> Nullable<Text>,
        password_hash -> Text,
        url -> Nullable<Text>,
        tags -> Nullable<Text>,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    sync (id) {
        id -> Nullable<Integer>,
        user_id -> Integer,
        device_id -> Integer,
        action -> Text,
        status -> Text,
        message -> Nullable<Text>,
        data -> Nullable<Binary>,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    users (id) {
        id -> Nullable<Integer>,
        username -> Text,
        password_hash -> Text,
        recovery_data -> Nullable<Binary>,
        two_factor_key -> Nullable<Text>,
        biometric_enabled -> Nullable<Bool>,
        backup_code_hash -> Nullable<Text>,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
    }
}
*/ 

#[derive(Debug, Serialize, Deserialize, Queryable)]
#[diesel(table_name = users)]
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

#[derive(Debug, Serialize, Deserialize, Queryable)]
#[diesel(table_name = passwords)]
pub struct Password {
    pub id: Option<i32>,
    pub user_id: i32,
    pub name: String,
    pub username: Option<String>,
    pub password_hash: String,
    pub url: Option<String>,
    pub tags: Option<String>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, Queryable)]
#[diesel(table_name = logs)]
pub struct Log {
    pub id: Option<i32>,
    pub user_id: i32,
    pub action: String,
    pub status: String,
    pub message: Option<String>,
    pub data: Option<Vec<u8>>,
    pub ip: Option<String>,
    pub device_id: Option<i32>,
    pub server_id: Option<i32>,
    pub password_id: Option<i32>,
    pub sync_id: Option<i32>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, Queryable)]
#[diesel(table_name = sync)]
pub struct Sync {
    pub id: Option<i32>,
    pub user_id: i32,
    pub device_id: i32,
    pub action: String,
    pub status: String,
    pub message: Option<String>,
    pub data: Option<Vec<u8>>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, Queryable)]
#[diesel(table_name = devices)]
pub struct Device {
    pub id: Option<i32>,
    pub user_id: i32,
    pub name: String,
    pub os: Option<String>,
    pub version: Option<String>,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, Queryable)]
#[diesel(table_name = configurations)]
pub struct Configuration {
    pub id: Option<i32>,
    pub user_id: Option<i32>,
    pub device_id: Option<i32>,
    pub server_id: Option<i32>,
    pub name: String,
    pub value: String,
    pub scope: String,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize, Queryable)]
#[diesel(table_name = client_server_settings)]
pub struct ClientServerSetting {
    pub id: Option<i32>,
    pub user_id: i32,
    pub server_ip: String,
    pub server_port: i32,
    pub auto_sync: bool,
    pub preferred_encryption: String,
    pub theme: String,
    pub created_at: Option<chrono::NaiveDateTime>,
    pub updated_at: Option<chrono::NaiveDateTime>,
}


