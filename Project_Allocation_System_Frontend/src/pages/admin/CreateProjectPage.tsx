import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  createProject,
  fetchProjectManagers,
  getOrganizations,
} from "../../api/admin";
import type { UserDto } from "../../types/userTypes";
import type { OrganizationDto } from "../../types/adminTypes";
import type { RootState } from "../../app/store";
import { UserRole } from "../../constants/roles";
import LoadingPage from "../../components/common/LoadingPage";

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const actorRole = useSelector((state: RootState) => state.auth.user?.role) as UserRole;

  const [orgList, setOrgList] = useState<OrganizationDto[]>([]);
  const [pmList, setPmList] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    organizationId: "",
    code: "",
    name: "",
    description: "",
    projectManagerId: "",
    status: 1,   // Planned
    priority: 2, // Medium
    startDate: "",
    endDate: "",
    budget: 0,
    maxAllocations: 1,
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load organizations
        const orgsData = await getOrganizations(1, 100, { isActive: true });
        setOrgList(orgsData.items);
        
        // Load all project managers initially
        const pmsData = await fetchProjectManagers();
        setPmList(pmsData);
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter project managers when organization changes
  useEffect(() => {
    async function loadPMsForOrg() {
      if (!form.organizationId) {
        // If no org selected, show all PMs
        try {
          const data = await fetchProjectManagers();
          setPmList(data);
        } catch {
          setError("Failed to load project managers");
        }
        return;
      }

      try {
        const allPMs = await fetchProjectManagers();
        // Filter PMs by selected organization
        const filteredPMs = allPMs.filter(
          (pm) => pm.organizationId === form.organizationId
        );
        setPmList(filteredPMs);
        
        // Clear selected PM if it doesn't belong to selected org
        if (form.projectManagerId) {
          const selectedPM = allPMs.find(
            (pm) => pm.userId === form.projectManagerId
          );
          if (!selectedPM || selectedPM.organizationId !== form.organizationId) {
            setForm((f) => ({ ...f, projectManagerId: "" }));
          }
        }
      } catch {
        setError("Failed to load project managers");
      }
    }

    loadPMsForOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.organizationId]);

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setError(null);

    if (!form.organizationId || !form.code || !form.name || !form.projectManagerId) {
      setError("Organization, Code, Name and Project Manager are required.");
      return;
    }

    try {
      setSaving(true);
      await createProject(form, actorRole);
      navigate("/admin/projects");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingPage message="Loading project setup..." />;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <header className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Create Project
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Define project details, assign a Project Manager, and set timeline and budget.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-800">Project Basics</h2>
          <Select
            label="Organization"
            value={form.organizationId}
            onChange={(v) => update("organizationId", v)}
          >
            <option value="">Select Organization</option>
            {orgList.map((org) => (
              <option key={org.organizationId} value={org.organizationId}>
                {org.name} {org.location ? `(${org.location})` : ""}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Code" value={form.code} onChange={(v) => update("code", v)} />
            <Input label="Name" value={form.name} onChange={(v) => update("name", v)} />
          </div>
          <Select
            label="Project Manager"
            value={form.projectManagerId}
            onChange={(v) => update("projectManagerId", v)}
            disabled={!form.organizationId}
          >
            <option value="">
              {form.organizationId ? "Select PM" : "Select Organization first"}
            </option>
            {pmList.map((pm) => (
              <option key={pm.userId} value={pm.userId}>
                {pm.displayName} ({pm.email})
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Status"
              value={form.status}
              onChange={(v) => update("status", Number(v))}
            >
              <option value={1}>Planned</option>
              <option value={2}>In Progress</option>
              <option value={3}>On Hold</option>
              <option value={4}>Completed</option>
              <option value={5}>Cancelled</option>
            </Select>
            <Select
              label="Priority"
              value={form.priority}
              onChange={(v) => update("priority", Number(v))}
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
              <option value={4}>Critical</option>
            </Select>
          </div>
        </section>

        <section className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-800">Timeline & Budget</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(v) => update("startDate", v)}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(v) => update("endDate", v)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Budget"
              type="number"
              value={form.budget}
              onChange={(v) => update("budget", Number(v))}
            />
            <Input
              label="Max Allocations"
              type="number"
              value={form.maxAllocations}
              onChange={(v) => update("maxAllocations", Number(v))}
            />
          </div>
        </section>
      </div>

      <section className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <label className="text-sm font-medium text-neutral-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          rows={4}
          placeholder="Add scope, goals, risks, and success metrics..."
        />
      </section>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Project"}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------- Small form helpers ---------- */

type InputProps<T extends string | number> = {
  label: string;
  type?: React.HTMLInputTypeAttribute;
  value: T;
  onChange: (value: T) => void;
};

function Input<T extends string | number>({
  label,
  type = "text",
  value,
  onChange,
}: InputProps<T>) {
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const raw = e.target.value;

    if (typeof value === "number") {
      onChange(Number(raw) as T);
    } else {
      onChange(raw as T);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  );
}


type SelectProps<T extends string | number> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  children: React.ReactNode;
  disabled?: boolean;
};

function Select<T extends string | number>({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: SelectProps<T>) {
  function handleChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const raw = e.target.value;

    if (typeof value === "number") {
      onChange(Number(raw) as T);
    } else {
      onChange(raw as T);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-500"
      >
        {children}
      </select>
    </div>
  );
}
