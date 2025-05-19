import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from "zod";
import { signInWithEmail } from '~/modules/auth/service.server';
import { getSelectedOrganisation, setSelectedOrganizationIdCookie } from '~/modules/organization/context.server';
import { setCookie } from '~/utils/cookies.server';
import { makeShelfError, isLikeShelfError, isZodValidationError, ShelfError, notAllowedMethod } from '~/utils/error';
import { parseData, safeRedirect } from '~/utils/http.server';

const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  redirectTo: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { email, password, redirectTo } = parseData(req.body, LoginFormSchema);

    const authSession = await signInWithEmail(email, password);

    if (!authSession) {
      res.status(302).setHeader("Location", `/otp?email=${encodeURIComponent(email)}&mode=login`);
      res.end();
      return;
    }

    const { userId } = authSession;
    const { organizationId } = await getSelectedOrganisation({ userId, request: req });

    // Set session and cookies as needed (adapt this to your stateless/sessionless approach)
    // await context.setSession(authSession); // Not available in Vercel API routes

    const orgCookie = await setSelectedOrganizationIdCookie(organizationId);

    res.setHeader("Set-Cookie", setCookie(orgCookie));
    res.status(302).setHeader("Location", safeRedirect(redirectTo || "/assets"));
    res.end();
  } catch (cause) {
    const reason = makeShelfError(
      cause,
      undefined,
      isLikeShelfError(cause) 
        ? cause.shouldBeCaptured 
        : !isZodValidationError(cause)
    );
    res.status(reason.status || 500).json({ error: reason.message });
  }
}