// @generated automatically by Diesel CLI.

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

diesel::joinable!(client_server_settings -> users (user_id));
diesel::joinable!(configurations -> devices (device_id));
diesel::joinable!(configurations -> users (user_id));
diesel::joinable!(devices -> users (user_id));
diesel::joinable!(logs -> devices (device_id));
diesel::joinable!(logs -> passwords (password_id));
diesel::joinable!(logs -> sync (sync_id));
diesel::joinable!(logs -> users (user_id));
diesel::joinable!(passwords -> users (user_id));
diesel::joinable!(sync -> devices (device_id));
diesel::joinable!(sync -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    client_server_settings,
    configurations,
    devices,
    logs,
    passwords,
    sync,
    users,
);
