import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="px-8 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">
                            {new Date().toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Usuario */}
                        <div className="flex items-center">
                            <div className="text-right mr-3">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-medical-500 rounded-full text-white font-semibold">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                        </div>

                        {/* Botón de logout */}
                        <button
                            onClick={handleLogout}
                            className="btn btn-secondary btn-sm flex items-center"
                            title="Cerrar Sesión"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Salir
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
