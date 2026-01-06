import * as client from "openid-client";
import { code_verification } from "../data/data";

interface ProviderConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope: string;
}

const providers: Record<string, ProviderConfig> = {
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
};

function getConfig(provider: string) {
  const details = providers[provider];
  if (!details) throw new Error(`Provider ${provider} not configured`);

  if (!details.client_id || !details.client_secret || !details.redirect_uri) {
    throw new Error(`Missing environment variables for ${provider}`);
  }

  return new client.Configuration(
    {
      issuer: details.issuer,
      authorization_endpoint: details.authorization_endpoint,
      token_endpoint: details.token_endpoint,
    },
    details.client_id,
    details.client_secret
  );
}

async function getAuthorizationUrl(provider: string): Promise<{
  redirectTo: URL;
  state: string;
}> {
  try {
    const config = getConfig(provider);
    const details = providers[provider];

    /**
     * PKCE: The following MUST be generated for every redirect to the
     * authorization_endpoint. You must store the code_verifier and state in the
     * end-user session such that it can be recovered as the user gets redirected
     * from the authorization server back to your application.
     */
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

    // now redirect the user to redirectTo.href
    console.log("redirecting to", redirectTo.href);
    return { redirectTo, state };
  } catch (error) {
    console.error("getAuthorizationUrl Helper Error:", error);
    throw error;
  }
}

async function handleCallback(
  provider: string,
  state: string,
  callbackUrl: URL
): Promise<client.TokenEndpointResponse> {
  try {
    const config = getConfig(provider);
    if (!state) {
      throw new Error("Missing state");
    }

    const stored = code_verification.get(state);
    if (!stored) {
      throw new Error("Invalid or expired state");
    }
    const code_verifier = stored.code_verifier;
    let tokens: client.TokenEndpointResponse =
      await client.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: code_verifier,
        expectedState: state,
      });

    code_verification.delete(state);

    console.log("Token Endpoint Response", tokens);
    return tokens;
  } catch (error) {
    console.error("handleCallback Helper Error:", error);
    throw error;
  }
}

async function getUserInfo(
  provider: string,
  accessToken: string,
  sub?: string
): Promise<client.UserInfoResponse> {
  try {
    const config = getConfig(provider);
    const details = providers[provider];

    const response = await client.fetchProtectedResource(
      config,
      accessToken,
      new URL(details.userinfo_endpoint),
      "GET"
    );

    console.log("User Info Response", await response.clone().json());

    let user = (await response.json()) as any;

    // GitHub specific: If email is null, fetch it from /user/emails
    if (provider === "github" && !user.email) {
      console.log("Fetching GitHub emails...");
      const emailResponse = await client.fetchProtectedResource(
        config,
        accessToken,
        new URL("https://api.github.com/user/emails"),
        "GET"
      );

      if (emailResponse.ok) {
        const emails: any[] = await emailResponse.json();
        const primary =
          emails.find((e) => e.primary && e.verified) ||
          emails.find((e) => e.primary) ||
          emails[0];
        if (primary) {
          user.email = primary.email;
          console.log("Found GitHub email:", user.email);
        }
      }
    }

    return user;
  } catch (error) {
    console.error("getUserInfo Helper Error:", error);
    throw error;
  }
}

export { getAuthorizationUrl, handleCallback, getUserInfo };
