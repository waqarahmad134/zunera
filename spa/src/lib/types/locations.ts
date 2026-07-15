// Employee-location type.

export interface EmployeeLocation {
  employeeId: number;
  employeeName: string;
  employeeRole: string;
  employeePhone: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  updatedAt: string;
}
