import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import patientsService from '../../api/patientsService';
import Toast from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../utils/constants';

const PatientDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general'); // general | history | files
    const [toast, setToast] = useState(null);

    // New Note State
    const [newNote, setNewNote] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);

    // Upload File State
    const [uploadingFile, setUploadingFile] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [patientData, historyData, filesData] = await Promise.all([
                patientsService.getById(id),
                patientsService.getClinicalHistory(id),
                patientsService.getFiles(id)
            ]);
            setPatient(patientData);
            setHistory(historyData);
            setFiles(filesData);
        } catch (error) {
            console.error('Error fetching patient details:', error);
            setToast({ message: 'Error al cargar los datos del paciente', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSubmittingNote(true);
        try {
            const profName = user ? `${user.firstName} ${user.lastName}` : 'Profesional';
            const addedNote = await patientsService.addClinicalHistory(id, {
                content: newNote,
                professionalName: profName
            });
            setHistory([addedNote, ...history]);
            setNewNote('');
            setToast({ message: 'Nota clínica agregada correctamente', type: 'success' });
        } catch (error) {
            console.error('Error adding note:', error);
            setToast({ message: 'Error al agregar la nota', type: 'error' });
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadedFile = await patientsService.uploadFile(id, formData);
            setFiles([uploadedFile, ...files]);
            setToast({ message: 'Archivo subido correctamente', type: 'success' });
        } catch (error) {
            console.error('Error uploading file:', error);
            setToast({ message: 'Error al subir el archivo', type: 'error' });
        } finally {
            setUploadingFile(false);
            e.target.value = null; // Reset input
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('Historia Clínica', 14, 22);

        doc.setFontSize(12);
        doc.text(`Paciente: ${patient.firstName} ${patient.lastName}`, 14, 32);
        doc.text(`DNI: ${patient.dni}`, 14, 38);
        doc.text(`Fecha de emisión: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`, 14, 44);

        // Table
        const tableBody = history.map(item => [
            format(new Date(item.date), 'dd/MM/yyyy HH:mm'),
            item.professionalName,
            item.content || item.note
        ]);

        autoTable(doc, {
            head: [['Fecha', 'Profesional', 'Nota Clínica']],
            body: tableBody,
            startY: 50,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [13, 148, 136] }, // teal-600
        });

        doc.save(`Historia_Clinica_${patient.lastName}_${patient.firstName}.pdf`);
        setToast({ message: 'PDF descargado exitosamente', type: 'success' });
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta evolución?')) return;

        try {
            await patientsService.deleteClinicalHistory(id, noteId);
            setHistory(history.filter(h => h.id !== noteId));
            setToast({ message: 'Evolución eliminada correctamente', type: 'success' });
        } catch (error) {
            console.error('Error deleting note:', error);
            setToast({ message: 'Error al eliminar la evolución', type: 'error' });
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo?')) return;

        try {
            await patientsService.deleteFile(id, fileId);
            setFiles(files.filter(f => f.id !== fileId));
            setToast({ message: 'Archivo eliminado correctamente', type: 'success' });
        } catch (error) {
            console.error('Error deleting file:', error);
            setToast({ message: 'Error al eliminar el archivo', type: 'error' });
        }
    };

    if (loading) return <div className="text-center py-10">Cargando datos del paciente...</div>;
    if (!patient) return <div className="text-center py-10 text-red-500">Paciente no encontrado.</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/patients')} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
                        <p className="text-sm text-gray-500">DNI: {patient.dni} | {patient.age ? `${patient.age} años` : 'Edad no registrada'}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['general', 'history', 'files']
                        .filter(tab => {
                            if (user?.role === ROLES.STAFF) {
                                return tab === 'general';
                            }
                            return true;
                        })
                        .map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                                ${activeTab === tab
                                        ? 'border-teal-500 text-teal-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                            >
                                {tab === 'general' && 'Información General'}
                                {tab === 'history' && 'Historia Clínica'}
                                {tab === 'files' && 'Archivos Adjuntos'}
                            </button>
                        ))}
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white shadow rounded-lg p-6 min-h-[400px]">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Datos Personales</h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.firstName} {patient.lastName}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">DNI</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.dni}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.email || '-'}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.phone || '-'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.address || '-'}</dd>
                                </div>
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Información Médica</h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Obra Social</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.insuranceCompany?.name || 'Particular'}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">N° Afiliado</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.insuranceNumber || '-'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Profesional Preferido</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{patient.preferredProfessional?.fullName || '-'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Notas</dt>
                                    <dd className="mt-1 text-sm text-gray-900 italic">{patient.notes || 'Sin notas adicionales.'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Evoluciones Clínicas</h3>
                            <button
                                onClick={generatePDF}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Descargar PDF
                            </button>
                        </div>

                        {/* Add Note */}
                        <form onSubmit={handleAddNote} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                                Nueva Nota Clínica
                            </label>
                            <textarea
                                id="note"
                                rows={3}
                                className="input w-full mb-3"
                                placeholder="Escribe la evolución del paciente..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={!newNote.trim() || submittingNote}
                                    className="btn btn-primary"
                                >
                                    {submittingNote ? 'Guardando...' : 'Agregar Evolución'}
                                </button>
                            </div>
                        </form>

                        {/* Timeline */}
                        <div className="flow-root">
                            <ul role="list" className="-mb-8">
                                {history.map((event, eventIdx) => (
                                    <li key={event.id}>
                                        <div className="relative pb-8">
                                            {eventIdx !== history.length - 1 ? (
                                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                            ) : null}
                                            <div className="relative flex space-x-3">
                                                <div>
                                                    <span className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center ring-8 ring-white">
                                                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            Evolución por <span className="font-medium text-gray-900">{event.professionalName}</span>
                                                        </p>
                                                        <div className="mt-2 text-sm text-gray-700">
                                                            <p>{event.content || event.note}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end space-y-2">
                                                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                            {format(new Date(event.date), "d MMM yyyy, HH:mm", { locale: es })}
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteNote(event.id)}
                                                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                            title="Eliminar evolución"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* FILES TAB */}
                {activeTab === 'files' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Archivos Adjuntos</h3>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploadingFile}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`btn btn-secondary cursor-pointer flex items-center ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    {uploadingFile ? 'Subiendo...' : 'Subir Archivo'}
                                </label>
                            </div>
                        </div>

                        {files.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500 border-2 border-dashed border-gray-300">
                                <p>No hay archivos adjuntos.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {files.map((file) => (
                                    <div key={file.id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200 border border-gray-200 hover:shadow-md transition-shadow relative group">
                                        <div className="w-full flex items-center justify-between p-6 space-x-6">
                                            <div className="flex-1 truncate">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-gray-900 text-sm font-medium truncate" title={file.name}>{file.name}</h3>
                                                </div>
                                                <p className="mt-1 text-gray-500 text-xs truncate">{file.size} • {file.date}</p>
                                            </div>
                                            <div className="flex-shrink-0 bg-teal-100 rounded-full p-2">
                                                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        </div>
                                        {/* Botón de eliminar - Visible al pasar el mouse */}
                                        <button
                                            onClick={() => handleDeleteFile(file.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all shadow-sm"
                                            title="Eliminar archivo"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default PatientDetailsPage;
