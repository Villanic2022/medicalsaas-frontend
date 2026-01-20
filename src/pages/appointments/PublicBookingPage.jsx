import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, addDays, startOfToday, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import publicAppointmentsService from '../../api/publicAppointmentsService';
import { dateHasAvailability, getTimeSlotsForDate } from '../../utils/availabilityUtils';

const PublicBookingPage = () => {
    const { slug } = useParams();

    // Data States
    const [tenant, setTenant] = useState(null);
    const [professionals, setProfessionals] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Wizard State
    const [step, setStep] = useState(1);

    // Selection States
    const [selectedProfessional, setSelectedProfessional] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [patientData, setPatientData] = useState({
        dni: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        insuranceName: '',
        insuranceNumber: ''
    });

    // State for occupied time slots
    const [occupiedSlots, setOccupiedSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Confirmation Result
    const [confirmationResult, setConfirmationResult] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [tenantData, profsData] = await Promise.all([
                    publicAppointmentsService.getTenantInfo(slug),
                    publicAppointmentsService.getProfessionals(slug)
                ]);
                setTenant(tenantData);
                setProfessionals(profsData);
            } catch (err) {
                console.error('Error fetching public data:', err);
                setError('No pudimos cargar la información del consultorio. Verifique la dirección.');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchInitialData();
        }
    }, [slug]);

    // Efecto para refrescar slots ocupados cada 30 segundos cuando hay una fecha seleccionada
    useEffect(() => {
        let interval;
        
        if (selectedProfessional && selectedDate && slug && step === 2) {
            interval = setInterval(() => {
                loadOccupiedSlots(selectedDate);
            }, 30000); // Refrescar cada 30 segundos
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [selectedProfessional, selectedDate, slug, step]);

    // --- Dynamic Data Generation based on Availability ---
    // Generate next 30 days and filter by professional availability
    const availableSafeDates = selectedProfessional && availability.length > 0
        ? Array.from({ length: 30 }, (_, i) => addDays(startOfToday(), i + 1))
            .filter(date => dateHasAvailability(date, availability))
        : [];

    // Generate time slots based on selected date and availability
    const timeSlots = selectedDate && availability.length > 0
        ? getTimeSlotsForDate(selectedDate, availability)
        : [];

    // --- Handlers ---

    const handleProfessionalSelect = async (prof) => {
        setSelectedProfessional(prof);
        const previousDate = selectedDate; // Guardar fecha anterior
        setSelectedDate(null);
        setSelectedTime(null);
        setOccupiedSlots([]); // Limpiar slots ocupados
        setLoading(true);

        try {
            // Load availability for selected professional
            const availData = await publicAppointmentsService.getProfessionalAvailability(slug, prof.id);
            setAvailability(availData || []);

            if (!availData || availData.length === 0) {
                alert('Este profesional aún no tiene horarios configurados. Por favor contacte al consultorio.');
                setSelectedProfessional(null);
                return;
            }

            // Si había una fecha seleccionada antes, verificar si sigue siendo válida
            if (previousDate && dateHasAvailability(previousDate, availData)) {
                setSelectedDate(previousDate);
                await loadOccupiedSlots(previousDate);
            }

            setStep(2);
        } catch (err) {
            console.error('Error loading availability:', err);
            alert('No se pudo cargar la disponibilidad del profesional.');
            setSelectedProfessional(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = async (date) => {
        setSelectedDate(date);
        setSelectedTime(null);
        
        if (selectedProfessional && date && slug) {
            setLoadingSlots(true);
            await loadOccupiedSlots(date);
            setLoadingSlots(false);
        }
    };

    const loadOccupiedSlots = async (date) => {
        try {
            const dateString = format(date, 'yyyy-MM-dd');
            const appointments = await publicAppointmentsService.getAppointments(slug, selectedProfessional.id, dateString);
            
            if (Array.isArray(appointments) && appointments.length > 0) {
                const occupied = appointments
                    .filter(appt => appt.status === 'CONFIRMED' || appt.status === 'Confirmado')
                    .map(appt => {
                        const d = new Date(appt.startDateTime);
                        return format(d, 'HH:mm');
                    });
                setOccupiedSlots(occupied);
            } else {
                setOccupiedSlots([]);
            }
        } catch (error) {
            console.error('Error cargando slots:', error);
            setOccupiedSlots([]);
        }
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        setStep(3); // Auto advance to patient data
    };

    const handlePatientChange = (e) => {
        const { name, value } = e.target;
        setPatientData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Construct DateTime
        const [hours, minutes] = selectedTime.split(':');
        const startDateTime = setMinutes(setHours(selectedDate, parseInt(hours)), parseInt(minutes));

        const payload = {
            professionalId: selectedProfessional.id,
            startDateTime: startDateTime.toISOString(),
            notes: "Reserva web",
            patient: patientData
        };

        try {
            const result = await publicAppointmentsService.createAppointment(slug, payload);
            console.log('Confirmation Result:', result); // DEBUG: Ver respuesta del backend
            setConfirmationResult(result);
            setStep(4); // Success Step
        } catch (err) {
            console.error('Error creating appointment:', err);
            alert('Hubo un error al confirmar el turno. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // Loading Overlay Component
    const LoadingOverlay = () => (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50 fade-in">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800">Procesando tu reserva...</h3>
            <p className="text-gray-600">Por favor, no cierres esta ventana.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            {/* Show full screen loader ONLY during initial load, not submission */}
            {loading && !tenant && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando consultorio...</p>
                    </div>
                </div>
            )}

            <div className="max-w-3xl mx-auto relative">

                {/* Header Consultorio */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-900 mb-2">{tenant?.name}</h1>
                    <p className="text-gray-600">Reserva de Turnos Online</p>
                </div>

                {/* Card Principal */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative min-h-[400px]">
                    {loading && tenant && <LoadingOverlay />}

                    {/* Progress Bar */}
                    {step < 4 && (
                        <div className="bg-gray-100 h-2 w-full">
                            <div
                                className="bg-primary-500 h-2 transition-all duration-500"
                                style={{ width: `${((step - 1) / 3) * 100}%` }}
                            ></div>
                        </div>
                    )}

                    <div className="p-8">
                        {/* STEP 1: Selección de Profesional */}
                        {step === 1 && (
                            <div className="fade-in">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Seleccione un Profesional</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {professionals.map(prof => (
                                        <div
                                            key={prof.id}
                                            onClick={() => handleProfessionalSelect(prof)}
                                            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center">
                                                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                    {prof.firstName.charAt(0)}{prof.lastName.charAt(0)}
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <p className="font-semibold text-gray-900">{prof.fullName}</p>
                                                    <p className="text-sm text-gray-500">{prof.specialty?.name}</p>
                                                    
                                                    {/* Información de consulta y obras sociales */}
                                                    <div className="mt-2">
                                                        {prof.privateConsultationPrice && (
                                                            <div className="flex items-center mb-1">
                                                                <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-green-700">
                                                                    Consulta particular: ${prof.privateConsultationPrice?.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {prof.acceptedInsurances && prof.acceptedInsurances.length > 0 && (
                                                            <div className="flex items-center">
                                                                <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                                </svg>
                                                                <span className="text-sm text-blue-700">
                                                                    Acepta: {prof.acceptedInsurances.slice(0, 2).map(ins => ins.name).join(', ')}
                                                                    {prof.acceptedInsurances.length > 2 && ` +${prof.acceptedInsurances.length - 2} más`}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {professionals.length === 0 && (
                                    <p className="text-center text-gray-500">No hay profesionales disponibles en este momento.</p>
                                )}
                            </div>
                        )}

                        {/* STEP 2: Selección de Fecha y Hora */}
                        {step === 2 && (
                            <div className="fade-in">
                                <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center">
                                    ← Volver
                                </button>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Seleccione Fecha y Hora</h2>
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <p className="text-gray-600 mb-2">Turno con <span className="font-semibold">{selectedProfessional.fullName}</span> ({selectedProfessional.specialty?.name})</p>
                                    <div className="flex flex-col space-y-1 text-sm">
                                        {selectedProfessional.privateConsultationPrice && (
                                            <div className="flex items-center text-green-700">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                </svg>
                                                <span>Consulta particular: ${selectedProfessional.privateConsultationPrice?.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedProfessional.acceptedInsurances && selectedProfessional.acceptedInsurances.length > 0 && (
                                            <div className="flex items-center text-blue-700">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                                <span>Acepta: {selectedProfessional.acceptedInsurances.map(ins => ins.name).join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Fechas */}
                                    <div className="col-span-1 border-r border-gray-100 pr-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Días Disponibles</h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {availableSafeDates.length > 0 ? (
                                                availableSafeDates.map(date => (
                                                    <button
                                                        key={date.toString()}
                                                        onClick={() => handleDateSelect(date)}
                                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${selectedDate?.toString() === date.toString()
                                                            ? 'bg-primary-600 text-white'
                                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {format(date, "EEEE d 'de' MMMM", { locale: es })}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 text-sm italic">No hay fechas disponibles en los próximos 30 días</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Horarios */}
                                    <div className="col-span-1 md:col-span-2">
                                        {selectedDate ? (
                                            <div className="fade-in">
                                                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                                                    Horarios para el {format(selectedDate, "d 'de' MMMM", { locale: es })}
                                                </h3>
                                                {loadingSlots ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                                        <span className="ml-2 text-gray-500">Cargando horarios...</span>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                    {timeSlots.length > 0 ? (
                                                        timeSlots.map(time => {
                                                            const isOccupied = occupiedSlots.includes(time);
                                                            return (
                                                                <button
                                                                    key={time}
                                                                    onClick={() => {
                                                                        if (isOccupied) {
                                                                            alert('Este horario ya está ocupado');
                                                                            return;
                                                                        }
                                                                        handleTimeSelect(time);
                                                                    }}
                                                                    style={{
                                                                        backgroundColor: isOccupied ? '#f3f4f6' : '',
                                                                        borderColor: isOccupied ? '#d1d5db' : '',
                                                                        color: isOccupied ? '#9ca3af' : '',
                                                                        cursor: isOccupied ? 'not-allowed' : 'pointer'
                                                                    }}
                                                                    className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                                                                        isOccupied
                                                                            ? 'opacity-50'
                                                                            : selectedTime === time
                                                                            ? 'bg-primary-600 border-primary-600 text-white'
                                                                            : 'border-primary-200 text-primary-700 hover:bg-primary-50'
                                                                    }`}
                                                                >
                                                                    {time}
                                                                    {isOccupied && " ❌"}
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <p className="col-span-full text-gray-500 text-sm italic">No hay horarios disponibles para este día</p>
                                                    )}
                                                </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                                                Seleccione un día para ver los horarios
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Datos del Paciente */}
                        {step === 3 && (
                            <div className="fade-in">
                                <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center">
                                    ← Volver
                                </button>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Completar Datos</h2>

                                <div className="bg-primary-50 rounded-lg p-4 mb-6 text-sm">
                                    <div className="text-primary-800 font-medium mb-2">
                                        Resumiendo: Turno con <b>{selectedProfessional.fullName}</b> para el <b>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</b> a las <b>{selectedTime} hs</b>.
                                    </div>
                                    {selectedProfessional.privateConsultationPrice && (
                                        <div className="text-green-700 text-sm">
                                            • Consulta particular: ${selectedProfessional.privateConsultationPrice?.toLocaleString()}
                                        </div>
                                    )}
                                    {selectedProfessional.acceptedInsurances && selectedProfessional.acceptedInsurances.length > 0 && (
                                        <div className="text-blue-700 text-sm">
                                            • Acepta obras sociales: {selectedProfessional.acceptedInsurances.map(ins => ins.name).join(', ')}
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="form-label">DNI *</label>
                                        <input
                                            type="text"
                                            name="dni"
                                            value={patientData.dni}
                                            onChange={handlePatientChange}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={patientData.firstName}
                                            onChange={handlePatientChange}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={patientData.lastName}
                                            onChange={handlePatientChange}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={patientData.email}
                                            onChange={handlePatientChange}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Teléfono *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={patientData.phone}
                                            onChange={handlePatientChange}
                                            className="input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Obra Social (Opcional)</label>
                                        {selectedProfessional.acceptedInsurances && selectedProfessional.acceptedInsurances.length > 0 ? (
                                            <select
                                                name="insuranceName"
                                                value={patientData.insuranceName}
                                                onChange={handlePatientChange}
                                                className="input"
                                            >
                                                <option value="">Seleccionar obra social...</option>
                                                <option value="particular">Consulta Particular</option>
                                                {selectedProfessional.acceptedInsurances.map(insurance => (
                                                    <option key={insurance.id} value={insurance.name}>
                                                        {insurance.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                name="insuranceName"
                                                value={patientData.insuranceName}
                                                onChange={handlePatientChange}
                                                className="input"
                                                placeholder="Consulta particular"
                                            />
                                        )}
                                    </div>

                                    <div className="col-span-1 md:col-span-2 mt-6">
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-full btn-lg font-bold shadow-lg transform hover:-translate-y-0.5"
                                            disabled={loading}
                                        >
                                            {loading ? 'Procesando...' : 'CONFIRMAR RESERVA'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* STEP 4: Confirmación Exitosa */}
                        {step === 4 && confirmationResult && (
                            <div className="text-center py-8 fade-in">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Turno Confirmado!</h2>
                                <p className="text-gray-600 mb-8 text-lg">{confirmationResult?.confirmationMessage || 'Su turno ha sido reservado con éxito.'}</p>

                                <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                                    <p className="mb-2"><strong>Profesional:</strong> {confirmationResult?.professionalName || 'N/A'}</p>
                                    <p className="mb-2">
                                        <strong>Fecha:</strong> {confirmationResult?.appointmentDateTime
                                            ? format(new Date(confirmationResult.appointmentDateTime), "EEEE d 'de' MMMM, yyyy", { locale: es })
                                            : 'Fecha no disponible'}
                                    </p>
                                    <p>
                                        <strong>Hora:</strong> {confirmationResult?.appointmentDateTime
                                            ? format(new Date(confirmationResult.appointmentDateTime), 'HH:mm')
                                            : '--:--'} hs
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                                    {confirmationResult.googleCalendarUrl && (
                                        <a
                                            href={confirmationResult.googleCalendarUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
                                            </svg>
                                            Agregar a Google Calendar
                                        </a>
                                    )}

                                    {confirmationResult.whatsappUrl && (
                                        <a
                                            href={confirmationResult.whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn bg-green-500 text-white hover:bg-green-600 flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            Consultar por WhatsApp
                                        </a>
                                    )}
                                </div>

                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-8 text-primary-600 hover:text-primary-800 text-sm font-medium"
                                >
                                    Realizar otra reserva
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicBookingPage;
