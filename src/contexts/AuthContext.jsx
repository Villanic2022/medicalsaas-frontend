import { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../api/authService';
import { STORAGE_KEYS, ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar usuario y token desde localStorage al iniciar
    useEffect(() => {
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.clear();
            }
        }

        setLoading(false);
    }, []);

    /**
     * Login de usuario
     */
    const loginUser = async (email, password) => {
        try {
            const data = await authService.login(email, password);

            // Guardar token y refresh token
            localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
            if (data.refreshToken) {
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
            }

            // Guardar datos de usuario
            const userData = {
                id: data.user?.id || data.id,
                email: data.user?.email || data.email,
                firstName: data.user?.firstName || data.firstName,
                lastName: data.user?.lastName || data.lastName,
                role: data.user?.role || data.role,
                tenantId: data.user?.tenantId || data.tenantId,
                tenantSlug: data.user?.tenantSlug || data.tenantSlug
            };

            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

            // Guardar tenantId y tenantSlug si existen
            if (userData.tenantId) {
                localStorage.setItem(STORAGE_KEYS.TENANT_ID, userData.tenantId);
            }
            if (userData.tenantSlug) {
                localStorage.setItem(STORAGE_KEYS.TENANT_SLUG, userData.tenantSlug);
            }

            setToken(data.token);
            setUser(userData);

            return userData;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    /**
     * Registro de Owner (crea consultorio)
     */
    const registerOwnerAccount = async (formData) => {
        try {
            const data = await authService.registerOwner(formData);

            // Después del registro, hacer login automático si el backend lo retorna
            if (data.token) {
                localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
                if (data.refreshToken) {
                    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
                }

                const userData = {
                    id: data.user?.id || data.id,
                    email: data.user?.email || data.email,
                    firstName: data.user?.firstName || data.firstName,
                    lastName: data.user?.lastName || data.lastName,
                    role: data.user?.role || ROLES.OWNER,
                    tenantId: data.user?.tenantId || data.tenantId,
                    tenantSlug: data.user?.tenantSlug || data.tenantSlug
                };

                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

                if (userData.tenantId) {
                    localStorage.setItem(STORAGE_KEYS.TENANT_ID, userData.tenantId);
                }
                if (userData.tenantSlug) {
                    localStorage.setItem(STORAGE_KEYS.TENANT_SLUG, userData.tenantSlug);
                }

                setToken(data.token);
                setUser(userData);
            }

            return data;
        } catch (error) {
            console.error('Register owner error:', error);
            throw error;
        }
    };

    /**
     * Registro de Staff
     */
    const registerStaffAccount = async (formData) => {
        try {
            const data = await authService.registerStaff(formData);

            // Después del registro, hacer login automático si el backend lo retorna
            if (data.token) {
                localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
                if (data.refreshToken) {
                    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
                }

                const userData = {
                    id: data.user?.id || data.id,
                    email: data.user?.email || data.email,
                    firstName: data.user?.firstName || data.firstName,
                    lastName: data.user?.lastName || data.lastName,
                    role: data.user?.role || ROLES.STAFF,
                    tenantId: data.user?.tenantId || data.tenantId,
                    tenantSlug: data.user?.tenantSlug || data.tenantSlug
                };

                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

                if (userData.tenantId) {
                    localStorage.setItem(STORAGE_KEYS.TENANT_ID, userData.tenantId);
                }
                if (userData.tenantSlug) {
                    localStorage.setItem(STORAGE_KEYS.TENANT_SLUG, userData.tenantSlug);
                }

                setToken(data.token);
                setUser(userData);
            }

            return data;
        } catch (error) {
            console.error('Register staff error:', error);
            throw error;
        }
    };

    /**
     * Logout
     */
    const logoutUser = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Limpiar estado y localStorage
            setUser(null);
            setToken(null);
            localStorage.clear();
        }
    };

    /**
     * Verificar si el usuario tiene un rol específico
     */
    const hasRole = (role) => {
        return user?.role === role;
    };

    /**
     * Verificar si el usuario tiene al menos un rol (OWNER incluye permisos de OWNER)
     */
    const hasMinRole = (minRole) => {
        if (!user) return false;

        const roleHierarchy = {
            [ROLES.ADMIN]: 3,
            [ROLES.OWNER]: 2,
            [ROLES.STAFF]: 1
        };

        return roleHierarchy[user.role] >= roleHierarchy[minRole];
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login: loginUser,
        logout: logoutUser,
        registerOwner: registerOwnerAccount,
        registerStaff: registerStaffAccount,
        hasRole,
        hasMinRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook para usar el contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export default AuthContext;
