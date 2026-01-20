import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RegisterStaffPage = () => {
    const navigate = useNavigate();
    const { registerStaff } = useAuth();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        tenantSlug: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!formData.tenantSlug.trim()) {
            setError('El código del consultorio es requerido');
            return;
        }

        setLoading(true);

        try {
            await registerStaff(formData);
            // Si el registro es exitoso y retorna token, AuthContext redirigirá
            navigate('/dashboard');
        } catch (err) {
            console.error('Register staff error:', err);

            // Mensajes de error más específicos
            const errorMessage = err.response?.data?.message || err.userMessage;
            if (errorMessage?.includes('not found') || errorMessage?.includes('no existe')) {
                setError('El código del consultorio no existe. Verifica con el administrador del consultorio.');
            } else {
                setError(errorMessage || 'Error al registrar el usuario');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-medical-600 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                        <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Registrar Staff</h1>
                    <p className="text-primary-100">Únete a un consultorio existente</p>
                </div>

                {/* Formulario */}
                <div className="card p-8">
                    {/* Información sobre el código */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm text-blue-800 font-medium mb-1">
                                    ¿Dónde obtengo el código del consultorio?
                                </p>
                                <p className="text-xs text-blue-700">
                                    El administrador del consultorio debe proporcionarte el código único (slug) para que puedas registrarte.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="tenantSlug" className="form-label">
                                Código del Consultorio *
                            </label>
                            <input
                                type="text"
                                id="tenantSlug"
                                name="tenantSlug"
                                value={formData.tenantSlug}
                                onChange={handleChange}
                                className="input font-mono"
                                placeholder="ej: clinica-san-jose"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Solicita este código al propietario del consultorio
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Juan"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">
                                    Apellido *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Pérez"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Correo Electrónico *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Contraseña *
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirmar Contraseña *
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input"
                                placeholder="Repetir contraseña"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full btn-lg mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Registrando...
                                </span>
                            ) : (
                                'Registrarse'
                            )}
                        </button>
                    </form>

                    {/* Link a login */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600">
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                Iniciar Sesión
                            </Link>
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                            ¿Quieres crear un consultorio?{' '}
                            <Link to="/register/owner" className="text-medical-600 hover:text-medical-700 font-medium">
                                Registrar Consultorio
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterStaffPage;
