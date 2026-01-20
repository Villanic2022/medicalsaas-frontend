import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterOwnerPage from '../pages/auth/RegisterOwnerPage';
import RegisterStaffPage from '../pages/auth/RegisterStaffPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfessionalsPage from '../pages/professionals/ProfessionalsPage';
import SpecialtiesPage from '../pages/specialties/SpecialtiesPage';
import AppointmentsPage from '../pages/appointments/AppointmentsPage';
import PublicBookingPage from '../pages/appointments/PublicBookingPage';
import TenantsPage from '../pages/admin/TenantsPage';
import StaffPage from '../pages/staff/StaffPage';
import InsuranceCompaniesPage from '../pages/insurance/InsuranceCompaniesPage';

import { ROLES } from '../utils/constants';

// Componente para redirigir desde la raíz
const RootRedirect = () => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
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

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirigir según el rol
    if (user?.role === ROLES.ADMIN) {
        return <Navigate to="/admin/tenants" replace />;
    }

    return <Navigate to="/dashboard" replace />;
};

// Placeholder para páginas que aún no están implementadas
const PlaceholderPage = ({ title }) => (
    <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <div className="card p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Próximamente</h2>
            <p className="text-gray-600">Esta funcionalidad se implementará en los próximos pasos</p>
        </div>
    </div>
);

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register/owner" element={<RegisterOwnerPage />} />
                    <Route path="/register/staff" element={<RegisterStaffPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* Rutas protegidas con layout */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        {/* Dashboard - OWNER y STAFF */}
                        <Route
                            path="dashboard"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.STAFF]}>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Profesionales - solo OWNER */}
                        <Route
                            path="professionals"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
                                    <ProfessionalsPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Turnos - OWNER y STAFF */}
                        <Route
                            path="appointments"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.STAFF]}>
                                    <AppointmentsPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Especialidades - OWNER y STAFF */}
                        <Route
                            path="specialties"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.STAFF]}>
                                    <SpecialtiesPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Obras Sociales - solo OWNER */}
                        <Route
                            path="insurance-companies"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
                                    <InsuranceCompaniesPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Staff - solo OWNER */}
                        <Route
                            path="staff"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
                                    <StaffPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin - solo ADMIN */}
                        <Route
                            path="admin/tenants"
                            element={
                                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                    <TenantsPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>

                    {/* Ruta para páginas públicas de reserva (sin layout) */}
                    <Route
                        path="/consultorio/:slug"
                        element={<PublicBookingPage />}
                    />

                    {/* 404 */}
                    <Route
                        path="*"
                        element={
                            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                                    <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                                    <a href="/" className="btn btn-primary">
                                        Volver al inicio
                                    </a>
                                </div>
                            </div>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default AppRoutes;
