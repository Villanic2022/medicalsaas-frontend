import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for consistency if needed, though mostly using state
import { useAuth } from '../../contexts/AuthContext';
import appointmentsService from '../../api/appointmentsService';
import professionalsService from '../../api/professionalsService';
import { format, addDays, startOfWeek, isSameDay, parseISO, startOfDay, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import Toast from '../../components/ui/Toast';

const AppointmentsPage = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null); // { message, type }

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    // Availability Modal State
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [selectedAvailabilityProfId, setSelectedAvailabilityProfId] = useState('');
    const [availabilityRules, setAvailabilityRules] = useState([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [availabilityViewDate, setAvailabilityViewDate] = useState(new Date()); // Controls the visible week

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

    // Available Slots State (Main View)
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // ... (keep getGreeting, generateWhatsAppLink, handleWhatsAppClick) ...
    // Note: I will need to replace the content of the file from line 46 down to where the modal was to ensure context is kept, 
    // but the instruction says "Replace the content of the Availability Modal". 
    // To be safe and since I can't see the middle lines in the previous view, I will try to target the Modal section specifically if possible, 
    // or use a larger range if I am replacing the whole file logic for imports.
    // Given the 'replace_file_content' limitations, I will stick to what I can see or just rewrite the modal part if I can target it.
    // However, I need to add imports at the top and state near the top.

    // I will rewrite the component start to include imports and state, then I will use a separate call or a large chunk for the modal if needed.
    // Wait, I can only do contiguous edits.
    // I will rewrite the top of the file to include imports and state.
    // Then I will rewrite the Modal section.

    // Actually, I'll assume the user wants the implementation.
    // I will use `replace_file_content` for the imports/top section first.


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

            // Si es PROFESIONAL, filtrar solo sus turnos
            if (user?.role === 'PROFESSIONAL') {
                const profId = user.professionalId || user.id;
                const filteredAppts = fetchedAppointments.filter(appt =>
                    appt.professional?.id === profId || appt.professionalId === profId
                );
                setAppointments(filteredAppts);
                setProfFilter(profId.toString());
            } else {
                setAppointments(fetchedAppointments);
            }

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
            setToast({ message: 'Error al actualizar el estado.', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de cancelar este turno definitivamente?')) return;

        try {
            await appointmentsService.cancel(id);
            fetchData();
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            setToast({ message: 'Error al cancelar el turno.', type: 'error' });
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
                professionalId: Number(formData.professionalId), // Ensure it is a number
                startDateTime: startDateTime,
                notes: formData.notes,
                patient: formData.patient
            };

            console.log('Creating appointment with payload:', payload);

            // Get tenantSlug securely
            let currentTenantSlug = user?.tenantSlug || localStorage.getItem('tenant_slug');
            if (!currentTenantSlug) {
                setToast({ message: 'Error: No se identificó el consultorio. Recarga la página.', type: 'error' });
                return;
            }

            console.log('Tenant Slug:', currentTenantSlug);

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
            setToast({ message: '¡Turno creado exitosamente! 🚀', type: 'success' });
        } catch (err) {
            console.error('Error creating appointment:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
            setToast({ message: `Error al crear el turno: ${errorMessage}`, type: 'error' });
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



    // Fetch availability when professional is selected in the new modal
    useEffect(() => {
        if (selectedAvailabilityProfId) {
            fetchAvailabilityRules(selectedAvailabilityProfId);
        } else {
            setAvailabilityRules([]);
        }
    }, [selectedAvailabilityProfId]);

    const fetchAvailabilityRules = async (profId) => {
        setLoadingAvailability(true);
        try {
            const rules = await professionalsService.getAvailability(profId);
            setAvailabilityRules(rules || []);
        } catch (err) {
            console.error('Error fetching availability:', err);
            setAvailabilityRules([]);
        } finally {
            setLoadingAvailability(false);
        }
    };

    // Helper to generate slots
    const generateTimeSlots = (start, end, duration = 30) => {
        const slots = [];
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        let currentTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        while (currentTime + duration <= endTime) {
            const hours = Math.floor(currentTime / 60);
            const minutes = currentTime % 60;
            const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            slots.push(timeString);
            currentTime += duration;
        }
        return slots;
    };

    const handleQuickSchedule = (profId, dateStr, time) => {
        setIsAvailabilityModalOpen(false);
        setFormData(prev => ({
            ...prev,
            professionalId: profId,
            date: dateStr,
            time: time || ''
        }));
        setIsCreateModalOpen(true);
    };

    // --- Calendar helpers ---
    const getCalendarDays = (baseDate) => {
        const start = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    };

    const isSlotOccupied = (dateStr, timeStr, profId) => {
        // Find if there is an appointment for this professional, date, and time
        // Note: appt.startDateTime is usually "YYYY-MM-DDTHH:mm:ss"
        // dateStr is "YYYY-MM-DD"
        // timeStr is "HH:mm"
        return appointments.some(appt => {
            if (appt.status === 'CANCELLED') return false;
            // Check professional
            if (appt.professional?.id != profId) return false; // loose equality for string/number

            // Check date/time overlap
            // Simplest: Check exact match of start time
            // Ideally should check duration overlap, but let's stick to start time for now
            const apptStart = appt.startDateTime; // ISO String
            const slotIso = `${dateStr}T${timeStr}`;

            return apptStart.startsWith(slotIso);
        });
    };

    const getRulesForDay = (date, rules) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // 1. Specific Date Rule?

        // 1. Specific Date Rules? - If any specific rule exists for this date, it overrides weekly rules completely? 
        // Or do we merge? Usually specific rules override weekly schedule for that specific day.
        // Let's assume OVERRIDE behavior for now (if I set a specific date, I want that to be THE schedule).
        const specificRules = rules.filter(r => r.specificDate === dateStr);
        if (specificRules.length > 0) return specificRules;

        // 2. Weekly Rules?
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dayKey = days[date.getDay()];

        return rules.filter(r => !r.specificDate && r.dayOfWeek === dayKey);
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Turnos</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            if (user?.role === 'PROFESSIONAL') {
                                setSelectedAvailabilityProfId((user.professionalId || user.id).toString());
                            }
                            setAvailabilityViewDate(new Date());
                            setIsAvailabilityModalOpen(true);
                        }}
                        className="btn bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200"
                    >
                        📅 Ver Disponibilidad
                    </button>
                    <button
                        onClick={() => {
                            if (user?.role === 'PROFESSIONAL') {
                                setFormData(prev => ({ ...prev, professionalId: (user.professionalId || user.id).toString() }));
                            }
                            setIsCreateModalOpen(true);
                        }}
                        className="btn btn-primary"
                    >
                        + Nuevo Turno
                    </button>
                </div>
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
                        disabled={user?.role === 'PROFESSIONAL'}
                    >
                        {user?.role !== 'PROFESSIONAL' && <option value="">Todos los profesionales</option>}
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

            {/* Available Slots Panel - MAIN SCREEN (kept as is) */}
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

            {/* Quick Availability Modal - REPLACED with Calendar View */}
            {isAvailabilityModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setIsAvailabilityModalOpen(false)}></div>
                        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full max-w-5xl z-50 p-6 max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <h3 className="text-lg font-bold text-gray-900">Agenda Semanal</h3>
                                <button onClick={() => setIsAvailabilityModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4 gap-4 flex-shrink-0">
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Profesional</label>
                                    <select
                                        className="input w-full mt-1"
                                        value={selectedAvailabilityProfId}
                                        onChange={(e) => setSelectedAvailabilityProfId(e.target.value)}
                                    >
                                        <option value="">Seleccione...</option>
                                        {professionals.map(p => (
                                            <option key={p.id} value={p.id}>{p.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setAvailabilityViewDate(prev => addDays(prev, -7))}
                                        className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                                        title="Semana Anterior"
                                    >
                                        ◀
                                    </button>
                                    <div className="text-center">
                                        <span className="block font-bold text-gray-800">
                                            {format(startOfWeek(availabilityViewDate, { weekStartsOn: 1 }), 'MMMM yyyy', { locale: es }).toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Semana del {format(startOfWeek(availabilityViewDate, { weekStartsOn: 1 }), 'dd')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setAvailabilityViewDate(prev => addDays(prev, 7))}
                                        className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                                        title="Semana Siguiente"
                                    >
                                        ▶
                                    </button>
                                </div>
                                <div className="w-full sm:w-1/3 text-right">
                                    <button
                                        onClick={() => setAvailabilityViewDate(new Date())}
                                        className="text-xs text-teal-600 font-medium hover:underline"
                                    >
                                        Ir a Hoy
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="flex-1 overflow-auto min-h-[300px]">
                                {!selectedAvailabilityProfId ? (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        Selecciona un profesional para ver su agenda.
                                    </div>
                                ) : loadingAvailability ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="loader text-teal-500">Cargando...</div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-2 min-w-[800px]">
                                        {getCalendarDays(availabilityViewDate).map((date, idx) => {
                                            const rules = getRulesForDay(date, availabilityRules);
                                            const dateStr = format(date, 'yyyy-MM-dd');
                                            const isToday = isSameDay(date, new Date());

                                            // Process all rules for the day
                                            let allSlots = [];
                                            rules.forEach(rule => {
                                                const ruleSlots = generateTimeSlots(rule.startTime, rule.endTime, rule.slotDurationMinutes || 30);
                                                allSlots = [...allSlots, ...ruleSlots];
                                            });

                                            // Sort slots
                                            allSlots.sort((a, b) => {
                                                const [hA, mA] = a.split(':').map(Number);
                                                const [hB, mB] = b.split(':').map(Number);
                                                return (hA * 60 + mA) - (hB * 60 + mB); // simple minutes comparison
                                            });
                                            // Remove duplicates if overlapping rules exist (optional but good practice)
                                            allSlots = [...new Set(allSlots)];

                                            return (
                                                <div key={idx} className={`border rounded-lg flex flex-col ${isToday ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white'}`}>
                                                    {/* Day Header */}
                                                    <div className={`p-2 text-center border-b ${isToday ? 'bg-teal-100 text-teal-800' : 'bg-gray-50 text-gray-700'}`}>
                                                        <div className="font-bold uppercase text-xs">
                                                            {format(date, 'EEE', { locale: es })}
                                                        </div>
                                                        <div className="text-lg font-bold">
                                                            {format(date, 'd')}
                                                        </div>
                                                    </div>

                                                    {/* Slots Content */}
                                                    <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[300px]">
                                                        {allSlots.length > 0 ? (
                                                            allSlots.map((time, tIdx) => {
                                                                const isBusy = isSlotOccupied(dateStr, time, selectedAvailabilityProfId);
                                                                return (
                                                                    <button
                                                                        key={tIdx}
                                                                        disabled={isBusy}
                                                                        onClick={() => handleQuickSchedule(selectedAvailabilityProfId, dateStr, time)}
                                                                        className={`w-full text-xs py-1 px-2 rounded border transition-all ${isBusy
                                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                                                                            : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-500 hover:text-white hover:border-teal-500 font-medium shadow-sm'
                                                                            }`}
                                                                    >
                                                                        {time}
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="text-center text-xs text-gray-400 italic py-4">
                                                                -
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}



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
                                        {user?.role === 'PROFESSIONAL' ? (
                                            <div className="mt-1 p-2 bg-gray-50 border rounded-md text-sm font-medium text-gray-700">
                                                {professionals.find(p => p.id == (user.professionalId || user.id))?.fullName || 'Registrando como vos'}
                                            </div>
                                        ) : (
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
                                        )}
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
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div >
    );
};

export default AppointmentsPage;
