// Roles del sistema
export const ROLES = {
    ADMIN: 'ADMIN',
    OWNER: 'OWNER',
    STAFF: 'STAFF'
};

// Estados de turnos
export const APPOINTMENT_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED'
};

// Traducciones de estados
export const APPOINTMENT_STATUS_LABELS = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    CANCELLED: 'Cancelado',
    COMPLETED: 'Completado'
};

// Colores por estado
export const APPOINTMENT_STATUS_COLORS = {
    PENDING: 'warning',
    CONFIRMED: 'success',
    CANCELLED: 'danger',
    COMPLETED: 'info'
};

// Claves de localStorage
export const STORAGE_KEYS = {
    TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user_data',
    TENANT_ID: 'tenant_id',
    TENANT_SLUG: 'tenant_slug'
};

// Rutas de la aplicación
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER_OWNER: '/register/owner',
    REGISTER_STAFF: '/register/staff',
    DASHBOARD: '/dashboard',
    PROFESSIONALS: '/professionals',
    SPECIALTIES: '/specialties',
    APPOINTMENTS: '/appointments',
    ADMIN_TENANTS: '/admin/tenants',
    PUBLIC_BOOKING: '/consultorio/:slug'
};

// Permisos por rol
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        'view_all_tenants',
        'create_tenant',
        'edit_tenant',
        'activate_tenant',
        'deactivate_tenant'
    ],
    [ROLES.OWNER]: [
        'view_professionals',
        'create_professional',
        'edit_professional',
        'delete_professional',
        'view_appointments',
        'edit_appointment',
        'delete_appointment',
        'view_specialties'
    ],
    [ROLES.STAFF]: [
        'view_professionals',
        'view_appointments',
        'edit_appointment',
        'view_specialties'
    ]
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
    UNAUTHORIZED: 'No estás autorizado para realizar esta acción.',
    SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    SERVER_ERROR: 'Error del servidor. Por favor, intenta nuevamente más tarde.',
    VALIDATION_ERROR: 'Por favor, verifica los datos ingresados.'
};

// Configuración de la API
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    TIMEOUT: 30000, // 30 segundos
    RETRY_ATTEMPTS: 3
};
