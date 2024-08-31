
# Eschema para a base de dados
FortiVault Password Manager

Introdução.
o FortiVault Password Manager é uma aplicação de gestão de passwords que permite armazenar de 
forma segura baseando-se em encriptação de dados, e armazenamento de dados de forma segura,
ja que a aplicação foca-se em armazenar as passwords localmente no dispositivo do utilizador.

E não em servidores externos, o que garante uma maior segurança dos dados impedindo o involvimento 
em grandes vazamentos de dados. (Como o caso do LastPass em 2022)

A aplicação tambem perimete a sincronização de dados entre dispositivos, e tambem caso o utilizador
queira, ele pode configurar um servidor proprio e dedicado para armazenar suas passwords, e sincronizar
de localizações diferentes, agindo como uma cloud privada.

Estrutura da base de dados.

Os pontos principais da base de dados são:

- User (Utilizador da aplicação)
o User é o utilizador da aplicação, ele é o responsavel por criar e gerir as passwords, e tambem
por configurar a aplicação, e sincronizar os dados entre dispositivos.
dados do User:
- id (int) - Identificador do utilizador
- username (string) - Nome do utilizador
- password (string) - Password do utilizador
- email (string) - Email do utilizador
- created_at (timestamp) - Data de criação do utilizador
- updated_at (timestamp) - Data de atualização do utilizador


- Password (Password do utilizador)
o Password é a password que o utilizador cria para armazenar de forma segura, todos os dados são encriptados
e armazenados de forma segura, e so o utilizador tem acesso a esses dados, nem mesmo caso ele configure um servidor
para sincronizar os dados, o servidor não tem acesso a esses dados, ja que a encriptação é feita no dispositivo do utilizador.
o servidor apenas armazena os dados encriptados. (Caso o utilizador configure um servidor)
dados da Password:
- id (int) - Identificador da password
- user_id (int) - Identificador do utilizador
- name (string) - Nome da password
- username (string) - Nome de utilizador
- password (string) - Password (encriptada) da password
- url (string) - URL da password (opcional caso seja uma password de site)
- flags (string) - Flags da password usadas como tags para organização são separadas por virgula e texto entre aspas (ex: "tag1,tag2,tag3")
- created_at (timestamp) - Data de criação da password
- updated_at (timestamp) - Data de atualização da password

- Sync (Sincronização de dados)
o Sync é a tabela que armazena os dados de sincronização entre dispositivos, em caso de sincronização com algum dispositivo
para fazer backup dos dados, ou para sincronizar os dados entre dispositivos, e no caso opcional do utilizador configurar um servidor
para sincronizar os dados, os dados são armazenados nessa tabela, serve como um log de sincronização.
dados do Sync:
- id (int) - Identificador da sincronização
- user_id (int) - Identificador do utilizador
- device_id (int) - Identificador do dispositivo
- action (string) - Ação da sincronização (backup, sync)
- status (string) - Status da sincronização (success, error)
- message (string) - Mensagem da sincronização
- data (string) - Dados da sincronização (json encriptado)
- created_at (timestamp) - Data de criação da sincronização
- updated_at (timestamp) - Data de atualização da sincronização


Outas tabelas importantes:


- Device (Dispositivo)
o Device é o dispositivo que o utilizador usa para acessar a aplicação, e tambem para sincronizar os dados
entre dispositivos, e tambem para fazer backup dos dados.
dados do Device:
- id (int) - Identificador do dispositivo
- user_id (int) - Identificador do utilizador
- name (string) - Nome do dispositivo
- os (string) - Sistema operacional do dispositivo
- version (string) - Versão do sistema operacional
- created_at (timestamp) - Data de criação do dispositivo
- updated_at (timestamp) - Data de atualização do dispositivo

- Server (Servidor)
o Server é o servidor que o utilizador configura para armazenar os dados, e sincronizar os dados entre dispositivos
dados do Server:
- id (int) - Identificador do servidor
- user_id (int) - Identificador do utilizador
- name (string) - Nome do servidor
- ip (string) - IP do servidor
- port (int) - Porta do servidor
- root (string) - Root do servidor
- created_at (timestamp) - Data de criação do servidor
- updated_at (timestamp) - Data de atualização do servidor

- Log (Log de atividades)
o Log é o log de atividades da aplicação, ele armazena todas as atividades do utilizador na aplicação
usado para auditoria e para debug, e tambem para monitoramento de atividades, sempre esta ativo, isto garante
uma camada de segurança adicional, podendo garantir a segurança dos dados, tanto localmente quanto dentro da rede.
dados do Log:
- id (int) - Identificador do log
- user_id (int) - Identificador do utilizador
- action (string) - Ação do log
- status (string) - Status do log
- message (string) - Mensagem do log
- data (string) - Dados do log (json encriptado)
- ip (string) - IP do log (opcional pode ser nulo)
- device_id (int) - Identificador do dispositivo
- server_id (int) - Identificador do servidor (opcional pode ser nulo)
- password_id (int) - Identificador da password
- sync_id (int) - Identificador da sincronização
- created_at (timestamp) - Data de criação do log
- updated_at (timestamp) - Data de atualização do log

- Config (Configuração da aplicação)
o Config é a configuração da aplicação, ele armazena as configurações da aplicação, e tambem as configurações
do utilizador, e tambem as configurações do servidor, e tambem as configurações do dispositivo.
dados do Config:
- id (int) - Identificador da configuração
- user_id (int) - Identificador do utilizador
- device_id (int) - Identificador do dispositivo
- server_id (int) - Identificador do servidor
- name (string) - Nome da configuração
- value (string) - Valor da configuração

_configurações do utilizador_
- theme (string) - Tema da aplicação (light, dark)
- sync (string) - Sincronização de dados (on, off)
- backup (string) - Backup de dados (on, off)
- password (string) - Password da aplicação

_configurações do servidor_
- sync (string) - Sincronização de dados (on, off)
- backup (string) - Backup de dados (on, off)
- password (string) - Password do servidor
- token (string) - Token do servidor
- public_key (string) - Chave publica do servidor
- private_key (string) - Chave privada do servidor
- acess_ip (string) - IP de acesso do servidor
- acess_port (int) - Porta de acesso do servidor
- root (string) - Root do servidor

_configurações do dispositivo_
- theme (string) - Tema do dispositivo (light, dark)
- sync (string) - Sincronização de dados (on, off)
- backup (string) - Backup de dados (on, off)
- password (string) - Password do dispositivo
- public_key (string) - Chave publica do dispositivo
- private_key (string) - Chave privada do dispositivo
- acess_ip (string) - IP de acesso do dispositivo
- acess_port (int) - Porta de acesso do dispositivo

_configurações da aplicação_
- version (string) - Versão da aplicação
- build (int) - Build da aplicação

- created_at (timestamp) - Data de criação da configuração
- updated_at (timestamp) - Data de atualização da configuração

Refined:

### Tabelas Principais

**1. `users` (Utilizador da aplicação)**

Armazena informações sobre os usuários que utilizam a aplicação.

```sql
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
```

**2. `passwords` (Password do utilizador)**

Armazena senhas dos usuários, com todas as informações necessárias.

```sql
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
```

**3. `sync` (Sincronização de dados)**

Registra logs de sincronização de dados entre dispositivos ou servidores.

```sql
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
```

**4. `devices` (Dispositivo do usuário)**

Registra os dispositivos utilizados pelo usuário para sincronizar dados.

```sql
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
```

**5. `servers` (Servidor do usuário)**

Registra servidores configurados pelo usuário para armazenamento seguro e sincronização de dados.

```sql
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
```

**6. `logs` (Log de atividades)**

Registra atividades e logs de auditoria na aplicação para segurança e monitoramento.

```sql
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
```

**7. `configurations` (Configuração da aplicação)**

Armazena configurações de aplicação e usuário, separando configurações de usuário, servidor e dispositivo para flexibilidade.

```sql
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
```

### Sugestões e Melhorias

1. **Segurança de Senhas**: Garanta que todas as senhas sejam armazenadas usando hashing seguro (por exemplo, `bcrypt`, `argon2`).

2. **Normalização de Tabelas**: As tabelas estão bem normalizadas, mas atenção para o uso de tipos de dados eficientes e evitar a redundância desnecessária.

3. **Logging e Auditoria**: Adicione logs de auditoria detalhados para ações críticas, como login, logout, alterações de senha e configurações, para melhorar a segurança.

4. **Criptografia de Dados Sensíveis**: Certifique-se de que dados como `data` em `logs` e `sync` sejam armazenados de forma encriptada.

5. **Índices para Desempenho**: Adicione índices em colunas frequentemente usadas para buscas ou filtros, como `username` em `users`, `user_id` em `passwords`, etc.

6. **Sincronização Offline e Backup**: Considere adicionar uma tabela para controle de backups automáticos locais para garantir redundância de dados.

7. **Autenticação de Dispositivos**: Adicione uma coluna `auth_token` ou algo semelhante em `devices` para autenticação segura de dispositivos.

Essas melhorias ajudarão a garantir que o FortiVault seja seguro, escalável e fácil de usar. Se precisar de mais ajustes ou quiser detalhar mais algum ponto, estou à disposição!