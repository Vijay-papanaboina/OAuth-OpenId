# Generic OAuth 2.0 & OpenID Connect Client

A scalable, server-side OAuth 2.0 / OpenID Connect (OIDC) implementation using Node.js, Express, and `openid-client` (v6).

**Current Status**: Fully implemented with **Discord** as the initial provider.
**Roadmap**: Designed to easily extend support for Google, GitHub, and other OIDC providers.

This project implements the **Authorization Code Flow** with **PKCE** (Proof Key for Code Exchange) and extensive state verification, providing a secure foundation for any identity provider.

## 🚀 Key Features

- **Provider Agnostic Design**: Built to support any OIDC-compliant provider (Google, Auth0, Okta, etc.) or plain OAuth 2.0 services (GitHub, Discord).
- **Security Best Practices**:
  - **Strict PKCE**: Prevents authorization code interception.
  - **State Verification**: Mitigates CSRF attacks.
  - **Secure Session Cookies**: `httpOnly` and `SameSite` configurations.
- **Configurable Architecture**: Endpoints and credentials are managed via environment variables, allowing you to switch providers without rewriting core logic.

## 📋 Prerequisites

- **Node.js** (v18+)
- **Provider Credentials**: Client ID and Secret from your identity provider (e.g., Discord Developer Portal).

## 🛠️ Installation

```bash
git clone https://github.com/Vijay-papanaboina/OAuth-OpenId.git
cd OAuth-OpenId
npm install
```

## ⚙️ Configuration

Create a `.env` file in the root directory. The current configuration uses Discord as the example provider:

```env
# Server Config
PORT=3000
NODE_ENV=development

# OAuth Provider Configuration (Example: Discord)
DISCORD_ISSUER=https://discord.com
DISCORD_AUTHORIZATION_ENDPOINT=https://discord.com/oauth2/authorize
DISCORD_TOKEN_ENDPOINT=https://discord.com/api/oauth2/token
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback

# Client App URL (For redirecting after login)
CLIENT_URL=http://localhost:5500
```

> **Note**: To check if a provider supports OIDC Discovery, you can often omitting the manual endpoints in code (if supported), but manual configuration (as shown above) ensures compatibility with providers like Discord that don't strictly follow OIDC discovery standards.

## 🏃‍♂️ Usage

1.  **Start the Server**:
    ```bash
    npm run dev
    ```
2.  **Visit the Sign-In Route**:
    Navigate to `http://localhost:3000/api/auth/discord/sign-in`.
3.  **Callback**:
    After authentication, the provider redirects back to your callback route, which exchanges the code for tokens, fetches the user profile, and redirects to your client app.

## �️ API Structure

The project is structured to easily add new providers:

- `helpers/auth.helper.ts`: Core OAuth logic. Currently configured for `DISCORD_` env vars, but can be refactored to accept a `provider` argument to support `google`, `github`, etc. dynamically.
- `routes/auth.routes.ts`: Handles the Express routes. You can basically copy-paste the Discord routes to create `/google/sign-in` or `/github/sign-in` routes in the future.

## 🛡️ Security Implementation

- **In-Memory Store**: Uses a `Map` (in `data/data.ts`) to temporarily store PKCE verifiers and State. **Production Note**: Replace this with Redis or a database for persistent, distributed sessions.
- **Token Handling**: Access tokens are used server-side to fetch user info and are not exposed to the client in the URL (only the user profile object is passed for demonstration).

## 📄 License

ISC
