import { useNavigate } from "react-router-dom";
import { base_url } from "../api";
import { useState, useEffect } from "react";
import axios from "axios";
import { getCategoryFallbackImage } from "../utils.jsx";

function ItemCard({ item }) {
    const navigate = useNavigate();
    const [coverImage, setCoverImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return `${text.slice(0, maxLength)}...`;
    };

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

    const languageChips = typeof item.languages === 'string'
        ? item.languages
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [];

    const getCoverImageUrl = () => {
        if (coverImage && coverImage.url) {
            const uploadBaseUrl = base_url.replace('/api', '');
            // Use the medium format if available, otherwise use the original
            if (coverImage.formats?.small) {
                console.log("Using medium format for cover image");
                return `${uploadBaseUrl}${coverImage.formats.small.url}`;
            } else if (coverImage.formats?.thumbnail) {
                console.log("Using thumbnail format for cover image");
                return `${uploadBaseUrl}${coverImage.formats.thumbnail.url}`;
            } else if (coverImage.formats?.medium) {
                console.log("Using medium format for cover image");
                return `${uploadBaseUrl}${coverImage.formats.medium.url}`;
            } else if (coverImage.formats?.large) {
                console.log("Using large format for cover image");
                return `${uploadBaseUrl}${coverImage.formats.large.url}`;
            }
            return `${uploadBaseUrl}${coverImage.url}`;
        }
        return getCategoryFallbackImage(item?.item_category?.name, 'card');
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
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
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
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getCategoryFallbackImage(item?.item_category?.name, 'card');
                        }}
                    />
                )}
            </div>

            {/* Card Content */}
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%' }}>
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
                    minWidth: 0,
                    maxWidth: '100%',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    overflow: 'hidden'
                }}>
                    {truncateText(item.name, 90)}
                </h3>

                {/* Description */}
                <p style={{
                    fontSize: '0.9rem',
                    color: '#6c757d',
                    marginBottom: '1rem',
                    lineHeight: '1.5',
                    minWidth: 0,
                    maxWidth: '100%',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    overflow: 'hidden',
                    flex: 1
                }}>
                    {truncateText(item.description || 'No description available', 150)}
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
                    
                    {languageChips.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{ color: '#6c757d' }}>🌐</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {languageChips.map((language) => (
                                    <span
                                        key={language}
                                        style={{
                                            padding: '0.15rem 0.55rem',
                                            borderRadius: '999px',
                                            backgroundColor: '#eef2ff',
                                            border: '1px solid #d6ddff',
                                            color: '#4c57a8',
                                            fontWeight: '600',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {language}
                                    </span>
                                ))}
                            </div>
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

                    {item.interested_count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#7c6fd6' }}>💡</span>
                            <span style={{ color: '#7c6fd6', fontWeight: '600' }}>
                                {item.interested_count} {item.interested_count === 1 ? 'person' : 'people'} interested
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
