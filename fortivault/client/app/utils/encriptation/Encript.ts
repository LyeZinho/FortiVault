import crypto from 'crypto';

class Encryption {
    private key: string;
    private iv: string;

    constructor(key?: string, iv?: string) {
        this.key = key || '';
        this.iv = iv || ''
    }

    // Encrypts data using AES-256-CBC
    encrypt(data: string): string {
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.key), Buffer.from(this.iv));
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    }

    // Decrypts data using AES-256-CBC
    decrypt(encryptedData: string): string {
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.key), Buffer.from(this.iv));
        let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    // Generates a SHA-256 hash from data
    hash(data: string): string {
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }

    // Generates a SHA-512 hash from data
    hash512(data: string): string {
        const hash = crypto.createHash('sha512');
        hash.update(data);
        return hash.digest('hex');
    }

    // Generates a SHA-256 hash from data using a given key
    hashWithKey(data: string, key: string): string {
        const hmac = crypto.createHmac('sha256', Buffer.from(key));
        hmac.update(data);
        return hmac.digest('hex');
    }

    // Generates a SHA-512 hash from data using a given key
    hash512WithKey(data: string, key: string): string {
        const hmac = crypto.createHmac('sha512', Buffer.from(key));
        hmac.update(data);
        return hmac.digest('hex');
    }

    // Generates a random key
    generateKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // Generates a random initialization vector
    generateIV(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    // Checks if two given keys are equal
    areKeysEqual(key1: string, key2: string): boolean {
        return this.hashWithKey(key1, key1) === this.hashWithKey(key2, key2);
    }

    // Checks if two given initialization vectors are equal
    areIVsEqual(iv1: string, iv2: string): boolean {
        return iv1 === iv2;
    }

    // Checks if two given hashes are equal
    areHashesEqual(hash1: string, hash2: string): boolean {
        return hash1 === hash2;
    }
}

export default Encryption;