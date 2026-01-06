# Generic OAuth 2.0 & OpenID Connect Client

A scalable, server-side OAuth 2.0 / OpenID Connect (OIDC) implementation using Node.js, Express, and `openid-client` (v6).

**Current Status**: Fully implemented with **Discord**, **GitHub**, and **Google** support.

## 🚀 Key Features

- **Multi-Provider Support**: Discord, GitHub, Google (easily extensible).
- **JWT Session Management**: Secure httpOnly cookies for authentication.
- **Normalized User Data**: Consistent `username`, `email`, `avatar` across all providers.
- **Security Best Practices**:
  - PKCE (Proof Key for Code Exchange)
  - State verification (CSRF protection)
  - Secure httpOnly cookies

## 📁 Project Structure

```
├── controllers/
│   └── auth.controller.ts     # HTTP request handlers
├── services/
│   └── auth.service.ts        # Business logic (OAuth flows)
├── repositories/
│   └── user.repository.ts     # Data access layer
├── helpers/
│   ├── providers.config.ts    # Provider configurations
│   └── config.manager.ts      # Config caching & discovery
├── utils/
│   └── jwt.util.ts            # JWT sign/verify utilities
├── data/
│   └── data.ts                # In-memory storage (users, PKCE)
├── routes/
│   ├── index.routes.ts
│   └── auth.routes.ts
└── index.ts                   # Express server entry
```

## 🛠️ Installation

```bash
git clone https://github.com/Vijay-papanaboina/OAuth-OpenId.git
cd OAuth-OpenId
npm install
```

## ⚙️ Configuration

Create a `.env` file:

```env
# Discord
DISCORD_ISSUER=https://discord.com
DISCORD_AUTHORIZATION_ENDPOINT=https://discord.com/oauth2/authorize
DISCORD_TOKEN_ENDPOINT=https://discord.com/api/oauth2/token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback

# GitHub
GITHUB_ISSUER=https://github.com
GITHUB_AUTHORIZATION_ENDPOINT=https://github.com/login/oauth/authorize
GITHUB_TOKEN_ENDPOINT=https://github.com/login/oauth/access_token
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback

# Google (uses OIDC Discovery - no endpoint config needed)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# JWT
JWT_SECRET=your_super_secret_key
```

## 🏃‍♂️ Usage

```bash
npm run dev
```

**Sign In URLs:**

- Discord: `http://localhost:3000/api/auth/discord/sign-in`
- GitHub: `http://localhost:3000/api/auth/github/sign-in`
- Google: `http://localhost:3000/api/auth/google/sign-in`

## 🔌 API Endpoints

| Method | Endpoint                       | Description                        |
| ------ | ------------------------------ | ---------------------------------- |
| GET    | `/api/auth/:provider/sign-in`  | Initiate OAuth flow                |
| GET    | `/api/auth/:provider/callback` | OAuth callback handler             |
| GET    | `/api/auth/me`                 | Get current user (from JWT cookie) |
| POST   | `/api/auth/logout`             | Clear session                      |

## 📦 User Data Model

```typescript
interface User {
  id: string;
  provider: string;
  username: string;
  email: string | null;
  avatar: string | null;
  raw: Record<string, any>; // Original provider data
}
```

## 🔐 Auth Flow

1. User clicks "Sign In with [Provider]".
2. Server generates PKCE & state, redirects to provider.
3. User authenticates, provider redirects to callback.
4. Server exchanges code for tokens, fetches user info.
5. Server normalizes data, stores in memory, creates JWT.
6. JWT stored in httpOnly cookie, user redirected to frontend.
7. Frontend calls `/api/auth/me` to retrieve user data.

## 📄 License

ISC
