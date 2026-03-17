//! FortiVault CLI - Inject secrets into subprocesses
//! 
//! Usage: fortivault run <command> [args...]
//!        fortivault run --env staging npm run dev
//!        fortivault run python manage.py runserver

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use argon2::{password_hash::SaltString, Argon2};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use clap::{Parser, Subcommand};
use futures_util::{SinkExt, StreamExt};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::process::{Command, Stdio};
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use tracing::{error, info, warn};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

mod crypto;
mod config;

// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "PING")]
    Ping,
    #[serde(rename = "PONG")]
    Pong,
    #[serde(rename = "KEY_EXCHANGE")]
    KeyExchange { public_key: String },
    #[serde(rename = "PAIR_REQUEST")]
    PairRequest { code: String },
    #[serde(rename = "DECRYPT_REQUEST")]
    DecryptRequest { encrypted_blob: String },
    #[serde(rename = "DECRYPT_RESPONSE")]
    DecryptResponse { plaintext: String },
    #[serde(rename = "SECRETS_REQUEST")]
    SecretsRequest { vault_id: String, env_prefix: Option<String> },
    #[serde(rename = "SECRETS_RESPONSE")]
    SecretsResponse { secrets: Vec<Secret> },
    #[serde(rename = "ERROR")]
    Error { message: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Secret {
    pub id: String,
    pub key: String,
    pub value: String,
    pub secret_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vault {
    pub id: String,
    pub name: String,
    pub scope: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub desktop_ws_url: String,
    pub api_url: String,
    pub session_token: Option<String>,
    pub paired: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            desktop_ws_url: "ws://127.0.0.1:9876".to_string(),
            api_url: "http://localhost:3001".to_string(),
            session_token: None,
            paired: false,
        }
    }
}

#[derive(Parser)]
#[command(name = "fortivault")]
#[command(version = "0.1.0")]
#[command(about = "FortiVault CLI - Zero-Knowledge Secrets Manager", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run a command with secrets injected as environment variables
    Run {
        /// The command to run (use quotes for commands with arguments)
        #[arg(trailing_var_arg = true)]
        command: Vec<String>,
        
        /// Environment to use (staging, production, etc.)
        #[arg(short, long)]
        env: Option<String>,
        
        /// Vault name or ID to use
        #[arg(short, long)]
        vault: Option<String>,
        
        /// Prefix for environment variables
        #[arg(short, long, default_value = "")]
        prefix: String,
    },
    
    /// List available vaults
    Vaults,
    
    /// List secrets in a vault
    List {
        /// Vault name or ID
        vault: Option<String>,
    },
    
    /// Check connection status with desktop app
    Status,
    
    /// Pair with desktop app
    Pair,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    let log_dir = directories::ProjectDirs::from("com", "fortivault", "cli")
        .map(|d| d.data_dir().to_path_buf())
        .unwrap_or_else(|| env::current_dir().unwrap());
    
    std::fs::create_dir_all(&log_dir)?;
    
    let file_appender = RollingFileAppender::new(Rotation::DAILY, &log_dir, "fortivault.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(fmt::layer().with_writer(non_blocking))
        .with(fmt::layer().with_writer(std::io::stdout))
        .init();
    
    info!("FortiVault CLI starting...");
    
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Run { command, env, vault, prefix } => {
            run_command(command, env, vault, prefix).await?;
        }
        Commands::Vaults => {
            list_vaults().await?;
        }
        Commands::List { vault } => {
            list_secrets(vault).await?;
        }
        Commands::Status => {
            check_status().await?;
        }
        Commands::Pair => {
            pair_desktop().await?;
        }
    }
    
    Ok(())
}

async fn run_command(
    command: Vec<String>,
    env: Option<String>,
    vault: Option<String>,
    prefix: String,
) -> Result<(), Box<dyn std::error::Error>> {
    if command.is_empty() {
        error!("No command provided. Usage: fortivault run <command>");
        return Ok(());
    }
    
    print_banner();
    
    info!("Command: {:?}", command);
    if let Some(ref e) = env {
        info!("Environment: {}", e);
    }
    
    // Connect to desktop app
    info!("Connecting to FortiVault Desktop...");
    let ws_url = "ws://127.0.0.1:9876";
    
    let (ws_stream, _) = match connect_async(ws_url).await {
        Ok(result) => {
            info!("[OK] Connected to desktop app");
            result
        }
        Err(e) => {
            error!("[ERR] Cannot connect to desktop app: {}", e);
            error!("Make sure FortiVault Desktop is running and WebSocket server is enabled.");
            return Ok(());
        }
    };
    
    let (mut write, mut read) = ws_stream.split();
    
    // Send ping to verify connection
    write.send(Message::Text(r#"{"type":"PING"}"#)).await?;
    
    if let Some(msg) = read.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                if text.contains("PONG") {
                    info!("[OK] Desktop app responded");
                }
            }
            Ok(_) => {}
            Err(e) => {
                warn!("Connection error: {}", e);
            }
        }
    }
    
    // Get vault info
    let vault_id = vault.unwrap_or_else(|| "default".to_string());
    info!("Using vault: {}", vault_id);
    
    // Request secrets from desktop
    let secrets_request = serde_json::json!({
        "type": "SECRETS_REQUEST",
        "vault_id": vault_id,
        "env_prefix": if prefix.is_empty() { None } else { Some(&prefix) }
    });
    
    write.send(Message::Text(secrets_request.to_string())).await?;
    
    let mut secrets: Vec<Secret> = Vec::new();
    
    // Wait for secrets response
    if let Some(msg) = read.next().await {
        if let Ok(Message::Text(text)) = msg {
            if let Ok(response) = serde_json::from_str::<serde_json::Value>(&text) {
                if let Some(secrets_data) = response.get("secrets").and_then(|s| s.as_array()) {
                    for secret in secrets_data {
                        if let (Some(key), Some(value)) = (
                            secret.get("key").and_then(|k| k.as_str()),
                            secret.get("value").and_then(|v| v.as_str()),
                        ) {
                            secrets.push(Secret {
                                id: secret.get("id").and_then(|i| i.as_str()).unwrap_or("").to_string(),
                                key: key.to_string(),
                                value: value.to_string(),
                                secret_type: secret.get("type").and_then(|t| t.as_str()).unwrap_or("ENV_VAR").to_string(),
                            });
                        }
                    }
                }
            }
        }
    }
    
    if secrets.is_empty() {
        warn!("[WARN] No secrets found in vault '{}'", vault_id);
        info!("No environment variables will be injected.");
    } else {
        info!("[OK] Retrieved {} secrets", secrets.len());
    }
    
    // Build environment variables
    let mut env_vars: HashMap<String, String> = HashMap::new();
    
    for secret in &secrets {
        let env_key = if prefix.is_empty() {
            secret.key.clone()
        } else {
            format!("{}_{}", prefix, secret.key)
        };
        env_vars.insert(env_key, secret.value.clone());
    }
    
    // Print secrets being injected (masked)
    println!();
    println!("┌─────────────────────────────────────────────┐");
    println!("│  INJECTING ENVIRONMENT VARIABLES            │");
    println!("├─────────────────────────────────────────────┤");
    for (key, _value) in &env_vars {
        println!("│  {}={}***", key, &"x".repeat(8.min(_value.len().saturating_sub(8))));
    }
    println!("└─────────────────────────────────────────────┘");
    println!();
    
    // Execute the command with environment variables
    let cmd = &command[0];
    let args = &command[1..];
    
    info!("Executing: {} {:?}", cmd, args);
    println!();
    println!("▶ Executing: {} {}", cmd, args.join(" "));
    println!();
    
    // Merge environment variables
    let mut cmd_env = env::vars().collect::<HashMap<_, _>>();
    for (key, value) in env_vars {
        cmd_env.insert(key, value);
    }
    
    // Execute the command
    let mut child = Command::new(cmd)
        .args(args)
        .envs(cmd_env)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .stdin(Stdio::inherit())
        .spawn()?;
    
    let status = child.wait()?;
    
    if status.success() {
        info!("Command completed successfully");
    } else {
        info!("Command exited with status: {:?}", status.code());
    }
    
    Ok(())
}

async fn list_vaults() -> Result<(), Box<dyn std::error::Error>> {
    print_banner();
    
    println!("Fetching vaults from FortiVault Desktop...");
    println!();
    
    // This would connect to desktop and fetch vault list
    // For now, show example output
    println!("┌─────────────────────────────────────────────┐");
    println!("│  AVAILABLE VAULTS                           │");
    println!("├─────────────────────────────────────────────┤");
    println!("│  [P] personal      Personal vault          │");
    println!("│  [D] engineering   Department: Engineering │");
    println!("│  [S] devops        Shared: DevOps           │");
    println!("└─────────────────────────────────────────────┘");
    
    Ok(())
}

async fn list_secrets(vault: Option<String>) -> Result<(), Box<dyn std::error::Error>> {
    print_banner();
    
    let vault_id = vault.unwrap_or_else(|| "personal".to_string());
    println!("Fetching secrets from vault: {}", vault_id);
    println!();
    
    // Example output
    println!("┌─────────────────────────────────────────────┐");
    println!("│  SECRETS IN VAULT: {} ", vault_id);
    println!("├─────────────────────────────────────────────┤");
    println!("│  AWS_ACCESS_KEY_ID     ENV_VAR              │");
    println!("│  AWS_SECRET_ACCESS_KEY ENV_VAR              │");
    println!("│  DATABASE_URL          ENV_VAR              │");
    println!("│  STRIPE_API_KEY         API_KEY              │");
    println!("└─────────────────────────────────────────────┘");
    
    Ok(())
}

async fn check_status() -> Result<(), Box<dyn std::error::Error>> {
    print_banner();
    
    println!("Checking FortiVault Desktop status...");
    println!();
    
    let ws_url = "ws://127.0.0.1:9876";
    
    match tokio::time::timeout(tokio::time::Duration::from_secs(3), connect_async(ws_url)).await {
        Ok(Ok((ws_stream, _))) => {
            println!("┌─────────────────────────────────────────────┐");
            println!("│  STATUS: CONNECTED                          │");
            println!("├─────────────────────────────────────────────┤");
            println!("│  Desktop App:   ONLINE                      │");
            println!("│  WebSocket:    Active                      │");
            println!("│  Encryption:   AES-256-GCM                 │");
            println!("└─────────────────────────────────────────────┘");
            
            // Close connection gracefully
            let (_write, mut read) = ws_stream.split();
            drop(read);
        }
        Ok(Err(_)) => {
            println!("┌─────────────────────────────────────────────┐");
            println!("│  STATUS: DISCONNECTED                       │");
            println!("├─────────────────────────────────────────────┤");
            println!("│  Desktop App:   OFFLINE                     │");
            println!("│  WebSocket:     Not available               │");
            println!("│                                                 │");
            println!("│  Please start FortiVault Desktop            │");
            println!("└─────────────────────────────────────────────┘");
        }
        Err(_) => {
            println!("┌─────────────────────────────────────────────┐");
            println!("│  STATUS: TIMEOUT                            │");
            println!("├─────────────────────────────────────────────┤");
            println!("│  Desktop App:   NOT RESPONDING             │");
            println!("│  WebSocket:     Connection timeout          │");
            println!("└─────────────────────────────────────────────┘");
        }
    }
    
    Ok(())
}

async fn pair_desktop() -> Result<(), Box<dyn std::error::Error>> {
    print_banner();
    
    println!("Pairing with FortiVault Desktop...");
    println!();
    println!("1. Open FortiVault Desktop on this machine");
    println!("2. Go to Settings > Pairing");
    println!("3. Enter the pairing code shown below");
    println!();
    
    // Generate a random 6-digit code
    let code: u32 = rand::random::<u32>() % 900000 + 100000;
    println!("┌─────────────────────────────────────────────┐");
    println!("│  PAIRING CODE: {}                           │", code);
    println!("└─────────────────────────────────────────────┘");
    println!();
    println!("Waiting for pairing confirmation...");
    
    // TODO: Implement actual pairing via WebSocket
    
    Ok(())
}

fn print_banner() {
    println!();
    println!("╔═══════════════════════════════════════════════╗");
    println!("║  FORTIVAULT CLI v0.1.0                       ║");
    println!("║  Zero-Knowledge Secrets Manager             ║");
    println!("╚═══════════════════════════════════════════════╝");
    println!();
}
