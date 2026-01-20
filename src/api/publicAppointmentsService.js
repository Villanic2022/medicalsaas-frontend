import axios from 'axios';
import { API_CONFIG } from '../utils/constants';

/**
 * Service for PUBLIC booking endpoints
 * Does NOT use the axiosInstance with interceptors mainly to avoid auth headers being required
 * but we can use a new instance if needed. For simplicity we'll use axios directly here or a public instance.
 */

const publicAxios = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Get Tenant Info by Slug
 * GET /t/{tenantSlug}
 */
export const getTenantInfo = async (slug) => {
    const response = await publicAxios.get(`/t/${slug}`);
    return response.data;
};

/**
 * Get Professionals for a Tenant
 * GET /t/{tenantSlug}/professionals
 */
export const getTenantProfessionals = async (slug) => {
    const response = await publicAxios.get(`/t/${slug}/professionals`);
    return response.data;
};

/**
 * Get Specialties for a Tenant
 * GET /t/{tenantSlug}/specialties
 */
export const getTenantSpecialties = async (slug) => {
    const response = await publicAxios.get(`/t/${slug}/specialties`);
    return response.data;
};

/**
 * Create Appointment
 * POST /t/{tenantSlug}/appointments
 */
export const createAppointment = async (slug, appointmentData) => {
    const response = await publicAxios.post(`/t/${slug}/appointments`, appointmentData);
    return response.data;
};

/**
 * Get Professional Appointments for a specific date (Public)
 * GET /t/{tenantSlug}/appointments?professionalId=X&date=YYYY-MM-DD
 */
export const getAppointments = async (slug, professionalId, date) => {
    const response = await publicAxios.get(`/t/${slug}/appointments`, {
        params: {
            professionalId,
            date
        }
    });
    return response.data;
};

export const getProfessionalAvailability = async (slug, professionalId) => {
    const response = await publicAxios.get(`/t/${slug}/professionals/${professionalId}/availability`);
    return response.data;
};

export default {
    getTenantInfo,
    getProfessionals: getTenantProfessionals,
    getSpecialties: getTenantSpecialties,
    createAppointment,
    getProfessionalAvailability,
    getAppointments
};
