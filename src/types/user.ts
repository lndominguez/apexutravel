// Tipos para el cliente - sin dependencias de Mongoose
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}

export enum ColorScheme {
  BLUE = 'blue',
  RED = 'red',
  GREEN = 'green',
  PURPLE = 'purple'
}

export interface UserPreferences {
  theme: ThemeMode;
  colorScheme: ColorScheme;
  language?: string;
}

export interface ClientUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatar?: string;
  preferences: UserPreferences;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para respuestas de API
export interface PreferencesResponse {
  preferences: UserPreferences;
}

export interface UpdatePreferencesResponse {
  message: string;
  preferences: UserPreferences;
}

export interface ApiError {
  error: string;
}
