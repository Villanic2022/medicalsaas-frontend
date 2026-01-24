import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import appointmentsService from '../../api/appointmentsService';
import professionalsService from '../../api/professionalsService'; // We need this for the dropdown
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AppointmentsPage = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        professionalId: '',
        date: '',
        time: '',
        notes: '',
        patient: {
            firstName: '',
            lastName: '',
            dni: '',
            email: '',
            phone: '',
            insuranceName: '',
            insuranceNumber: ''
        }
    });

    // Filters
    const [dateFilter, setDateFilter] = useState('');
    const [profFilter, setProfFilter] = useState('');
    const [whatsappFilter, setWhatsappFilter] = useState('PENDING'); // 'ALL', 'PENDING', 'SENT'

    // Available Slots State
    const [selectedProfAvailability, setSelectedProfAvailability] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Smart Greeting Logic
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 13) return 'Buenos días';
        if (hour >= 13 && hour < 20) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const generateWhatsAppLink = (appt) => {
        const phone = appt.patient?.phone?.replace(/\D/g, '');
        if (!phone) return null;

        const greeting = getGreeting();
        const dateStr = format(new Date(appt.startDateTime), "dd/MM/yyyy", { locale: es });
        const timeStr = format(new Date(appt.startDateTime), "HH:mm", { locale: es });

        const message = `${greeting} ${appt.patient.firstName}! 🌟\nTe recordamos tu turno para el día 📅 *${dateStr}* a las 🕒 *${timeStr} hs* con el profesional 👨‍⚕️ *${appt.professional?.fullName}*.\n\n📍 Lugar: ${user?.tenantName || 'El consultorio'}.\n\nPor favor, confirmá tu asistencia. ¡Te esperamos!`;

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    const handleWhatsAppClick = async (appt) => {
        const link = generateWhatsAppLink(appt);
        if (link) {
            window.open(link, '_blank');

            // Pacman effect: Optimistic local update
            setAppointments(prev => prev.map(a =>
                a.id === appt.id ? { ...a, whatsappSent: true } : a
            ));

            try {
                // Prepare backend: Call the service (it might fail if backend not ready yet)
                await appointmentsService.markAsNotified(appt.id);
            } catch (err) {
                console.warn('Backend markAsNotified not yet implemented, but local state updated.');
            }
        }
    };

    const filteredAppointments = appointments.filter(appt => {
        const matchesProf = profFilter ? appt.professional?.id == profFilter : true;
        const matchesDate = dateFilter ? appt.startDateTime?.startsWith(dateFilter) : true;

        // WhatsApp Filter
        const isSent = appt.whatsappSent || false;
        if (whatsappFilter === 'PENDING') return matchesProf && matchesDate && !isSent;
        if (whatsappFilter === 'SENT') return matchesProf && matchesDate && isSent;

        return matchesProf && matchesDate;
    });

    // Sort to move SENT to the bottom if showing ALL
    const sortedAppointments = [...filteredAppointments].sort((a, b) => {
        if (whatsappFilter === 'ALL') {
            return (a.whatsappSent === b.whatsappSent) ? 0 : a.whatsappSent ? 1 : -1;
        }
        return 0;
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate available slots when professional and date filters change
    useEffect(() => {
        const calculateAvailableSlots = async () => {
            // Reset if either filter is missing
            if (!profFilter || !dateFilter) {
                setAvailableSlots([]);
                setSelectedProfAvailability([]);
                return;
            }

            setLoadingSlots(true);
            try {
                // Fetch availability for selected professional
                const availability = await professionalsService.getAvailability(profFilter);
                setSelectedProfAvailability(availability || []);

                if (!availability || availability.length === 0) {
                    setAvailableSlots([]);
                    setLoadingSlots(false);
                    return;
                }

                // Determine day of week for selected date
                // Parse date manually to avoid timezone issues
                const [year, month, day] = dateFilter.split('-').map(Number);
                const selectedDateObj = new Date(year, month - 1, day);
                const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                const dayOfWeek = days[selectedDateObj.getDay()];

                // Find matching availability block (specific date takes priority over weekly)
                let matchingBlock = availability.find(block => block.specificDate === dateFilter);
                if (!matchingBlock) {
                    matchingBlock = availability.find(block => block.dayOfWeek === dayOfWeek && !block.specificDate);
                }

                if (!matchingBlock) {
                    setAvailableSlots([]);
                    setLoadingSlots(false);
                    return;
                }

                // Generate all possible slots for this block
                const allSlots = [];
                const [startHour, startMin] = matchingBlock.startTime.split(':').map(Number);
                const [endHour, endMin] = matchingBlock.endTime.split(':').map(Number);
                const slotDuration = matchingBlock.slotDurationMinutes;

                let currentTime = startHour * 60 + startMin; // Convert to minutes
                const endTime = endHour * 60 + endMin;

                while (currentTime + slotDuration <= endTime) {
                    const hours = Math.floor(currentTime / 60);
                    const minutes = currentTime % 60;
                    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    allSlots.push(timeString);
                    currentTime += slotDuration;
                }

                // Create map of booked appointments
                const bookedAppointments = appointments
                    .filter(appt =>
                        appt.professional?.id == profFilter &&
                        appt.startDateTime?.startsWith(dateFilter) &&
                        appt.status !== 'CANCELLED'
                    );

                const bookedTimesMap = new Map();
                bookedAppointments.forEach(appt => {
                    const dateTime = new Date(appt.startDateTime);
                    const timeString = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
                    bookedTimesMap.set(timeString, appt);
                });

                const slotsWithStatus = allSlots.map(slot => {
                    const appointment = bookedTimesMap.get(slot);
                    return {
                        time: slot,
                        isAvailable: !appointment,
                        appointment: appointment || null
                    };
                });
                setAvailableSlots(slotsWithStatus);
            } catch (err) {
                console.error('Error calculating available slots:', err);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        calculateAvailableSlots();
    }, [profFilter, dateFilter, appointments]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedAppointments, fetchedProfessionals] = await Promise.all([
                appointmentsService.getAll(),
                professionalsService.getAll()
            ]);
            setAppointments(fetchedAppointments);
            setProfessionals(fetchedProfessionals);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Error al cargar los turnos.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!window.confirm(`¿Estás seguro de cambiar el estado a ${newStatus}?`)) return;

        try {
            await appointmentsService.updateStatus(id, newStatus);
            fetchData(); // Reload list
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error al actualizar el estado.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de cancelar este turno definitivamente?')) return;

        try {
            await appointmentsService.cancel(id);
            fetchData();
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            alert('Error al cancelar el turno.');
        }
    };

    // Form Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
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
        setCreateLoading(true);
        try {
            // Combine date and time to ISO LocalDateTime
            const startDateTime = `${formData.date}T${formData.time}:00`;

            const payload = {
                professionalId: formData.professionalId,
                startDateTime: startDateTime,
                notes: formData.notes,
                patient: formData.patient
            };

            // Get tenantSlug securely
            let currentTenantSlug = user?.tenantSlug || localStorage.getItem('tenant_slug');
            if (!currentTenantSlug) {
                alert('Error: No se identificó el consultorio. Recarga la página.');
                return;
            }

            await appointmentsService.create(currentTenantSlug, payload);
            setIsCreateModalOpen(false);
            fetchData();
            // Reset form
            setFormData({
                professionalId: '',
                date: '',
                time: '',
                notes: '',
                patient: { firstName: '', lastName: '', dni: '', email: '', phone: '', insuranceName: '', insuranceNumber: '' }
            });
        } catch (err) {
            console.error('Error creating appointment:', err);
            alert('Error al crear el turno. Verifica los datos.');
        } finally {
            setCreateLoading(false);
        }
    };

    // Handler to quickly create appointment from available slot
    const handleQuickBook = (timeSlot) => {
        const selectedProf = professionals.find(p => p.id == profFilter);
        setFormData({
            professionalId: profFilter,
            date: dateFilter,
            time: timeSlot,
            notes: '',
            patient: { firstName: '', lastName: '', dni: '', email: '', phone: '', insuranceName: '', insuranceNumber: '' }
        });
        setIsCreateModalOpen(true);
    };

    const getStatusBadge = (status) => {
        const styles = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            CONFIRMED: 'bg-green-100 text-green-800',
            CANCELLED: 'bg-red-100 text-red-800',
            COMPLETED: 'bg-blue-100 text-blue-800'
        };
        const labels = {
            PENDING: 'Pendiente',
            CONFIRMED: 'Confirmado',
            CANCELLED: 'Cancelado',
            COMPLETED: 'Completado'
        };
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Turnos</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary"
                >
                    + Nuevo Turno
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Filtrar por Fecha</label>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="input text-sm py-1.5 w-full sm:w-48"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Filtrar por Profesional</label>
                    <select
                        value={profFilter}
                        onChange={(e) => setProfFilter(e.target.value)}
                        className="input text-sm py-1.5 w-full sm:w-64"
                    >
                        <option value="">Todos los profesionales</option>
                        {professionals.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.firstName} {p.lastName} {p.specialty ? `(${p.specialty.name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-auto">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Recordatorios WA</label>
                    <select
                        value={whatsappFilter}
                        onChange={(e) => setWhatsappFilter(e.target.value)}
                        className="input text-sm py-1.5 w-full sm:w-40"
                    >
                        <option value="PENDING">Pendientes hoy 🍒</option>
                        <option value="SENT">Ya enviados ✅</option>
                        <option value="ALL">Ver todos</option>
                    </select>
                </div>
                {(dateFilter || profFilter || whatsappFilter !== 'PENDING') && (
                    <button
                        onClick={() => { setDateFilter(''); setProfFilter(''); setWhatsappFilter('PENDING'); }}
                        className="btn btn-secondary text-sm py-1.5 h-[34px]"
                    >
                        Limpiar Filtros
                    </button>
                )}
            </div>

            {/* Available Slots Panel */}
            {profFilter && dateFilter && (
                <div className="bg-gradient-to-br from-teal-50 to-white p-6 rounded-lg shadow-sm border-2 border-teal-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Turnos Disponibles
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {professionals.find(p => p.id == profFilter)?.fullName} - {(() => {
                                    const [year, month, day] = dateFilter.split('-').map(Number);
                                    const dateObj = new Date(year, month - 1, day);
                                    return format(dateObj, 'dd/MM/yyyy', { locale: es });
                                })()}
                            </p>
                        </div>
                        {loadingSlots && <div className="text-sm text-teal-600">Calculando...</div>}
                    </div>

                    {!loadingSlots && availableSlots.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium">No hay turnos disponibles</p>
                            <p className="text-sm mt-1">El profesional no tiene horarios configurados para este día o todos los turnos están ocupados.</p>
                        </div>
                    )}

                    {!loadingSlots && availableSlots.length > 0 && (
                        <div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {availableSlots.map((slot, idx) => (
                                    slot.isAvailable ? (
                                        <button
                                            key={idx}
                                            onClick={() => handleQuickBook(slot.time)}
                                            className="px-3 py-2 bg-white border-2 border-teal-300 text-teal-700 rounded-lg hover:bg-teal-500 hover:text-white hover:border-teal-500 transition-all font-medium text-sm shadow-sm hover:shadow-md"
                                            title={`Crear turno a las ${slot.time}`}
                                        >
                                            ✓ {slot.time}
                                        </button>
                                    ) : (
                                        <button
                                            key={idx}
                                            disabled
                                            className="px-3 py-2 bg-gray-100 border-2 border-gray-300 text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed opacity-60"
                                            title={`Ocupado - ${slot.appointment?.patient?.fullName || 'Paciente'}`}
                                        >
                                            ✗ {slot.time}
                                        </button>
                                    )
                                ))}
                            </div>
                            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                    <span className="text-teal-600 font-bold">✓</span> Disponible - Haz clic para agendar
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 font-bold">✗</span> Ocupado
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>}

            {/* List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">Cargando...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-bold text-teal-600">WhatsApp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesional</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No hay turnos que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                sortedAppointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-gray-50 transition-all duration-500">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${appt.whatsappSent ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}
                                                    title={appt.whatsappSent ? 'Recordatorio enviado' : 'Pendiente de envío'}
                                                ></div>
                                                {!appt.whatsappSent && (
                                                    <button
                                                        onClick={() => handleWhatsAppClick(appt)}
                                                        className="text-teal-600 hover:text-teal-800 p-1 rounded hover:bg-teal-50 transition-colors"
                                                        title="Enviar recordatorio WhatsApp"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {appt.whatsappSent && (
                                                    <span className="text-xs text-gray-400 font-medium">Enviado</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(appt.startDateTime), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{appt.patient?.fullName || 'Desconocido'}</div>
                                            <div className="text-sm text-gray-500">{appt.patient?.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {appt.professional?.fullName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(appt.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {appt.status === 'PENDING' && (
                                                <button onClick={() => handleStatusChange(appt.id, 'CONFIRMED')} className="text-green-600 hover:text-green-900">Confirmar</button>
                                            )}
                                            {appt.status === 'CONFIRMED' && (
                                                <button onClick={() => handleStatusChange(appt.id, 'COMPLETED')} className="text-blue-600 hover:text-blue-900">Completar</button>
                                            )}
                                            {appt.status !== 'CANCELLED' && (
                                                <button onClick={() => handleStatusChange(appt.id, 'CANCELLED')} className="text-red-600 hover:text-red-900">Cancelar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4">
                            <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setIsCreateModalOpen(false)}></div>
                            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg w-full z-50 p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Nuevo Turno</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Profesional</label>
                                        <select
                                            name="professionalId"
                                            value={formData.professionalId}
                                            onChange={handleInputChange}
                                            className="mt-1 input block w-full"
                                            required
                                        >
                                            <option value="">Seleccione un profesional</option>
                                            {professionals.map(p => (
                                                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} - {p.specialty?.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fecha</label>
                                            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="mt-1 input block w-full" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Hora</label>
                                            <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="mt-1 input block w-full" required />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Datos del Paciente</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input placeholder="Nombre" name="patient.firstName" value={formData.patient.firstName} onChange={handleInputChange} className="input" required />
                                            <input placeholder="Apellido" name="patient.lastName" value={formData.patient.lastName} onChange={handleInputChange} className="input" required />
                                            <input placeholder="DNI" name="patient.dni" value={formData.patient.dni} onChange={handleInputChange} className="input" required />
                                            <input placeholder="Teléfono" name="patient.phone" value={formData.patient.phone} onChange={handleInputChange} className="input" required />
                                            <input placeholder="Email" type="email" name="patient.email" value={formData.patient.email} onChange={handleInputChange} className="input col-span-2" required />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Notas</label>
                                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="mt-1 input block w-full" rows="2"></textarea>
                                    </div>

                                    <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
                                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">
                                            Cancelar
                                        </button>
                                        <button type="submit" disabled={createLoading} className="btn btn-primary">
                                            {createLoading ? 'Guardando...' : 'Crear Turno'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AppointmentsPage;
