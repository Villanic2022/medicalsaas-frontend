/**
 * Default procedure templates for quick loading
 */

export const DENTISTRY_TEMPLATES = [
    { name: 'Consulta General / Diagnóstico', durationMinutes: 30 },
    { name: 'Limpieza Dental (Profilaxis)', durationMinutes: 45 },
    { name: 'Extracción Simple', durationMinutes: 60 },
    { name: 'Extracción Compleja / Muela del Juicio', durationMinutes: 120 },
    { name: 'Obturación (Arreglo de caries)', durationMinutes: 45 },
    { name: 'Ajuste de Ortodoncia (Brackets)', durationMinutes: 20 },
    { name: 'Blanqueamiento Dental', durationMinutes: 60 },
    { name: 'Tratamiento de Conducto (Endodoncia)', durationMinutes: 90 },
    { name: 'Implante Dental', durationMinutes: 120 },
    { name: 'Prótesis Dental (Toma de impresión)', durationMinutes: 30 },
];

export const GENERAL_TEMPLATES = [
    { name: 'Consulta Médica de Rutina', durationMinutes: 20 },
    { name: 'Control Post-operatorio', durationMinutes: 30 },
    { name: 'Certificado Médico / Apto Físico', durationMinutes: 15 },
    { name: 'Intervención Menor (Cirugía ambulatoria)', durationMinutes: 90 },
];

export default {
    DENTISTRY_TEMPLATES,
    GENERAL_TEMPLATES
};
