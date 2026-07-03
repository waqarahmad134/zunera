// Client-safe employee-location type.

export interface EmployeeLocation {
  employeeId: number;
  employeeName: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  updatedAt: string;
}
