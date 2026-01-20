import { useState, useEffect } from 'react';
import specialtiesService from '../../api/specialtiesService';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

const SpecialtiesPage = () => {
    const { user } = useAuth();
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [isvModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchSpecialties();
    }, []);

    const fetchSpecialties = async () => {
        try {
            setLoading(true);
            const data = await specialtiesService.getAll();
            setSpecialties(data);
        } catch (err) {
            console.error('Error fetching specialties:', err);
            setError('Error al cargar las especialidades.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ name: '', description: '' });
        setIsModalOpen(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', description: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('El nombre de la especialidad es obligatorio.');
            return;
        }

        try {
            setCreating(true);
            setError(null);
            await specialtiesService.create(formData);
            await fetchSpecialties();
            handleCloseModal();
        } catch (err) {
            console.error('Error creating specialty:', err);
            setError('Error al crear la especialidad. Intente nuevamente.');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`¿Estás seguro que deseas eliminar la especialidad "${name}"?`)) {
            try {
                setLoading(true);
                await specialtiesService.delete(id);
                // Refresh list
                await fetchSpecialties();
            } catch (err) {
                console.error('Error deleting specialty:', err);
                setError('Error al eliminar la especialidad.');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && !isvModalOpen && specialties.length === 0) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Especialidades</h1>
                    <p className="text-gray-600 mt-1">Listado de especialidades médicas disponibles en el sistema.</p>
                </div>
                {user?.role === ROLES.OWNER && (
                    <button
                        onClick={handleOpenModal}
                        className="btn btn-primary flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Especialidad
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="w-1/4">Nombre</th>
                                <th className="w-2/4">Descripción</th>
                                <th className="w-1/6">Estado</th>
                                {user?.role === ROLES.OWNER && <th className="w-1/12">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {specialties.length === 0 ? (
                                <tr>
                                    <td colSpan={user?.role === ROLES.OWNER ? "4" : "3"} className="text-center py-8 text-gray-500">
                                        No hay especialidades disponibles.
                                    </td>
                                </tr>
                            ) : (
                                specialties.map((specialty) => (
                                    <tr key={specialty.id}>
                                        <td className="font-medium text-gray-900">
                                            {specialty.name}
                                        </td>
                                        <td className="text-gray-600">
                                            {specialty.description || '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${specialty.active !== false ? 'badge-success' : 'badge-danger'}`}>
                                                {specialty.active !== false ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        {user?.role === ROLES.OWNER && (
                                            <td>
                                                <button
                                                    onClick={() => handleDelete(specialty.id, specialty.name)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    title="Eliminar especialidad"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-right">
                * {user?.role === ROLES.OWNER
                    ? 'Puede crear nuevas especialidades para su consultorio.'
                    : 'Las especialidades son gestionadas por la administración del sistema.'}
            </div>

            {/* Create Specialty Modal */}
            {isvModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Nueva Especialidad
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4">
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    placeholder="Ej: Cardiología"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                    Descripción
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="input w-full h-24 resize-none"
                                    placeholder="Descripción breve de la especialidad..."
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn btn-secondary"
                                    disabled={creating}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={creating}
                                >
                                    {creating ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecialtiesPage;
