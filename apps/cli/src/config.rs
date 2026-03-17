// Configuration module for FortiVault CLI

use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

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

impl Config {
    pub fn config_path() -> Option<PathBuf> {
        ProjectDirs::from("com", "fortivault", "cli")
            .map(|dirs| dirs.config_dir().join("config.json"))
    }

    pub fn load() -> Self {
        if let Some(path) = Self::config_path() {
            if path.exists() {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(config) = serde_json::from_str(&content) {
                        return config;
                    }
                }
            }
        }

        Self::default()
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(path) = Self::config_path() {
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent)?;
            }
            let content = serde_json::to_string_pretty(self)?;
            fs::write(path, content)?;
        }
        Ok(())
    }
}
