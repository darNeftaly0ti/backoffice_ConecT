import axios, { AxiosError } from 'axios';
import ApiConfig from '../config/api.config';

/**
 * Interfaz para el payload de login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interfaz para la respuesta del login
 */
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    accountStatus: string;
    verified: boolean;
    roles: string[];
  };
}

/**
 * Interfaz para el error de la API
 */
export interface AuthErrorResponse {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Clase de servicio para operaciones de autenticación
 */
class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  /**
   * Realiza el login del usuario
   * @param credentials Credenciales de login (email y password)
   * @returns Respuesta con token y datos del usuario
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        ApiConfig.loginUrl,
        credentials,
        {
          timeout: 10000, // 10 segundos como especificado
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Guardar token y usuario en localStorage
      this.setToken(response.data.token);
      this.setUser(response.data.user);

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<AuthErrorResponse>;
      if (axiosError.response) {
        const errorMessage = axiosError.response.data?.message || 
                            axiosError.response.data?.error || 
                            `Error al iniciar sesión: ${axiosError.response.status}`;
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        throw new Error(`Error al iniciar sesión: ${axiosError.message}`);
      }
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.removeToken();
    this.removeUser();
  }

  /**
   * Obtiene el token almacenado
   * @returns Token JWT o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Guarda el token en localStorage
   * @param token Token JWT
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Elimina el token de localStorage
   */
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene el usuario almacenado
   * @returns Datos del usuario o null si no existe
   */
  getUser(): LoginResponse['user'] | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Guarda el usuario en localStorage
   * @param user Datos del usuario
   */
  setUser(user: LoginResponse['user']): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Elimina el usuario de localStorage
   */
  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si hay token y usuario, false en caso contrario
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }

  /**
   * Obtiene el header de autorización para las peticiones
   * @returns Objeto con el header Authorization o null
   */
  getAuthHeader(): { Authorization: string } | null {
    const token = this.getToken();
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }
}

// Exportar una instancia única del servicio
export const authService = new AuthService();
export default authService;

