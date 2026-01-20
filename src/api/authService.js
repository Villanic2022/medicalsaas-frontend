import axiosInstance from './axiosConfig';

/**
 * Servicio de autenticación
 * Maneja todos los endpoints de /auth
 */

/**
 * Registro de nuevo consultorio (Owner)
 * POST /auth/register/owner
 */
export const registerOwner = async (data) => {
    const response = await axiosInstance.post('/auth/register/owner', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        clinicName: data.clinicName || null,
        clinicPhone: data.clinicPhone || null,
        clinicAddress: data.clinicAddress || null,
        clinicCity: data.clinicCity || null
    });
    return response.data;
};

/**
 * Registro de staff en consultorio existente
 * POST /auth/register/staff
 */
export const registerStaff = async (data) => {
    const response = await axiosInstance.post('/auth/register/staff', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        tenantSlug: data.tenantSlug
    });
    return response.data;
};

/**
 * Login de usuario
 * POST /auth/login
 * Retorna: { token, refreshToken?, user: { id, email, role, tenantId, tenantSlug } }
 */
export const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', {
        email,
        password
    });
    return response.data;
};

/**
 * Refresh del token
 * POST /auth/refresh
 */
export const refreshToken = async (refreshToken) => {
    const response = await axiosInstance.post('/auth/refresh', {
        refreshToken
    });
    return response.data;
};

/**
 * Logout (opcional - puede ser solo client-side)
 * POST /auth/logout
 */
export const logout = async () => {
    try {
        await axiosInstance.post('/auth/logout');
    } catch (error) {
        // Ignorar errores de logout
        console.error('Error en logout:', error);
    }
};

/**
 * Solicitar reset de contraseña
 * POST /auth/forgot-password
 */
export const forgotPassword = async (email) => {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
};

/**
 * Validar token de reset
 * GET /auth/validate-reset-token
 */
export const validateResetToken = async (token) => {
    const response = await axiosInstance.get(`/auth/validate-reset-token?token=${token}`);
    return response.data;
};

/**
 * Resetear contraseña
 * POST /auth/reset-password
 */
export const resetPassword = async (token, newPassword, confirmPassword) => {
    const response = await axiosInstance.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword
    });
    return response.data;
};

export default {
    registerOwner,
    registerStaff,
    login,
    refreshToken,
    logout,
    forgotPassword,
    validateResetToken,
    resetPassword
};
