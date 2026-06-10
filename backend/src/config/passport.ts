import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

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

        if (!user) {
          user = await User.create({
            githubId: profile.id,
            username: profile.username,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
