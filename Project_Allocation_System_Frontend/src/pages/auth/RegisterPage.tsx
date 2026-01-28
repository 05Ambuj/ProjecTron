import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOrganizations } from "../../api/admin";
import api from "../../api/client";

/* ---------------- Types ---------------- */

interface Organization {
  organizationId: string;
  name: string;
  location: string;
}

const DESIGNATIONS = [
  { label: "Project Manager", role: 2 },
  { label: "Team Lead", role: 3 },
  { label: "Team Member", role: 4 },
];

/* ---------------- Helper Components ---------------- */

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-amber-700">{message}</p>;
}

function FloatingField({
  label,
  type = "text",
  value,
  error,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`peer w-full rounded-lg border px-3 pb-2 pt-5 text-sm transition
          ${
            error
              ? "border-amber-500 bg-amber-50"
              : "border-neutral-300 bg-white"
          }
          focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900`}
      />

      <label
        className={`pointer-events-none absolute left-3 top-1/2 origin-left
          -translate-y-1/2 text-sm text-neutral-500 transition-all
          peer-focus:top-2 peer-focus:scale-75 peer-focus:text-neutral-900
          ${hasValue ? "top-2 scale-75 text-neutral-900" : ""}`}
      >
        {label}
      </label>

      <FieldError message={error} />
    </div>
  );
}

function FloatingSelect({
  label,
  value,
  error,
  onChange,
  children,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`peer w-full appearance-none rounded-lg border bg-white px-3 pb-2 pt-5 text-sm transition
          ${
            error
              ? "border-amber-500 bg-amber-50"
              : "border-neutral-300"
          }
          focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900`}
      >
        <option value="" />
        {children}
      </select>

      <label
        className={`pointer-events-none absolute left-3 top-1/2 origin-left
          -translate-y-1/2 text-sm text-neutral-500 transition-all
          peer-focus:top-2 peer-focus:scale-75 peer-focus:text-neutral-900
          ${hasValue ? "top-2 scale-75 text-neutral-900" : ""}`}
      >
        {label}
      </label>

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
        ▾
      </span>

      <FieldError message={error} />
    </div>
  );
}

/* ---------------- Main Component ---------------- */

export default function RegisterPage() {
  const navigate = useNavigate();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    department: "",
    designation: "",
    role: 4,
    organizationId: "",
  });

  useEffect(() => {
    getOrganizations()
      .then((res) => {
        const items = Array.isArray(res) ? res : res?.items;
        setOrgs(items ?? []);
      })
      .catch(() => setOrgs([]));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.firstName) e.firstName = "First name is required";
    if (!form.lastName) e.lastName = "Last name is required";
    if (!form.email.includes("@")) e.email = "Invalid email address";
    if (form.password.length < 8)
      e.password = "Minimum 8 characters required";
    if (!form.phoneNumber) e.phoneNumber = "Phone number required";
    if (!form.department) e.department = "Department required";
    if (!form.designation) e.designation = "Select a designation";
    if (!form.organizationId) e.organizationId = "Select an organization";

    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await api.post("/auth/register", form);
      setIsSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-6">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-10 gap-10 items-start">
        {/* LEFT */}
        <aside className="md:col-span-4 bg-neutral-50 border border-neutral-200 rounded-lg p-8 space-y-6">
          <h1 className="text-2xl font-semibold text-neutral-900">
            User Registration
          </h1>
          <p className="text-sm text-neutral-600 max-w-sm">
            Create your account to access your organization’s workspace with
            role-based permissions.
          </p>
          <ul className="text-sm text-neutral-600 space-y-2">
            <li>• Secure role assignment</li>
            <li>• Organization scoped access</li>
            <li>• Full audit logging</li>
          </ul>
        </aside>

        {/* RIGHT */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-6 bg-white border border-neutral-300 rounded-lg p-8 md:p-10"
        >
          <div className="mb-6">
            <h2 className="text-lg font-medium text-neutral-900">
              Create your account
            </h2>
            <p className="text-sm text-neutral-600">
              All fields are mandatory
            </p>
          </div>

          {isSuccess && (
            <div className="mb-6 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
              Account created successfully. Redirecting…
            </div>
          )}

          <section className="mb-10">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingField
                label="First name"
                value={form.firstName}
                error={fieldErrors.firstName}
                onChange={(v) => setForm({ ...form, firstName: v })}
              />
              <FloatingField
                label="Last name"
                value={form.lastName}
                error={fieldErrors.lastName}
                onChange={(v) => setForm({ ...form, lastName: v })}
              />
              <div className="md:col-span-2">
                <FloatingField
                  label="Email address"
                  value={form.email}
                  error={fieldErrors.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                />
              </div>
              <div className="md:col-span-2">
                <FloatingField
                  label="Password"
                  type="password"
                  value={form.password}
                  error={fieldErrors.password}
                  onChange={(v) => setForm({ ...form, password: v })}
                />
              </div>
              <div className="md:col-span-2">
                <FloatingField
                  label="Phone number"
                  value={form.phoneNumber}
                  error={fieldErrors.phoneNumber}
                  onChange={(v) => setForm({ ...form, phoneNumber: v })}
                />
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Organization Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingField
                label="Department"
                value={form.department}
                error={fieldErrors.department}
                onChange={(v) => setForm({ ...form, department: v })}
              />

              <FloatingSelect
                label="Designation"
                value={form.designation}
                error={fieldErrors.designation}
                onChange={(v) => {
                  const d = DESIGNATIONS.find((x) => x.label === v);
                  setForm({ ...form, designation: v, role: d?.role || 4 });
                }}
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d.label} value={d.label}>
                    {d.label}
                  </option>
                ))}
              </FloatingSelect>

              <div className="md:col-span-2">
                <FloatingSelect
                  label="Organization"
                  value={form.organizationId}
                  error={fieldErrors.organizationId}
                  onChange={(v) => setForm({ ...form, organizationId: v })}
                >
                  {orgs.map((o) => (
                    <option key={o.organizationId} value={o.organizationId}>
                      {o.name} — {o.location}
                    </option>
                  ))}
                </FloatingSelect>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between border-t pt-6">
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>

            <Link
              to="/login"
              className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
