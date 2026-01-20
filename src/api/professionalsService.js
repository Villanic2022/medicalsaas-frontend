import axiosInstance from './axiosConfig';

/**
 * Service for managing Professionals
 */

/**
 * Get all professionals for current tenant
 * GET /professionals
 */
export const getAllProfessionals = async () => {
    const response = await axiosInstance.get('/professionals');
    return response.data;
};

/**
 * Get professional by ID
 * GET /professionals/{id}
 */
export const getProfessionalById = async (id) => {
    const response = await axiosInstance.get(`/professionals/${id}`);
    return response.data;
};

/**
 * Create new professional
 * POST /professionals
 */
export const createProfessional = async (data) => {
    const response = await axiosInstance.post('/professionals', data);
    return response.data;
};

/**
 * Update professional
 * PUT /professionals/{id}
 */
export const updateProfessional = async (id, data) => {
    const response = await axiosInstance.put(`/professionals/${id}`, data);
    return response.data;
};

/**
 * Delete professional
 * DELETE /professionals/{id}
 */
export const deleteProfessional = async (id) => {
    const response = await axiosInstance.delete(`/professionals/${id}`);
    return response.data;
};

/**
 * Get all insurance companies available for selection
 * GET /insurance-companies
 */
export const getInsuranceCompanies = async () => {
    const response = await axiosInstance.get('/insurance-companies');
    return response.data;
};

/**
 * Get availability for a professional
 * GET /professionals/{id}/availability
 */
export const getAvailability = async (professionalId) => {
    const response = await axiosInstance.get(`/professionals/${professionalId}/availability`);
    return response.data;
};

/**
 * Update entire availability configuration for a professional
 * PUT /professionals/{id}/availability
 */
export const updateAvailability = async (professionalId, availability) => {
    const response = await axiosInstance.put(`/professionals/${professionalId}/availability`, availability);
    return response.data;
};

/**
 * Add a single availability rule
 * POST /professionals/{id}/availability
 */
export const addAvailability = async (professionalId, data) => {
    const response = await axiosInstance.post(`/professionals/${professionalId}/availability`, data);
    return response.data;
};

/**
 * Delete a specific availability rule
 * DELETE /professionals/availability/{id}
 */
export const deleteAvailability = async (availabilityId) => {
    const response = await axiosInstance.delete(`/professionals/availability/${availabilityId}`);
    return response.data;
};

export default {
    getAll: getAllProfessionals,
    getById: getProfessionalById,
    create: createProfessional,
    update: updateProfessional,
    delete: deleteProfessional,
    getAvailability: getAvailability,
    updateAvailability: updateAvailability,
    addAvailability: addAvailability,
    deleteAvailability: deleteAvailability,
    getInsuranceCompanies: getInsuranceCompanies
};
