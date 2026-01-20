import { format } from 'date-fns';

/**
 * Utility functions for generating time slots based on professional availability
 */

/**
 * Generates time slots based on availability configuration
 * @param {Object} availability - Availability object with startTime, endTime, slotDurationMinutes
 * @returns {Array<string>} Array of time slots in HH:mm format
 */
export const generateTimeSlots = (availability) => {
    const { startTime, endTime, slotDurationMinutes } = availability;

    // Parse start time (format: "HH:mm:ss" or "HH:mm")
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const slots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
        currentHour < endHour ||
        (currentHour === endHour && currentMinute < endMinute)
    ) {
        // Format time as HH:mm
        const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        slots.push(timeSlot);

        // Add slot duration
        currentMinute += slotDurationMinutes;

        // Handle minute overflow
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
        }
    }

    return slots;
};

/**
 * Maps day of week from backend enum to JavaScript day number
 * @param {string} dayOfWeek - Backend day enum (MONDAY, TUESDAY, etc.)
 * @returns {number} JavaScript day number (0 = Sunday, 1 = Monday, etc.)
 */
export const dayOfWeekToNumber = (dayOfWeek) => {
    const mapping = {
        'SUNDAY': 0,
        'MONDAY': 1,
        'TUESDAY': 2,
        'WEDNESDAY': 3,
        'THURSDAY': 4,
        'FRIDAY': 5,
        'SATURDAY': 6
    };
    return mapping[dayOfWeek];
};

/**
 * Checks if a date matches any of the configured availability days
 * @param {Date} date - Date to check
 * @param {Array<Object>} availabilityConfig - Array of availability configurations
 * @returns {boolean} True if the date has availability
 */
export const dateHasAvailability = (date, availabilityConfig) => {
    const rules = getAvailabilityForDate(date, availabilityConfig);
    return rules.length > 0;
};

/**
 * Gets all availability configurations for a specific date
 * @param {Date} date - Date to get availability for
 * @param {Array<Object>} availabilityConfig - Array of availability configurations
 * @returns {Array<Object>} Array of availability configs for that day
 */
export const getAvailabilityForDate = (date, availabilityConfig) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayNumber = date.getDay();

    // 1. Check for Specific Date overrides
    // We look for any rule that matches this specific date
    const specificRulesAll = availabilityConfig.filter(config =>
        config.specificDate === dateString
    );

    // If specific rules exist for this date (active or inactive), they OVERRIDE the weekly schedule
    if (specificRulesAll.length > 0) {
        // Return only the active ones to generate slots
        return specificRulesAll.filter(config => config.active !== false);
    }

    // 2. Fallback to Weekly Recurring Schedule
    // Only if NO specific rules exist for this date
    return availabilityConfig.filter(config => {
        // Must NOT have a specific date (is a recurring rule)
        // Must match day of week
        // Must be active
        return !config.specificDate &&
            dayOfWeekToNumber(config.dayOfWeek) === dayNumber &&
            config.active !== false;
    });
};

/**
 * Gets all time slots for a specific date based on availability
 * @param {Date} date - Date to get slots for
 * @param {Array<Object>} availabilityConfig - Array of availability configurations
 * @returns {Array<string>} Array of time slots
 */
export const getTimeSlotsForDate = (date, availabilityConfig) => {
    const dayConfigs = getAvailabilityForDate(date, availabilityConfig);

    // Generate slots for each time block and combine them
    const allSlots = dayConfigs.flatMap(config => generateTimeSlots(config));

    // Sort slots chronologically
    return allSlots.sort((a, b) => {
        const [aHour, aMin] = a.split(':').map(Number);
        const [bHour, bMin] = b.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });
};
