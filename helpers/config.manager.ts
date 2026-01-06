import * as client from "openid-client";
import { providers } from "./providers.config";
import logger from "../utils/logger";

// Cache for client configurations (discovered or manual)
const configCache = new Map<string, client.Configuration>();

// Initialize configurations at startup
async function initConfigs(): Promise<void> {
  // Discover Google OIDC config once
  const googleDetails = providers.google;
  if (googleDetails.client_id && googleDetails.client_secret) {
    const googleConfig = await client.discovery(
      new URL("https://accounts.google.com"),
      googleDetails.client_id,
      googleDetails.client_secret
    );
    configCache.set("google", googleConfig);
    logger.info("Google OIDC config discovered and cached");
  }

  // Pre-build manual configs for Discord and GitHub
  for (const provider of ["discord", "github"]) {
    const details = providers[provider];
    if (details.client_id && details.client_secret && details.redirect_uri) {
      const config = new client.Configuration(
        {
          issuer: details.issuer,
          authorization_endpoint: details.authorization_endpoint,
          token_endpoint: details.token_endpoint,
        },
        details.client_id,
        details.client_secret
      );
      configCache.set(provider, config);
      logger.info(`${provider} config cached`);
    }
  }
}

// Initialize configs when module loads
initConfigs().catch((err) =>
  logger.error("Failed to init configs", { error: err })
);

export function getConfig(provider: string): client.Configuration {
  const config = configCache.get(provider);
  if (!config) {
    throw new Error(
      `Provider ${provider} not configured or not initialized yet.`
    );
  }
  return config;
}
