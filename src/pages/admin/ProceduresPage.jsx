import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import proceduresService from '../../api/proceduresService';
import professionalsService from '../../api/professionalsService';
import specialtiesService from '../../api/specialtiesService';
import { DENTISTRY_TEMPLATES } from '../../data/proceduresData';
import Toast from '../../components/ui/Toast';

const ProceduresPage = () => {
    const { user } = useAuth();
    const [procedures, setProcedures] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProcedure, setEditingProcedure] = useState(null);
    const [professionals, setProfessionals] = useState([]);
    const [error, setError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        durationMinutes: 30,
        specialtyId: ''
    });

    // Filtering
    const [specialtyFilter, setSpecialtyFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching procedures, specialties and professionals...');
            const [respProcedures, respSpecialties, respProfessionals] = await Promise.all([
                proceduresService.getAll().catch(err => {
                    console.error('Procedures fetch failed:', err);
                    return { error: err.userMessage || err.message, status: err.response?.status };
                }),
                specialtiesService.getAll().catch(() => []),
                professionalsService.getAll().catch(() => [])
            ]);

            // DEBUG: Ver qué devuelve el backend
            console.log('Raw procedures response:', respProcedures);
            console.log('Type:', typeof respProcedures, Array.isArray(respProcedures));

            // Manejo defensivo de la respuesta de procedimientos
            let proceduresList = [];
            if (Array.isArray(respProcedures)) {
                proceduresList = respProcedures;
            } else if (respProcedures?.data && Array.isArray(respProcedures.data)) {
                proceduresList = respProcedures.data;
            } else if (respProcedures?.content && Array.isArray(respProcedures.content)) {
                proceduresList = respProcedures.content;
            } else if (respProcedures?.error) {
                setError(`Error de API: ${respProcedures.error}`);
            } else {
                console.warn('Formato de respuesta no reconocido:', respProcedures);
            }

            console.log('Parsed procedures list:', proceduresList);
            setProcedures(proceduresList);
            setSpecialties(Array.isArray(respSpecialties) ? respSpecialties : (respSpecialties?.data || []));
            setProfessionals(Array.isArray(respProfessionals) ? respProfessionals : (respProfessionals?.data || []));

        } catch (err) {
            console.error('Unexpected error in fetchData:', err);
            setError('Error crítico al cargar los datos.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (editingProcedure) {
            setEditingProcedure(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingProcedure) {
                await proceduresService.update(editingProcedure.id, editingProcedure);
                setToast({ message: 'Procedimiento actualizado. ✅', type: 'success' });
                setEditingProcedure(null);
            } else {
                await proceduresService.create(formData);
                setToast({ message: 'Procedimiento guardado correctamente. ✅', type: 'success' });
                setShowAddForm(false);
                setFormData({ name: '', durationMinutes: 30, specialtyId: '' });
            }
            fetchData();
        } catch (err) {
            console.error('Error saving procedure:', err);
            setToast({ message: 'Error al guardar. Cuidado: puede que el nombre ya exista.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este procedimiento del catálogo?')) return;
        try {
            await proceduresService.remove(id);
            setProcedures(prev => prev.filter(p => p.id !== id));
            setToast({ message: 'Procedimiento eliminado.', type: 'success' });
        } catch (err) {
            setToast({ message: 'No se pudo eliminar el procedimiento.', type: 'error' });
        }
    };

    const handleLoadDefaults = async () => {
        if (!window.confirm('Esto cargará una lista de procedimientos estándar para Odontología. ¿Continuar?')) return;

        setSaving(true);
        try {
            // DEBUG: Ver qué especialidades hay disponibles
            console.log('Especialidades disponibles:', specialties.map(s => ({ id: s.id, name: s.name })));
            
            // Intentar encontrar la especialidad "Odontología" o similar para linkearlos
            const dentistrySpec = specialties.find(s => {
                const name = s.name.toLowerCase();
                return name.includes('odont') || 
                       name.includes('dental') || 
                       name.includes('dent') ||
                       name.includes('bucal') ||
                       name.includes('estomatol');
            });

            console.log('Especialidad encontrada:', dentistrySpec);

            if (!dentistrySpec) {
                const specNames = specialties.map(s => s.name).join(', ') || 'ninguna';
                const proceed = window.confirm(`No se encontró una especialidad de Odontología.\n\nEspecialidades disponibles: ${specNames}\n\n¿Deseás cargar los procedimientos como "Globales"?`);
                if (!proceed) {
                    setSaving(false);
                    return;
                }
            }

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            for (const template of DENTISTRY_TEMPLATES) {
                const payload = {
                    ...template,
                    specialtyId: dentistrySpec ? dentistrySpec.id : null
                };
                try {
                    await proceduresService.create(payload);
                    successCount++;
                } catch (e) {
                    errorCount++;
                    const errorMsg = e.response?.data?.message || e.message || 'Error desconocido';
                    errors.push(`${template.name}: ${errorMsg}`);
                    console.warn('Error creating procedure:', template.name, e);
                }
            }

            // Mostrar resultado según lo que pasó
            if (successCount > 0 && errorCount === 0) {
                setToast({ message: `Plantilla de Odontología cargada con éxito! 🦷 (${successCount} procedimientos)`, type: 'success' });
            } else if (successCount > 0 && errorCount > 0) {
                setToast({ message: `Se cargaron ${successCount} procedimientos. ${errorCount} ya existían o fallaron.`, type: 'warning' });
            } else if (successCount === 0 && errorCount > 0) {
                console.error('Todos los procedimientos fallaron:', errors);
                setToast({ message: `No se pudo cargar ningún procedimiento. Revisa la consola para más detalles.`, type: 'error' });
            }

            await fetchData();
        } catch (err) {
            console.error('Error cargando plantillas:', err);
            setToast({ message: 'Error cargando plantillas: ' + (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Procedimientos filtrados
    const filteredProcedures = procedures.filter(proc => {
        if (!specialtyFilter) return true;
        if (specialtyFilter === 'global') return !proc.specialtyId && !proc.specialty;
        const filterId = String(specialtyFilter);
        return String(proc.specialtyId) === filterId || String(proc.specialty?.id) === filterId;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Catálogo de Procedimientos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestioná los servicios y tiempos de atención del consultorio.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleLoadDefaults}
                        className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                        title="Cargar procedimientos comunes de odontología"
                    >
                        🦷 Cargar Plantilla Dental
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="btn btn-primary"
                    >
                        {showAddForm ? 'Cancelar' : '+ Nuevo Procedimiento'}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-primary-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Agregar al Catálogo</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="form-group">
                            <label className="form-label">Nombre del Procedimiento</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Ej: Extracción, Limpieza..."
                                className="input"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Duración (minutos)</label>
                            <select
                                name="durationMinutes"
                                value={formData.durationMinutes}
                                onChange={handleInputChange}
                                className="input"
                            >
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>1 hora (60 min)</option>
                                <option value={90}>1.5 horas (90 min)</option>
                                <option value={120}>2 horas (120 min)</option>
                                <option value={180}>3 horas (180 min)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Especialidad (Opcional)</label>
                            <select
                                name="specialtyId"
                                value={formData.specialtyId}
                                onChange={handleInputChange}
                                className="input"
                            >
                                <option value="">Global (Todas)</option>
                                {specialties.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={saving} className="btn btn-primary h-[42px]">
                            {saving ? 'Guardando...' : 'Guardar Procedimiento'}
                        </button>
                    </form>
                </div>
            )}

            {editingProcedure && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar Procedimiento
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="form-group">
                                <label className="form-label">Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editingProcedure.name}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Duración</label>
                                <select
                                    name="durationMinutes"
                                    value={editingProcedure.durationMinutes}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>60 min</option>
                                    <option value={90}>90 min</option>
                                    <option value={120}>120 min</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Especialidad</label>
                                <select
                                    name="specialtyId"
                                    value={editingProcedure.specialtyId || ''}
                                    onChange={handleInputChange}
                                    className="input w-full"
                                >
                                    <option value="">Global</option>
                                    {specialties.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setEditingProcedure(null)} className="btn btn-secondary flex-1">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1 flex justify-between">
                            <p className="text-sm text-red-700 font-medium">
                                {error}
                            </p>
                            <button onClick={fetchData} className="text-sm text-red-700 underline font-bold hover:text-red-800">
                                Reintentar ↻
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Filtrar por especialidad:</span>
                        <select
                            value={specialtyFilter}
                            onChange={(e) => setSpecialtyFilter(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">Todas las especialidades</option>
                            <option value="global">Solo Global</option>
                            {specialties.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        {specialtyFilter && (
                            <button
                                onClick={() => setSpecialtyFilter('')}
                                className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                title="Limpiar filtro"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Limpiar
                            </button>
                        )}
                    </div>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600 font-bold">
                        {procedures.filter(p => {
                            if (!specialtyFilter) return true;
                            if (specialtyFilter === 'global') return !p.specialtyId && !p.specialty;
                            const filterId = String(specialtyFilter);
                            return String(p.specialtyId) === filterId || String(p.specialty?.id) === filterId;
                        }).length} items
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">Cargando catálogo...</div>
                ) : procedures.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">El catálogo está vacío</h3>
                        <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                            Comenzá cargando tus procedimientos habituales o usá la plantilla dental para empezar rápido.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración Sugerida</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {procedures
                                    .filter(proc => {
                                        if (!specialtyFilter) return true;
                                        if (specialtyFilter === 'global') return !proc.specialtyId && !proc.specialty;
                                        const filterId = String(specialtyFilter);
                                        return String(proc.specialtyId) === filterId || String(proc.specialty?.id) === filterId;
                                    })
                                    .map((proc) => {
                                    // Buscar el nombre de la especialidad por ID
                                    const specName = proc.specialty?.name || 
                                        specialties.find(s => s.id === proc.specialtyId)?.name || 
                                        'Global';
                                    return (
                                    <tr key={proc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{proc.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs text-gray-500">
                                                {specName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200">
                                                {proc.durationMinutes} minutos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingProcedure({ ...proc, specialtyId: proc.specialtyId || proc.specialty?.id || '' })}
                                                    className="text-primary-400 hover:text-primary-600 p-2 rounded-full hover:bg-primary-50 transition-all"
                                                    title="Editar procedimiento"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(proc.id)}
                                                    className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all"
                                                    title="Eliminar del catálogo"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ProceduresPage;
