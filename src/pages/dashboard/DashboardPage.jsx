import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';
import appointmentsService from '../../api/appointmentsService';
import { format } from 'date-fns';

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [todayStats, setTodayStats] = useState({ loading: true, total: 0, byProfessional: {}, error: null });

    useEffect(() => {
        const fetchTodayStats = async () => {
            try {
                // Fetch all appointments (or filter by date if API supports it efficiently)
                // For now, fetching all and filtering client-side for "Today"
                const allAppointments = await appointmentsService.getAll();

                const todayStr = format(new Date(), 'yyyy-MM-dd');
                const todayAppointments = allAppointments.filter(appt =>
                    appt.startDateTime.startsWith(todayStr) && appt.status !== 'CANCELLED'
                );

                const byProf = {};
                todayAppointments.forEach(appt => {
                    const profName = appt.professional?.fullName || 'Sin Asignar';
                    byProf[profName] = (byProf[profName] || 0) + 1;
                });

                setTodayStats({
                    loading: false,
                    total: todayAppointments.length,
                    byProfessional: byProf,
                    error: null
                });
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setTodayStats({ loading: false, total: 0, byProfessional: {}, error: "No se pudieron cargar los datos de hoy." });
            }
        };

        if (user?.tenantSlug) {
            fetchTodayStats();
        }
    }, [user]);

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

            {/* Resumen del Día */}
            <div className="card p-6 mb-6 bg-white border-l-4 border-teal-500 shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">📅</span> Estado de Hoy
                </h2>

                {todayStats.loading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                ) : todayStats.error ? (
                    <div className="text-red-500 text-sm">{todayStats.error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-teal-100 text-teal-600 mr-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Turnos Hoy</p>
                                <p className="text-3xl font-bold text-gray-900">{todayStats.total}</p>
                            </div>
                        </div>

                        <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                            <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Por Profesional</p>
                            {Object.keys(todayStats.byProfessional).length === 0 ? (
                                <p className="text-gray-400 italic text-sm">No hay turnos programados.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {Object.entries(todayStats.byProfessional).map(([name, count]) => (
                                        <li key={name} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-700 font-medium">{name}</span>
                                            <span className="bg-teal-50 text-teal-700 py-0.5 px-2.5 rounded-full text-xs font-bold border border-teal-100">
                                                {count}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
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
