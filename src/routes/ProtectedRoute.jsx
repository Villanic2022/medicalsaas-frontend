import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Mientras carga, mostrar loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si hay roles permitidos y el usuario no tiene el rol correcto
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        // Si es ADMIN intentando acceder a ruta no-admin, redirigir a admin panel
        if (user?.role === ROLES.ADMIN) {
            return <Navigate to="/admin/tenants" replace />;
        }
        // Otros usuarios sin permiso van al dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // Usuario autenticado y con permisos correctos
    return children;
};

export default ProtectedRoute;
