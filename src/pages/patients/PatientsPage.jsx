import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import patientsService from '../../api/patientsService';
import professionalsService from '../../api/professionalsService';
import insuranceService from '../../api/insuranceService';

const PatientsPage = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [insuranceCompanies, setInsuranceCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPatient, setCurrentPatient] = useState(null);
    const [modalError, setModalError] = useState('');
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        birthDate: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        insuranceCompanyId: '',
        insuranceNumber: '',
        preferredProfessionalId: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [patientsData, profsData, insuranceData] = await Promise.all([
                patientsService.getAll(),
                professionalsService.getAll(),
                insuranceService.getAll()
            ]);
            setPatients(patientsData);
            setProfessionals(profsData);
            setInsuranceCompanies(insuranceData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error al cargar los datos. Verifica la conexión con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    // Filter patients based on search query
    const filteredPatients = patients.filter(patient => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            patient.firstName?.toLowerCase().includes(query) ||
            patient.lastName?.toLowerCase().includes(query) ||
            patient.fullName?.toLowerCase().includes(query) ||
            patient.dni?.toLowerCase().includes(query) ||
            patient.phone?.includes(query)
        );
    });

    const handleOpenModal = (patient = null) => {
        if (patient) {
            setCurrentPatient(patient);
            setFormData({
                firstName: patient.firstName || '',
                lastName: patient.lastName || '',
                dni: patient.dni || '',
                birthDate: patient.birthDate || '',
                gender: patient.gender || '',
                email: patient.email || '',
                phone: patient.phone || '',
                address: patient.address || '',
                insuranceCompanyId: patient.insuranceCompany?.id || '',
                insuranceNumber: patient.insuranceNumber || '',
                preferredProfessionalId: patient.preferredProfessional?.id || '',
                notes: patient.notes || ''
            });
        } else {
            setCurrentPatient(null);
            setFormData({
                firstName: '',
                lastName: '',
                dni: '',
                birthDate: '',
                gender: '',
                email: '',
                phone: '',
                address: '',
                insuranceCompanyId: '',
                insuranceNumber: '',
                preferredProfessionalId: '',
                notes: ''
            });
        }
        setModalError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentPatient(null);
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
        setModalError('');
        setSaving(true);

        try {
            // Prepare payload
            const payload = {
                ...formData,
                insuranceCompanyId: formData.insuranceCompanyId || null,
                preferredProfessionalId: formData.preferredProfessionalId || null
            };

            if (currentPatient) {
                await patientsService.update(currentPatient.id, payload);
            } else {
                await patientsService.create(payload);
            }

            fetchData();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving patient:', err);
            if (err.response?.status === 409) {
                setModalError('Ya existe un paciente con ese DNI.');
            } else {
                setModalError('Error al guardar. Verifica los datos e intenta nuevamente.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este paciente?')) return;

        try {
            await patientsService.delete(id);
            fetchData();
        } catch (err) {
            console.error('Error deleting patient:', err);
            alert('Error al eliminar el paciente.');
        }
    };

    if (loading) return <div className="text-center py-10">Cargando...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Paciente
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido, DNI o teléfono..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-10 w-full md:w-96"
                    />
                </div>
            </div>

            {/* Patients Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>DNI</th>
                                <th>Contacto</th>
                                <th>Obra Social</th>
                                <th>Profesional Preferido</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-gray-500">
                                        {searchQuery ? 'No se encontraron pacientes con ese criterio.' : 'No hay pacientes registrados.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <tr key={patient.id}>
                                        <td>
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold mr-3">
                                                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{patient.fullName || `${patient.firstName} ${patient.lastName}`}</div>
                                                    {patient.birthDate && (
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(patient.birthDate).toLocaleDateString('es-AR')}
                                                            {patient.gender && ` • ${patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : 'Otro'}`}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-mono text-sm">{patient.dni}</span>
                                        </td>
                                        <td>
                                            <div className="text-sm">
                                                <div className="flex items-center mb-1">
                                                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {patient.phone || '-'}
                                                </div>
                                                {patient.email && (
                                                    <div className="flex items-center text-gray-500">
                                                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="truncate max-w-[150px]">{patient.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {patient.insuranceCompany ? (
                                                <div>
                                                    <span className="badge badge-info text-xs">{patient.insuranceCompany.name}</span>
                                                    {patient.insuranceNumber && (
                                                        <div className="text-xs text-gray-500 mt-1">N° {patient.insuranceNumber}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Particular</span>
                                            )}
                                        </td>
                                        <td>
                                            {patient.preferredProfessional ? (
                                                <span className="text-sm">{patient.preferredProfessional.fullName}</span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => navigate(`/patients/${patient.id}`)}
                                                    className="text-teal-600 hover:text-teal-800"
                                                    title="Ver Historia Clínica y Detalles"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(patient)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                    title="Editar"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(patient.id)}
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content p-6 max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {currentPatient ? 'Editar Paciente' : 'Nuevo Paciente'}
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
                            {/* Personal Information */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Datos Personales
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <label className="form-label">DNI *</label>
                                        <input
                                            type="text"
                                            name="dni"
                                            value={formData.dni}
                                            onChange={handleInputChange}
                                            className="input"
                                            placeholder="12345678"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            name="birthDate"
                                            value={formData.birthDate}
                                            onChange={handleInputChange}
                                            className="input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Género</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="input"
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="MALE">Masculino</option>
                                            <option value="FEMALE">Femenino</option>
                                            <option value="OTHER">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Contacto
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Teléfono *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="input"
                                            placeholder="1155667788"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Para recordatorios por WhatsApp</p>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="input"
                                            placeholder="paciente@email.com"
                                        />
                                    </div>
                                    <div className="form-group md:col-span-2">
                                        <label className="form-label">Dirección</label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="input"
                                            placeholder="Av. Corrientes 1234, CABA"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Insurance Information */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Obra Social
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Obra Social</label>
                                        <select
                                            name="insuranceCompanyId"
                                            value={formData.insuranceCompanyId}
                                            onChange={handleInputChange}
                                            className="input"
                                        >
                                            <option value="">Sin obra social (Particular)</option>
                                            {insuranceCompanies.map(ins => (
                                                <option key={ins.id} value={ins.id}>{ins.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Número de Afiliado</label>
                                        <input
                                            type="text"
                                            name="insuranceNumber"
                                            value={formData.insuranceNumber}
                                            onChange={handleInputChange}
                                            className="input"
                                            placeholder="OS-123456"
                                            disabled={!formData.insuranceCompanyId}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preferences */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Preferencias
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">Profesional de Cabecera</label>
                                        <select
                                            name="preferredProfessionalId"
                                            value={formData.preferredProfessionalId}
                                            onChange={handleInputChange}
                                            className="input"
                                        >
                                            <option value="">Sin preferencia</option>
                                            {professionals.map(prof => (
                                                <option key={prof.id} value={prof.id}>
                                                    {prof.fullName || `${prof.firstName} ${prof.lastName}`} - {prof.specialty?.name || 'Sin especialidad'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Notas Internas</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            className="input h-20"
                                            placeholder="Información relevante sobre el paciente..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                                    {saving ? 'Guardando...' : 'Guardar Paciente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsPage;
