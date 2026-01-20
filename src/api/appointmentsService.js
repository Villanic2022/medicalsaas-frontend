
import axiosInstance from './axiosConfig';

/**
 * Service for Internal Appointments Management (Owner/Staff)
 * Base URL: /appointments
 */

/**
 * Get all appointments for the current tenant
 * @param {Object} filters - Optional filters (date, professionalId)
 * GET /appointments
 */
export const getAll = async (filters = {}) => {
    // TODO: Append filters to query params if backend supports them later
    const response = await axiosInstance.get('/appointments', { params: filters });
    return response.data;
};

/**
 * Get appointment by ID
 * GET /appointments/{id}
 */
export const getById = async (id) => {
    const response = await axiosInstance.get(`/appointments/${id}`);
    return response.data;
};

/**
 * Create a new appointment (Manual booking)
 * Uses the PUBLIC endpoint as the internal one doesn't exist yet.
 * POST /t/{tenantSlug}/appointments
 * Payload: { professionalId, startDateTime, patient: { ... }, notes }
 */
export const create = async (tenantSlug, appointmentData) => {
    // We use the authenticated instance (axiosInstance) even though it's a public endpoint
    // to keep it simple. The backend should ignore the token or accept it.
    const response = await axiosInstance.post(`/t/${tenantSlug}/appointments`, appointmentData);
    return response.data;
};

/**
 * Update appointment status
 * PUT /appointments/{id}/status?status={status}
 */
export const updateStatus = async (id, status) => {
    const response = await axiosInstance.put(`/appointments/${id}/status`, null, {
        params: { status }
    });
    return response.data;
};

/**
 * Mark appointment as notified via WhatsApp
 * PATCH /appointments/{id}/notified
 */
export const markAsNotified = async (id) => {
    const response = await axiosInstance.patch(`/appointments/${id}/notified`);
    return response.data;
};

/**
 * Cancel appointment (Delete)
 * DELETE /appointments/{id}
 */
export const cancel = async (id) => {
    await axiosInstance.delete(`/appointments/${id}`);
};

export default {
    getAll,
    getById,
    create,
    updateStatus,
    cancel,
    markAsNotified
};
