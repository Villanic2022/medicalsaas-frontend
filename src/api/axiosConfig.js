import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../utils/constants';

// Crear instancia de axios
const axiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor deRequest - Agregar token JWT
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Agregar tenantId como header si existe
        const tenantId = localStorage.getItem(STORAGE_KEYS.TENANT_ID);
        if (tenantId && !config.url.startsWith('/auth') && !config.url.startsWith('/t/')) {
            config.headers['X-Tenant-ID'] = tenantId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor de Response - Manejar errores y refresh token
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Si es error 401 y no es el endpoint de login/refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Si es el endpoint de refresh, logout
            if (originalRequest.url === '/auth/refresh') {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Intentar refresh del token
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const response = await axios.post(
                    `${API_CONFIG.BASE_URL}/auth/refresh`,
                    { refreshToken }
                );

                const { token, refreshToken: newRefreshToken } = response.data;

                // Guardar nuevos tokens
                localStorage.setItem(STORAGE_KEYS.TOKEN, token);
                if (newRefreshToken) {
                    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
                }

                // Reintentar request original
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                // Si falla el refresh, limpiar y redirigir a login
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Manejo de otros errores
        if (error.response) {
            // El servidor respondió con un código de error
            const status = error.response.status;
            const message = error.response.data?.message || error.response.data?.error;

            switch (status) {
                case 403:
                    error.userMessage = ERROR_MESSAGES.UNAUTHORIZED;
                    break;
                case 404:
                    error.userMessage = message || 'Recurso no encontrado';
                    break;
                case 500:
                    error.userMessage = ERROR_MESSAGES.SERVER_ERROR;
                    break;
                default:
                    error.userMessage = message || ERROR_MESSAGES.VALIDATION_ERROR;
            }
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
            error.userMessage = ERROR_MESSAGES.NETWORK_ERROR;
        } else {
            // Algo pasó al configurar la petición
            error.userMessage = error.message;
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
