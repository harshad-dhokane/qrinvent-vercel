import { useState } from "react";
import { useZorm } from "react-zorm";
import { z } from "zod";
import { Form } from "~/components/custom-form";
import Input from "~/components/forms/input";
import PasswordInput from "~/components/forms/password-input";
import { Button } from "~/components/shared/button";
import { config } from "~/config/shelf.config";
import { useSearchParams } from "~/hooks/search-params";
import { ContinueWithEmailForm } from "~/modules/auth/components/continue-with-email-form";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";

const LoginFormSchema = z.object({
  email: z
    .string()
    .transform((email) => email.toLowerCase())
    .refine((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), {
      message: "Please enter a valid email",
    }),
  password: z.string().min(8, "Password is too short. Minimum 8 characters."),
  redirectTo: z.string().optional(),
});

export const meta = () => [
  { title: appendToMetaTitle("Log in") },
];

export default function IndexLoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const zo = useZorm("LoginForm", LoginFormSchema);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const acceptedInvite = searchParams.get("acceptedInvite");
  const passwordReset = searchParams.get("password_reset");
  const { disableSignup, disableSSO } = config;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: formData.get("redirectTo"),
    };

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Handle OTP redirect
      if (res.status === 302) {
        const location = res.headers.get("Location");
        if (location) {
          window.location.href = location;
          return;
        }
      }

      const data = await res.json();

      if (data.error) {
        setFormError(data.error);
      } else if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      setFormError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {acceptedInvite && (
        <div className="mb-8 text-center text-success-600">
          Successfully accepted workspace invite. Please login to see your new workspace.
        </div>
      )}

      {passwordReset && (
        <div className="mb-8 text-center text-success-600">
          You have successfully reset your password. You can now use your new password to login.
        </div>
      )}

      <form onSubmit={handleSubmit} ref={zo.ref} className="flex flex-col gap-5">
        <div>
          <Input
            data-test-id="email"
            label="Email address"
            placeholder="zaans@huisje.com"
            required
            autoFocus={true}
            name={zo.fields.email()}
            type="email"
            autoComplete="email"
            disabled={loading}
            inputClassName="w-full"
            error={zo.errors.email()?.message || formError}
          />
        </div>

        <PasswordInput
          label="Password"
          placeholder="**********"
          data-test-id="password"
          name={zo.fields.password()}
          autoComplete="new-password"
          disabled={loading}
          inputClassName="w-full"
          error={zo.errors.password()?.message || formError}
        />

        <input type="hidden" name={zo.fields.redirectTo()} value={redirectTo} />

        <Button
          className="text-center"
          type="submit"
          data-test-id="login"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </Button>

        {/* Rest of your UI components remain the same */}
        {/* ...existing code... */}
      </form>

      {!disableSSO && (
        <div className="mt-6 text-center">
          <Button variant="link" to="/sso-login">
            Login with SSO
          </Button>
        </div>
      )}

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">
              Or use a{" "}
              <strong title="One Time Password (OTP) is the most secure way to login. We will send you a code to your email.">
                One Time Password
              </strong>
            </span>
          </div>
        </div>
        <div className="mt-6">
          <ContinueWithEmailForm mode="login" />
        </div>
        {!disableSignup && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Button
              variant="link"
              data-test-id="signupButton"
              to={{
                pathname: "/join",
                search: searchParams.toString(),
              }}
            >
              Sign up
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}