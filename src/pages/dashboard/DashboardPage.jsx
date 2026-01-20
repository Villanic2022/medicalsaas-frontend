import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard
                </h1>
                <p className="text-gray-600 mt-2">
                    Bienvenido, {user?.firstName} {user?.lastName}
                </p>
            </div>

            {/* Card de bienvenida */}
            <div className="card p-6 mb-6">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            ¡Bienvenido a MediSaaS!
                        </h2>
                        <p className="mt-2 text-gray-600">
                            Sistema de gestión médica multi-tenant. Estás usando el rol de <span className="font-semibold text-primary-600">{user?.role}</span>.
                        </p>
                        {user?.tenantSlug && (
                            <p className="mt-1 text-sm text-gray-500">
                                Consultorio: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user.tenantSlug}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Link público para pacientes (Solo OWNER) */}
            {user?.role === ROLES.OWNER && user?.tenantSlug && (
                <div className="card p-6 mb-6 bg-gradient-to-r from-teal-50 to-white border-l-4 border-teal-500">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        🏥 Enlace de Turnos para Pacientes
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Comparte este enlace con tus pacientes para que puedan reservar turnos online:
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="bg-gray-100 p-3 rounded text-sm text-gray-800 flex-1 truncate font-mono border border-gray-200">
                            {`${window.location.origin}/consultorio/${user.tenantSlug}`}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/consultorio/${user.tenantSlug}`);
                                alert('¡Enlace copiado al portapapeles!');
                            }}
                            className="btn btn-secondary flex-shrink-0"
                            title="Copiar enlace"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            <span className="ml-2">Copiar</span>
                        </button>
                        <a
                            href={`/consultorio/${user.tenantSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary flex-shrink-0"
                            title="Ver página"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="ml-2">Abrir</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Información según rol */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user?.role === ROLES.OWNER && (
                    <>
                        <div
                            className="card p-6 card-hover cursor-pointer"
                            onClick={() => navigate('/professionals')}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Profesionales</h3>
                                <svg className="h-8 w-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-sm">Gestiona los profesionales de tu consultorio</p>
                        </div>

                        <div
                            className="card p-6 card-hover cursor-pointer"
                            onClick={() => navigate('/appointments')}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Turnos</h3>
                                <svg className="h-8 w-8 text-medical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-sm">Administra los turnos y citas</p>
                        </div>

                        <div
                            className="card p-6 card-hover cursor-pointer"
                            onClick={() => navigate('/specialties')}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Especialidades</h3>
                                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-sm">Ver especialidades médicas</p>
                        </div>
                    </>
                )}

                {user?.role === ROLES.STAFF && (
                    <>
                        <div
                            className="card p-6 card-hover cursor-pointer"
                            onClick={() => navigate('/appointments')}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Turnos</h3>
                                <svg className="h-8 w-8 text-medical-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-sm">Ver y gestionar turnos</p>
                        </div>

                        <div
                            className="card p-6 card-hover cursor-pointer"
                            onClick={() => navigate('/professionals')}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Profesionales</h3>
                                <svg className="h-8 w-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-600 text-sm">Ver profesionales del consultorio</p>
                        </div>
                    </>
                )}

                {user?.role === ROLES.ADMIN && (
                    <div
                        className="card p-6 card-hover cursor-pointer"
                        onClick={() => navigate('/admin/tenants')}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Gestión de Consultorios</h3>
                            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <p className="text-gray-600 text-sm">Administrar todos los consultorios del sistema</p>
                        <p className="text-xs text-gray-500 mt-2">Ir a Admin Panel</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
