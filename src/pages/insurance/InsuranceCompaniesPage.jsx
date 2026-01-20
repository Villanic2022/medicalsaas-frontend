import { useState, useEffect } from 'react';
import insuranceService from '../../api/insuranceService';

const InsuranceCompaniesPage = () => {
    const [insuranceCompanies, setInsuranceCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentInsurance, setCurrentInsurance] = useState(null);
    const [modalError, setModalError] = useState('');
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        active: true
    });

    useEffect(() => {
        fetchInsuranceCompanies();
    }, []);

    const fetchInsuranceCompanies = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await insuranceService.getAll();
            setInsuranceCompanies(data);
        } catch (err) {
            console.error('Error fetching insurance companies:', err);
            setError('No se pudieron cargar las obras sociales: ' + (err.userMessage || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (insurance = null) => {
        setCurrentInsurance(insurance);
        if (insurance) {
            setFormData({
                name: insurance.name || '',
                code: insurance.code || '',
                active: insurance.active !== undefined ? insurance.active : true
            });
        } else {
            setFormData({
                name: '',
                code: '',
                active: true
            });
        }
        setModalError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentInsurance(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Auto-generate code from name
        if (name === 'name' && !currentInsurance) {
            const autoCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
            setFormData(prev => ({
                ...prev,
                code: autoCode
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        setSaving(true);

        try {
            if (currentInsurance) {
                await insuranceService.update(currentInsurance.id, formData);
            } else {
                await insuranceService.create(formData);
            }

            await fetchInsuranceCompanies();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving insurance company:', err);
            setModalError(err.userMessage || err.message || 'Error al guardar la obra social');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Está seguro de que desea eliminar esta obra social?')) {
            return;
        }

        try {
            await insuranceService.delete(id);
            await fetchInsuranceCompanies();
        } catch (err) {
            console.error('Error deleting insurance company:', err);
            alert('Error al eliminar la obra social: ' + (err.userMessage || err.message));
        }
    };

    const handleToggleActive = async (insurance) => {
        try {
            await insuranceService.update(insurance.id, {
                ...insurance,
                active: !insurance.active
            });
            await fetchInsuranceCompanies();
        } catch (err) {
            console.error('Error updating insurance company:', err);
            alert('Error al actualizar la obra social: ' + (err.userMessage || err.message));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Obras Sociales</h1>
                    <p className="text-gray-600 mt-1">Gestione las obras sociales disponibles en el sistema</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nueva Obra Social
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Código</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {insuranceCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-gray-500">
                                        No hay obras sociales registradas.
                                    </td>
                                </tr>
                            ) : (
                                insuranceCompanies.map((insurance) => (
                                    <tr key={insurance.id}>
                                        <td>
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mr-3">
                                                    {insurance.name.charAt(0)}
                                                </div>
                                                <div className="font-medium text-gray-900">{insurance.name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline text-xs">
                                                {insurance.code}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleActive(insurance)}
                                                className={`badge cursor-pointer ${insurance.active ? 'badge-success hover:badge-warning' : 'badge-danger hover:badge-success'}`}
                                                title={insurance.active ? 'Click para desactivar' : 'Click para activar'}
                                            >
                                                {insurance.active ? 'Activa' : 'Inactiva'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(insurance)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                    title="Editar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(insurance.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Eliminar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Crear/Editar */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {currentInsurance ? 'Editar Obra Social' : 'Nueva Obra Social'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {modalError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Nombre *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="input"
                                        placeholder="Ej: Omint, Medife, Galeno"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Código *</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        className="input"
                                        placeholder="Ej: OMINT, MEDIFE"
                                        required
                                        maxLength="10"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Se genera automáticamente del nombre, pero puedes editarlo
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={formData.active}
                                            onChange={handleInputChange}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Activa</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Solo las obras sociales activas aparecerán en la selección de profesionales
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn btn-ghost"
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Guardando...
                                        </>
                                    ) : (
                                        currentInsurance ? 'Actualizar' : 'Crear'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsuranceCompaniesPage;