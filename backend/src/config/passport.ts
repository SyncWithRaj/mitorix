import dotenv from "dotenv";
dotenv.config({ path: "../.env", quiet: true } as any);

import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/auth.model.js";

const backendUrl =
  process.env.BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? "http://localhost" : "http://localhost:5000");

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${backendUrl}/api/v1/auth/github/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        let primaryEmail = profile.emails?.find((e: any) => e.primary)?.value || profile.emails?.[0]?.value;

        // Bulletproof fallback: Fetch email directly from GitHub API if missing
        if (!primaryEmail && _accessToken) {
          try {
            const emailRes = await fetch("https://api.github.com/user/emails", {
              headers: { 
                Authorization: `token ${_accessToken}`,
                Accept: "application/vnd.github.v3+json"
              }
            });
            if (emailRes.ok) {
              const emails = await emailRes.json();
              if (Array.isArray(emails)) {
                primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
              }
            }
          } catch (e) {
            console.error("Failed to fetch emails from GitHub API:", e);
          }
        }

        if (!user) {
          user = await User.create({
            githubId: profile.id,
            username: profile.username,
            email: primaryEmail,
            avatar: profile.photos?.[0]?.value,
          });
        } else {
          // If the user already exists but their email is missing (e.g. from an old login), update it
          let isUpdated = false;
          if (primaryEmail && !user.email) {
            user.email = primaryEmail;
            isUpdated = true;
          }
          if (profile.photos?.[0]?.value && user.avatar !== profile.photos[0].value) {
            user.avatar = profile.photos[0].value;
            isUpdated = true;
          }
          
          if (isUpdated) {
            await user.save();
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
