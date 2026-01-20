import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../api/authService';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            const response = await authService.forgotPassword(email);
            setStatus('success');
            setMessage(response.message || 'Si el email está registrado, recibirás un enlace para resetear tu contraseña.');
        } catch (err) {
            console.error('Forgot password error:', err);
            setStatus('error');
            setMessage(err.userMessage || 'Ocurrió un error al procesar la solicitud. Intente nuevamente.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-medical-600 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                {/* Logo y título */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                        <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Recuperar Contraseña</h1>
                    <p className="text-primary-100">Ingresa tu email para recibir instrucciones</p>
                </div>

                <div className="card p-8">
                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Correo enviado!</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                {message}
                            </p>
                            <Link to="/login" className="btn btn-primary w-full inline-block">
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {status === 'error' && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {message}
                                </div>
                            )}

                            <div className="form-group mb-6">
                                <label htmlFor="email" className="form-label">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input"
                                    placeholder="tu@email.com"
                                    required
                                    autoComplete="email"
                                    disabled={status === 'loading'}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="btn btn-primary w-full btn-lg"
                            >
                                {status === 'loading' ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enviando...
                                    </span>
                                ) : (
                                    'Enviar enlace de recuperación'
                                )}
                            </button>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="text-sm text-primary-600 hover:text-primary-500 font-medium">
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
