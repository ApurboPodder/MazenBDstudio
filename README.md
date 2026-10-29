

## Password-protect Model Studio

The standalone page is protected by a server-verified login. The required variable names are in `.env.example`. For local Vercel development, copy it to `.env.local` and replace both placeholder values. `.env.local` is ignored by Git. For deployment, set both values in Vercel under Project Settings → Environment Variables for Preview and Production, then redeploy:

- `MODEL_STUDIO_PASSWORD`: choose a password with at least 8 characters, including at least one letter and one number.
- `MODEL_STUDIO_SESSION_SECRET`: generate a separate random signing secret with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

For a project deployed from the repository root, set the variables on the root Vercel project. The root routing proxy protects `/model-studio-standalone/` and its files while leaving other pages public. If this folder is deployed as its own Vercel project, set the same variables on that project; its proxy protects the whole deployment except the sign-in page and auth endpoint. The login lasts eight hours, and the **Log out** button ends the session.

Keep these values in Vercel environment settings; do not commit real passwords or signing secrets.
