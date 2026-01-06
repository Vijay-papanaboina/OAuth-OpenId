import express from "express";
import { signIn, callback, me, logout } from "../controllers/auth.controller";

const router = express.Router();

// OAuth flows
router.get("/:provider/sign-in", signIn);
router.get("/:provider/callback", callback);

// User session
router.get("/me", me);
router.post("/logout", logout);

export default router;
