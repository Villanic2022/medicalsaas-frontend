import axiosInstance from './axiosConfig';

/**
 * Service for managing Insurance Companies
 */

/**
 * Get all insurance companies
 * GET /insurance-companies
 */
export const getAllInsuranceCompanies = async () => {
    const response = await axiosInstance.get('/insurance-companies');
    return response.data;
};

/**
 * Get insurance company by ID
 * GET /insurance-companies/{id}
 */
export const getInsuranceCompanyById = async (id) => {
    const response = await axiosInstance.get(`/insurance-companies/${id}`);
    return response.data;
};

/**
 * Create new insurance company
 * POST /insurance-companies
 */
export const createInsuranceCompany = async (data) => {
    const response = await axiosInstance.post('/insurance-companies', data);
    return response.data;
};

/**
 * Update insurance company
 * PUT /insurance-companies/{id}
 */
export const updateInsuranceCompany = async (id, data) => {
    const response = await axiosInstance.put(`/insurance-companies/${id}`, data);
    return response.data;
};

/**
 * Delete insurance company
 * DELETE /insurance-companies/{id}
 */
export const deleteInsuranceCompany = async (id) => {
    const response = await axiosInstance.delete(`/insurance-companies/${id}`);
    return response.data;
};

export default {
    getAll: getAllInsuranceCompanies,
    getById: getInsuranceCompanyById,
    create: createInsuranceCompany,
    update: updateInsuranceCompany,
    delete: deleteInsuranceCompany
};