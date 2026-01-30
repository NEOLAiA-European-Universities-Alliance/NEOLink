import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { base_url, discourse_url } from "../api";
import ItemCard from "../components/item_card";
import Navbar from "../components/navbar";

function MyItems() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchMyItems();
    }, [token]);

    const fetchMyItems = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post(
                `${base_url}/custom-item/my-items/`,
                {
                    token: token
                }
            );
            
            setItems(response.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching my items:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            } else {
                setError("Failed to load your items. Please try again.");
            }
            setLoading(false);
        }
    };

    const handleEdit = (itemId) => {
        navigate(`/items/${itemId}/edit`);
    };

    const handleDeleteClick = (item) => {
        setDeleteConfirm(item);
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        
        setDeleting(true);
        try {
            await axios.post(`${base_url}/custom-item/remove-item/`, {
                item_id: deleteConfirm.documentId,
                token: token
            });
            setItems(items.filter(item => item.documentId !== deleteConfirm.documentId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Error deleting item:", err);
            setError("Failed to delete item. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const handleVirtualCafe = (categoryName) => {
        if (categoryName) {
            window.open(`${discourse_url}/c/${categoryName}`, '_blank');
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Navbar token={token} />

            {/* Main Content */}
            <div style={{ 
                flex: 1,
                maxWidth: '1400px',
                width: '100%',
                margin: '0 auto',
                padding: '2rem 1rem'
            }}>
                {/* Page Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h2 style={{ 
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: '#213547',
                            margin: '0 0 0.5rem 0'
                        }}>
                            My Items
                        </h2>
                        <p style={{ color: '#6c757d', margin: 0 }}>
                            {items.length} {items.length === 1 ? 'item' : 'items'} published
                        </p>
                    </div>
                </div>

                {/* Items Grid */}
                <div>
                    {error && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c2c7',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            color: '#842029'
                        }}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ 
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '400px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '3rem',
                                    height: '3rem',
                                    border: '0.3rem solid #f3f3f3',
                                    borderTop: '0.3rem solid #7c6fd6',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    margin: '0 auto'
                                }}></div>
                                <p style={{ marginTop: '1rem', color: '#6c757d' }}>Loading your items...</p>
                            </div>
                        </div>
                    ) : items.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                            <h3 style={{ color: '#213547', marginBottom: '0.5rem' }}>You haven't published any items yet</h3>
                            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                                Start sharing your knowledge by creating your first item
                            </p>
                            <button
                                onClick={() => navigate('/create-item')}
                                style={{
                                    padding: '0.75rem 2rem',
                                    background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                Create Your First Item
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {items.map(item => (
                                <div key={item.id} style={{ position: 'relative' }}>
                                    <ItemCard item={item} />
                                    
                                    {/* Action Buttons Overlay */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.75rem',
                                        right: '0.75rem',
                                        display: 'flex',
                                        gap: '0.5rem',
                                        zIndex: 10
                                    }}>
                                        {/* Virtual Café Button */}
                                        {item.category_name && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleVirtualCafe(item.category_name);
                                                }}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                    color: '#667eea',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.1rem',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                                    e.currentTarget.style.color = 'white';
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                                                    e.currentTarget.style.color = '#667eea';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                                title="Open Virtual Café"
                                            >
                                                ☕
                                            </button>
                                        )}

                                        {/* Edit Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(item.documentId);
                                            }}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                color: '#7c6fd6',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#7c6fd6';
                                                e.currentTarget.style.color = 'white';
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                                                e.currentTarget.style.color = '#7c6fd6';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                            title="Edit item"
                                        >
                                            ✏️
                                        </button>
                                        
                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(item);
                                            }}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                color: '#dc3545',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#dc3545';
                                                e.currentTarget.style.color = 'white';
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                                                e.currentTarget.style.color = '#dc3545';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                            title="Delete item"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div style={{
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
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ 
                                fontSize: '3rem', 
                                marginBottom: '1rem'
                            }}>
                                ⚠️
                            </div>
                            <h3 style={{ 
                                color: '#213547', 
                                margin: '0 0 0.5rem 0',
                                fontSize: '1.25rem'
                            }}>
                                Delete Item?
                            </h3>
                            <p style={{ 
                                color: '#6c757d', 
                                margin: 0,
                                fontSize: '0.95rem'
                            }}>
                                Are you sure you want to delete "<strong>{deleteConfirm.name}</strong>"? 
                                This action cannot be undone.
                            </p>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center'
                        }}>
                            <button
                                onClick={handleDeleteCancel}
                                disabled={deleting}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#f8f9fa',
                                    color: '#495057',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: deleting ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!deleting) {
                                        e.target.style.backgroundColor = '#e9ecef';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: deleting 
                                        ? '#adb5bd' 
                                        : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (!deleting) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                {deleting ? (
                                    <>
                                        <div style={{
                                            width: '1rem',
                                            height: '1rem',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTop: '2px solid white',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }}></div>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

export default MyItems;