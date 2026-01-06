import * as client from "openid-client";
import { code_verification } from "../data/data";

if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET || !process.env.DISCORD_ISSUER || !process.env.DISCORD_AUTHORIZATION_ENDPOINT || !process.env.DISCORD_TOKEN_ENDPOINT) {
  throw new Error("Missing environment variables");
}

const config = new client.Configuration(
  {
    issuer: process.env.DISCORD_ISSUER,
    authorization_endpoint: process.env.DISCORD_AUTHORIZATION_ENDPOINT,
    token_endpoint: process.env.DISCORD_TOKEN_ENDPOINT,
  },
  process.env.DISCORD_CLIENT_ID,
  process.env.DISCORD_CLIENT_SECRET
);

async function getAuthorizationUrl(): Promise<{
  redirectTo: URL;
  state: string;
}> {
  try {
    if (!process.env.DISCORD_REDIRECT_URI) {
      throw new Error("Missing environment variables");
    }
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
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
      scope: "identify email",
      code_challenge,
      code_challenge_method: "S256",
      state,
    };

    const redirectTo: URL = client.buildAuthorizationUrl(config, parameters);

    // now redirect the user to redirectTo.href
    console.log("redirecting to", redirectTo.href);
    return { redirectTo, state };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function handleCallback(
  state: string,
  callbackUrl: URL
): Promise<client.TokenEndpointResponse> {
  try {
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
    console.log(error);
    throw error;
  }
}

async function getUserInfo(
  accessToken: string,
  sub?: string
): Promise<client.UserInfoResponse> {
  try {
    const response = await client.fetchProtectedResource(
      config,
      accessToken,
      new URL("https://discord.com/api/users/@me"),
      "GET"
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return (await response.json()) as client.UserInfoResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export { getAuthorizationUrl, handleCallback, getUserInfo };
