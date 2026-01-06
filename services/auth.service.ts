import * as client from "openid-client";
import { code_verification } from "../data/data";
import { providers } from "../helpers/providers.config";
import { getConfig } from "../helpers/config.manager";
import { saveUser } from "../repositories/user.repository";
import logger from "../utils/logger";

export async function getAuthorizationUrl(provider: string): Promise<{
  redirectTo: URL;
  state: string;
}> {
  const config = getConfig(provider);
  const details = providers[provider];

  const code_verifier: string = client.randomPKCECodeVerifier();
  const code_challenge: string = await client.calculatePKCECodeChallenge(
    code_verifier
  );
  const state = client.randomState();

  code_verification.set(state, { code_verifier });

  const parameters: Record<string, string> = {
    redirect_uri: details.redirect_uri,
    scope: details.scope,
    code_challenge,
    code_challenge_method: "S256",
    state,
  };

  const redirectTo: URL = client.buildAuthorizationUrl(config, parameters);
  logger.info("Redirecting to authorization URL", {
    provider,
    url: redirectTo.href,
  });
  return { redirectTo, state };
}

export async function exchangeCodeForTokens(
  provider: string,
  state: string,
  callbackUrl: URL
): Promise<client.TokenEndpointResponse> {
  const config = getConfig(provider);

  const stored = code_verification.get(state);
  if (!stored) {
    throw new Error("Invalid or expired state");
  }

  const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: stored.code_verifier,
    expectedState: state,
  });

  code_verification.delete(state);
  logger.debug("Token endpoint response received", { provider });
  return tokens;
}

export async function fetchUserInfo(
  provider: string,
  accessToken: string
): Promise<any> {
  const config = getConfig(provider);
  const details = providers[provider];
  let user: any;

  if (!details.userinfo_endpoint) {
    user = await client.fetchUserInfo(
      config,
      accessToken,
      client.skipSubjectCheck
    );
  } else {
    const response = await client.fetchProtectedResource(
      config,
      accessToken,
      new URL(details.userinfo_endpoint),
      "GET"
    );
    user = await response.json();
  }

  // GitHub specific: fetch private email
  if (provider === "github" && !user.email) {
    const emailResponse = await client.fetchProtectedResource(
      config,
      accessToken,
      new URL("https://api.github.com/user/emails"),
      "GET"
    );
    if (emailResponse.ok) {
      const emails: any[] = await emailResponse.json();
      const primary = emails.find((e) => e.primary && e.verified) || emails[0];
      if (primary) user.email = primary.email;
    }
  }

  logger.debug("User info fetched", { provider, email: user.email });
  return user;
}

export async function processOAuthCallback(
  provider: string,
  state: string,
  callbackUrl: URL
): Promise<string> {
  const tokens = await exchangeCodeForTokens(provider, state, callbackUrl);
  const rawUserInfo = await fetchUserInfo(provider, tokens.access_token);

  // Normalize user data across providers
  const normalizedUser = normalizeUserData(provider, rawUserInfo);

  const userId = crypto.randomUUID();
  saveUser(userId, normalizedUser);

  return userId;
}

function normalizeUserData(
  provider: string,
  raw: any
): import("../data/data").User {
  let username: string;
  let email: string | null;
  let avatar: string | null;

  switch (provider) {
    case "discord":
      username = raw.username;
      email = raw.email || null;
      avatar = raw.avatar
        ? `https://cdn.discordapp.com/avatars/${raw.id}/${raw.avatar}.png`
        : null;
      break;

    case "github":
      username = raw.login;
      email = raw.email || null;
      avatar = raw.avatar_url || null;
      break;

    case "google":
      username = raw.name || raw.given_name || raw.email?.split("@")[0];
      email = raw.email || null;
      avatar = raw.picture || null;
      break;

    default:
      username = raw.name || raw.username || raw.login || "Unknown";
      email = raw.email || null;
      avatar = raw.picture || raw.avatar_url || null;
  }

  return {
    id: raw.id?.toString() || raw.sub || crypto.randomUUID(),
    provider,
    username,
    email,
    avatar,
    raw,
  };
}
