import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { base_url, discourse_url } from "../api";
import { jwtDecode } from "jwt-decode";
import Navbar from "../components/navbar.jsx";
import QRCode from "qrcode";

const logo_neolaia = "/logoNEOLAiA.png";
const eu_logo = "/eu_logo.png";

function ItemDetail() {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [relatedData, setRelatedData] = useState({
        university: null,
        category: null,
        secondLevelStructure: null
    });
    const [coverImage, setCoverImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInterested, setIsInterested] = useState(false);
    const [interestLoading, setInterestLoading] = useState(false);
    const [interestMessage, setInterestMessage] = useState(null);
    const [userData, setUserData] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // New state for share features
    const [showShareModal, setShowShareModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [virtualCafeLink, setVirtualCafeLink] = useState(null);

    // Get base URL without /api for uploads
    const getUploadBaseUrl = () => {
        return base_url.replace('/api', '');
    };

    const token = location.state?.token || localStorage.getItem("token");

    // Get current page URL
    const getCurrentPageUrl = () => {
        return window.location.href;
    };

    // Generate QR Code
    const generateQRCode = async (url) => {
        try {
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#213547',
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (err) {
            console.error('Error generating QR code:', err);
        }
    };

    // Copy link to clipboard
    const handleCopyLink = async () => {
        const url = getCurrentPageUrl();
        try {
            await navigator.clipboard.writeText(url);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    // Open share modal
    const handleShareClick = () => {
        const url = getCurrentPageUrl();
        generateQRCode(url);
        setShowShareModal(true);
    };

    // Download QR Code
    const handleDownloadQR = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.download = `${item.name.replace(/\s+/g, '_')}_QRCode.png`;
            link.href = qrCodeUrl;
            link.click();
        }
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
                setTimeout(() => navigate("/login", { 
                    state: { from: `/items/${documentId}` }
                }), 2000);
            }
        } else {
            setError("No token provided");
            setTimeout(() => navigate("/login", { 
                state: { from: `/items/${documentId}` }
            }), 2000);
        }
    }, [token, navigate, documentId]);

    useEffect(() => {
        if (userData) {
            fetchItemDetails();
        }
    }, [documentId, userData]);

    const fetchItemDetails = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch main item data with interested_users populated
            const itemResponse = await axios.get(`${base_url}/items/${documentId}?populate=*`);
            const itemData = itemResponse.data.data;
            setItem(itemData);

            // Check if current user is already interested
            if (userData && itemData.interested_users && Array.isArray(itemData.interested_users)) {
                const userIsInterested = itemData.interested_users.some(
                    user => user.documentId === userData.user_id
                );
                setIsInterested(userIsInterested);
            }
            
            // Fetch related data in parallel
            const promises = [];

            if (itemData.coverId) {
                promises.push(
                    axios.get(`${base_url}/upload/files/${itemData.coverId}`)
                        .then(res => ({ coverImage: res.data }))
                        .catch(err => {
                            console.error("Error fetching cover image:", err);
                            return { coverImage: null };
                        })
                );
            }

            const results = await Promise.all(promises);
            
            // Merge all related data
            const mergedData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
            setRelatedData({
                university: mergedData.university,
                category: mergedData.category,
                secondLevelStructure: mergedData.secondLevelStructure
            });
            setCoverImage(mergedData.coverImage);
            setVirtualCafeLink(`${discourse_url}/c/${itemData.category_name}` || null);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching item details:", err);
            setError("Failed to load item details. Please try again.");
            setLoading(false);
        }
    };

    const handleInterestClick = async () => {
        if (!token) {
            setInterestMessage({
                type: 'error',
                text: 'Please log in to express interest'
            });
            setTimeout(() => setInterestMessage(null), 3000);
            return;
        }

        setInterestLoading(true);
        setInterestMessage(null);

        try {
            const response = await axios.post(`${base_url}/custom-item/interest/`, {
                item_id: documentId,
                token: token,
            });
            
        if (response.status === 200) {
            console.log(item);
            setIsInterested(true);
            console.log("Interest recorded successfully:", response.data);
            const message = response.data.message || 'You have been added to the Virtual Cafè discussion group!';
            const groupLink = `${discourse_url}/c/${item.category_name}` || null;
            console.log("Virtual Café group link:", groupLink); 
            // Store the Virtual Café link
            setVirtualCafeLink(groupLink);
            
            setInterestMessage({
                type: 'success',
                text: message,
                link: groupLink 
            });
            
            await fetchItemDetails();
            
            //setTimeout(() => setInterestMessage(null), 10000);
        }
        } catch (err) {
            console.error("Error expressing interest:", err);
            
            let errorText = 'Failed to record interest. Please try again.';
            if (err.response?.status === 401) {
                errorText = 'Session expired. Please log in again.';
            } else if (err.response?.data?.message) {
                errorText = err.response.data.message;
            }

            setInterestMessage({
                type: 'error',
                text: errorText
            });

            // Clear error message after 5 seconds
            setTimeout(() => setInterestMessage(null), 5000);
        } finally {
            setInterestLoading(false);
        }
    };

    const handleRemoveInterestClick = async () => {
        if (!token) {
            setInterestMessage({
                type: 'error',
                text: 'Please log in to remove interest'
            });
            setTimeout(() => setInterestMessage(null), 3000);
            return;
        }

        setInterestLoading(true);
        setInterestMessage(null);

        try {
            const response = await axios.post(`${base_url}/custom-item/remove-interest/`, {
                item_id: documentId,
                token: token,
            });
            
            if (response.status === 200) {
                setIsInterested(false);
                setVirtualCafeLink(null); // Clear the Virtual Café link
                setInterestMessage({
                    type: 'success',
                    text: response.data.message || 'You have been removed from the Virtual Cafè discussion group.'
                });
                // Refresh item data to update interested_users
                await fetchItemDetails();
                // Clear message after 3 seconds
                setTimeout(() => setInterestMessage(null), 3000);
            }
        } catch (err) {
            console.error("Error removing interest:", err);
            
            let errorText = 'Failed to remove interest. Please try again.';
            if (err.response?.status === 401) {
                errorText = 'Session expired. Please log in again.';
            } else if (err.response?.data?.message) {
                errorText = err.response.data.message;
            }

            setInterestMessage({
                type: 'error',
                text: errorText
            });

            // Clear error message after 5 seconds
            setTimeout(() => setInterestMessage(null), 5000);
        } finally {
            setInterestLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
    };

    const handleDeleteConfirm = async () => {
        if (!token) {
            setInterestMessage({
                type: 'error',
                text: 'Please log in to delete this item'
            });
            setTimeout(() => setInterestMessage(null), 3000);
            setShowDeleteModal(false);
            return;
        }

        setDeleteLoading(true);
        setInterestMessage(null);
        try {
            const response = await axios.post(`${base_url}/custom-item/remove-item/`, {
                item_id: documentId,
                token: token
            });
            
            if (response.status === 200 || response.status === 204) {
                setShowDeleteModal(false);
                setInterestMessage({
                    type: 'success',
                    text: 'Item deleted successfully. Redirecting...'
                });
                setTimeout(() => navigate('/items'), 2000);
            }
        } catch (err) {
            console.error("Error deleting item:", err);
            
            let errorText = 'Failed to delete item. Please try again.';
            if (err.response?.status === 401) {
                errorText = 'Session expired. Please log in again.';
            } else if (err.response?.status === 403) {
                errorText = 'You do not have permission to delete this item.';
            } else if (err.response?.data?.message) {
                errorText = err.response.data.message;
            }

            setInterestMessage({
                type: 'error',
                text: errorText
            });

            // Clear error message after 5 seconds
            setTimeout(() => setInterestMessage(null), 5000);
            setShowDeleteModal(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
            const uploadBaseUrl = getUploadBaseUrl();
            if (coverImage.formats?.large) {
                return `${uploadBaseUrl}${coverImage.formats.large.url}`;
            }
            return `${uploadBaseUrl}${coverImage.url}`;
        }
        return 'https://placehold.co/1200x400?text=No+Cover+Image';
    };

    // Helper function to format ISCED display
    const formatIscedField = (field) => {
        if (!field) return null;
        const code = field.code || '';
        const description = field.description || field.attributes?.description || '';
        return code && description ? `${code} - ${description}` : (code || description || null);
    };

    // Check if any ISCED field is present
    const hasIscedData = () => {
        return item?.isced_broad_field || item?.isced_narrow_field || item?.isced_detailed_field;
    };

    if (loading) {
        return (
            <div style={{ 
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa'
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
                    <p style={{ marginTop: '1rem', color: '#6c757d' }}>Loading item details...</p>
                </div>
            </div>
        );
    }

    if (error || !item) {
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
                    maxWidth: '500px'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                    <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Error</h2>
                    <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                        {error || "Item not found"}
                    </p>
                    <button
                        onClick={() => navigate('/items')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#7c6fd6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Back to Items
                    </button>
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
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
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

            <Navbar token={token} />

            {/* Main Content */}
            <div style={{
                flex: 1,
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto',
                padding: '2rem 1rem'
            }}>
                {/* Notification Message */}
                {interestMessage && (
                    <div style={{
                        animation: 'slideDown 0.3s ease-out',
                        marginBottom: '1rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        backgroundColor: interestMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                        border: `1px solid ${interestMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                        color: interestMessage.type === 'success' ? '#155724' : '#721c24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontWeight: '500'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>
                            {interestMessage.type === 'success' ? '✓' : '⚠'}
                        </span>
                        <div style={{ flex: 1 }}>
                            {interestMessage.text}
                        </div>
                    </div>
                )}

                {/* Back Button and Share Button Row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={() => navigate('/items')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'transparent',
                            color: '#7c6fd6',
                            border: '2px solid #7c6fd6',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
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
                        ← Back to Items
                    </button>

                    <button
                        onClick={handleShareClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#7c6fd6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 8px rgba(124, 111, 214, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(124, 111, 214, 0.3)';
                        }}
                    >
                        <span>🔗</span>
                        <span>Share</span>
                    </button>
                </div>

                {/* Cover Image */}
                <div style={{
                    width: '100%',
                    height: '250px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                    <img 
                        src={getCoverImageUrl()}
                        alt={item.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onError={(e) => {
                            e.target.src = 'https://placehold.co/1200x400?text=No+Image';
                        }}
                    />
                </div>

                {/* Virtual Café Link Banner for Interested Users */}
                {((isInterested && virtualCafeLink) || (userData?.user_id === item.seller?.documentId && virtualCafeLink)) && (
                    <div style={{
                        animation: 'slideDown 0.3s ease-out',
                        marginBottom: '2rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>☕</span>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                    Virtual Cafè Discussion
                                </div>
                                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                    Join the conversation about this item
                                </div>
                            </div>
                        </div>
                        <a 
                            href={virtualCafeLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                border: '2px solid white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                transition: 'all 0.3s',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = '#667eea';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                e.target.style.color = 'white';
                            }}
                        >
                            Open Discussion →
                        </a>
                    </div>
                )}

                {/* Main Content Card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '2rem',
                    marginBottom: '2rem'
                }}>
                    {/* Status Badge and Action Buttons Row */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            backgroundColor: getStatusColor(item.item_status),
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                        }}>
                            {item.item_status}
                        </span>

                        {/* Action Buttons - Show different buttons based on ownership */}
                        {token && userData && item.seller && (
                            userData.user_id === item.seller.documentId ? (
                                /* Owner Buttons - Modify and Delete */
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => navigate(`/items/${documentId}/edit`)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#7c6fd6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 2px 8px rgba(124, 111, 214, 0.3)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 2px 8px rgba(124, 111, 214, 0.3)';
                                        }}
                                    >
                                        <span>✏️</span>
                                        <span>Modify</span>
                                    </button>
                                    <button
                                        onClick={handleDeleteClick}
                                        disabled={deleteLoading}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.75rem 1.5rem',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            fontSize: '1rem',
                                            transition: 'all 0.3s',
                                            opacity: deleteLoading ? 0.7 : 1,
                                            boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!deleteLoading) {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!deleteLoading) {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.3)';
                                            }
                                        }}
                                    >
                                        <span>🗑️</span>
                                        <span>Delete</span>
                                    </button>
                                </div>
                            ) : (
                                /* Interest Buttons for non-owners */
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    {!isInterested ? (
                                        <button
                                            onClick={handleInterestClick}
                                            disabled={interestLoading}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: '#7c6fd6',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: interestLoading ? 'not-allowed' : 'pointer',
                                                fontWeight: '600',
                                                fontSize: '1rem',
                                                transition: 'all 0.3s',
                                                opacity: interestLoading ? 0.7 : 1,
                                                boxShadow: '0 2px 8px rgba(124, 111, 214, 0.3)'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!interestLoading) {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.4)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!interestLoading) {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 2px 8px rgba(124, 111, 214, 0.3)';
                                                }
                                            }}
                                        >
                                            {interestLoading ? (
                                                <>
                                                    <div style={{
                                                        width: '1rem',
                                                        height: '1rem',
                                                        border: '2px solid #ffffff',
                                                        borderTop: '2px solid transparent',
                                                        borderRadius: '50%',
                                                        animation: 'spin 0.8s linear infinite'
                                                    }}></div>
                                                    <span>Processing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>💡</span>
                                                    <span>I'm Interested</span>
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                disabled
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.75rem 1.5rem',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'not-allowed',
                                                    fontWeight: '600',
                                                    fontSize: '1rem',
                                                    opacity: 0.9,
                                                    boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                                                }}
                                            >
                                                <span>✓</span>
                                                <span>Already Interested</span>
                                            </button>
                                            <button
                                                onClick={handleRemoveInterestClick}
                                                disabled={interestLoading}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.75rem 1.5rem',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: interestLoading ? 'not-allowed' : 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '1rem',
                                                    transition: 'all 0.3s',
                                                    opacity: interestLoading ? 0.7 : 1,
                                                    boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!interestLoading) {
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!interestLoading) {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.3)';
                                                    }
                                                }}
                                            >
                                                {interestLoading ? (
                                                    <>
                                                        <div style={{
                                                            width: '1rem',
                                                            height: '1rem',
                                                            border: '2px solid #ffffff',
                                                            borderTop: '2px solid transparent',
                                                            borderRadius: '50%',
                                                            animation: 'spin 0.8s linear infinite'
                                                        }}></div>
                                                        <span>Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>✕</span>
                                                        <span>Remove Interest</span>
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                        fontWeight: '700',
                        color: '#213547',
                        marginBottom: '1rem',
                        lineHeight: '1.2'
                    }}>
                        {item.name}
                    </h1>

                    {/* Meta Info Bar */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1.5rem',
                        paddingBottom: '1.5rem',
                        marginBottom: '1.5rem',
                        borderBottom: '2px solid #e9ecef'
                    }}>
                        {item.seller_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>👤</span>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: '600' }}>
                                        Offered By
                                    </div>
                                    <div style={{ fontWeight: '600', color: '#495057' }}>
                                        {item.seller.full_name}
                                    </div>
                                </div>
                            </div>
                        )}

                        {item.createdAt && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>📅</span>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: '600' }}>
                                            Added to Platform
                                        </div>
                                        <div style={{ fontWeight: '600', color: '#495057' }}>
                                            {formatDate(item.createdAt)}
                                        </div>
                                    </div>
                                </div>
                        )}

                        {item.languages && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: '600' }}>
                                        Languages
                                    </div>
                                    <div style={{ fontWeight: '600', color: '#495057' }}>
                                        {item.languages}
                                    </div>
                                </div>
                            </div>
                        )}

                        {item.item_category && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>📁</span>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: '600' }}>
                                        Category
                                    </div>
                                    <div style={{ fontWeight: '600', color: '#495057' }}>
                                        {item.item_category?.name || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {item.description && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: '#213547',
                                marginBottom: '1rem'
                            }}>
                                Description
                            </h2>
                            <p style={{
                                textAlign: 'justify',
                                fontSize: '1.1rem',
                                lineHeight: '1.7',
                                color: '#495057',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {item.description}
                            </p>
                        </div>
                    )}

                    {/* Dates Section */}
                    {(item.start_date || item.end_date || item.expiration) && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px'
                        }}>
                            {item.start_date && (
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        Start Date
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#495057' }}>
                                        📅 {formatDate(item.start_date)}
                                    </div>
                                </div>
                            )}
                            {item.end_date && (
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        End Date
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#495057' }}>
                                        📅 {formatDate(item.end_date)}
                                    </div>
                                </div>
                            )}
                            {item.expiration && (
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: '600', marginBottom: '0.25rem' }}>
                                        Expiration Date
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#495057' }}>
                                        ⏰ {formatDate(item.expiration)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Additional Information Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Learning Outcomes */}
                    {item.learning_outcomes && (
                        <InfoCard 
                            title="Learning Outcomes"
                            icon="🎯"
                            content={item.learning_outcomes}
                        />
                    )}

                    {/* Pedagogical Objectives */}
                    {item.pedagogical_objectives && (
                        <InfoCard 
                            title="Pedagogical Objectives"
                            icon="📚"
                            content={item.pedagogical_objectives}
                        />
                    )}

                    {/* Multimedia Material */}
                    {item.multimedial_material_provided && (
                        <InfoCard 
                            title="Multimedia Material"
                            icon="🎬"
                            content={item.multimedial_material_provided}
                        />
                    )}

                    {/* Speakers */}
                    {item.speakers && (
                        <InfoCard 
                            title="Speakers"
                            icon="🎤"
                            content={item.speakers}
                        />
                    )}

                    {/* Level of Study */}
                    {item.level_of_study && (
                        <InfoCard 
                            title="Level of Study"
                            icon="🎓"
                            content={item.level_of_study}
                        />
                    )}
                </div>

                {/* ISCED Classification Section */}
                {hasIscedData() && (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <h2 style={{
                            fontSize: '1.75rem',
                            fontWeight: '600',
                            color: '#213547',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <span>🔢</span>
                            ISCED Classification
                        </h2>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            {/* ISCED Hierarchy Visualization */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                {/* Broad Field */}
                                {item.isced_broad_field && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div style={{
                                            width: '120px',
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#7c6fd6',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            textAlign: 'center'
                                        }}>
                                            Broad Field
                                        </div>
                                        <div style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#f0f0ff',
                                            borderRadius: '8px',
                                            border: '2px solid #7c6fd6',
                                            color: '#495057',
                                            fontWeight: '500'
                                        }}>
                                            {formatIscedField(item.isced_broad_field)}
                                        </div>
                                    </div>
                                )}

                                {/* Narrow Field */}
                                {item.isced_narrow_field && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        marginLeft: '2rem'
                                    }}>
                                        <div style={{
                                            width: '120px',
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#5a4fcf',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            textAlign: 'center'
                                        }}>
                                            Narrow Field
                                        </div>
                                        <div style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#e8e6f8',
                                            borderRadius: '8px',
                                            border: '2px solid #5a4fcf',
                                            color: '#495057',
                                            fontWeight: '500'
                                        }}>
                                            {formatIscedField(item.isced_narrow_field)}
                                        </div>
                                    </div>
                                )}

                                {/* Detailed Field */}
                                {item.isced_detailed_field && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        marginLeft: '4rem'
                                    }}>
                                        <div style={{
                                            width: '120px',
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#4a3fc0',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            textAlign: 'center'
                                        }}>
                                            Detailed Field
                                        </div>
                                        <div style={{
                                            flex: 1,
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#e0ddf5',
                                            borderRadius: '8px',
                                            border: '2px solid #4a3fc0',
                                            color: '#495057',
                                            fontWeight: '500'
                                        }}>
                                            {formatIscedField(item.isced_detailed_field)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Academic Information */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '2rem',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: '600',
                        color: '#213547',
                        marginBottom: '1.5rem'
                    }}>
                        Academic Information
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {/* University */}
                        {item.university && (
                            <DetailItem 
                                label="University"
                                value={item.university?.university_name || 'N/A'}
                            />
                        )}

                        {/* First Level Structure */}
                        {item.first_level_structure && (
                            <DetailItem 
                                label="First Level Structure"
                                value={item.first_level_structure.name || 'N/A'}
                            />
                        )}

                        {/* Second Level Structure */}
                        {item.second_level_structure && (
                            <DetailItem 
                                label="Second Level Structure"
                                value={item.second_level_structure?.name || item.second_level_structure?.name || 'N/A'}
                            />
                        )}

                        {/* ERC Area */}
                        {item.erc_area && (
                            <DetailItem 
                                label="ERC Area"
                                value={item.erc_area}
                            />
                        )}

                        {/* ERC Panel */}
                        {item.erc_panel && (
                            <DetailItem 
                                label="ERC Panel"
                                value={item.erc_panel.name || 'N/A'}
                            />
                        )}

                        {/* ERC Keyword */}
                        {item.erc_keyword && (
                            <DetailItem 
                                label="ERC Keyword"
                                value={item.erc_keyword.name || 'N/A'}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
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
                    animation: 'fadeIn 0.2s ease-out',
                    padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ 
                                fontSize: '3rem', 
                                marginBottom: '1rem'
                            }}>
                                🔗
                            </div>
                            <h3 style={{ 
                                color: '#213547', 
                                margin: '0 0 0.5rem 0',
                                fontSize: '1.5rem',
                                fontWeight: '600'
                            }}>
                                Share this Item
                            </h3>
                            <p style={{ 
                                color: '#6c757d', 
                                margin: 0,
                                fontSize: '0.95rem'
                            }}>
                                Copy the link or scan the QR code
                            </p>
                        </div>

                        {/* QR Code */}
                        {qrCodeUrl && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <img 
                                    src={qrCodeUrl} 
                                    alt="QR Code" 
                                    style={{
                                        width: '250px',
                                        height: '250px',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '12px',
                                        padding: '1rem'
                                    }}
                                />
                            </div>
                        )}

                        {/* URL Display */}
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #dee2e6',
                            wordBreak: 'break-all',
                            fontSize: '0.875rem',
                            color: '#495057'
                        }}>
                            {getCurrentPageUrl()}
                        </div>
                        
                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <button
                                onClick={handleCopyLink}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: copySuccess ? '#28a745' : '#7c6fd6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (!copySuccess) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <span>{copySuccess ? '✓' : '📋'}</span>
                                <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                            </button>

                            <button
                                onClick={handleDownloadQR}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <span>⬇️</span>
                                <span>Download QR</span>
                            </button>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowShareModal(false)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#f8f9fa',
                                color: '#495057',
                                border: '1px solid #dee2e6',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#e9ecef';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#f8f9fa';
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
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
                                Are you sure you want to delete "<strong>{item.name}</strong>"? 
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
                                disabled={deleteLoading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#f8f9fa',
                                    color: '#495057',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: deleteLoading ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!deleteLoading) {
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
                                disabled={deleteLoading}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: deleteLoading 
                                        ? '#adb5bd' 
                                        : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (!deleteLoading) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                {deleteLoading ? (
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
        </div>
    );
}

// Helper Components
function InfoCard({ title, icon, content }) {
    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            height: '100%'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
            }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#213547',
                    margin: 0
                }}>
                    {title}
                </h3>
            </div>
            <p style={{
                textAlign: 'justify',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: '#495057',
                margin: 0,
                whiteSpace: 'pre-wrap'
            }}>
                {content}
            </p>
        </div>
    );
}

function DetailItem({ label, value }) {
    return (
        <div>
            <div style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#6c757d',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.5rem'
            }}>
                {label}
            </div>
            <div style={{
                fontSize: '1.05rem',
                fontWeight: '500',
                color: '#213547'
            }}>
                {value}
            </div>
        </div>
    );
}

export default ItemDetail;