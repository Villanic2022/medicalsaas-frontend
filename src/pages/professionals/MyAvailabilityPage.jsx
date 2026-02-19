import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import professionalsService from '../../api/professionalsService';
import Toast from '../../components/ui/Toast';

const DAYS_OF_WEEK = [
    { value: 'MONDAY', label: 'Lunes' },
    { value: 'TUESDAY', label: 'Martes' },
    { value: 'WEDNESDAY', label: 'Miércoles' },
    { value: 'THURSDAY', label: 'Jueves' },
    { value: 'FRIDAY', label: 'Viernes' },
    { value: 'SATURDAY', label: 'Sábado' },
    { value: 'SUNDAY', label: 'Domingo' },
];

const DAY_LABELS = {
    MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves', FRIDAY: 'Viernes', SATURDAY: 'Sábado', SUNDAY: 'Domingo'
};

const defaultForm = {
    type: 'weekly', // 'weekly' | 'specific'
    dayOfWeek: 'MONDAY',
    specificDate: '',
    startTime: '08:00',
    endTime: '13:00',
    slotDurationMinutes: 30,
};

const MyAvailabilityPage = () => {
    const { user } = useAuth();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [showAddForm, setShowAddForm] = useState(false);

    // The professional's own ID from auth context
    const professionalId = user?.professionalId || user?.id;

    useEffect(() => {
        if (professionalId) fetchRules();
    }, [professionalId]);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const data = await professionalsService.getAvailability(professionalId);
            setRules(data || []);
        } catch (err) {
            console.error('Error fetching availability:', err);
            setToast({ message: 'Error al cargar los horarios.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!professionalId) return;

        // Validation
        if (formData.startTime >= formData.endTime) {
            setToast({ message: 'La hora de inicio debe ser menor que la hora de fin.', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                dayOfWeek: formData.type === 'weekly' ? formData.dayOfWeek : null,
                specificDate: formData.type === 'specific' ? formData.specificDate : null,
                startTime: formData.startTime,
                endTime: formData.endTime,
                slotDurationMinutes: parseInt(formData.slotDurationMinutes),
            };
            await professionalsService.addAvailability(professionalId, payload);
            setToast({ message: '¡Horario agregado correctamente! ✅', type: 'success' });
            setFormData(defaultForm);
            setShowAddForm(false);
            fetchRules();
        } catch (err) {
            console.error('Error adding availability:', err);
            const msg = err.response?.data?.message || 'Error al guardar el horario.';
            setToast({ message: msg, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ruleId) => {
        if (!window.confirm('¿Estás seguro de eliminar este horario?')) return;
        try {
            await professionalsService.deleteAvailability(ruleId);
            setRules(prev => prev.filter(r => r.id !== ruleId));
            setToast({ message: 'Horario eliminado.', type: 'success' });
        } catch (err) {
            console.error('Error deleting availability:', err);
            setToast({ message: 'Error al eliminar el horario.', type: 'error' });
        }
    };

    // Group rules by day/type for display
    const weeklyRules = rules.filter(r => !r.specificDate);
    const specificRules = rules.filter(r => r.specificDate);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mi Disponibilidad</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestioná tus horarios de atención. Los turnos disponibles se calcularán automáticamente.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Horario
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-teal-200 animate-in fade-in duration-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Nuevo Horario
                    </h3>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Type */}
                        <div className="form-group">
                            <label className="form-label">Tipo de Horario</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="input">
                                <option value="weekly">Semanal (se repite)</option>
                                <option value="specific">Fecha Específica (excepcional)</option>
                            </select>
                        </div>

                        {/* Day / Date */}
                        {formData.type === 'weekly' ? (
                            <div className="form-group">
                                <label className="form-label">Día de la Semana</label>
                                <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} className="input">
                                    {DAYS_OF_WEEK.map(d => (
                                        <option key={d.value} value={d.value}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label className="form-label">Fecha</label>
                                <input type="date" name="specificDate" value={formData.specificDate} onChange={handleChange} className="input" required={formData.type === 'specific'} />
                            </div>
                        )}

                        {/* Duration */}
                        <div className="form-group">
                            <label className="form-label">Duración del Turno (min)</label>
                            <select name="slotDurationMinutes" value={formData.slotDurationMinutes} onChange={handleChange} className="input">
                                <option value={15}>15 minutos</option>
                                <option value={20}>20 minutos</option>
                                <option value={30}>30 minutos</option>
                                <option value={45}>45 minutos</option>
                                <option value={60}>60 minutos (1 hora)</option>
                            </select>
                        </div>

                        {/* Start Time */}
                        <div className="form-group">
                            <label className="form-label">Hora de Inicio</label>
                            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="input" required />
                        </div>

                        {/* End Time */}
                        <div className="form-group">
                            <label className="form-label">Hora de Fin</label>
                            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="input" required />
                        </div>

                        {/* Actions */}
                        <div className="form-group flex items-end gap-2">
                            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                                {saving ? 'Guardando...' : 'Guardar Horario'}
                            </button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Rules List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Cargando horarios...</div>
            ) : rules.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No tenés horarios configurados</h3>
                    <p className="text-gray-500 mb-6 text-sm">Agregá tus primeros horarios de atención para que los pacientes puedan reservar turnos.</p>
                    <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
                        + Agregar mi primer horario
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weekly Schedule */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
                            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <h3 className="text-base font-semibold text-teal-800">Horarios Semanales</h3>
                            <span className="ml-auto text-xs bg-teal-100 text-teal-700 font-medium px-2 py-0.5 rounded-full">{weeklyRules.length}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {weeklyRules.length === 0 ? (
                                <p className="text-center text-gray-400 py-6 text-sm">Sin horarios semanales</p>
                            ) : weeklyRules.map(rule => (
                                <div key={rule.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm">{DAY_LABELS[rule.dayOfWeek] || rule.dayOfWeek}</span>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            🕐 {rule.startTime} – {rule.endTime} &nbsp;|&nbsp; ⏱ {rule.slotDurationMinutes} min/turno
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="ml-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Eliminar horario"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Specific Dates */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-base font-semibold text-blue-800">Fechas Específicas</h3>
                            <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">{specificRules.length}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {specificRules.length === 0 ? (
                                <p className="text-center text-gray-400 py-6 text-sm">Sin fechas especiales</p>
                            ) : specificRules.map(rule => (
                                <div key={rule.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm">📅 {rule.specificDate}</span>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            🕐 {rule.startTime} – {rule.endTime} &nbsp;|&nbsp; ⏱ {rule.slotDurationMinutes} min/turno
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="ml-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Eliminar fecha"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Info Box */}
            {rules.length > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-teal-800">
                        <p className="font-semibold mb-1">¿Cómo funciona?</p>
                        <ul className="list-disc list-inside space-y-1 text-teal-700">
                            <li><strong>Semanal</strong>: Se aplica todos los {weeklyRules.length > 0 ? weeklyRules.map(r => DAY_LABELS[r.dayOfWeek]).join(', ') : '...'} indefinidamente.</li>
                            <li><strong>Fecha Específica</strong>: Sobreescribe el horario semanal para ese día puntual (ideal para guardias, jornadas especiales o excepciones).</li>
                        </ul>
                    </div>
                </div>
            )}

            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
};

export default MyAvailabilityPage;
