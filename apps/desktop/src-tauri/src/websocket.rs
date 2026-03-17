// WebSocket server for communication with SvelteKit frontend
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::AppHandle;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::broadcast;
use tokio_tungstenite::{accept_async, tungstenite::Message};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "PING")]
    Ping,
    #[serde(rename = "PONG")]
    Pong,
    #[serde(rename = "DECRYPT_REQUEST")]
    DecryptRequest { encrypted_blob: String },
    #[serde(rename = "DECRYPT_RESPONSE")]
    DecryptResponse { plaintext: String },
    #[serde(rename = "KEY_EXCHANGE")]
    KeyExchange { public_key: String },
    #[serde(rename = "KEY_EXCHANGE_ACK")]
    KeyExchangeAck { session_key: String },
}

/// Start WebSocket server on localhost
pub async fn start_server(_app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = "127.0.0.1:9876";
    let listener = TcpListener::bind(addr).await?;
    tracing::info!("WebSocket server listening on {}", addr);
    
    // Broadcast channel for messaging
    let (tx, _rx) = broadcast::channel::<String>(100);
    
    while let Ok((stream, addr)) = listener.accept().await {
        tracing::info!("New WebSocket connection from {}", addr);
        let tx = tx.clone();
        
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream, tx).await {
                tracing::error!("Connection error: {}", e);
            }
        });
    }
    
    Ok(())
}

async fn handle_connection(stream: TcpStream, tx: broadcast::Sender<String>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let ws_stream = accept_async(stream).await?;
    let (mut write, mut read) = ws_stream.split();
    
    // Subscribe to broadcast channel
    let mut rx = tx.subscribe();
    
    loop {
        tokio::select! {
            // Handle incoming messages
            msg = read.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        tracing::debug!("Received: {}", text);
                        if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                            match ws_msg {
                                WsMessage::Ping => {
                                    let response = serde_json::to_string(&WsMessage::Pong).unwrap();
                                    write.send(Message::Text(response)).await?;
                                }
                                WsMessage::DecryptRequest { encrypted_blob } => {
                                    // TODO: Decrypt using session key from key exchange
                                    // For now, just echo back for testing
                                    let response = serde_json::to_string(&WsMessage::DecryptResponse {
                                        plaintext: "DECRYPTED_VALUE".to_string()
                                    }).unwrap();
                                    write.send(Message::Text(response)).await?;
                                }
                                WsMessage::KeyExchange { public_key } => {
                                    tracing::info!("Key exchange request received");
                                    // TODO: Generate session key, encrypt with client's public key
                                    let response = serde_json::to_string(&WsMessage::KeyExchangeAck {
                                        session_key: "SESSION_KEY_PLACEHOLDER".to_string()
                                    }).unwrap();
                                    write.send(Message::Text(response)).await?;
                                }
                                _ => {}
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        break;
                    }
                    Some(Ok(Message::Ping(data))) => {
                        write.send(Message::Pong(data)).await?;
                    }
                    Some(Err(e)) => {
                        tracing::error!("Error: {}", e);
                        break;
                    }
                    _ => {}
                }
            }
            // Handle broadcast messages
            msg = rx.recv() => {
                if let Ok(msg) = msg {
                    write.send(Message::Text(msg)).await?;
                }
            }
        }
    }
    
    Ok(())
}
