import axiosInstance from './axiosConfig';

/**
 * Service for managing Tenants (Admin only)
 */

/**
 * Get all tenants
 * GET /tenants
 */
export const getAll = async () => {
    const response = await axiosInstance.get('/admin/tenants');
    return response.data;
};

/* 
 * Toggle tenant active status (Optional future implementation)
 * PUT /tenants/{id}/toggle-active
 */
export const toggleActive = async (id) => {
    const response = await axiosInstance.put(`/tenants/${id}/toggle-active`);
    return response.data;
};

export default {
    getAll,
    toggleActive
};
