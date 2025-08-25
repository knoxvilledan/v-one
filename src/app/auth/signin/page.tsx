"use client";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type LoginStep = "email" | "password";

export default function SignIn() {
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Prefetch dashboard assets when email is verified
  const prefetchDashboard = async () => {
    if (isPrefetching) return;

    setIsPrefetching(true);
    try {
      // Prefetch main dashboard route
      router.prefetch("/");

      // Prefetch API routes that will be called on dashboard load
      await Promise.all([
        fetch("/api/config", { method: "HEAD" }),
        fetch("/api/user-data", { method: "HEAD" }),
      ]);

      console.log("Dashboard assets prefetched");
    } catch (error) {
      console.log("Prefetch failed (non-critical):", error);
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsVerifyingEmail(true);
    setError("");

    try {
      // Check if email exists by attempting a sign-in with a dummy password
      // This is a lightweight way to verify email existence
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.exists) {
        // Email exists, move to password step and prefetch
        setStep("password");
        await prefetchDashboard();
      } else {
        setError("Email not found. Please check your email or sign up.");
      }
    } catch (err) {
      console.error("Email verification error:", err);
      setError("Unable to verify email. Please try again.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid password. Please try again.");
      } else if (result?.ok) {
        const session = await getSession();
        if (session) {
          // Dashboard should load faster due to prefetching
          router.push("/");
        }
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep("email");
    setPassword("");
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to AMP Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Track your daily habits and amplify your productivity
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-red-800 text-sm text-center">{error}</div>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailVerification} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  autoFocus
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isVerifyingEmail}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingEmail ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    "Next"
                  )}
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 text-center">
                Welcome back, {email}
                {isPrefetching && (
                  <div className="text-xs text-green-600 mt-1">
                    🚀 Preparing your dashboard...
                  </div>
                )}
              </div>

              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ flex: "2" }}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>

              {/* Forgot password link */}
              <div className="text-center mt-4">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          )}

          {/* Sign up link */}
          <div className="text-center">
            <Link
              href="/auth/signup"
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
