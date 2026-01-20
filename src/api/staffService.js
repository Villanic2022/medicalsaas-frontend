import axiosInstance from './axiosConfig';

/**
 * Service for managing Staff (Owner only)
 */

/**
 * Get all staff members
 * GET /staff
 */
export const getAll = async () => {
    const response = await axiosInstance.get('/staff');
    return response.data;
};

/**
 * Create new staff member
 * Uses the auth endpoint but wrapped here for convenience
 * POST /auth/register/staff
 */
export const create = async (staffData) => {
    const response = await axiosInstance.post('/auth/register/staff', staffData);
    return response.data;
};

/**
 * Toggle staff active status (Optional)
 * PUT /staff/{id}/toggle-active
 */
export const toggleActive = async (id) => {
    const response = await axiosInstance.put(`/staff/${id}/toggle-active`);
    return response.data;
};

export default {
    getAll,
    create,
    toggleActive
};
