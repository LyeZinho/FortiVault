# FortiVault

**FortiVault** is a decentralized password manager designed to keep your credentials secure by eliminating reliance on central servers. Built with a focus on privacy and security, FortiVault uses cutting-edge technology to ensure that your sensitive information is stored and synchronized safely across devices without the need for large data centers or third-party servers.

## Why FortiVault?

In recent years, data breaches have exposed millions of passwords and sensitive information from major databases. For instance:

- **Equifax Data Breach (2017)**: Over 147 million records, including sensitive personal information, were compromised.
- **Yahoo Data Breaches (2013-2014)**: A series of breaches resulted in over 3 billion accounts being compromised.
- **LastPass Security Incident (2022)**: Exposed data from a password manager raised concerns about password security and encryption practices.

These incidents highlight the risks associated with storing personal data on centralized servers. Large data centers, while providing convenience, are also lucrative targets for cybercriminals. FortiVault mitigates these risks by employing a decentralized approach, ensuring that your passwords are stored and managed on your own devices, not in vulnerable data centers.

## Features

- **Decentralized Storage:** Passwords are stored locally on your device and synchronized across devices using a peer-to-peer network.
- **Strong Encryption:** AES encryption ensures that your data is securely encrypted and protected from unauthorized access.
- **Multi-Factor Authentication (MFA):** Enhance security with MFA, including biometric options.
- **Cross-Platform Compatibility:** Available for Windows, macOS, Linux, Android, and iOS.
- **Backup and Recovery:** Secure backups and recovery options to safeguard against data loss.

# Archtecture

```
+------------------------------------------------------+
|                FortiVault Architecture               |
+------------------------------------------------------+

+---------------------------+      +---------------------------+
|                           |      |                           |
|      Client (Local App)   |<---->|     Dedicated Server/NAS  |
|                           |      |                           |
| +-----------------------+ |      | +-----------------------+ |
| |                       | |      | |                       | |
| |    Password Storage   | |      | |    Password Storage   | |
| |    (Encrypted)        | |<---->| |    (Encrypted)        | |
| |                       | |      | |                       | |
| +-----------------------+ |      | +-----------------------+ |
|                           |      |                           |
| +-----------------------+ |      | +-----------------------+ |
| |                       | |      | |                       | |
| |   Backup Manager      | |      | |   Backup Manager      | |
| | (Local & Remote)      | |<---->| | (Server Backup)       | |
| |                       | |      | |                       | |
| +-----------------------+ |      | +-----------------------+ |
|                           |      |                           |
| +-----------------------+ |      | +-----------------------+ |
| |                       | |      | |                       | |
| |   Encryption Module   | |      | |   Encryption Module   | | (Server not encript client data because
| |  (AES-256, Argon2)    | |      | |  (AES-256, Argon2)    | |  the data already come to server encripted 
| |                       | |      | |                       | |  so only client know how to decript
| +-----------------------+ |      | +-----------------------+ |  it will ensure that even if data leaks the 
|                           |      |                           |  content will remain safe)
| +-----------------------+ |      | +-----------------------+ |
| |                       | |      | |                       | |
| |   P2P Sync Manager    | |<---->| |   P2P Sync Manager    | |
| |  (libp2p)             | |      | |  (libp2p)             | |
| |                       | |      | |                       | |
| +-----------------------+ |      | +-----------------------+ |
|                           |      |                           |
| +-----------------------+ |      | +-----------------------+ |
| |                       | |      | |                       | |
| |   Authentication      | |      | |   Authentication      | |
| |   & Authorization     | |<---->| |   & Authorization     | |
| |  (MFA, JWT, etc.)     | |      | |  (MFA, JWT, etc.)     | |
| |                       | |      | |                       | |
| +-----------------------+ |      | +-----------------------+ |
|                           |      |                           |
+---------------------------+      +---------------------------+

+-------------------------------+  +-------------------------------+
|           User Interface      |  |    Network & Security Layers  |
+-------------------------------+  +-------------------------------+
|                               |  |                               |
| +---------------------------+ |  | +---------------------------+ |
| |   Next.js Frontend        | |  | |   TLS/SSL Encryption      | |
| |   (React, Tauri)          | |  | |   Secure Communication    | |
| +---------------------------+ |  | +---------------------------+ |
|                               |  |                               |
| +---------------------------+ |  | +---------------------------+ |
| |   API Communication       | |  | |   API Security Layer      | |
| |   (Rust, Tauri)           | |  | |   (JWT, OAuth2, etc.)     | |
| +---------------------------+ |  | +---------------------------+ |
+-------------------------------+  +-------------------------------+
```
![schema](https://raw.githubusercontent.com/LyeZinho/FortiVault/main/schemagroups.png)
### Explaination

Client (local application):
   - Password Storage: Stores passwords in encrypted form locally on the device.
   - Backup Manager: Manages local and remote backups. In case of dedicated servers, sync with them.
   - Encryption module: Performs data encryption using AES-256 and key derivation using Argon2.
   - P2P Sync Manager: Manages peer-to-peer synchronization between devices, ensuring that passwords are always up to date.
   - Authentication and Authorization: Implements authentication and authorization mechanisms, such as MFA and JWT.

Dedicated Server/NAS:
   - It works as a dedicated server where users can store their passwords, sync between devices and keep secure backups.
   - It shares the same functionalities as the local client, but operates on a dedicated server.

User Interface:
   - Next.js Frontend: User interface built with Next.js and React, integrated with Tauri to enable desktop functionality.
   - API Communication: Communication between frontend and backend is done securely using Rust and Tauri.

Network and security layers:
   - TLS/SSL encryption: Ensures that all communications between client and server are secure.
   - API Security Layer: Protects APIs with mechanisms like JWT, OAuth2, and other security practices.

```
/fortivault
    /client
        /src
        /public
        /components
        /services
        /pages
        /assets
        /hooks
        /utils
        /config
        /tests
        next.config.js
        package.json
        README.md
    /server
        /src
        /config
        /routes
        /models
        /services
        /tests
        Cargo.toml
        README.md
    /shared
        /src
        /config
        /utils
        /models
        /tests
        Cargo.toml
    /docs
        architecture.md
        setup.md
        user-guide.md
    /scripts
        setup.sh
        deploy.sh
    README.md
```

Palette:
#333333, #643173, #7d5ba6, #86a59c, #89ce94

## Getting Started

To get started with FortiVault, follow these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/fortivault.git
   ```

2. **Install Dependencies:**
   Navigate to the project directory and install dependencies for each microservice.
   ```bash
   cd fortivault
   # Follow the installation instructions for each microservice
   ```

3. **Build and Run:**
   Build and run the application using the provided scripts or commands.
   ```bash
   # Example command
   npm run start
   ```

4. **Configuration:**
   Follow the configuration guidelines provided in the `docs/` directory to set up your local environment and synchronize devices.

## Contributing

We welcome contributions from the community to help improve FortiVault. Here’s how you can get involved:

1. **Report Issues:**
   If you encounter any bugs or have suggestions for improvements, please [open an issue](https://github.com/yourusername/fortivault/issues).

2. **Submit Pull Requests:**
   Feel free to submit pull requests with bug fixes, new features, or improvements. Make sure to follow the [contribution guidelines](CONTRIBUTING.md).

3. **Join the Discussion:**
   Engage with other contributors and developers on our [discussion forum](https://github.com/yourusername/fortivault/discussions).

4. **Spread the Word:**
   Share FortiVault with others who might benefit from a more secure way to manage their passwords.

## License

FortiVault is licensed under the [MIT License](LICENSE). See the LICENSE file for more details.

---

Protect your credentials and join us in revolutionizing password management with FortiVault.
