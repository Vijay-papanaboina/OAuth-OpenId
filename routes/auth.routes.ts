import express from "express";
import {
  getAuthorizationUrl,
  handleCallback,
  getUserInfo,
} from "../helpers/auth.helper";
const router = express.Router();

router.get("/discord/sign-in", async (req, res) => {
  try {
    const { redirectTo, state } = await getAuthorizationUrl();
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.redirect(redirectTo.href);
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/discord/callback", async (req, res) => {
  const queryState =
    typeof req.query.state === "string" ? req.query.state : undefined;
  const cookieState = req.cookies?.oauth_state;
  const url = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);
  if (!queryState || !cookieState || queryState !== cookieState) {
    return res.status(400).send("State not found");
  }
  try {
    const tokens = await handleCallback(queryState, url);
    const user = await getUserInfo(tokens.access_token);
    res.clearCookie("oauth_state");
    res.redirect("http://localhost:5500/?user=" + JSON.stringify(user));
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});
export default router;
