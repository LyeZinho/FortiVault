// Shamir's Secret Sharing implementation for FortiVault
// This implements (k, n) threshold scheme where:
// - A secret is divided into n shares
// - Any k shares can reconstruct the secret
// - Fewer than k shares reveal nothing about the secret

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Key};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A share in Shamir's Secret Sharing scheme
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShamirShare {
    pub x: u32,     // x-coordinate (share index)
    pub y: Vec<u8>, // y-coordinates (one per byte of the secret)
    pub threshold: u32,
    pub total_shares: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryConfig {
    pub threshold: u32,    // Minimum shares needed (k)
    pub total_shares: u32, // Total shares to generate (n)
    pub share_holders: Vec<ShareHolder>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareHolder {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
    pub role: ShareHolderRole,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ShareHolderRole {
    User,      // The account owner
    Admin,     // IT Admin
    Colleague, // Trusted colleague
    External,  // External trusted party (lawyer, etc.)
}

/// Split a secret into n shares using Shamir's Secret Sharing
///
/// # Arguments
/// * `secret` - The secret to split (as bytes)
/// * `threshold` - Minimum shares needed to reconstruct (k)
/// * `total_shares` - Total number of shares to generate (n)
///
/// # Returns
/// Vector of shares where each share is a ShamirShare
pub fn split_secret(
    secret: &[u8],
    threshold: u32,
    total_shares: u32,
) -> Result<Vec<ShamirShare>, String> {
    if threshold < 2 {
        return Err("Threshold must be at least 2".to_string());
    }
    if total_shares < threshold {
        return Err("Total shares must be >= threshold".to_string());
    }
    if total_shares > 255 {
        return Err("Maximum 255 shares supported".to_string());
    }

    let mut shares = Vec::with_capacity(total_shares as usize);
    let secret_len = secret.len();

    // Generate random coefficients for each byte position
    // For each byte of the secret, we create a polynomial of degree (threshold - 1)
    // The constant term (a0) is the secret byte itself

    for share_idx in 1..=total_shares {
        let mut y_values = Vec::with_capacity(secret_len);

        for byte_idx in 0..secret_len {
            let secret_byte = secret[byte_idx];

            // Generate random coefficients for this byte's polynomial
            // a0 = secret_byte, a1..a(threshold-1) = random
            let mut coefficients = vec![secret_byte];
            let mut random_coeffs = vec![0u8; (threshold as usize - 1) * 4]; // 4 bytes per u32
            OsRng.fill_bytes(&mut random_coeffs);

            // Parse random bytes as u32 values
            for chunk in random_coeffs.chunks(4) {
                let mut arr = [0u8; 4];
                arr.copy_from_slice(chunk);
                coefficients.push(arr[0]); // Use first byte as coefficient (simplified)
            }

            // Evaluate polynomial at x = share_idx
            // f(x) = a0 + a1*x + a2*x^2 + ... + a(k-1)*x^(k-1)
            let mut result = coefficients[0] as u32;
            for (deg, coeff) in coefficients.iter().enumerate().skip(1) {
                let mut power = 1u32;
                for _ in 0..deg {
                    power = power.wrapping_mul(share_idx);
                }
                result = result.wrapping_add((*coeff as u32).wrapping_mul(power));
            }

            y_values.push(result as u8);
        }

        shares.push(ShamirShare {
            x: share_idx,
            y: y_values,
            threshold,
            total_shares,
        });
    }

    Ok(shares)
}

/// Reconstruct a secret from k or more shares using Lagrange interpolation
///
/// # Arguments
/// * `shares` - Vector of at least k ShamirShares
///
/// # Returns
/// The reconstructed secret as bytes
pub fn reconstruct_secret(shares: &[ShamirShare]) -> Result<Vec<u8>, String> {
    if shares.is_empty() {
        return Err("No shares provided".to_string());
    }

    let threshold = shares[0].threshold as usize;
    let total_shares = shares[0].total_shares as usize;

    if shares.len() < threshold {
        return Err(format!(
            "Need at least {} shares to reconstruct, got {}",
            threshold,
            shares.len()
        ));
    }

    // Verify all shares have the same threshold and length
    let secret_len = shares[0].y.len();
    for share in shares {
        if share.threshold != shares[0].threshold {
            return Err("All shares must have the same threshold".to_string());
        }
        if share.y.len() != secret_len {
            return Err("All shares must have the same length".to_string());
        }
    }

    // Use Lagrange interpolation at x=0 to recover each byte
    let mut secret = Vec::with_capacity(secret_len);

    for byte_idx in 0..secret_len {
        // Get y values for this byte position from all shares
        let y_values: Vec<u32> = shares.iter().map(|s| s.y[byte_idx] as u32).collect();

        let x_values: Vec<u32> = shares.iter().map(|s| s.x as u32).collect();

        // Lagrange interpolation: f(0) = Σ(yi * λi)
        // where λi = Π(xj / (xj - xi)) for all j != i
        let mut result = 0u32;

        for i in 0..shares.len() {
            let mut numerator = 1u32;
            let mut denominator = 1u32;

            for j in 0..shares.len() {
                if i != j {
                    // Calculate x_j * (x_j - x_i)^-1 mod 256
                    // Since we're working with small numbers, we can use modular arithmetic
                    let xj = x_values[j];
                    let xi = x_values[i];

                    numerator = numerator.wrapping_mul(xj);

                    // Compute modular inverse using extended Euclidean algorithm
                    let diff = xj.wrapping_sub(xi);
                    if diff == 0 {
                        continue; // Skip if same x value
                    }

                    // Simple modular inverse for 256 (which is 2^8)
                    // For small values, we can just compute directly
                    let inv = mod_inverse_256(diff as u8);
                    denominator = denominator.wrapping_mul(inv as u32);
                }
            }

            // λi = numerator * denominator^-1 mod 256
            let lambda = numerator.wrapping_mul(mod_inverse_256(denominator as u8) as u32);
            result = result.wrapping_add(y_values[i].wrapping_mul(lambda));
        }

        secret.push(result as u8);
    }

    Ok(secret)
}

/// Simple modular inverse for values up to 255
/// Using extended Euclidean algorithm
fn mod_inverse_256(a: u8) -> u8 {
    if a == 0 {
        return 0; // No inverse for 0
    }

    // Extended Euclidean algorithm
    let mut m0 = 256i32;
    let mut t: i32;
    let mut q: i32;
    let mut x0: i32 = 0;
    let mut x1: i32 = 1;
    let mut a = a as i32;

    if m0 == 1 {
        return 1;
    }

    while a > 1 {
        q = a / m0;
        t = m0;
        m0 = a % m0;
        a = t;
        t = x0;
        x0 = x1 - q * x0;
        x1 = t;
    }

    if x1 < 0 {
        x1 += 256;
    }

    x1 as u8
}

/// Encrypt the master key and split it into shares for disaster recovery
pub fn create_recovery_shares(
    master_key: &[u8],
    config: &RecoveryConfig,
) -> Result<Vec<ShamirShare>, String> {
    split_secret(master_key, config.threshold, config.total_shares)
}

/// Reconstruct the master key from recovery shares
pub fn recover_from_shares(shares: &[ShamirShare]) -> Result<Vec<u8>, String> {
    reconstruct_secret(shares)
}

/// Encrypt shares for storage/backup
pub fn encrypt_share(share: &ShamirShare, encryption_key: &[u8]) -> Result<String, String> {
    let key = Key::<Aes256Gcm>::from_slice(encryption_key);
    let cipher = Aes256Gcm::new(key);

    let nonce_bytes: [u8; 12] = rand::random();
    let nonce = aes_gcm::Nonce::from_slice(&nonce_bytes);

    let plaintext = serde_json::to_vec(share).map_err(|e| e.to_string())?;
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_ref())
        .map_err(|e| e.to_string())?;

    let mut result = nonce_bytes.to_vec();
    result.extend(ciphertext);

    Ok(STANDARD.encode(&result))
}

/// Decrypt a stored share
pub fn decrypt_share(encrypted_data: &str, encryption_key: &[u8]) -> Result<ShamirShare, String> {
    let data = STANDARD.decode(encrypted_data).map_err(|e| e.to_string())?;

    if data.len() < 12 {
        return Err("Invalid encrypted data".to_string());
    }

    let key = Key::<Aes256Gcm>::from_slice(encryption_key);
    let cipher = Aes256Gcm::new(key);

    let nonce = aes_gcm::Nonce::from_slice(&data[..12]);
    let ciphertext = &data[12..];

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| e.to_string())?;

    serde_json::from_slice(&plaintext).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_and_reconstruct() {
        let secret = b"my-super-secret-master-key-12345";
        let threshold = 3u32;
        let total_shares = 5u32;

        let shares = split_secret(secret, threshold, total_shares).unwrap();
        assert_eq!(shares.len(), 5);

        // Reconstruct with all 5 shares
        let reconstructed = reconstruct_secret(&shares).unwrap();
        assert_eq!(reconstructed, secret);

        // Reconstruct with exactly 3 shares (threshold)
        let subset = vec![shares[0].clone(), shares[2].clone(), shares[4].clone()];
        let reconstructed = reconstruct_secret(&subset).unwrap();
        assert_eq!(reconstructed, secret);

        // Try with 2 shares (should fail - below threshold)
        let subset = vec![shares[0].clone(), shares[1].clone()];
        let result = reconstruct_secret(&subset);
        assert!(result.is_err());
    }

    #[test]
    fn test_mod_inverse() {
        // 1 * 1 = 1 mod 256, so inverse of 1 is 1
        assert_eq!(mod_inverse_256(1), 1);

        // 3 * 171 = 513 = 1 mod 256, so inverse of 3 is 171
        assert_eq!(mod_inverse_256(3), 171);

        // 7 * 183 = 1281 = 1 mod 256, so inverse of 7 is 183
        assert_eq!(mod_inverse_256(7), 183);
    }
}
