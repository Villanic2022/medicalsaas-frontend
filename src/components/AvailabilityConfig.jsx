import { useState, useEffect } from 'react';

// Helper component defined before usage to avoid any hoisting checks/issues
const BlockItem = ({ block, slotOptions, onRemove, onChange }) => {
    const [confirmed, setConfirmed] = useState(false);

    const handleConfirm = () => {
        setConfirmed(true);
        setTimeout(() => setConfirmed(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2 p-2 bg-gray-50 rounded border border-gray-200">
            <div className="form-group">
                <label className="form-label text-xs">Inicio</label>
                <input
                    type="time"
                    value={block.startTime}
                    onChange={(e) => onChange(block.index, 'startTime', e.target.value)}
                    className="input text-sm"
                />
            </div>
            <div className="form-group">
                <label className="form-label text-xs">Fin</label>
                <input
                    type="time"
                    value={block.endTime}
                    onChange={(e) => onChange(block.index, 'endTime', e.target.value)}
                    className="input text-sm"
                />
            </div>
            <div className="form-group">
                <label className="form-label text-xs">Duración</label>
                <select
                    value={block.slotDurationMinutes}
                    onChange={(e) => onChange(block.index, 'slotDurationMinutes', parseInt(e.target.value))}
                    className="input text-sm"
                >
                    {slotOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col justify-end gap-1">
                <button
                    type="button"
                    onClick={handleConfirm}
                    className={`btn text-[10px] w-full py-1 leading-none h-7 transition-all duration-300 ${confirmed ? 'bg-green-500 text-white hover:bg-green-600 border-none' : 'btn-primary'}`}
                >
                    {confirmed ? '¡Listo! ✅' : 'Guardar'}
                </button>
                <button type="button" onClick={onRemove} className="btn btn-secondary text-[10px] w-full py-1 leading-none h-7">
                    Quitar
                </button>
            </div>
        </div>
    );
};

/**
 * Component for configuring professional availability
 * Allows selecting days of week, time ranges, and slot duration
 * Supports multiple time blocks per day (e.g., morning and afternoon)
 */
const AvailabilityConfig = ({ availability = [], onChange }) => {
    const daysOfWeek = [
        { value: 'MONDAY', label: 'Lunes' },
        { value: 'TUESDAY', label: 'Martes' },
        { value: 'WEDNESDAY', label: 'Miércoles' },
        { value: 'THURSDAY', label: 'Jueves' },
        { value: 'FRIDAY', label: 'Viernes' },
        { value: 'SATURDAY', label: 'Sábado' },
        { value: 'SUNDAY', label: 'Domingo' }
    ];

    const slotOptions = [
        { value: 15, label: '15 minutos' },
        { value: 30, label: '30 minutos' },
        { value: 45, label: '45 minutos' },
        { value: 60, label: '60 minutos' }
    ];

    const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' | 'dates'
    const [selectedDate, setSelectedDate] = useState('');
    const [config, setConfig] = useState([]);

    useEffect(() => {
        try {
            // Convert backend format (HH:mm:ss) to input format (HH:mm)
            const normalizedConfig = (availability || []).map(item => {
                const dateVal = item.specificDate || item.date || null;

                // If backend returns null dayOfWeek for specific dates, we calculate it for UI display
                let displayDay = item.dayOfWeek;
                if (!displayDay && dateVal) {
                    const d = new Date(dateVal); // 2024-02-12
                    // Note: Date parsing from string 'yyyy-mm-dd' is usually UTC. 
                    // To be safe and display correctly in UI regardless of timezone shifts for just finding the day name:
                    // We can validly rely on the date string parts.
                    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
                    // getUTCDay() is safer for YYYY-MM-DD strings
                    displayDay = days[d.getUTCDay()];
                }

                return {
                    ...item,
                    startTime: item.startTime?.substring(0, 5) || '08:00',
                    endTime: item.endTime?.substring(0, 5) || '18:00',
                    // Ensure date is handled from backend's 'specificDate' or fallback
                    date: dateVal,
                    dayOfWeek: displayDay
                };
            });
            setConfig(normalizedConfig);
        } catch (error) {
            console.error("Error normalizing availability config:", error);
            setConfig([]);
        }
    }, [availability]);

    const notifyChange = (newConfig) => {
        // Convert input format (HH:mm) to backend format (HH:mm:ss)
        const backendConfig = newConfig.map(item => ({
            // Backend now supports NULL dayOfWeek. We MUST send null for specific dates
            // to ensure it is treated as an exception and not a weekly rule.
            dayOfWeek: item.date ? null : item.dayOfWeek,
            specificDate: item.date, // Map internal 'date' to backend 'specificDate'
            startTime: `${item.startTime}:00`,
            endTime: `${item.endTime}:00`,
            slotDurationMinutes: item.slotDurationMinutes,
            active: true
        }));
        onChange(backendConfig);
    };

    // --- Weekly Logic ---
    const addTimeBlock = (dayValue) => {
        const newConfig = [
            ...config,
            {
                dayOfWeek: dayValue,
                date: null,
                startTime: '08:00',
                endTime: '18:00',
                slotDurationMinutes: 30
            }
        ];
        setConfig(newConfig);
        notifyChange(newConfig);
    };

    // --- Specific Date Logic ---
    const addDateBlock = () => {
        if (!selectedDate) return;

        try {
            // Determine day of week from date
            const dateObj = new Date(selectedDate);
            // date-fns or native: 0=Sunday, 1=Monday...
            // Backend expects: MONDAY, TUESDAY...
            const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
            const dayOfWeek = days[dateObj.getUTCDay()];

            const newConfig = [
                ...config,
                {
                    dayOfWeek: dayOfWeek, // Still send dayOfWeek even for dates, good practice
                    date: selectedDate,
                    startTime: '08:00',
                    endTime: '18:00',
                    slotDurationMinutes: 30
                }
            ];
            setConfig(newConfig);
            notifyChange(newConfig);
            setSelectedDate(''); // Reset picker
        } catch (e) {
            console.error("Error adding date block", e);
        }
    };

    const removeTimeBlock = (index) => {
        const newConfig = config.filter((_, i) => i !== index);
        setConfig(newConfig);
        notifyChange(newConfig);
    };

    const handleTimeChange = (index, field, value) => {
        const newConfig = config.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setConfig(newConfig);
        notifyChange(newConfig);
    };

    const getWeeklyBlocks = (dayValue) => {
        return config
            .map((item, index) => ({ ...item, index }))
            .filter(item => !item.date && item.dayOfWeek === dayValue);
    };

    const getDateBlocks = () => {
        return config
            .map((item, index) => ({ ...item, index }))
            .filter(item => item.date)
            .sort((a, b) => {
                try {
                    return new Date(a.date) - new Date(b.date);
                } catch (e) {
                    return 0;
                }
            });
    };

    const isDayUsed = (dayValue) => {
        return config.some(item => !item.date && item.dayOfWeek === dayValue);
    };

    const formatDate = (dateString) => {
        try {
            if (!dateString) return 'Fecha inválida';
            // Create date using split to avoid timezone issues with UTC
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
                <button
                    type="button"
                    className={`px-4 py-2 font-medium text-sm focus:outline-none ${activeTab === 'weekly' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('weekly')}
                >
                    Horario Semanal
                </button>
                <button
                    type="button"
                    className={`px-4 py-2 font-medium text-sm focus:outline-none ${activeTab === 'dates' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('dates')}
                >
                    Fechas Específicas (Excepciones)
                </button>
            </div>

            {activeTab === 'weekly' ? (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-3">
                        Configura el horario habitual. Se repetirá todas las semanas.
                    </p>
                    {daysOfWeek.map(day => {
                        const blocks = getWeeklyBlocks(day.value);
                        // ... render blocks (reuse existing logic but use 'blocks' var) ...
                        return (
                            <div key={day.value} className="bg-white p-3 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">{day.label}</span>
                                    <button
                                        type="button"
                                        onClick={() => addTimeBlock(day.value)}
                                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Agregar bloque
                                    </button>
                                </div>
                                {blocks.length === 0 && (
                                    <div className="text-center py-2 text-gray-400 text-sm">Sin horarios</div>
                                )}
                                {blocks.map(block => (
                                    <BlockItem
                                        key={block.index}
                                        block={block}
                                        slotOptions={slotOptions}
                                        onRemove={() => removeTimeBlock(block.index)}
                                        onChange={handleTimeChange}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-3">
                        Agrega horarios para fechas específicas. Estos horarios <strong>reemplazan</strong> al horario semanal para ese día.
                    </p>

                    <div className="flex gap-2 mb-4 bg-white p-3 rounded-lg border border-gray-200 items-end">
                        <div className="form-group flex-1">
                            <label className="form-label text-xs">Seleccionar Fecha</label>
                            <input
                                type="date"
                                className="input text-sm"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addDateBlock}
                            disabled={!selectedDate}
                            className="btn btn-primary text-sm mb-[2px]"
                        >
                            Guardar Fecha
                        </button>
                    </div>

                    <div className="space-y-3">
                        {getDateBlocks().length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-white rounded border border-gray-200 border-dashed">
                                No hay fechas específicas configuradas.
                            </div>
                        ) : (
                            getDateBlocks().map(block => (
                                <div key={block.index} className="bg-white p-3 rounded-lg border border-teal-200 border-l-4 border-l-teal-500">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-800">
                                            {formatDate(block.date)} <span className="text-xs font-normal text-gray-500">({block.dayOfWeek})</span>
                                        </span>
                                        <button onClick={() => removeTimeBlock(block.index)} className="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                                    </div>
                                    <BlockItem
                                        block={block}
                                        slotOptions={slotOptions}
                                        onRemove={() => removeTimeBlock(block.index)}
                                        onChange={handleTimeChange}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityConfig;
