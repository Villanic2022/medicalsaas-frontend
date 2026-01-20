import axiosInstance from './axiosConfig';

/**
 * Service for managing Specialties
 */

/**
 * Get all specialties
 * GET /specialties
 */
export const getAll = async () => {
    const response = await axiosInstance.get('/public/specialties');
    return response.data;
};

/**
 * Get specialty by ID
 * GET /specialties/{id}
 */
export const getSpecialtyById = async (id) => {
    const response = await axiosInstance.get(`/specialties/${id}`);
    return response.data;
};

/**
 * Create a new specialty
 * POST /specialties
 */
export const create = async (specialtyData) => {
    const response = await axiosInstance.post('/specialties', specialtyData);
    return response.data;
};

/**
 * Delete (soft delete) specialty by ID
 * DELETE /specialties/{id}
 */
export const deleteSpecialty = async (id) => {
    const response = await axiosInstance.delete(`/specialties/${id}`);
    return response.data;
};

export default {
    getAll: getAll,
    getById: getSpecialtyById,
    create: create,
    delete: deleteSpecialty
};
