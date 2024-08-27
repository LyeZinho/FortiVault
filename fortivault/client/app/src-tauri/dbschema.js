/*
Eschema para a base de dados
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

*/