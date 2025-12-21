import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;
const logo_neolink = `${import.meta.env.BASE_URL}logo.png`;

function PersonalPage() {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    const token = location.state?.token || localStorage.getItem("token");

    // Format name to title case
    const formatName = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
            } catch (err) {
                console.error("Error decoding token:", err);
                setError("Invalid token");
                localStorage.removeItem("token");
                setTimeout(() => navigate("/login"), 2000);
            }
        } else {
            setError("No token provided");
            setTimeout(() => navigate("/login"), 2000);
        }
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (error) {
        return (
            <div style={{ 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    maxWidth: '400px'
                }}>
                    <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>Error</h1>
                    <p style={{ color: '#6c757d' }}>{error}</p>
                    <p style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                        Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div style={{ 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa'
            }}>
                <div className="text-center">
                    <div className="spinner-border" style={{ color: '#7c6fd6' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3" style={{ color: '#6c757d' }}>Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div className="py-3 py-md-4 border-bottom bg-white" style={{ width: '100%' }}>
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center px-3 px-md-5 gap-3">
                    <div className="d-flex align-items-center gap-2 gap-md-3">
                        <img 
                            src={logo_neolink} 
                            alt='Logo NEOLAiA' 
                            className="img-fluid" 
                            style={{ maxHeight: '50px', height: 'auto' }}
                        />
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <img 
                            src={eu_logo} 
                            alt='Logo EU' 
                            className="img-fluid" 
                            style={{ maxHeight: '45px', height: 'auto' }}
                        />
                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '0.5rem 1.5rem',
                                background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                transition: 'all 0.3s',
                                boxShadow: '0 2px 4px rgba(124, 111, 214, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(124, 111, 214, 0.2)';
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ 
                flex: 1,
                padding: '2rem 1rem',
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto'
            }}>
                {/* Welcome Banner */}
                <div style={{
                    background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(124, 111, 214, 0.3)'
                }}>
                    <h1 style={{ 
                        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                        fontWeight: '700',
                        marginBottom: '0.5rem'
                    }}>
                        Welcome back, {userData.full_name ? formatName(userData.full_name.split(' ')[0]) : 'User'}! 👋
                    </h1>
                    <p style={{ 
                        fontSize: '1.1rem',
                        opacity: 0.9,
                        margin: 0
                    }}>
                        Manage your profile and explore NEOLink
                    </p>
                </div>

                {/* Profile Information Card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    {/* Card Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        padding: '1.5rem 2rem',
                        borderBottom: '2px solid #dee2e6'
                    }}>
                        <h2 style={{ 
                            margin: 0,
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: '#213547'
                        }}>
                            Profile Information
                        </h2>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '2rem' }}>
                        <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '2rem'
                        }}>
                            {/* Full Name */}
                            {userData.full_name && (
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    borderLeft: '4px solid #7c6fd6'
                                }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#6c757d',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Full Name
                                    </div>
                                    <div style={{
                                        fontSize: '1.25rem',
                                        fontWeight: '600',
                                        color: '#213547'
                                    }}>
                                        {formatName(userData.full_name)}
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            {userData.email && (
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    borderLeft: '4px solid #667eea'
                                }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#6c757d',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Email Address
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '500',
                                        color: '#213547',
                                        wordBreak: 'break-word'
                                    }}>
                                        {userData.email}
                                    </div>
                                </div>
                            )}

                            {/* University/Institution */}
                            {userData.institution && (
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    borderLeft: '4px solid #4ecdc4'
                                }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#6c757d',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Institution
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '500',
                                        color: '#213547'
                                    }}>
                                        {userData.institution}
                                    </div>
                                </div>
                            )}

                            {/* Role */}
                            {userData.role && (
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    borderLeft: '4px solid #ff6b6b'
                                }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#6c757d',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Role
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '500',
                                        color: '#213547'
                                    }}>
                                        {formatName(userData.role)}
                                    </div>
                                </div>
                            )}

                            {/* User ID */}
                            {userData.sub && (
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    borderLeft: '4px solid #ffd93d'
                                }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#6c757d',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '0.5rem'
                                    }}>
                                        User ID
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '500',
                                        color: '#213547',
                                        fontFamily: 'monospace'
                                    }}>
                                        {userData.sub}
                                    </div>
                                </div>
                            )}

                            {/* Additional fields - add more as needed */}
                            {userData.department && (
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '12px',
                                    borderLeft: '4px solid #95e1d3'
                                }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        color: '#6c757d',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Department
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '500',
                                        color: '#213547'
                                    }}>
                                        {userData.department}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{
                    marginTop: '2rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem'
                }}>

                    <button 
                        onClick={() => navigate('/create-item', { state: { token } })}
                        style={{
                            padding: '1.25rem',
                            backgroundColor: 'white',
                            border: '2px solid #e9ecef',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            textAlign: 'left',
                            fontWeight: '600',
                            fontSize: '1rem',
                            color: '#213547',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = '#7c6fd6';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = '#e9ecef';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                        }}
                    >
                        ➕ Create New Item
                    </button>
                    <button style={{
                        padding: '1.25rem',
                        backgroundColor: 'white',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: '#213547',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.borderColor = '#7c6fd6';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e9ecef';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                    }}
                    >
                        📝 Edit Profile
                    </button>

                    <button style={{
                        padding: '1.25rem',
                        backgroundColor: 'white',
                        border: '2px solid #e9ecef',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: '#213547',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.borderColor = '#7c6fd6';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.borderColor = '#e9ecef';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                    }}
                    >
                        💬 Support
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PersonalPage;