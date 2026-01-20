import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import staffService from '../../api/staffService';
import { ROLES } from '../../utils/constants';

const StaffPage = () => {
    const { user } = useAuth();

    // Data States
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' only for now

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await staffService.getAll();
            setStaffList(data);
        } catch (err) {
            console.error('Error fetching staff:', err);
            setError('Error al cargar el personal.');
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        // Basic Validation
        if (formData.password !== formData.confirmPassword) {
            setFormError('Las contraseñas no coinciden');
            return;
        }
        if (formData.password.length < 6) {
            setFormError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setSubmitting(true);
        try {
            // TENTANT SLUG ROBUST RETRIEVAL
            let currentTenantSlug = user?.tenantSlug;

            // Fallback: Try to get from localStorage if missing in user context
            if (!currentTenantSlug) {
                console.warn('TenantSlug missing in user context, trying localStorage...');
                currentTenantSlug = localStorage.getItem('tenant_slug');
            }

            console.log('Creating staff for tenantSlug:', currentTenantSlug);

            if (!currentTenantSlug) {
                throw new Error('No se pudo identificar el consultorio (tenantSlug faltante). Por favor, recarga la página.');
            }

            const payload = {
                ...formData,
                tenantSlug: currentTenantSlug
            };

            await staffService.create(payload);

            // Success
            closeModal();
            fetchStaff(); // Refresh list
        } catch (err) {
            console.error('Error creating staff:', err);
            setFormError(err.response?.data?.message || err.message || 'Error al crear el usuario');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Staff</h1>
                <button
                    onClick={openCreateModal}
                    className="btn btn-primary flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Staff
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : staffList.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                    No hay miembros de staff registrados.
                                </td>
                            </tr>
                        ) : (
                            staffList.map((staff) => (
                                <tr key={staff.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3">
                                                {staff.firstName?.charAt(0)}{staff.lastName?.charAt(0)}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {staff.firstName} {staff.lastName}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {staff.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            STAFF
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {staff.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Nuevo Miembro de Staff
                                    </h3>
                                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                                        <span className="text-2xl">&times;</span>
                                    </button>
                                </div>

                                {formError && (
                                    <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                                        {formError}
                                    </div>
                                )}

                                <form id="staffForm" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className="mt-1 input block w-full"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Apellido *</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className="mt-1 input block w-full"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="mt-1 input block w-full"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contraseña *</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="mt-1 input block w-full"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña *</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="mt-1 input block w-full"
                                            required
                                        />
                                    </div>
                                </form>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    form="staffForm"
                                    disabled={submitting}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    {submitting ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPage;
