import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import authService from '../../api/authService';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState('validating'); // validating, valid, invalid, submitting, success
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setStatus('invalid');
                setError('Token no proporcionado.');
                return;
            }

            try {
                // El backend valida el token
                await authService.validateResetToken(token);
                setStatus('valid');
            } catch (err) {
                console.error('Token validation error:', err);
                setStatus('invalid');
                setError(err.userMessage || 'El enlace es inválido o ha expirado.');
            }
        };

        validateToken();
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setStatus('submitting');
        setError('');

        try {
            await authService.resetPassword(token, formData.newPassword, formData.confirmPassword);
            setStatus('success');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error('Reset password error:', err);
            setStatus('valid'); // Volver a mostrar el form, pero con error
            setError(err.userMessage || 'Error al restablecer la contraseña. Intente nuevamente.');
        }
    };

    if (status === 'validating') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-medical-600 flex items-center justify-center px-4">
                <div className="text-white text-center">
                    <svg className="animate-spin h-10 w-10 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg">Verificando enlace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-medical-600 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                        <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Nueva Contraseña</h1>
                    <p className="text-primary-100">Establece tu nueva contraseña de acceso</p>
                </div>

                <div className="card p-8">
                    {status === 'invalid' ? (
                        <div className="text-center text-red-600">
                            <svg className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Enlace inválido o expirado</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                {error}
                            </p>
                            <Link to="/forgot-password" className="btn btn-primary w-full inline-block">
                                Solicitar nuevo enlace
                            </Link>
                        </div>
                    ) : status === 'success' ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Contraseña actualizada!</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Tu contraseña ha sido cambiada exitosamente.
                                <br />
                                Redirigiendo al login...
                            </p>
                            <Link to="/login" className="btn btn-primary w-full inline-block">
                                Iniciar Sesión ahora
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="newPassword" className="form-label">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group mb-6">
                                <label htmlFor="confirmPassword" className="form-label">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="btn btn-primary w-full btn-lg"
                            >
                                {status === 'submitting' ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Actualizando...
                                    </span>
                                ) : (
                                    'Cambiar Contraseña'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
