export interface ProviderConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope: string;
}

export const providers: Record<string, ProviderConfig> = {
  discord: {
    issuer: process.env.DISCORD_ISSUER!,
    authorization_endpoint: process.env.DISCORD_AUTHORIZATION_ENDPOINT!,
    token_endpoint: process.env.DISCORD_TOKEN_ENDPOINT!,
    userinfo_endpoint: "https://discord.com/api/users/@me",
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    scope: "identify email",
  },
  github: {
    issuer: process.env.GITHUB_ISSUER!,
    authorization_endpoint: process.env.GITHUB_AUTHORIZATION_ENDPOINT!,
    token_endpoint: process.env.GITHUB_TOKEN_ENDPOINT!,
    userinfo_endpoint: "https://api.github.com/user",
    client_id: process.env.GITHUB_CLIENT_ID!,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: "read:user user:email",
  },
  google: {
    issuer: "https://accounts.google.com",
    authorization_endpoint: "", // Discovered
    token_endpoint: "", // Discovered
    userinfo_endpoint: "", // Discovered
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    scope: "openid profile email",
  },
};
