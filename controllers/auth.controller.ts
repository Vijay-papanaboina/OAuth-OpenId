import { Request, Response } from "express";
import {
  getAuthorizationUrl,
  processOAuthCallback,
} from "../services/auth.service";
import { findUserById, deleteUser } from "../repositories/user.repository";
import { signToken, verifyToken } from "../utils/jwt.util";

const VALID_PROVIDERS = ["discord", "github", "google"];

export async function signIn(req: Request, res: Response): Promise<void> {
  const { provider } = req.params;

  if (!VALID_PROVIDERS.includes(provider)) {
    res.status(404).send("Invalid provider");
    return;
  }

  try {
    const { redirectTo, state } = await getAuthorizationUrl(provider);
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.redirect(redirectTo.href);
  } catch (error) {
    console.error("Sign-In Controller Error:", error);
    res.status(500).send("Something went wrong");
  }
}

export async function callback(req: Request, res: Response): Promise<void> {
  const { provider } = req.params;

  if (!VALID_PROVIDERS.includes(provider)) {
    res.status(404).send("Invalid provider");
    return;
  }

  const queryState =
    typeof req.query.state === "string" ? req.query.state : undefined;
  const cookieState = req.cookies?.oauth_state;
  const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);

  if (!queryState || !cookieState || queryState !== cookieState) {
    res.status(400).send("State mismatch");
    return;
  }

  try {
    const userId = await processOAuthCallback(provider, queryState, url);

    // Generate JWT and set in cookie
    const token = signToken({ userId });
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.clearCookie("oauth_state");
    res.redirect("http://localhost:5500/");
  } catch (error) {
    console.error("Callback Controller Error:", error);
    res.status(500).send("Authentication failed");
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.auth_token;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const user = findUserById(payload.userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.auth_token;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      deleteUser(payload.userId);
    }
  }

  res.clearCookie("auth_token");
  res.json({ message: "Logged out successfully" });
}
