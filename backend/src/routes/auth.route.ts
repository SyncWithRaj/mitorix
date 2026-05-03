import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { protect } from "../middlewares/auth.middleware.js";
import { User } from "../models/auth.model.js";

const router = Router();

// Redirect to GitHub for OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

// GitHub OAuth Callback
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie on backend domain for direct API calls
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Pass token via URL parameters for frontend consumption
    // This is the reliable fix for cross-origin cookie issues
    const frontendUrl = process.env.FRONTEND_URL || (process.env.NODE_ENV === "production" ? "http://localhost" : "http://localhost:3000");
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

// Retrieve current authenticated user
router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Logout user
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// Dev Login (development only — bypasses GitHub OAuth)
// Used by contributors who ran `npm run seed` to test the UI
if (process.env.NODE_ENV !== "production") {
  router.post("/dev-login", async (req, res) => {
    try {
      const user = await User.findOne({ githubId: "demo-dev-00000" });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Demo user not found. Run 'npm run seed' first.",
        });
      }

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error("Dev login error:", error);
      res.status(500).json({ success: false, message: "Dev login failed" });
    }
  });
}

export default router;