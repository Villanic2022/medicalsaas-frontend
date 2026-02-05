import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

const Sidebar = () => {
    const { user } = useAuth();

    // Configuración de navegación según rol
    const getNavigationItems = () => {
        const items = [];

        if (user?.role === ROLES.ADMIN) {
            items.push(
                {
                    name: 'Gestión de Consultorios',
                    path: '/admin/tenants',
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    )
                }
            );
        }

        if (user?.role === ROLES.OWNER || user?.role === ROLES.STAFF) {
            items.push(
                {
                    name: 'Dashboard',
                    path: '/dashboard',
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    )
                }
            );
        }

        if (user?.role === ROLES.OWNER) {
            items.push(
                {
                    name: 'Profesionales',
                    path: '/professionals',
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                },
                {
                    name: 'Staff',
                    path: '/staff',
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    )
                }
            );
        }

        if (user?.role === ROLES.OWNER || user?.role === ROLES.STAFF) {
            items.push(
                {
                    name: 'Turnos',
                    path: '/appointments',
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )
                },
                {
                    name: 'Pacientes',
                    path: '/patients',
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                },
                {
                    name: 'Especialidades',
                    path: '/specialties',
                    icon: (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    )
                }
            );
        }

        // Obras Sociales - solo para OWNER
        if (user?.role === ROLES.OWNER) {
            items.push({
                name: 'Obras Sociales',
                path: '/insurance-companies',
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                )
            });
        }

        return items;
    };

    const navigationItems = getNavigationItems();

    return (
        <div className="sidebar">
            {/* Logo */}
            <div className="px-6 py-6 border-b border-primary-700">
                <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg mr-3">
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">MediSaaS</h2>
                        <p className="text-xs text-primary-200">Gestión Médica</p>
                    </div>
                </div>
            </div>

            {/* Información del consultorio (solo para non-admin) */}
            {user?.role !== ROLES.ADMIN && user?.tenantSlug && (
                <div className="px-6 py-4 bg-primary-900 bg-opacity-50">
                    <p className="text-xs text-primary-200 mb-1">Consultorio</p>
                    <p className="text-sm font-medium text-white truncate font-mono">
                        {user.tenantSlug}
                    </p>
                </div>
            )}

            {/* Navegación */}
            <nav className="mt-6 flex-1">
                {navigationItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                        }
                    >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Información del usuario en la parte inferior */}
            <div className="px-6 py-4 border-t border-primary-700">
                <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-700 rounded-full text-white font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-primary-200">
                            {user?.role === ROLES.ADMIN && 'Administrador'}
                            {user?.role === ROLES.OWNER && 'Propietario'}
                            {user?.role === ROLES.STAFF && 'Staff'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
