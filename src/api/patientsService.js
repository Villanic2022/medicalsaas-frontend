import axiosInstance from './axiosConfig';

/**
 * Service for managing Patients
 * Base URL: /patients
 */

/**
 * Get all patients for the current tenant
 * @param {Object} filters - Optional filters (search, insuranceId, professionalId)
 * GET /patients
 */
export const getAll = async (filters = {}) => {
    const response = await axiosInstance.get('/patients', { params: filters });
    return response.data;
};

/**
 * Get patient by ID
 * GET /patients/{id}
 */
export const getById = async (id) => {
    const response = await axiosInstance.get(`/patients/${id}`);
    return response.data;
};

/**
 * Get patient by DNI
 * GET /patients/by-dni/{dni}
 */
export const getByDni = async (dni) => {
    const response = await axiosInstance.get(`/patients/by-dni/${dni}`);
    return response.data;
};

/**
 * Search patients by name or DNI (for autocomplete)
 * GET /patients/search?q={query}
 */
export const search = async (query) => {
    const response = await axiosInstance.get('/patients/search', { params: { q: query } });
    return response.data;
};

/**
 * Create new patient
 * POST /patients
 */
export const create = async (patientData) => {
    const response = await axiosInstance.post('/patients', patientData);
    return response.data;
};

/**
 * Update existing patient
 * PUT /patients/{id}
 */
export const update = async (id, patientData) => {
    const response = await axiosInstance.put(`/patients/${id}`, patientData);
    return response.data;
};

/**
 * Delete patient
 * DELETE /patients/{id}
 */
export const remove = async (id) => {
    const response = await axiosInstance.delete(`/patients/${id}`);
    return response.data;
};

export default {
    getAll,
    getById,
    getByDni,
    search,
    create,
    update,
    delete: remove
};
