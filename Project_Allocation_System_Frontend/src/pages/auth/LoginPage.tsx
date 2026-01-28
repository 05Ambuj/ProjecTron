import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { loginSuccess } from "../../features/auth/authSlice";
import { useToast } from "../../contexts/useToast";

type Step = "email" | "password";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", { email, password });

      dispatch(
        loginSuccess({
          user: res.data.user,
          token: res.data.accessToken,
        })
      );

      showSuccess("Login successful");
      navigate(res.data.user.role === 1 ? "/admin" : "/dashboard");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-5 gap-12">
        {/* LEFT — CONTEXT */}
        <aside className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              ProjecTron
            </h1>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Centralized platform for project planning, task execution,
              resource allocation, and operational tracking across
              organizations.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-neutral-600">
            <li>• Role-based access control and audit logging</li>
            <li>• Real-time project and task visibility</li>
            <li>• Secure, organization-scoped workspaces</li>
          </ul>

          <div className="pt-6 border-t border-neutral-300 text-xs text-neutral-500">
            Access is monitored and recorded. Unauthorized use is prohibited.
          </div>
        </aside>

        {/* RIGHT — AUTH */}
        <section className="md:col-span-3 bg-white border border-neutral-300 rounded-lg p-10">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-neutral-900">
              Secure sign-in
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Authenticate to continue to your workspace
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8 h-1 bg-neutral-200 rounded">
            <div
              className={`h-full bg-neutral-900 transition-all duration-300 ${
                step === "email" ? "w-1/2" : "w-full"
              }`}
            />
          </div>

          <form onSubmit={handleLogin}>
            {step === "email" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email address
                  </label>
                  <input
                    autoFocus
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md px-3 py-2
                               focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep("password")}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  Continue
                </button>
              </div>
            )}

            {step === "password" && (
              <div className="space-y-6">
                <div className="text-sm text-neutral-600">
                  Signed in as <span className="font-medium">{email}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Password
                  </label>
                  <input
                    autoFocus
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md px-3 py-2
                               focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="text-sm font-medium text-neutral-900 hover:underline"
                  >
                    Sign in
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    Change email
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-10 text-xs text-neutral-500">
            Need access?{" "}
            <Link to="/register" className="underline">
              Request an account
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
