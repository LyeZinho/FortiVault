use tauri::Manager;

mod crypto;
mod websocket;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to FortiVault Desktop.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
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
