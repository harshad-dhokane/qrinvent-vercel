import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from "zod";
import { signInWithEmail } from '~/modules/auth/service.server';
import { getSelectedOrganisation, setSelectedOrganizationIdCookie } from '~/modules/organization/context.server';
import { setCookie } from '~/utils/cookies.server';
import { makeShelfError, isLikeShelfError, isZodValidationError } from '~/utils/error';
import { parseData, safeRedirect } from '~/utils/http.server';

const LoginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  redirectTo: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, redirectTo } = parseData(req.body, LoginFormSchema);

    const authSession = await signInWithEmail(email, password);

    if (!authSession) {
      return res.status(302).json({
        redirect: `/otp?email=${encodeURIComponent(email)}&mode=login`,
      });
    }

    const { userId } = authSession;
    const { organizationId } = await getSelectedOrganisation({ userId, request: req });

    // Set organization cookie
    const orgCookie = await setSelectedOrganizationIdCookie(organizationId);
    res.setHeader('Set-Cookie', setCookie(orgCookie));

    return res.status(200).json({
      success: true,
      redirect: safeRedirect(redirectTo || '/assets'),
    });

  } catch (cause) {
    const reason = makeShelfError(
      cause,
      undefined,
      isLikeShelfError(cause) ? cause.shouldBeCaptured : !isZodValidationError(cause)
    );
    return res.status(reason.status || 500).json({ 
      error: reason.message || 'Something went wrong'
    });
  }
}