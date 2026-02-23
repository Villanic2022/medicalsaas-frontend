import axiosInstance from './axiosConfig';

/**
 * Service for managing Procedures (Treatments/Services)
 */

/**
 * Get all procedures for current tenant
 * GET /procedures
 */
export const getAll = async () => {
    const response = await axiosInstance.get('/procedures');
    return response.data;
};

/**
 * Get procedures by Professional ID
 * GET /professionals/{id}/procedures
 */
export const getByProfessional = async (professionalId) => {
    const response = await axiosInstance.get(`/professionals/${professionalId}/procedures`);
    return response.data;
};

/**
 * Create new procedure
 * POST /procedures
 */
export const create = async (data) => {
    const payload = {
        name: data.name,
        durationMinutes: Number(data.durationMinutes),
        specialtyId: data.specialtyId ? Number(data.specialtyId) : null
    };
    const response = await axiosInstance.post('/procedures', payload);
    return response.data;
};

/**
 * Update procedure
 * PUT /procedures/{id}
 */
export const update = async (id, data) => {
    const payload = {
        name: data.name,
        durationMinutes: Number(data.durationMinutes),
        specialtyId: data.specialtyId ? Number(data.specialtyId) : null
    };
    const response = await axiosInstance.put(`/procedures/${id}`, payload);
    return response.data;
};

/**
 * Delete procedure
 * DELETE /procedures/{id}
 */
export const remove = async (id) => {
    const response = await axiosInstance.delete(`/procedures/${id}`);
    return response.data;
};

/**
 * Load default procedures (Bulk template)
 * POST /procedures/template-load?specialty={specialty}
 */
export const loadTemplate = async (specialty) => {
    const response = await axiosInstance.post(`/procedures/template-load`, null, {
        params: { specialty }
    });
    return response.data;
};

export default {
    getAll,
    getByProfessional,
    create,
    update,
    remove,
    loadTemplate
};
