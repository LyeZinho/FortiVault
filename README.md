# 🛡️ Fortivault

**The Industrial-Grade, Zero-Knowledge Secret Manager.**

Fortivault is a decentralized ecosystem for managing passwords, API keys, and environment variables. It was designed to eliminate the weakest link in web security: the browser. Through a "bridge" architecture featuring a native **Rust** engine, Fortivault ensures your secrets are never decrypted in a vulnerable environment.

-----

## 🏗️ Global Architecture

Fortivault operates on a security triad to guarantee data integrity:

1.  **Fortivault Web (SvelteKit):** Administrative interface and viewer. It acts as a "dumb" terminal that requests cryptographic operations from the desktop client.
2.  **Fortivault Core (Rust/Tauri):** The "brain" of the project. It manages private keys, AES-256-GCM encryption, and integration with OS biometrics.
3.  **Fortivault Server (NestJS/PostgreSQL):** The orchestrator. It manages RBAC permissions, encrypted data synchronization, and audit logs.

-----

## 🎨 Design System: Neobrutalism

The project follows a rigorous **Neobrutalist** aesthetic to convey robustness and clarity:

* **Palette:** Blue (#3B82F6), Black (#000000), and Grey (#F3F4F6).
* **UI:** `4px` borders, solid shadows, and mono typography for sensitive data.
* **UX:** Physical visual feedback — "sinking" buttons and components that react to the status of the Rust engine.

-----

## 🚀 Key Features (FRs)

### 🔐 Zero-Knowledge Security

* The server only stores encrypted payloads.
* Private keys reside exclusively within **Fortivault Desktop**.
* Local decryption: plaintext secrets never touch the database.

### 🏢 Scope Management (Folders & Departments)

* **Personal Vaults:** Individual secrets.
* **Department Vaults:** Sharing based on asymmetric encryption (Group Keys).
* **RBAC:** Fine-grained control over who can view, edit, or manage vaults.

### 💻 CLI: Bye Bye `.env` files

The **Fortivault Run** feature allows you to inject secrets directly into a process's memory:

```bash
fortivault run "npm run dev"
```

*No `.env` files are written to disk, preventing accidental leaks in repositories.*

-----

## 🛠️ Tech Stack

* **Frontend:** [SvelteKit](https://kit.svelte.dev/) + [TailwindCSS](https://tailwindcss.com/)
* **Backend:** [NestJS](https://nestjs.com/) + [PostgreSQL](https://www.postgresql.org/)
* **Core & Desktop:** [Rust](https://www.rust-lang.org/) + [Tauri](https://tauri.app/)
* **Queue/Cache:** [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/)
* **Monorepo:** [Turborepo](https://turbo.build/)
* **Validation:** [Zod](https://zod.dev/)

-----

## ✅ Requirements for Completion (Definition of Done)

* [ ] **FR01:** Secure Browser-Desktop pairing via ECDH.
* [ ] **FR02:** Creation of Personal and Department vaults.
* [ ] **FR03:** Support for types: Password, API Key, and Env Vars.
* [ ] **FR04:** Mandatory decryption within the Rust engine.
* [ ] **FR05:** Immutable audit logs on the Backend.
* [ ] **FR06:** Functional CLI for runtime variable injection.
* [ ] **FR07:** "Break-glass" recovery system via Shamir's Secret Sharing.

-----

## 🛠️ Installation (Development)

1.  Clone the monorepo:
    ```bash
    git clone https://github.com/your-user/fortivault.git
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Start the development environment:
    ```bash
    pnpm dev
    ```

-----

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

-----

**Developed with a focus on maximum security and raw performance.**
