import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";

const logo_neolaia = `${import.meta.env.BASE_URL}logo.png`;
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;

function Navbar({ token }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
            } catch (err) {
                console.error("Error decoding token:", err);
            }
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const navItems = [
        { path: "/personal-page", label: "Home", icon: "🏠" },
        { path: "/items", label: "Browse Items", icon: "📚" },
        ...(token ? [
            { path: "/create-item", label: "Create Item", icon: "➕" },
            { path: "/my-items", label: "My Items", icon: "📋" }
        ] : [])
    ];

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav style={{
            padding: '1rem 0',
            borderBottom: '1px solid #dee2e6',
            backgroundColor: 'white',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 1024px) {
                    .nav-desktop-links {
                        display: none !important;
                    }
                    .nav-desktop-user {
                        display: none !important;
                    }
                    .nav-mobile-toggle {
                        display: flex !important;
                    }
                }

                @media (min-width: 1025px) {
                    .nav-desktop-links {
                        display: flex !important;
                    }
                    .nav-desktop-user {
                        display: flex !important;
                    }
                    .nav-mobile-toggle {
                        display: none !important;
                    }
                    .nav-mobile-menu {
                        display: none !important;
                    }
                }

                /* Prevent horizontal scroll */
                body {
                    overflow-x: hidden;
                }
            `}</style>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 1rem',
                maxWidth: '1400px',
                margin: '0 auto',
                gap: '1rem'
            }}>
                {/* Logo Section */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    minWidth: 'fit-content'
                }}>
                    <img 
                        src={logo_neolaia} 
                        alt='Logo NEOLAiA' 
                        style={{ 
                            maxHeight: '45px',
                            width: 'auto',
                            height: 'auto', 
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                        }}
                        onClick={() => navigate('/')}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    />
                </div>

                {/* Desktop Navigation Links */}
                <div className="nav-desktop-links" style={{
                    display: 'none',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flex: '1 1 auto',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            style={{
                                padding: '0.5rem 0.875rem',
                                backgroundColor: isActive(item.path) ? '#f0f0ff' : 'transparent',
                                color: isActive(item.path) ? '#7c6fd6' : '#495057',
                                border: isActive(item.path) ? '2px solid #7c6fd6' : '2px solid transparent',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: isActive(item.path) ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive(item.path)) {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                    e.target.style.borderColor = '#dee2e6';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive(item.path)) {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.borderColor = 'transparent';
                                }
                            }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Right Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minWidth: 'fit-content'
                }}>
                    {/* Desktop User Menu */}
                    <div className="nav-desktop-user" style={{
                        display: 'none',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        {token && userData ? (
                            <>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    maxWidth: '150px'
                                }}>
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#213547',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100%'
                                    }}>
                                        {userData.full_name || userData.email}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: '#6c757d',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100%'
                                    }}>
                                        {userData.email}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: '0.5rem 0.875rem',
                                        backgroundColor: 'transparent',
                                        color: '#dc3545',
                                        border: '2px solid #dc3545',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#dc3545';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.color = '#dc3545';
                                    }}
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{
                                        padding: '0.5rem 0.875rem',
                                        backgroundColor: 'transparent',
                                        color: '#7c6fd6',
                                        border: '2px solid #7c6fd6',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#7c6fd6';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = 'transparent';
                                        e.target.style.color = '#7c6fd6';
                                    }}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    style={{
                                        padding: '0.5rem 0.875rem',
                                        background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 2px 4px rgba(124, 111, 214, 0.2)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 8px rgba(124, 111, 214, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 4px rgba(124, 111, 214, 0.2)';
                                    }}
                                >
                                    Register
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="nav-mobile-toggle"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        style={{
                            display: 'none',
                            padding: '0.5rem',
                            backgroundColor: showMobileMenu ? '#7c6fd6' : 'transparent',
                            border: '2px solid #7c6fd6',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            color: showMobileMenu ? 'white' : '#7c6fd6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '40px',
                            minHeight: '40px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {showMobileMenu ? '✕' : '☰'}
                    </button>

                    {/* EU Logo */}
                    <img 
                        src={eu_logo} 
                        alt='Logo EU' 
                        style={{ 
                            maxHeight: '40px',
                            width: 'auto',
                            height: 'auto'
                        }}
                    />
                </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="nav-mobile-menu" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderBottom: '1px solid #dee2e6',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    animation: 'slideDown 0.3s ease-out',
                    padding: '1rem',
                    maxHeight: 'calc(100vh - 80px)',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        maxWidth: '1400px',
                        margin: '0 auto'
                    }}>
                        {navItems.map(item => (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setShowMobileMenu(false);
                                }}
                                style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: isActive(item.path) ? '#f0f0ff' : 'transparent',
                                    color: isActive(item.path) ? '#7c6fd6' : '#495057',
                                    border: isActive(item.path) ? '2px solid #7c6fd6' : '2px solid #dee2e6',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: isActive(item.path) ? '600' : '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    textAlign: 'left',
                                    width: '100%'
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}

                        <div style={{
                            borderTop: '1px solid #dee2e6',
                            marginTop: '0.5rem',
                            paddingTop: '0.75rem'
                        }}>
                            {token && userData ? (
                                <>
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            color: '#213547',
                                            marginBottom: '0.25rem',
                                            wordBreak: 'break-word'
                                        }}>
                                            {userData.full_name || userData.email}
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: '#6c757d',
                                            wordBreak: 'break-word'
                                        }}>
                                            {userData.email}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setShowMobileMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    <button
                                        onClick={() => {
                                            navigate('/login');
                                            setShowMobileMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: 'transparent',
                                            color: '#7c6fd6',
                                            border: '2px solid #7c6fd6',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigate('/register');
                                            setShowMobileMenu(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 4px rgba(124, 111, 214, 0.2)'
                                        }}
                                    >
                                        Register
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;