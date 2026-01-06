import express from "express";
import {
  getAuthorizationUrl,
  handleCallback,
  getUserInfo,
} from "../helpers/auth.helper";
const router = express.Router();

// allow only discord and github
router.get("/:provider/sign-in", async (req, res) => {
  const { provider } = req.params;

  if (!["discord", "github"].includes(provider)) {
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
    console.error("Sign-In Route Error:", error);
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    }
    res
      .status(500)
      .send(
        "Something went wrong: " +
          (error instanceof Error ? error.message : String(error))
      );
  }
});

router.get("/:provider/callback", async (req, res) => {
  const { provider } = req.params;

  if (!["discord", "github"].includes(provider)) {
    res.status(404).send("Invalid provider");
    return;
  }

  const queryState =
    typeof req.query.state === "string" ? req.query.state : undefined;
  const cookieState = req.cookies?.oauth_state;
  const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
  if (!queryState || !cookieState || queryState !== cookieState) {
    return res.status(400).send("State not found");
  }
  try {
    const tokens = await handleCallback(provider, queryState, url);
    const user = await getUserInfo(provider, tokens.access_token);
    res.clearCookie("oauth_state");
    res.redirect("http://localhost:5500/?user=" + JSON.stringify(user));
  } catch (error) {
    console.error("Callback Error:", error);
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    }
    res
      .status(500)
      .send(
        "Something went wrong: " +
          (error instanceof Error ? error.message : String(error))
      );
  }
});
export default router;
