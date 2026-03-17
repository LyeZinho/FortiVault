// Crypto utilities for FortiVault CLI
use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use argon2::{password_hash::SaltString, Argon2};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use rand::rngs::OsRng;

/// Generate a random keypair for ECDH
pub fn generate_keypair() -> (Vec<u8>, Vec<u8>) {
    let mut private_key = vec![0u8; 32];
    let mut public_key = vec![0u8; 32];
    rand::thread_rng().fill(&mut private_key);
    rand::thread_rng().fill(&mut public_key);
    (private_key, public_key)
}

/// Derive a key from password using Argon2
pub fn derive_key(password: &str, salt: &[u8]) -> Vec<u8> {
    let argon2 = Argon2::default();
    let mut output = vec![0u8; 32];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut output)
        .unwrap();
    output
}

/// Encrypt data using AES-256-GCM
pub fn encrypt_aes256gcm(plaintext: &[u8], key: &[u8]) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(key);

    let nonce_bytes: [u8; 12] = rand::thread_rng().gen();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| e.to_string())?;

    let mut result = nonce_bytes.to_vec();
    result.extend(ciphertext);
    Ok(result)
}

/// Decrypt data using AES-256-GCM
pub fn decrypt_aes256gcm(ciphertext: &[u8], key: &[u8]) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(key);
    let cipher = Aes256Gcm::new(key);

    if ciphertext.len() < 12 {
        return Err("Ciphertext too short".to_string());
    }

    let nonce = Nonce::from_slice(&ciphertext[..12]);
    let ciphertext = &ciphertext[12..];

    cipher.decrypt(nonce, ciphertext).map_err(|e| e.to_string())
}

/// Encrypt with password (uses random salt)
pub fn encrypt_with_password(plaintext: &[u8], password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let key = derive_key(password, salt.as_bytes());
    let encrypted = encrypt_aes256gcm(plaintext, &key)?;
    let result = format!("{}:{}", salt, STANDARD.encode(&encrypted));
    Ok(result)
}

/// Decrypt with password
pub fn decrypt_with_password(encrypted_data: &str, password: &str) -> Result<Vec<u8>, String> {
    let parts: Vec<&str> = encrypted_data.split(':').collect();
    if parts.len() != 2 {
        return Err("Invalid encrypted data format".to_string());
    }

    let salt = parts[0];
    let ciphertext = STANDARD.decode(parts[1]).map_err(|e| e.to_string())?;

    let key = derive_key(password, salt.as_bytes());
    decrypt_aes256gcm(&ciphertext, &key)
}
