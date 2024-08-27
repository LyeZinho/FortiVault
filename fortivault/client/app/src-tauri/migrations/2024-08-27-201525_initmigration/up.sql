-- Your SQL goes here

-- User table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usergroups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usergroup_members (
    user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (group_id) REFERENCES usergroups (id),
    PRIMARY KEY (user_id, group_id)
);

CREATE TABLE usergroup_permissions (
    group_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    FOREIGN KEY (group_id) REFERENCES usergroups (id),
    FOREIGN KEY (permission_id) REFERENCES permissions (id),
    PRIMARY KEY (group_id, permission_id)
);

CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE passwordsentries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE usersettings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    setting_name TEXT NOT NULL,
    setting_value TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE serversettings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT NOT NULL,
    setting_value TEXT
);

CREATE TABLE commonlogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    log_message TEXT
);

CREATE TABLE criticallogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    log_message TEXT
);

CREATE TABLE syncinfo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT,
    details TEXT
    device_id INTEGER NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices (id)
    sync_status TEXT,
    details TEXT
);

CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL,
    device_ip TEXT NOT NULL,
    device_port INTEGER NOT NULL,
    device_username TEXT NOT NULL,
    device_password TEXT NOT NULL,
    device_description TEXT,
    device_status TEXT,
    device_last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);


CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    notification_type TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity_type TEXT NOT NULL,
    activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
