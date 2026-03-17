use tauri::Manager;

mod crypto;
mod shamir;
mod websocket;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to FortiVault Desktop.", name)
}

/// Create recovery shares from a master key
#[tauri::command]
fn create_recovery_shares(
    master_key: String,
    threshold: u32,
    total_shares: u32,
) -> Result<Vec<shamir::ShamirShare>, String> {
    shamir::create_recovery_shares(master_key.as_bytes(), &shamir::RecoveryConfig {
        threshold,
        total_shares,
        share_holders: vec![],
    })
}

/// Reconstruct master key from shares
#[tauri::command]
fn recover_from_shares(shares: Vec<shamir::ShamirShare>) -> Result<String, String> {
    let recovered = shamir::recover_from_shares(&shares)?;
    String::from_utf8(recovered).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            create_recovery_shares,
            recover_from_shares
        ])
        .setup(|app| {
            tracing::info!("FortiVault Desktop starting...");
            
            // Start WebSocket server for communication with frontend
            #[cfg(not(target_os = "android"))]
            {
                let handle = app.handle().clone();
                std::thread::spawn(move || {
                    if let Err(e) = websocket::start_server(handle) {
                        tracing::error!("WebSocket server error: {}", e);
                    }
                });
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
