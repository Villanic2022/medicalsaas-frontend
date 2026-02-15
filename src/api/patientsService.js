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

// --- CLINICAL HISTORY & FILES ENDPOINTS ---

/**
 * Get clinical history (notes/visits)
 * GET /patients/{id}/clinical-history
 */
export const getClinicalHistory = async (patientId) => {
    const response = await axiosInstance.get(`/patients/${patientId}/clinical-history`);
    return response.data;
};

/**
 * Add clinical note
 * POST /patients/{id}/clinical-history
 */
export const addClinicalHistory = async (patientId, noteData) => {
    const response = await axiosInstance.post(`/patients/${patientId}/clinical-history`, noteData);
    return response.data;
};

/**
 * Delete clinical note
 * DELETE /patients/{id}/clinical-history/{noteId}
 */
export const deleteClinicalHistory = async (patientId, noteId) => {
    const response = await axiosInstance.delete(`/patients/${patientId}/clinical-history/${noteId}`);
    return response.data;
};

/**
 * Get patient files
 * GET /patients/{id}/files
 */
export const getFiles = async (patientId) => {
    const response = await axiosInstance.get(`/patients/${patientId}/files`);
    return response.data;
};

/**
 * Upload file
 * POST /patients/{id}/files
 */
export const uploadFile = async (patientId, formData) => {
    const response = await axiosInstance.post(`/patients/${patientId}/files`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * Delete patient file
 * DELETE /patients/{id}/files/{fileId}
 */
export const deleteFile = async (patientId, fileId) => {
    const response = await axiosInstance.delete(`/patients/${patientId}/files/${fileId}`);
    return response.data;
};

export default {
    getAll,
    getById,
    getByDni,
    search,
    create,
    update,
    delete: remove,
    getClinicalHistory,
    addClinicalHistory,
    deleteClinicalHistory,
    getFiles,
    uploadFile,
    deleteFile
};
