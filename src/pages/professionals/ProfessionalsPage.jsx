import { useState, useEffect } from 'react';
import professionalsService from '../../api/professionalsService';
import specialtiesService from '../../api/specialtiesService';
import AvailabilityConfig from '../../components/AvailabilityConfig';

const ProfessionalsPage = () => {
    const [professionals, setProfessionals] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProfessional, setCurrentProfessional] = useState(null);
    const [modalError, setModalError] = useState('');
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        bio: '',
        specialtyId: '',
        active: true,
        privateConsultationPrice: '',
        acceptedInsurances: []
    });

    // Insurance companies state
    const [insuranceCompanies, setInsuranceCompanies] = useState([]);

    // Availability state
    const [availabilityConfig, setAvailabilityConfig] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Intentar cargar profesionales
            try {
                const profsData = await professionalsService.getAll();
                setProfessionals(profsData);
            } catch (err) {
                console.error('Error fetching professionals:', err);
                throw new Error('No se pudieron cargar los profesionales: ' + (err.userMessage || err.message));
            }

            // Intentar cargar especialidades
            try {
                const specsData = await specialtiesService.getAll();
                setSpecialties(specsData);
            } catch (err) {
                console.error('Error fetching specialties:', err);
                // No lanzamos error fatal si fallan solo las especialidades, pero avisamos
                console.warn('Specialties fetch failed');
            }

            // Intentar cargar obras sociales
            try {
                const insuranceData = await professionalsService.getInsuranceCompanies();
                setInsuranceCompanies(insuranceData);
            } catch (err) {
                console.error('Error fetching insurance companies:', err);
                // No es crítico si no se cargan las obras sociales
            }

        } catch (err) {
            console.error('Fatal fetch error:', err);
            setError(err.message || 'Error de conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = async (professional = null) => {
        if (professional) {
            setCurrentProfessional(professional);
            setFormData({
                firstName: professional.firstName,
                lastName: professional.lastName,
                email: professional.email || '',
                phone: professional.phone || '',
                licenseNumber: professional.licenseNumber || '',
                bio: professional.bio || '',
                specialtyId: professional.specialty?.id || '',
                active: professional.active,
                privateConsultationPrice: professional.privateConsultationPrice || '',
                acceptedInsurances: professional.acceptedInsurances || []
            });

            // Load availability for existing professional
            try {
                const availability = await professionalsService.getAvailability(professional.id);
                setAvailabilityConfig(availability || []);
            } catch (err) {
                console.error('Error loading availability:', err);
                setAvailabilityConfig([]);
            }
        } else {
            setCurrentProfessional(null);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                licenseNumber: '',
                bio: '',
                specialtyId: '',
                active: true,
                privateConsultationPrice: '',
                acceptedInsurances: []
            });
            setAvailabilityConfig([]);
        }
        setModalError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProfessional(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleInsuranceChange = (insuranceId, isChecked) => {
        setFormData(prev => ({
            ...prev,
            acceptedInsurances: isChecked 
                ? [...prev.acceptedInsurances, insuranceId]
                : prev.acceptedInsurances.filter(id => id !== insuranceId)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');
        setSaving(true);

        try {
            let professionalId;

            // Save professional data
            if (currentProfessional) {
                await professionalsService.update(currentProfessional.id, formData);
                professionalId = currentProfessional.id;
            } else {
                const newProfessional = await professionalsService.create(formData);
                professionalId = newProfessional.id;
            }

            // Save availability configuration
            if (availabilityConfig.length > 0) {
                try {
                    await professionalsService.updateAvailability(professionalId, availabilityConfig);
                } catch (err) {
                    console.error('Error saving availability:', err);
                    setModalError('Profesional guardado, pero hubo un error al guardar la disponibilidad.');
                    setSaving(false);
                    return;
                }
            }

            fetchData(); // Reload list
            handleCloseModal();
        } catch (err) {
            console.error('Error saving professional:', err);
            setModalError('Error al guardar. Verifica los datos e intenta nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este profesional?')) return;

        try {
            await professionalsService.delete(id);
            fetchData();
        } catch (err) {
            console.error('Error deleting professional:', err);
            alert('Error al eliminar el profesional.');
        }
    };

    if (loading) return <div className="text-center py-10">Cargando...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Profesionales</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Profesional
                </button>
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
                                <th>Nombre</th>
                                <th>Especialidad</th>
                                <th>Contacto</th>
                                <th>Consulta/Obras Sociales</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {professionals.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        No hay profesionales registrados.
                                    </td>
                                </tr>
                            ) : (
                                professionals.map((prof) => (
                                    <tr key={prof.id}>
                                        <td>
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3">
                                                    {prof.firstName.charAt(0)}{prof.lastName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{prof.fullName}</div>
                                                    <div className="text-xs text-gray-500">Lic: {prof.licenseNumber || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-info text-xs">
                                                {prof.specialty?.name || 'Sin especialidad'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div className="flex items-center mb-1">
                                                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {prof.email || '-'}
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {prof.phone || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                {prof.privateConsultationPrice && (
                                                    <div className="flex items-center mb-1">
                                                        <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                        </svg>
                                                        <span className="font-medium">${prof.privateConsultationPrice?.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {prof.acceptedInsurances && prof.acceptedInsurances.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {prof.acceptedInsurances.slice(0, 2).map(insurance => (
                                                            <span key={insurance.id} className="badge badge-outline text-xs">
                                                                {insurance.name}
                                                            </span>
                                                        ))}
                                                        {prof.acceptedInsurances.length > 2 && (
                                                            <span className="text-xs text-gray-500">
                                                                +{prof.acceptedInsurances.length - 2} más
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {(!prof.privateConsultationPrice && (!prof.acceptedInsurances || prof.acceptedInsurances.length === 0)) && (
                                                    <span className="text-gray-400 text-xs">No configurado</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${prof.active ? 'badge-success' : 'badge-danger'}`}>
                                                {prof.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(prof)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                    title="Editar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(prof.id)}
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
                                {currentProfessional ? 'Editar Profesional' : 'Nuevo Profesional'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Nombre *</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Apellido *</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Especialidad *</label>
                                    <select
                                        name="specialtyId"
                                        value={formData.specialtyId}
                                        onChange={handleInputChange}
                                        className="input"
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {specialties.map(spec => (
                                            <option key={spec.id} value={spec.id}>
                                                {spec.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nro. Matrícula</label>
                                    <input
                                        type="text"
                                        name="licenseNumber"
                                        value={formData.licenseNumber}
                                        onChange={handleInputChange}
                                        className="input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Teléfono</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="input"
                                    />
                                </div>
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">Biografía</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        className="input h-24"
                                    />
                                </div>

                                {/* Precio Consulta Particular */}
                                <div className="form-group">
                                    <label className="form-label">Precio Consulta Particular ($)</label>
                                    <input
                                        type="number"
                                        name="privateConsultationPrice"
                                        value={formData.privateConsultationPrice}
                                        onChange={handleInputChange}
                                        className="input"
                                        placeholder="25000"
                                        min="0"
                                        step="1000"
                                    />
                                </div>

                                {/* Obras Sociales Aceptadas */}
                                <div className="form-group">
                                    <label className="form-label">Obras Sociales Aceptadas</label>
                                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded p-3 bg-gray-50">
                                        {insuranceCompanies.length > 0 ? (
                                            insuranceCompanies.map(insurance => (
                                                <label key={insurance.id} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.acceptedInsurances.includes(insurance.id)}
                                                        onChange={(e) => handleInsuranceChange(insurance.id, e.target.checked)}
                                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                                                    />
                                                    <span className="text-sm">{insurance.name}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">No hay obras sociales disponibles</p>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Seleccione las obras sociales que acepta este profesional
                                    </p>
                                </div>

                                {/* Availability Configuration */}
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">Disponibilidad Horaria</label>
                                    <AvailabilityConfig
                                        availability={availabilityConfig}
                                        onChange={setAvailabilityConfig}
                                    />
                                </div>

                                <div className="form-group md:col-span-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="active"
                                            checked={formData.active}
                                            onChange={handleInputChange}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                                        />
                                        <span className="text-gray-900 font-medium">Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn btn-secondary"
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionalsPage;
