export interface JwtUser {
  id: number;
  email: string;
  role: string;
  schoolId: string | null;
}