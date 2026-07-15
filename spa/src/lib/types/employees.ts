// Employee types and status metadata.

export type EmployeeStatus = "active" | "inactive";

export const EMPLOYEE_STATUSES: EmployeeStatus[] = ["active", "inactive"];

export const EMPLOYEE_STATUS_META: Record<EmployeeStatus, { label: string; color: string; bg: string; border: string }> = {
  active: {
    label: "Active",
    color: "#0ca30c",
    bg: "rgba(12,163,12,0.10)",
    border: "rgba(12,163,12,0.30)",
  },
  inactive: {
    label: "Inactive",
    color: "#898781",
    bg: "rgba(137,135,129,0.12)",
    border: "rgba(137,135,129,0.30)",
  },
};

export interface Employee {
  id: number;
  name: string;
  phone: string | null;
  role: string;
  salary: number;
  joinedDate: string;
  status: EmployeeStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewEmployeeInput {
  name: string;
  phone?: string;
  role: string;
  salary: number;
  joinedDate: string;
  status: EmployeeStatus;
  notes?: string | null;
}
