// Tipos para usuarios de la app móvil
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type UserRole = 'client' | 'admin' | 'provider' | 'viewer';
export type UserSegment = 'premium' | 'standard' | 'basic' | 'trial';

export interface MobileAppUser {
  id: string;
  username?: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  onuSn?: string; // ONU Serial Number
  status: UserStatus;
  role: UserRole;
  segment?: UserSegment;
  providerId?: string; // ID del proveedor que creó este usuario
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  metadata?: {
    avatar?: string;
    company?: string;
    address?: string;
    notes?: string;
    tags?: string[];
  };
}

export interface UserFormData {
  username: string;
  email: string;
  phone: string; // Obligatorio según el backend
  password: string; // Obligatorio según el backend
  firstName: string;
  lastName: string;
  onuSn?: string; // ONU Serial Number - opcional en creación mínima
  status: UserStatus;
  role: UserRole;
  segment?: UserSegment;
  metadata?: {
    avatar?: string;
    company?: string;
    address?: string;
    notes?: string;
    tags?: string[];
  };
}

export interface UserFilters {
  search: string;
  status?: UserStatus;
  role?: UserRole;
  segment?: UserSegment;
}

