import axios, { AxiosError } from 'axios';
import ApiConfig from '../config/api.config';
import { MobileAppUser, UserStatus, UserRole, UserSegment } from '../pages/user-management/types';

/**
 * Interfaz para crear usuario completo
 */
export interface CreateUserRequest {
  username: string; // Obligatorio
  first_name: string; // Obligatorio
  last_name: string; // Obligatorio
  email: string; // Obligatorio
  phone_number: string; // Obligatorio según el backend
  password: string; // Obligatorio según el backend
  ONU_sn?: string; // Opcional en creación mínima
  account_status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  role?: 'client' | 'admin' | 'provider' | 'viewer';
  segment?: 'premium' | 'standard' | 'basic' | 'trial';
  metadata?: {
    avatar?: string;
    company?: string;
    address?: string;
    notes?: string;
    tags?: string[];
  };
}

/**
 * Interfaz para crear usuario con datos mínimos
 */
export interface CreateUserMinimalRequest {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
}

/**
 * Interfaz para la respuesta del usuario
 */
export interface UserResponse {
  id?: string;
  _id?: string; // MongoDB ObjectId
  username?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  ONU_sn?: string;
  status?: string;
  account_status?: string; // Puede venir como account_status desde la DB
  role?: string;
  roles?: string[]; // Array de roles desde la DB
  segment?: string;
  provider_id?: string;
  created_at?: string;
  created_on?: string; // Fecha de creación desde la DB
  updated_at?: string;
  updated_on?: string; // Fecha de actualización desde la DB
  last_login_at?: string;
  last_login?: string; // Último login desde la DB
  metadata?: {
    avatar?: string;
    company?: string;
    address?: string;
    notes?: string;
    tags?: string[];
  };
  tags?: string[]; // Tags directos desde la DB
  verified?: boolean;
}

/**
 * Mapea un MobileAppUser del frontend a CreateUserRequest para el backend
 */
export function mapUserToCreateRequest(user: Partial<MobileAppUser> & { username?: string; onuSn?: string; password?: string; phone?: string }): CreateUserRequest {
  // Limpiar ONU_sn: si está vacío o solo espacios, no enviarlo (undefined)
  const onuSn = user.onuSn?.trim();
  const onuSnValue = onuSn && onuSn.length > 0 ? onuSn : undefined;
  
  // Limpiar metadata: solo incluir campos que tengan valor
  let metadata: CreateUserRequest['metadata'] = undefined;
  if (user.metadata) {
    const cleanMetadata: any = {};
    
    if (user.metadata.avatar?.trim()) {
      cleanMetadata.avatar = user.metadata.avatar.trim();
    }
    
    if (user.metadata.company?.trim()) {
      cleanMetadata.company = user.metadata.company.trim();
    }
    
    if (user.metadata.address?.trim()) {
      cleanMetadata.address = user.metadata.address.trim();
    }
    
    if (user.metadata.notes?.trim()) {
      cleanMetadata.notes = user.metadata.notes.trim();
    }
    
    if (user.metadata.tags && user.metadata.tags.length > 0) {
      cleanMetadata.tags = user.metadata.tags.filter(tag => tag.trim().length > 0);
      if (cleanMetadata.tags.length === 0) {
        delete cleanMetadata.tags;
      }
    }
    
    // Solo incluir metadata si tiene al menos un campo con valor
    if (Object.keys(cleanMetadata).length > 0) {
      metadata = cleanMetadata;
    }
  }
  
  return {
    username: user.username || user.email?.split('@')[0] || '', // Obligatorio
    first_name: user.firstName || '', // Obligatorio
    last_name: user.lastName || '', // Obligatorio
    email: user.email || '', // Obligatorio
    phone_number: user.phone || '', // Obligatorio
    password: user.password || '', // Obligatorio
    ONU_sn: onuSnValue, // Opcional - solo se envía si tiene valor
    status: user.status || 'active',
    role: user.role || 'client',
    segment: user.segment || undefined,
    metadata: metadata
  };
}

/**
 * Mapea una respuesta UserResponse del backend a MobileAppUser del frontend
 */
export function mapUserResponseToMobileAppUser(response: UserResponse): MobileAppUser {
  // Obtener ID (puede venir como id o _id)
  const userId = response.id || response._id || '';
  
  // Obtener fecha de creación (puede venir como created_at o created_on)
  const createdAt = response.created_at || response.created_on || new Date().toISOString();
  
  // Obtener fecha de actualización (puede venir como updated_at o updated_on)
  const updatedAt = response.updated_at || response.updated_on || new Date().toISOString();
  
  // Obtener último login (puede venir como last_login_at o last_login)
  const lastLogin = response.last_login_at || response.last_login;
  
  // Obtener status (puede venir como status o account_status)
  const status = response.status || response.account_status?.toLowerCase() || 'active';
  
  // Obtener role (puede venir como role o el primer elemento de roles array)
  const role = response.role || (response.roles && response.roles[0] ? response.roles[0].toLowerCase() : 'client');
  
  // Obtener tags (pueden venir en metadata.tags o directamente en tags)
  const tags = response.metadata?.tags || response.tags || undefined;

  return {
    id: userId,
    username: response.username,
    email: response.email,
    phone: response.phone_number || undefined,
    firstName: response.first_name,
    lastName: response.last_name,
    fullName: `${response.first_name} ${response.last_name}`.trim(),
    onuSn: response.ONU_sn || undefined,
    status: (status as UserStatus) || 'active',
    role: (role as UserRole) || 'client',
    segment: response.segment as UserSegment | undefined,
    providerId: response.provider_id || undefined,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
    lastLoginAt: lastLogin ? new Date(lastLogin) : undefined,
    metadata: response.metadata ? {
      avatar: response.metadata.avatar || undefined,
      company: response.metadata.company || undefined,
      address: response.metadata.address || undefined,
      notes: response.metadata.notes || undefined,
      tags: tags
    } : (tags ? { tags } : undefined)
  };
}

/**
 * Interfaz para la respuesta de error de la API
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Interfaz para la respuesta de lista de usuarios
 */
export interface UsersListResponse {
  success?: boolean;
  data?: UserResponse[];
  users?: UserResponse[];
  message?: string;
}

/**
 * Clase de servicio para operaciones de usuarios
 */
class UserService {
  /**
   * Verifica el estado del servicio de creación de usuarios
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(ApiConfig.createUserHealthUrl, {
        timeout: ApiConfig.timeoutMs
      });
      return response.status === 200;
    } catch (error) {
      console.error('Error checking user service health:', error);
      return false;
    }
  }

  /**
   * Obtiene la lista de usuarios desde la API
   * @returns Lista de usuarios en formato MobileAppUser
   */
  async getUsers(): Promise<MobileAppUser[]> {
    try {
      const response = await axios.get<UsersListResponse | UserResponse[]>(
        ApiConfig.usersUrl,
        {
          timeout: ApiConfig.timeoutMs,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // El backend puede devolver los usuarios de diferentes formas:
      // 1. Array directo: [UserResponse, UserResponse, ...]
      // 2. Objeto con propiedad data: { data: [UserResponse, ...] }
      // 3. Objeto con propiedad users: { users: [UserResponse, ...] }

      let usersArray: UserResponse[] = [];

      if (Array.isArray(response.data)) {
        // Si la respuesta es un array directo
        usersArray = response.data;
      } else if ('data' in response.data && Array.isArray(response.data.data)) {
        // Si la respuesta tiene una propiedad 'data'
        usersArray = response.data.data;
      } else if ('users' in response.data && Array.isArray(response.data.users)) {
        // Si la respuesta tiene una propiedad 'users'
        usersArray = response.data.users;
      } else {
        throw new Error('Formato de respuesta no reconocido');
      }

      // Mapear cada usuario a MobileAppUser
      return usersArray.map(user => mapUserResponseToMobileAppUser(user));
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        const errorMessage = axiosError.response.data?.message || 
                            axiosError.response.data?.error || 
                            `Error al obtener usuarios: ${axiosError.response.status}`;
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        throw new Error(`Error al obtener usuarios: ${axiosError.message}`);
      }
    }
  }

  /**
   * Crea un usuario completo con todos los campos opcionales
   * @param userData Datos del usuario en formato CreateUserRequest
   * @returns Usuario creado en formato MobileAppUser
   */
  async createUser(userData: CreateUserRequest): Promise<MobileAppUser> {
    try {
      const response = await axios.post<UserResponse>(
        ApiConfig.createUserUrl,
        userData,
        {
          timeout: ApiConfig.timeoutMs,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return mapUserResponseToMobileAppUser(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        // El servidor respondió con un código de error
        const errorMessage = axiosError.response.data?.message || 
                            axiosError.response.data?.error || 
                            `Error al crear usuario: ${axiosError.response.status}`;
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        // La petición fue hecha pero no se recibió respuesta
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        // Algo más causó el error
        throw new Error(`Error al crear usuario: ${axiosError.message}`);
      }
    }
  }

  /**
   * Crea un usuario con datos mínimos
   * @param userData Datos mínimos del usuario
   * @returns Usuario creado en formato MobileAppUser
   */
  async createUserMinimal(userData: CreateUserMinimalRequest): Promise<MobileAppUser> {
    try {
      const response = await axios.post<UserResponse>(
        ApiConfig.createUserMinimalUrl,
        userData,
        {
          timeout: ApiConfig.timeoutMs,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return mapUserResponseToMobileAppUser(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response) {
        const errorMessage = axiosError.response.data?.message || 
                            axiosError.response.data?.error || 
                            `Error al crear usuario: ${axiosError.response.status}`;
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        throw new Error(`Error al crear usuario: ${axiosError.message}`);
      }
    }
  }

  /**
   * Crea un usuario desde un objeto MobileAppUser parcial
   * @param userData Datos del usuario en formato MobileAppUser (debe incluir username, phone, password)
   * @returns Usuario creado en formato MobileAppUser
   */
  async createUserFromMobileAppUser(userData: Partial<MobileAppUser> & { username?: string; onuSn?: string; password?: string; phone?: string }): Promise<MobileAppUser> {
    const createRequest = mapUserToCreateRequest(userData);
    return this.createUser(createRequest);
  }
}

// Exportar una instancia única del servicio
export const userService = new UserService();
export default userService;

