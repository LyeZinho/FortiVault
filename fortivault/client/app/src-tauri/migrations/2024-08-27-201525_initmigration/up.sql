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

CREATE TABLE sync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id INTEGER NOT NULL,
    action TEXT NOT NULL,  -- Ação de sincronização: 'backup', 'sync'
    status TEXT NOT NULL,  -- Status da sincronização: 'success', 'error'
    message TEXT,  -- Mensagem descritiva sobre o status ou erro
    data BLOB,  -- Dados encriptados relacionados à sincronização (JSON ou outra estrutura)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
);

CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,  -- Nome do dispositivo
    os TEXT,  -- Sistema operacional do dispositivo
    version TEXT,  -- Versão do sistema operacional
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE client_server_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,  -- Usuário ao qual as configurações se aplicam
    server_ip TEXT NOT NULL,  -- IP do servidor para conexão
    server_port INTEGER NOT NULL,  -- Porta do servidor para conexão
    auto_sync BOOLEAN NOT NULL DEFAULT 0,  -- Sincronização automática (1 - Ativado, 0 - Desativado)
    preferred_encryption TEXT NOT NULL DEFAULT 'AES-256',  -- Protocolo de criptografia preferido
    theme TEXT NOT NULL DEFAULT 'light',  -- Tema da aplicação (light, dark)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,  -- Ação realizada (por exemplo, 'login', 'backup', 'sync')
    status TEXT NOT NULL,  -- Status da ação (por exemplo, 'success', 'failed')
    message TEXT,  -- Mensagem detalhada do log
    data BLOB,  -- Dados adicionais relacionados à ação (encriptados)
    ip TEXT,  -- IP do dispositivo (pode ser NULL)
    device_id INTEGER,  -- Identificador do dispositivo (pode ser NULL)
    server_id INTEGER,  -- Identificador do servidor (pode ser NULL)
    password_id INTEGER,  -- Identificador da senha (pode ser NULL)
    sync_id INTEGER,  -- Identificador da sincronização (pode ser NULL)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices (id),
    FOREIGN KEY (server_id) REFERENCES servers (id),
    FOREIGN KEY (password_id) REFERENCES passwords (id),
    FOREIGN KEY (sync_id) REFERENCES sync (id)
);

CREATE TABLE configurations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    device_id INTEGER,
    server_id INTEGER,
    name TEXT NOT NULL,  -- Nome da configuração
    value TEXT NOT NULL,  -- Valor da configuração
    scope TEXT NOT NULL,  -- Escopo da configuração ('user', 'server', 'device', 'app')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices (id),
    FOREIGN KEY (server_id) REFERENCES servers (id)
);