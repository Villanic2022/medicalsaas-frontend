import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RegisterOwnerPage = () => {
    const navigate = useNavigate();
    const { registerOwner } = useAuth();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        clinicName: '',
        clinicPhone: '',
        clinicAddress: '',
        clinicCity: ''
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

        setLoading(true);

        try {
            await registerOwner(formData);
            // Si el registro es exitoso y retorna token, AuthContext redirigirá
            // Si no retorna token, redirigir a login
            navigate('/dashboard');
        } catch (err) {
            console.error('Register error:', err);
            setError(err.userMessage || err.response?.data?.message || 'Error al registrar el consultorio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-medical-600 flex items-center justify-center px-4 py-12">
            <div className="max-w-3xl w-full">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                        <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Registrar Consultorio</h1>
                    <p className="text-primary-100">Crea tu cuenta y comienza a gestionar tu consultorio</p>
                </div>

                {/* Formulario */}
                <div className="card p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Datos Personales */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Datos Personales
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                <div className="form-group md:col-span-2">
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
                            </div>
                        </div>

                        {/* Datos del Consultorio */}
                        <div className="mb-6 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-medical-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Datos del Consultorio
                                <span className="ml-2 text-sm text-gray-500 font-normal">(Opcional)</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group md:col-span-2">
                                    <label htmlFor="clinicName" className="form-label">
                                        Nombre del Consultorio
                                    </label>
                                    <input
                                        type="text"
                                        id="clinicName"
                                        name="clinicName"
                                        value={formData.clinicName}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Clínica San José"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="clinicPhone" className="form-label">
                                        Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        id="clinicPhone"
                                        name="clinicPhone"
                                        value={formData.clinicPhone}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="+54 11 1234-5678"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="clinicCity" className="form-label">
                                        Ciudad
                                    </label>
                                    <input
                                        type="text"
                                        id="clinicCity"
                                        name="clinicCity"
                                        value={formData.clinicCity}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Buenos Aires"
                                    />
                                </div>

                                <div className="form-group md:col-span-2">
                                    <label htmlFor="clinicAddress" className="form-label">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        id="clinicAddress"
                                        name="clinicAddress"
                                        value={formData.clinicAddress}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Av. Corrientes 1234"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full btn-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creando consultorio...
                                </span>
                            ) : (
                                'Crear Consultorio'
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterOwnerPage;
