import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { base_url } from "../api";
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;
const logo_neolink = `${import.meta.env.BASE_URL}logo.png`;
import Navbar from "../components/navbar";
import axios from "axios";
import { getCategoryIcon } from "../utils";

function PersonalPage() {
    const [userData, setUserData] = useState(null);
    const [recentItems, setRecentItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [error, setError] = useState(null);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    const token = location.state?.token || localStorage.getItem("token");

    const formatName = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
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

    useEffect(() => {
        const fetchRecentItems = async () => {
            try {
                setLoadingItems(true);
                const response = await axios.get(
                    `${base_url}/items?sort=createdAt:desc&pagination[limit]=5&populate=*`
                );
                if (response.status === 200) {
                    const data = response.data;
                    setRecentItems(data.data || data || []);
                }
            } catch (err) {
                console.error("Error fetching recent items:", err);
            } finally {
                setLoadingItems(false);
            }
        };

        if (token) {
            fetchRecentItems();
        }
    }, [token]);

    useEffect(() => {        
        const checkToken = async () => {
            if (!token_is_valid()) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        };
        const interval = setInterval(checkToken, 60000);
        return () => clearInterval(interval);
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const SupportModal = () => {
        if (!showSupportModal) return null;
        
        return (
            <div 
                style={styles.modalOverlay}
                onClick={() => setShowSupportModal(false)}
            >
                <div 
                    style={styles.modalContent}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button 
                        style={styles.modalClose}
                        onClick={() => setShowSupportModal(false)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        ✕
                    </button>
                    
                    <div style={styles.modalIcon}>💬</div>
                    <h2 style={styles.modalTitle}>Need Help?</h2>
                    <p style={styles.modalText}>
                        Our support team is here to assist you. Reach out to us via email and we'll get back to you as soon as possible.
                    </p>
                    
                    <div style={styles.emailContainer}>
                        <span style={styles.emailLabel}>Contact us at:</span>
                        <a 
                            href="mailto:virtualcafe-support-list@unisa.it"
                            style={styles.emailLink}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#6b5fc7';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#7c6fd6';
                            }}
                        >
                            ✉ virtualcafe-support-list@unisa.it
                        </a>
                    </div>
                </div>
            </div>
        );
    };

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIcon}>⚠</div>
                    <h1 style={styles.errorTitle}>Something went wrong</h1>
                    <p style={styles.errorText}>{error}</p>
                    <p style={styles.redirectText}>Redirecting to login...</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.pageWrapper}>
            <Navbar token={token} onLogout={handleLogout} />
            
            {/* Support Modal */}
            <SupportModal />

            {/* Main Content */}
            <main style={styles.mainContent}>
                {/* Welcome Header */}
                <header style={styles.welcomeHeader}>
                    <div style={styles.welcomeContent}>
                        <span style={styles.welcomeTag}>Dashboard</span>
                        <h1 style={styles.welcomeTitle}>
                            Welcome back, {userData.full_name ? formatName(userData.full_name.split(' ')[0]) : 'User'}
                        </h1>
                        <p style={styles.welcomeSubtitle}>
                            Here's what's happening on NEOLink
                        </p>
                    </div>
                    <div style={styles.welcomeDecor}>
                        <div style={styles.decorCircle1}></div>
                        <div style={styles.decorCircle2}></div>
                    </div>
                </header>

                {/* Two Column Layout */}
                <div style={styles.twoColumnGrid}>
                    {/* Left Column - Profile */}
                    <section style={styles.leftColumn}>
                        {/* Profile Card */}
                        <div style={styles.profileCard}>
                            <div style={styles.profileHeader}>
                                <div style={styles.profileHeaderInfo}>
                                    <h2 style={styles.profileName}>
                                        {userData.full_name ? formatName(userData.full_name) : 'User'}
                                    </h2>
                                    {userData.role && (
                                        <span style={styles.roleTag}>{formatName(userData.role)}</span>
                                    )}
                                </div>
                            </div>

                            <div style={styles.profileDetails}>
                                {userData.email && (
                                    <div style={styles.detailRow}>
                                        <span style={styles.detailIcon}>✉</span>
                                        <div style={styles.detailContent}>
                                            <span style={styles.detailLabel}>Email</span>
                                            <span style={styles.detailValue}>{userData.email}</span>
                                        </div>
                                    </div>
                                )}

                                {userData.university_name && (
                                    <div style={styles.detailRow}>
                                        <span style={styles.detailIcon}>🏛</span>
                                        <div style={styles.detailContent}>
                                            <span style={styles.detailLabel}>Institution</span>
                                            <span style={styles.detailValue}>{userData.university_name}</span>
                                        </div>
                                    </div>
                                )}

                                {userData.first_level_structure && (
                                    <div style={styles.detailRow}>
                                        <span style={styles.detailIcon}>📁</span>
                                        <div style={styles.detailContent}>
                                            <span style={styles.detailLabel}>Department</span>
                                            <span style={styles.detailValue}>{userData.first_level_structure}</span>
                                        </div>
                                    </div>
                                )}

                                {userData.sub && (
                                    <div style={styles.detailRow}>
                                        <span style={styles.detailIcon}>#</span>
                                        <div style={styles.detailContent}>
                                            <span style={styles.detailLabel}>User ID</span>
                                            <span style={{...styles.detailValue, fontFamily: 'monospace', fontSize: '0.85rem'}}>
                                                {userData.sub}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div style={styles.actionsCard}>
                            <h3 style={styles.actionsTitle}>Quick Actions</h3>
                            <div style={styles.actionsGrid}>
                                <button 
                                    onClick={() => navigate('/create-item', { state: { token } })}
                                    style={styles.actionButton}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 111, 214, 0.25)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                                    }}
                                >
                                    <span style={styles.actionIcon}>➕</span>
                                    <span style={styles.actionLabel}>Create Item</span>
                                </button>

                                <button 
                                    onClick={() => navigate('/items')}
                                    style={styles.actionButton}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 111, 214, 0.25)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                                    }}
                                >
                                    <span style={styles.actionIcon}>📚</span>
                                    <span style={styles.actionLabel}>Browse All</span>
                                </button>

                                <button 
                                    onClick={() => setShowSupportModal(true)}
                                    style={{...styles.actionButton, ...styles.supportButton}}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(230, 126, 34, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                                    }}
                                >
                                    <span style={styles.actionIcon}>💬</span>
                                    <span style={styles.actionLabel}>Get Support</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Right Column - Recent Items */}
                    <section style={styles.rightColumn}>
                        <div style={styles.recentItemsCard}>
                            <div style={styles.recentHeader}>
                                <h3 style={styles.recentTitle}>Recent Items</h3>
                                <button 
                                    onClick={() => navigate('/items')}
                                    style={styles.viewAllButton}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#6b5fc7'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#7c6fd6'}
                                >
                                    View all →
                                </button>
                            </div>

                            {loadingItems ? (
                                <div style={styles.itemsLoading}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} style={styles.skeletonItem}>
                                            <div style={styles.skeletonIcon}></div>
                                            <div style={styles.skeletonContent}>
                                                <div style={styles.skeletonTitle}></div>
                                                <div style={styles.skeletonMeta}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentItems.length > 0 ? (
                                <div style={styles.itemsList}>
                                    {recentItems.map((item, index) => (
                                        <div 
                                            key={item.id || index} 
                                            style={styles.itemCard}
                                            onClick={() => navigate(`/items/${item.documentId}`, { state: { token } })}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                                e.currentTarget.style.borderColor = '#7c6fd6';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#fff';
                                                e.currentTarget.style.borderColor = '#e8eef3';
                                            }}
                                        >
                                            <div style={styles.itemIconWrapper}>
                                                <span style={styles.itemIcon}>
                                                    <img src={getCategoryIcon(item?.item_category?.name || item || '')} alt="Category Icon" style={{ width: '40px', height: '30px' }}/>
                                                </span>
                                            </div>
                                            <div style={styles.itemInfo}>
                                                <h4 style={styles.itemTitle}>
                                                    {item.title || item.name || 'Untitled Item'}
                                                </h4>
                                                <div style={styles.itemMeta}>
                                                    {item.author && (
                                                        <span style={styles.itemAuthor}>
                                                            by {formatName(item.author)}
                                                        </span>
                                                    )}
                                                    {(item.createdAt || item.created_at || item.publishedAt) && (
                                                        <span style={styles.itemDate}>
                                                            📅 {formatDate(item.createdAt || item.created_at || item.publishedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p style={styles.itemDescription}>
                                                        {item.description.length > 80 
                                                            ? item.description.substring(0, 80) + '...' 
                                                            : item.description}
                                                    </p>
                                                )}
                                            </div>
                                            <span style={styles.itemArrow}>›</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={styles.emptyState}>
                                    <div style={styles.emptyIcon}>📭</div>
                                    <p style={styles.emptyText}>No items posted yet</p>
                                    <button 
                                        onClick={() => navigate('/create-item', { state: { token } })}
                                        style={styles.emptyButton}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6b5fc7'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7c6fd6'}
                                    >
                                        Create the first item
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(5deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

const styles = {
    // Page wrapper
    pageWrapper: {
        minHeight: '100vh',
        backgroundColor: '#f4f7fa',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    },

    // Main content
    mainContent: {
        flex: 1,
        padding: '2rem',
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
    },

    // Welcome header
    welcomeHeader: {
        background: 'linear-gradient(135deg, #2d5b84 0%, #7c6fd6 100%)',
        borderRadius: '20px',
        padding: '2.5rem 3rem',
        marginBottom: '2rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(45, 91, 132, 0.3)',
    },

    welcomeContent: {
        position: 'relative',
        zIndex: 2,
    },

    welcomeTag: {
        display: 'inline-block',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: '0.4rem 1rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: '1rem',
        backdropFilter: 'blur(10px)',
    },

    welcomeTitle: {
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
        fontWeight: '700',
        marginBottom: '0.5rem',
        letterSpacing: '-0.5px',
    },

    welcomeSubtitle: {
        fontSize: '1.1rem',
        opacity: 0.85,
        margin: 0,
        fontWeight: '400',
    },

    welcomeDecor: {
        position: 'absolute',
        right: '-50px',
        top: '-50px',
        width: '300px',
        height: '300px',
    },

    decorCircle1: {
        position: 'absolute',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        right: '20px',
        top: '20px',
    },

    decorCircle2: {
        position: 'absolute',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        right: '80px',
        top: '80px',
    },

    // Two column layout
    twoColumnGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '2rem',
    },

    // Left column
    leftColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },

    // Profile card
    profileCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e8eef3',
    },

    profileHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #e8eef3',
    },

    profileHeaderInfo: {
        flex: 1,
    },

    profileName: {
        fontSize: '1.4rem',
        fontWeight: '700',
        color: '#1a2f44',
        margin: '0 0 0.5rem 0',
    },

    roleTag: {
        display: 'inline-block',
        backgroundColor: '#f0eeff',
        color: '#7c6fd6',
        padding: '0.3rem 0.8rem',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: '600',
    },

    profileDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },

    detailRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        padding: '0.75rem',
        borderRadius: '10px',
        backgroundColor: '#f8fafc',
        transition: 'all 0.2s ease',
    },

    detailIcon: {
        fontSize: '1.1rem',
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },

    detailContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
    },

    detailLabel: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#8899a8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },

    detailValue: {
        fontSize: '0.95rem',
        fontWeight: '500',
        color: '#1a2f44',
        wordBreak: 'break-word',
    },

    // Actions card
    actionsCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e8eef3',
    },

    actionsTitle: {
        fontSize: '1rem',
        fontWeight: '700',
        color: '#1a2f44',
        margin: '0 0 1rem 0',
    },

    actionsGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },

    actionButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        backgroundColor: 'white',
        border: '1px solid #e8eef3',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        textAlign: 'left',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },

    supportButton: {
        borderColor: '#fde8d7',
        backgroundColor: '#fffbf8',
    },

    actionIcon: {
        fontSize: '1.2rem',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f7fa',
        borderRadius: '10px',
    },

    actionLabel: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#1a2f44',
    },

    // Right column
    rightColumn: {
        display: 'flex',
        flexDirection: 'column',
    },

    recentItemsCard: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e8eef3',
        flex: 1,
    },

    recentHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e8eef3',
    },

    recentTitle: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#1a2f44',
        margin: 0,
    },

    viewAllButton: {
        background: 'none',
        border: 'none',
        color: '#7c6fd6',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'color 0.2s ease',
        padding: '0.25rem 0.5rem',
    },

    itemsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },

    itemCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #e8eef3',
        backgroundColor: '#fff',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },

    itemIconWrapper: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: '#f4f7fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    itemIcon: {
        fontSize: '1.4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },

    itemInfo: {
        flex: 1,
        minWidth: 0,
    },

    itemTitle: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#1a2f44',
        margin: '0 0 0.25rem 0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },

    itemMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
    },

    itemAuthor: {
        fontSize: '0.8rem',
        color: '#5a7fa8',
        fontWeight: '500',
    },

    itemDate: {
        fontSize: '0.75rem',
        color: '#7c6fd6',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
    },

    itemDescription: {
        fontSize: '0.85rem',
        color: '#6b7c8a',
        margin: '0.5rem 0 0 0',
        lineHeight: '1.4',
    },

    itemArrow: {
        fontSize: '1.5rem',
        color: '#c5d1db',
        fontWeight: '300',
        transition: 'color 0.2s ease',
    },

    // Loading skeleton
    itemsLoading: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },

    skeletonItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid #e8eef3',
    },

    skeletonIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: '#e8eef3',
        animation: 'pulse 1.5s ease-in-out infinite',
    },

    skeletonContent: {
        flex: 1,
    },

    skeletonTitle: {
        height: '16px',
        backgroundColor: '#e8eef3',
        borderRadius: '4px',
        width: '70%',
        marginBottom: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
    },

    skeletonMeta: {
        height: '12px',
        backgroundColor: '#e8eef3',
        borderRadius: '4px',
        width: '40%',
        animation: 'pulse 1.5s ease-in-out infinite',
    },

    // Empty state
    emptyState: {
        textAlign: 'center',
        padding: '3rem 1rem',
    },

    emptyIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
        animation: 'float 3s ease-in-out infinite',
    },

    emptyText: {
        fontSize: '1rem',
        color: '#8899a8',
        marginBottom: '1.5rem',
    },

    emptyButton: {
        backgroundColor: '#7c6fd6',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    },

    // Error state
    errorContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f7fa',
        padding: '2rem',
    },

    errorCard: {
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
    },

    errorIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },

    errorTitle: {
        color: '#e74c3c',
        marginBottom: '1rem',
        fontSize: '1.5rem',
        fontWeight: '700',
    },

    errorText: {
        color: '#6b7c8a',
        marginBottom: '0.5rem',
    },

    redirectText: {
        fontSize: '0.9rem',
        color: '#8899a8',
    },

    // Loading state
    loadingContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f7fa',
    },

    loadingCard: {
        textAlign: 'center',
    },

    spinner: {
        width: '48px',
        height: '48px',
        border: '4px solid #e8eef3',
        borderTop: '4px solid #7c6fd6',
        borderRadius: '50%',
        margin: '0 auto 1rem',
        animation: 'spin 1s linear infinite',
    },

    loadingText: {
        color: '#6b7c8a',
        fontSize: '1rem',
    },

    // Modal styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease',
    },

    modalContent: {
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '2.5rem',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        animation: 'slideUp 0.3s ease',
    },

    modalClose: {
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '1.2rem',
        color: '#8899a8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    },

    modalIcon: {
        fontSize: '3.5rem',
        marginBottom: '1rem',
    },

    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#1a2f44',
        margin: '0 0 0.75rem 0',
    },

    modalText: {
        fontSize: '0.95rem',
        color: '#6b7c8a',
        lineHeight: '1.6',
        margin: '0 0 1.5rem 0',
    },

    emailContainer: {
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1rem',
    },

    emailLabel: {
        display: 'block',
        fontSize: '0.8rem',
        color: '#8899a8',
        marginBottom: '0.75rem',
        fontWeight: '500',
    },

    emailLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#7c6fd6',
        color: 'white',
        padding: '0.75rem 1.5rem',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'background-color 0.2s ease',
    },

    modalFooter: {
        fontSize: '0.85rem',
        color: '#8899a8',
        margin: 0,
        fontStyle: 'italic',
    },
};

export default PersonalPage;