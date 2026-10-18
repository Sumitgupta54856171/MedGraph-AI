import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'DOCTOR' | 'PATIENT';
  department?: string;
  mrn?: string;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: 'DOCTOR' | 'PATIENT';
  department?: string;
  mrn?: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
    return response.data;
  },

  async signup(data: SignupRequest): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, data);
    return response.data;
  },

  saveUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medgraph_user', JSON.stringify(user));
    }
  },

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('medgraph_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medgraph_user');
    }
  },

  isAuthenticated(): boolean {
    return this.getUser() !== null;
  },

  isDoctor(): boolean {
    const user = this.getUser();
    return user?.role === 'DOCTOR';
  },

  isPatient(): boolean {
    const user = this.getUser();
    return user?.role === 'PATIENT';
  },

  getAuthToken(): string | null {
    const user = this.getUser();
    return user?.token || null;
  }
};
