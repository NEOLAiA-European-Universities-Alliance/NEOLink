import { useNavigate } from "react-router-dom";
import { base_url } from "../api";
import { useState, useEffect } from "react";
import axios from "axios";

function ItemCard({ item }) {
    const navigate = useNavigate();
    const [coverImage, setCoverImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        const fetchCoverImage = async () => {
            if (item.coverId) {
                try {
                    const response = await axios.get(`${base_url}/upload/files/${item.coverId}`);
                    setCoverImage(response.data);
                    setImageLoading(false);
                } catch (err) {
                    console.error("Error fetching cover image:", err);
                    setImageLoading(false);
                }
            } else {
                setImageLoading(false);
            }
        };

        fetchCoverImage();
    }, [item.coverId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'active': return '#28a745';
            case 'running': return '#007bff';
            case 'expired': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getCoverImageUrl = () => {
        if (coverImage && coverImage.url) {
            // Use the medium format if available, otherwise use the original
            if (coverImage.formats?.small) {
                console.log("Using medium format for cover image");
                let img_url = base_url.replace('/api', '');
                return `${img_url}${coverImage.formats.small.url}`;
            } else if (coverImage.formats?.thumbnail) {
                console.log("Using thumbnail format for cover image");
                let img_url = base_url.replace('/api', '');
                return `${img_url}${coverImage.formats.thumbnail.url}`;
            } else if (coverImage.formats?.medium) {
                console.log("Using medium format for cover image");
                let img_url = base_url.replace('/api', '');
                return `${img_url}${coverImage.formats.medium.url}`;
            } else if (coverImage.formats?.large) {
                console.log("Using large format for cover image");
                let img_url = base_url.replace('/api', '');
                return `${img_url}${coverImage.formats.large.url}`;
            }
            return `${base_url}${coverImage.url}`;
        }
        return 'https://placehold.co/400x250?text=No+Image';
    };

    return (
        <div 
            onClick={() => navigate(`/items/${item.documentId}`)}
            style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 111, 214, 0.3)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
        >
            {/* Cover Image */}
            <div style={{
                width: '100%',
                height: '200px',
                overflow: 'hidden',
                backgroundColor: '#f8f9fa',
                position: 'relative'
            }}>
                {imageLoading ? (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '2rem',
                            height: '2rem',
                            border: '0.25rem solid #f3f3f3',
                            borderTop: '0.25rem solid #7c6fd6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    </div>
                ) : (
                    <img 
                        src={getCoverImageUrl()}
                        alt={item.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/400x250?text=No+Image';
                        }}
                    />
                )}
            </div>

            {/* Card Content */}
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Status Badge */}
                <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: getStatusColor(item.item_status),
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                    }}>
                        {item.item_status}
                    </span>
                </div>

                {/* Title */}
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#213547',
                    marginBottom: '0.75rem',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {item.name}
                </h3>

                {/* Description */}
                <p style={{
                    fontSize: '0.9rem',
                    color: '#6c757d',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1
                }}>
                    {item.description || 'No description available'}
                </p>

                {/* Meta Info */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e9ecef',
                    fontSize: '0.85rem'
                }}>
                    {item.seller_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#6c757d' }}>👤</span>
                            <span style={{ color: '#495057', fontWeight: '500' }}>{item.seller_name}</span>
                        </div>
                    )}
                    
                    {item.languages && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#6c757d' }}>🌐</span>
                            <span style={{ color: '#495057' }}>{item.languages}</span>
                        </div>
                    )}

                    {(item.start_date || item.end_date) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#6c757d' }}>📅</span>
                            <span style={{ color: '#495057' }}>
                                {formatDate(item.start_date)} - {formatDate(item.end_date)}
                            </span>
                        </div>
                    )}
                </div>

                {/* View Details Button */}
                <button
                    style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#7c6fd6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#6b5fc5';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#7c6fd6';
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/items/${item.documentId}`);
                    }}
                >
                    View Details →
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default ItemCard;