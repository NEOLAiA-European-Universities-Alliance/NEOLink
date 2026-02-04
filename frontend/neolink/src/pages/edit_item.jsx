import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { base_url } from "../api";
import { shouldShowField, getCategoryFieldDescription } from "../category_field_config";
import Navbar from "../components/navbar";

function EditItem() {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [userData, setUserData] = useState(null);
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        item_status: 'active',
        name: '',
        description: '',
        item_category: '',
        expiration: '',
        // ISCED hierarchical fields
        isced_broad_field: '',
        isced_narrow_field: '',
        isced_detailed_field: '',
        erc_area: '',
        erc_panel: '',
        erc_keyword: '',
        start_date: '',
        learning_outcomes: '',
        multimediarial_material_provided: '',
        end_date: '',
        languages: '',
        speakers: '',
        pedagogical_objectives: '',
        level_of_study: '',
        university: '',
        first_level_structure: '',
        second_level_structure: '',
        offered_by: '',
        cover: null,
    });

    // Category info
    const [categoryName, setCategoryName] = useState('');

    // Dropdown options from database
    const [universities, setUniversities] = useState([]);
    const [firstLevelStructures, setFirstLevelStructures] = useState([]);
    const [secondLevelStructures, setSecondLevelStructures] = useState([]);
    const [ercPanels, setErcPanels] = useState([]);
    const [ercKeywords, setErcKeywords] = useState([]);

    // ISCED hierarchical dropdowns
    const [iscedBroadFields, setIscedBroadFields] = useState([]);
    const [iscedNarrowFields, setIscedNarrowFields] = useState([]);
    const [iscedDetailedFields, setIscedDetailedFields] = useState([]);

    // Item status options
    const itemStatusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'running', label: 'Running' },
        { value: 'expired', label: 'Expired' }
    ];

    // ERC Area options
    const ercAreaOptions = [
        { value: 'Life Sciences (LS)', label: 'Life Sciences (LS)' },
        { value: 'Physical Sciences and Engineering (PE)', label: 'Physical Sciences and Engineering (PE)' },
        { value: 'Social Sciences and Humanities (SH)', label: 'Social Sciences and Humanities (SH)' }
    ];

    // Format date for input fields
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Verify token and load user data
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

    // Load item data and universities
    useEffect(() => {
        const loadItemData = async () => {
            if (!userData) return;

            try {
                setLoading(true);

                // Fetch item data with all relations populated
                const itemResponse = await axios.get(`${base_url}/items/${documentId}?populate=*`);
                const itemData = itemResponse.data.data;
                setItem(itemData);

                // Check if user is the owner
                if (itemData.seller && itemData.seller.documentId !== userData.user_id) {
                    setError("You don't have permission to edit this item.");
                    setTimeout(() => navigate(`/items/${documentId}`), 2000);
                    return;
                }

                // Get category name
                const catName = itemData.item_category?.name || '';
                setCategoryName(catName);

                // Fetch universities and ISCED broad fields
                const [universitiesRes, iscedBroadRes] = await Promise.all([
                    axios.get(`${base_url}/universities`),
                    axios.get(`${base_url}/isced-broad-fields`)
                ]);
                
                setUniversities(universitiesRes.data.data || universitiesRes.data || []);
                setIscedBroadFields(iscedBroadRes.data.data || iscedBroadRes.data || []);

                // Pre-populate form with item data
                setFormData({
                    item_status: itemData.item_status || 'active',
                    name: itemData.name || '',
                    description: itemData.description || '',
                    item_category: itemData.item_category?.documentId || '',
                    expiration: formatDateForInput(itemData.expiration),
                    // ISCED hierarchical fields
                    isced_broad_field: itemData.isced_broad_field?.documentId || '',
                    isced_narrow_field: itemData.isced_narrow_field?.documentId || '',
                    isced_detailed_field: itemData.isced_detailed_field?.documentId || '',
                    erc_area: itemData.erc_area || '',
                    erc_panel: itemData.erc_panel?.documentId || '',
                    erc_keyword: itemData.erc_keyword?.documentId || '',
                    start_date: formatDateForInput(itemData.start_date),
                    learning_outcomes: itemData.learning_outcomes || '',
                    multimediarial_material_provided: itemData.multimediarial_material_provided || '',
                    end_date: formatDateForInput(itemData.end_date),
                    languages: itemData.languages || '',
                    speakers: itemData.speakers || '',
                    pedagogical_objectives: itemData.pedagogical_objectives || '',
                    level_of_study: itemData.level_of_study || '',
                    university: itemData.university?.documentId || '',
                    first_level_structure: itemData.first_level_structure?.documentId || '',
                    second_level_structure: itemData.second_level_structure?.documentId || '',
                    offered_by: itemData.seller?.full_name || '',
                    cover: itemData.coverId || null,
                });
                console.log(itemData)
                setLoading(false);
            } catch (err) {
                console.error("Error loading item:", err);
                setError("Failed to load item data. Please try again.");
                setLoading(false);
            }
        };

        loadItemData();
    }, [documentId, userData, navigate]);

    // Load first level structures based on university
    useEffect(() => {
        const loadFirstLevelStructures = async () => {
            if (formData.university) {
                try {
                    const response = await axios.get(
                        `${base_url}/first-level-structures?filters[university][documentId][$eq]=${formData.university}`
                    );
                    setFirstLevelStructures(response.data.data || response.data || []);
                } catch (err) {
                    console.error("Error loading first level structures:", err);
                    setFirstLevelStructures([]);
                }
            } else {
                setFirstLevelStructures([]);
            }
        };

        loadFirstLevelStructures();
    }, [formData.university]);

    // Load second level structures based on first level structure
    useEffect(() => {
        const loadSecondLevelStructures = async () => {
            if (formData.first_level_structure) {
                try {
                    const response = await axios.get(
                        `${base_url}/second-level-structures?filters[first_level_structure][documentId][$eq]=${formData.first_level_structure}&populate=first_level_structure`
                    );
                    setSecondLevelStructures(response.data.data || response.data || []);
                } catch (err) {
                    console.error("Error loading second level structures:", err);
                    setSecondLevelStructures([]);
                }
            } else {
                setSecondLevelStructures([]);
            }
        };

        loadSecondLevelStructures();
    }, [formData.first_level_structure]);

    // Load ISCED Narrow Fields based on selected Broad Field
    useEffect(() => {
        const loadIscedNarrowFields = async () => {
            if (formData.isced_broad_field) {
                try {
                    const response = await axios.get(
                        `${base_url}/isced-narrow-fields?filters[isced_broad_field][documentId][$eq]=${formData.isced_broad_field}&populate=isced_broad_field`
                    );
                    console.log("ISCED Narrow Fields:", response.data);
                    setIscedNarrowFields(response.data.data || response.data || []);
                } catch (err) {
                    console.error("Error loading ISCED narrow fields:", err);
                    setIscedNarrowFields([]);
                }
            } else {
                setIscedNarrowFields([]);
            }
        };

        loadIscedNarrowFields();
    }, [formData.isced_broad_field]);

    // Load ISCED Detailed Fields based on selected Narrow Field
    useEffect(() => {
        const loadIscedDetailedFields = async () => {
            if (formData.isced_narrow_field) {
                try {
                    const response = await axios.get(
                        `${base_url}/isced-detailed-fields?filters[isced_narrow_field][documentId][$eq]=${formData.isced_narrow_field}&populate=isced_narrow_field`
                    );
                    console.log("ISCED Detailed Fields:", response.data);
                    setIscedDetailedFields(response.data.data || response.data || []);
                } catch (err) {
                    console.error("Error loading ISCED detailed fields:", err);
                    setIscedDetailedFields([]);
                }
            } else {
                setIscedDetailedFields([]);
            }
        };

        loadIscedDetailedFields();
    }, [formData.isced_narrow_field]);

    // Load ERC panels based on selected ERC area
    useEffect(() => {
        const loadErcPanels = async () => {
            if (formData.erc_area) {
                try {
                    const response = await axios.get(
                        `${base_url}/custom-erc-panel/?erc_area=${formData.erc_area}`
                    );
                    setErcPanels(response.data.data || response.data || []);
                } catch (err) {
                    console.error("Error loading ERC panels:", err);
                    setErcPanels([]);
                }
            } else {
                setErcPanels([]);
            }
        };

        loadErcPanels();
    }, [formData.erc_area]);

    // Load ERC keywords based on selected ERC panel
    useEffect(() => {
        const loadErcKeywords = async () => {
            if (formData.erc_panel) {
                try {
                    const response = await axios.get(
                        `${base_url}/erc-keywords?filters[erc_panel][documentId][$eq]=${formData.erc_panel}&populate=erc_panel`
                    );
                    setErcKeywords(response.data.data || response.data || []);
                } catch (err) {
                    console.error("Error loading ERC keywords:", err);
                    setErcKeywords([]);
                }
            } else {
                setErcKeywords([]);
            }
        };

        loadErcKeywords();
    }, [formData.erc_panel]);

    const handleUniversityChange = (e) => {
        const value = e.target.value;

        setFormData(prev => ({
            ...prev,
            university: value,
            first_level_structure: '',
            second_level_structure: ''
        }));
    };

    const handleIscedBroadFieldChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            isced_broad_field: value,
            isced_narrow_field: '',
            isced_detailed_field: ''
        }));
    };

    const handleIscedNarrowFieldChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            isced_narrow_field: value,
            isced_detailed_field: ''
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            cover: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Prepare the data for update
            const updateData = {
                data: {
                    item_status: formData.item_status,
                    name: formData.name,
                    description: formData.description,
                    expiration: formData.expiration || null,
                    erc_area: formData.erc_area || null,
                    start_date: formData.start_date || null,
                    learning_outcomes: formData.learning_outcomes || null,
                    multimediarial_material_provided: formData.multimediarial_material_provided || null,
                    end_date: formData.end_date || null,
                    languages: formData.languages || null,
                    speakers: formData.speakers || null,
                    pedagogical_objectives: formData.pedagogical_objectives || null,
                    level_of_study: formData.level_of_study || null,
                }
            };

            // Add relations if they exist
            if (formData.university) {
                updateData.data.university = formData.university;
            }
            if (formData.first_level_structure) {
                updateData.data.first_level_structure = formData.first_level_structure;
            }
            if (formData.second_level_structure) {
                updateData.data.second_level_structure = formData.second_level_structure;
            }
            if (formData.erc_panel) {
                updateData.data.erc_panel = formData.erc_panel;
            }
            if (formData.erc_keyword) {
                updateData.data.erc_keyword = formData.erc_keyword;
            }

            // Add ISCED hierarchical fields (user can stop at any level)
            // Always include the field even if empty to allow clearing
            updateData.data.isced_broad_field = formData.isced_broad_field || null;
            updateData.data.isced_narrow_field = formData.isced_narrow_field || null;
            updateData.data.isced_detailed_field = formData.isced_detailed_field || null;

            // If there's a new cover image, upload it separately
            let coverId = null;
            if (formData.cover && formData.cover instanceof File) {
                const fileFormData = new FormData();
                fileFormData.append('files', formData.cover);
                
                const uploadResponse = await axios.post(`${base_url}/upload`, fileFormData);
                coverId = uploadResponse.data[0].id;
            }
            const response = await axios.post(
                `${base_url}/custom-item/update-item/`,{
                    item_id: documentId,
                    ...updateData,
                    cover: coverId || item.coverId || null,
                    token: token
                }
            );

            setSuccessMessage('Item updated successfully!');
            
            // Redirect after a short delay
            setTimeout(() => {
                navigate(`/items/${documentId}`);
            }, 1500);

        } catch (err) {
            console.error("Error updating item:", err);
            let errorText = 'Failed to update item. Please try again.';
            if (err.response?.status === 401) {
                errorText = 'Session expired. Please log in again.';
            } else if (err.response?.status === 403) {
                errorText = 'You do not have permission to edit this item.';
            } else if (err.response?.data?.error?.message) {
                errorText = err.response.data.error.message;
            }
            setError(errorText);
        } finally {
            setSaving(false);
        }
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
                    <p style={{ marginTop: '1rem', color: '#6c757d' }}>Loading item data...</p>
                </div>
            </div>
        );
    }

    if (error && !item) {
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
                        {error}
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
            `}</style>

            <Navbar token={token} />

            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #dee2e6',
                padding: '1.5rem 0'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => navigate(`/items/${documentId}`)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: 'transparent',
                                color: '#6c757d',
                                border: '2px solid #dee2e6',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.borderColor = '#7c6fd6';
                                e.target.style.color = '#7c6fd6';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.borderColor = '#dee2e6';
                                e.target.style.color = '#6c757d';
                            }}
                        >
                            ← Back
                        </button>
                        <div>
                            <h1 style={{
                                margin: 0,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#213547'
                            }}>
                                Edit Item
                            </h1>
                            <p style={{
                                margin: '0.25rem 0 0 0',
                                fontSize: '0.9rem',
                                color: '#6c757d'
                            }}>
                                Modify the details of your item
                            </p>
                        </div>
                    </div>
                    
                    {/* Category Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f0f0ff',
                        borderRadius: '20px',
                        border: '1px solid #7c6fd6'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>📂</span>
                        <span style={{ 
                            fontWeight: '600',
                            color: '#7c6fd6'
                        }}>
                            {categoryName}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ 
                flex: 1,
                padding: '2rem 1rem',
                maxWidth: '1000px',
                width: '100%',
                margin: '0 auto'
            }}>
                {/* Success Message */}
                {successMessage && (
                    <div style={{
                        animation: 'slideDown 0.3s ease-out',
                        marginBottom: '1.5rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        color: '#155724',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontWeight: '500'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>✓</span>
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        animation: 'slideDown 0.3s ease-out',
                        marginBottom: '1.5rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        color: '#721c24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontWeight: '500'
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>⚠</span>
                        {error}
                    </div>
                )}

                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    padding: '2rem'
                }}>
                    <h2 style={{ 
                        marginBottom: '0.5rem',
                        color: '#213547',
                        fontSize: '1.75rem',
                        fontWeight: '600'
                    }}>
                        Item Details
                    </h2>
                    <p style={{
                        marginBottom: '2rem',
                        color: '#6c757d',
                        fontSize: '0.95rem'
                    }}>
                        {getCategoryFieldDescription(categoryName)}
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Item Status */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                {categoryName} Status <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <select
                                name="item_status"
                                value={formData.item_status}
                                onChange={handleInputChange}
                                required
                                style={selectStyle}
                            >
                                {itemStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Name - Always shown */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                {categoryName} Name <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                style={inputStyle}
                                placeholder="Enter item name"
                            />
                        </div>

                        {/* Offered By - Always shown (Read-only) */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                Inserted by <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="offered_by"
                                value={formData.offered_by}
                                readOnly
                                required
                                style={{
                                    ...inputStyle,
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'not-allowed',
                                    color: '#6c757d'
                                }}
                                placeholder="Instructor/Professor name"
                            />
                            <small style={{ 
                                display: 'block',
                                marginTop: '0.25rem',
                                fontSize: '0.85rem',
                                color: '#6c757d'
                            }}>
                                This field cannot be changed.
                            </small>
                        </div>

                        {/* Description - Always shown */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>{categoryName} Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                style={textareaStyle}
                                placeholder="Enter item description"
                            />
                        </div>

                        {/* Dates - Conditional */}
                        {(shouldShowField('start_date', categoryName) || 
                          shouldShowField('end_date', categoryName) || 
                          shouldShowField('expiration', categoryName)) && (
                            <>
                                <div style={{ 
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1.5rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    {shouldShowField('start_date', categoryName) && (
                                        <div>
                                            <label style={labelStyle}>Start Date <span style={{ color: '#dc3545' }}>*</span></label>
                                            <input
                                                type="date"
                                                name="start_date"
                                                value={formData.start_date}
                                                onChange={handleInputChange}
                                                style={inputStyle}
                                                required
                                            />
                                        </div>
                                    )}

                                    {shouldShowField('end_date', categoryName) && (
                                        <div>
                                            <label style={labelStyle}>End Date <span style={{ color: '#dc3545' }}>*</span></label>
                                            <input
                                                type="date"
                                                name="end_date"
                                                value={formData.end_date}
                                                onChange={handleInputChange}
                                                style={inputStyle}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                {shouldShowField('expiration', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Expiration Date <span style={{ color: '#dc3545' }}>*</span></label>
                                        <input
                                            type="date"
                                            name="expiration"
                                            value={formData.expiration}
                                            onChange={handleInputChange}
                                            style={inputStyle}
                                            required
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Academic Fields - Conditional */}
                        {(shouldShowField('isced_code', categoryName) || 
                          shouldShowField('level_of_study', categoryName) ||
                          shouldShowField('learning_outcomes', categoryName) ||
                          shouldShowField('pedagogical_objectives', categoryName)) && (
                            <>
                                <div style={{
                                    marginTop: '2rem',
                                    marginBottom: '1rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #e9ecef'
                                }}>
                                    <h3 style={{
                                        margin: 0,
                                        color: '#495057',
                                        fontSize: '1.2rem',
                                        fontWeight: '600'
                                    }}>
                                        Academic Information
                                    </h3>
                                </div>

                                {/* ISCED Code Hierarchical Selection */}
                                {shouldShowField('isced_code', categoryName) && (
                                    <>
                                        <div style={{ 
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                            gap: '1.5rem',
                                            marginBottom: '1.5rem'
                                        }}>
                                            {/* ISCED Broad Field */}
                                            <div>
                                                <label style={labelStyle}>ISCED Broad Field</label>
                                                <select
                                                    name="isced_broad_field"
                                                    value={formData.isced_broad_field}
                                                    onChange={handleIscedBroadFieldChange}
                                                    style={selectStyle}
                                                >
                                                    <option value="">Select Broad Field</option>
                                                    {iscedBroadFields.map(field => (
                                                        <option key={field.documentId} value={field.documentId}>
                                                            {field.code} - {field.attributes?.description || field.description}
                                                        </option>
                                                    ))}
                                                </select>
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.25rem',
                                                    fontSize: '0.85rem',
                                                    color: '#6c757d'
                                                }}>
                                                    Select broad field first to filter narrow fields
                                                </small>
                                            </div>

                                            {/* ISCED Narrow Field */}
                                            <div>
                                                <label style={labelStyle}>ISCED Narrow Field</label>
                                                <select
                                                    name="isced_narrow_field"
                                                    value={formData.isced_narrow_field}
                                                    onChange={handleIscedNarrowFieldChange}
                                                    style={{
                                                        ...selectStyle,
                                                        cursor: !formData.isced_broad_field ? 'not-allowed' : 'pointer',
                                                        opacity: !formData.isced_broad_field ? 0.6 : 1
                                                    }}
                                                    disabled={!formData.isced_broad_field}
                                                >
                                                    <option value="">
                                                        {formData.isced_broad_field ? 'Select Narrow Field' : 'Select broad field first'}
                                                    </option>
                                                    {iscedNarrowFields.map(field => (
                                                        <option key={field.documentId} value={field.documentId}>
                                                            {field.code} - {field.attributes?.description || field.description}
                                                        </option>
                                                    ))}
                                                </select>
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.25rem',
                                                    fontSize: '0.85rem',
                                                    color: '#6c757d'
                                                }}>
                                                    Optional - select to filter detailed fields
                                                </small>
                                            </div>

                                            {/* ISCED Detailed Field */}
                                            <div>
                                                <label style={labelStyle}>ISCED Detailed Field</label>
                                                <select
                                                    name="isced_detailed_field"
                                                    value={formData.isced_detailed_field}
                                                    onChange={handleInputChange}
                                                    style={{
                                                        ...selectStyle,
                                                        cursor: !formData.isced_narrow_field ? 'not-allowed' : 'pointer',
                                                        opacity: !formData.isced_narrow_field ? 0.6 : 1
                                                    }}
                                                    disabled={!formData.isced_narrow_field}
                                                >
                                                    <option value="">
                                                        {formData.isced_narrow_field ? 'Select Detailed Field' : 'Select narrow field first'}
                                                    </option>
                                                    {iscedDetailedFields.map(field => (
                                                        <option key={field.documentId} value={field.documentId}>
                                                            {field.code} - {field.attributes?.description || field.description}
                                                        </option>
                                                    ))}
                                                </select>
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.25rem',
                                                    fontSize: '0.85rem',
                                                    color: '#6c757d'
                                                }}>
                                                    Optional - most specific classification
                                                </small>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {shouldShowField('level_of_study', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Level of Study</label>
                                        <input
                                            type="text"
                                            name="level_of_study"
                                            value={formData.level_of_study}
                                            onChange={handleInputChange}
                                            style={inputStyle}
                                            placeholder="e.g., Undergraduate, Graduate"
                                        />
                                    </div>
                                )}

                                {shouldShowField('learning_outcomes', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Learning Outcomes</label>
                                        <textarea
                                            name="learning_outcomes"
                                            value={formData.learning_outcomes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            style={textareaStyle}
                                            placeholder="Enter learning outcomes"
                                        />
                                    </div>
                                )}

                                {shouldShowField('pedagogical_objectives', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Pedagogical Objectives</label>
                                        <textarea
                                            name="pedagogical_objectives"
                                            value={formData.pedagogical_objectives}
                                            onChange={handleInputChange}
                                            rows={3}
                                            style={textareaStyle}
                                            placeholder="Enter pedagogical objectives"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Research Fields - Conditional */}
                        {(shouldShowField('erc_area', categoryName) || 
                          shouldShowField('erc_panel', categoryName) ||
                          shouldShowField('erc_keyword', categoryName)) && (
                            <>
                                <div style={{
                                    marginTop: '2rem',
                                    marginBottom: '1rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #e9ecef'
                                }}>
                                    <h3 style={{
                                        margin: 0,
                                        color: '#495057',
                                        fontSize: '1.2rem',
                                        fontWeight: '600'
                                    }}>
                                        Research Classification
                                    </h3>
                                </div>

                                <div style={{ 
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '1.5rem',
                                    marginBottom: '1.5rem'
                                }}>
                                    {shouldShowField('erc_area', categoryName) && (
                                        <div>
                                            <label style={labelStyle}>ERC Area</label>
                                            <select
                                                name="erc_area"
                                                value={formData.erc_area}
                                                onChange={handleInputChange}
                                                style={selectStyle}
                                            >
                                                <option value="">Select ERC Area</option>
                                                {ercAreaOptions.map(area => (
                                                    <option key={area.value} value={area.value}>
                                                        {area.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <small style={{ 
                                                display: 'block',
                                                marginTop: '0.25rem',
                                                fontSize: '0.85rem',
                                                color: '#6c757d'
                                            }}>
                                                Select area first to filter panels
                                            </small>
                                        </div>
                                    )}

                                    {shouldShowField('erc_panel', categoryName) && (
                                        <div>
                                            <label style={labelStyle}>ERC Panel</label>
                                            <select
                                                name="erc_panel"
                                                value={formData.erc_panel}
                                                onChange={handleInputChange}
                                                style={{
                                                    ...selectStyle,
                                                    cursor: !formData.erc_area ? 'not-allowed' : 'pointer',
                                                    opacity: !formData.erc_area ? 0.6 : 1
                                                }}
                                                disabled={!formData.erc_area}
                                            >
                                                <option value="">
                                                    {formData.erc_area ? 'Select ERC Panel' : 'Select area first'}
                                                </option>
                                                {ercPanels.map(panel => (
                                                    <option key={panel.documentId} value={panel.documentId}>
                                                        {panel.attributes?.name || panel.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <small style={{ 
                                                display: 'block',
                                                marginTop: '0.25rem',
                                                fontSize: '0.85rem',
                                                color: '#6c757d'
                                            }}>
                                                Select panel to filter keywords
                                            </small>
                                        </div>
                                    )}

                                    {shouldShowField('erc_keyword', categoryName) && (
                                        <div>
                                            <label style={labelStyle}>ERC Keyword</label>
                                            <select
                                                name="erc_keyword"
                                                value={formData.erc_keyword}
                                                onChange={handleInputChange}
                                                style={{
                                                    ...selectStyle,
                                                    cursor: !formData.erc_panel ? 'not-allowed' : 'pointer',
                                                    opacity: !formData.erc_panel ? 0.6 : 1
                                                }}
                                                disabled={!formData.erc_panel}
                                            >
                                                <option value="">
                                                    {formData.erc_panel ? 'Select ERC Keyword' : 'Select panel first'}
                                                </option>
                                                {ercKeywords.map(keyword => (
                                                    <option key={keyword.documentId} value={keyword.documentId}>
                                                        {keyword.attributes?.name || keyword.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Content Fields - Conditional */}
                        {(shouldShowField('languages', categoryName) || 
                          shouldShowField('speakers', categoryName) ||
                          shouldShowField('multimediarial_material_provided', categoryName)) && (
                            <>
                                <div style={{
                                    marginTop: '2rem',
                                    marginBottom: '1rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #e9ecef'
                                }}>
                                    <h3 style={{
                                        margin: 0,
                                        color: '#495057',
                                        fontSize: '1.2rem',
                                        fontWeight: '600'
                                    }}>
                                        Content Details
                                    </h3>
                                </div>

                                {shouldShowField('languages', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Languages <span style={{ color: '#dc3545' }}>*</span></label>
                                        <input
                                            type="text"
                                            name="languages"
                                            value={formData.languages}
                                            onChange={handleInputChange}
                                            style={inputStyle}
                                            placeholder="e.g., English, Spanish, French"
                                            required
                                        />
                                    </div>
                                )}

                                {shouldShowField('speakers', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Speakers</label>
                                        <input
                                            type="text"
                                            name="speakers"
                                            value={formData.speakers}
                                            onChange={handleInputChange}
                                            style={inputStyle}
                                            placeholder="Enter speaker names"
                                        />
                                    </div>
                                )}

                                {shouldShowField('multimediarial_material_provided', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Multimedia Material Provided</label>
                                        <textarea
                                            name="multimediarial_material_provided"
                                            value={formData.multimediarial_material_provided}
                                            onChange={handleInputChange}
                                            rows={3}
                                            style={textareaStyle}
                                            placeholder="Describe multimedia materials"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* Structure Fields - Conditional */}
                        {(shouldShowField('university', categoryName) || 
                          shouldShowField('first_level_structure', categoryName) ||
                          shouldShowField('second_level_structure', categoryName)) && (
                            <>
                                <div style={{
                                    marginTop: '2rem',
                                    marginBottom: '1rem',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '2px solid #e9ecef'
                                }}>
                                    <h3 style={{
                                        margin: 0,
                                        color: '#495057',
                                        fontSize: '1.2rem',
                                        fontWeight: '600'
                                    }}>
                                        Institutional Information
                                    </h3>
                                </div>

                                {shouldShowField('university', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>
                                            University <span style={{ color: '#dc3545' }}>*</span>
                                        </label>
                                        <select
                                            name="university"
                                            value={formData.university}
                                            onChange={handleUniversityChange}
                                            required
                                            style={selectStyle}
                                        >
                                            <option value="">Select university</option>
                                            {universities.map(uni => (
                                                <option key={uni.documentId} value={uni.documentId}>
                                                    {uni.attributes?.name || uni.university_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {shouldShowField('first_level_structure', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>First Level Structure <span style={{ color: '#dc3545' }}>*</span></label>
                                        <select
                                            name="first_level_structure"
                                            value={formData.first_level_structure}
                                            onChange={handleInputChange}
                                            style={{
                                                ...selectStyle,
                                                cursor: !formData.university ? 'not-allowed' : 'pointer',
                                                opacity: !formData.university ? 0.6 : 1
                                            }}
                                            disabled={!formData.university}
                                            required
                                        >
                                            <option value="">
                                                {formData.university ? 'Select first level structure' : 'Select university first'}
                                            </option>
                                            {firstLevelStructures.map(struct => (
                                                <option key={struct.documentId} value={struct.documentId}>
                                                    {struct.attributes?.name || struct.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {shouldShowField('second_level_structure', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>Second Level Structure <span style={{ color: '#dc3545' }}>*</span></label>
                                        <select
                                            name="second_level_structure"
                                            value={formData.second_level_structure}
                                            onChange={handleInputChange}
                                            style={{
                                                ...selectStyle,
                                                cursor: !formData.first_level_structure ? 'not-allowed' : 'pointer',
                                                opacity: !formData.first_level_structure ? 0.6 : 1
                                            }}
                                            disabled={!formData.first_level_structure || secondLevelStructures.length === 0}
                                            required
                                        >
                                            <option value="">
                                                {formData.first_level_structure ? 'Select second level structure' : 'Select first level first'}
                                            </option>
                                            {secondLevelStructures.map(struct => (
                                                <option key={struct.documentId} value={struct.documentId}>
                                                    {struct.attributes?.name || struct.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Cover Image - Conditional */}
                        {shouldShowField('cover', categoryName) && (
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={labelStyle}>Cover Image</label>
                                {item?.cover && (
                                    <div style={{
                                        marginBottom: '1rem',
                                        padding: '1rem',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <span style={{ color: '#6c757d' }}>📷</span>
                                        <span style={{ color: '#495057', fontSize: '0.9rem' }}>
                                            Current cover image is set. Upload a new one to replace it.
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{
                                        ...inputStyle,
                                        padding: '0.5rem'
                                    }}
                                />
                                {formData.cover && (
                                    <p style={{ 
                                        marginTop: '0.5rem',
                                        fontSize: '0.9rem',
                                        color: '#28a745'
                                    }}>
                                        ✓ New image selected: {formData.cover.name}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ 
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'space-between',
                            marginTop: '2rem',
                            paddingTop: '2rem',
                            borderTop: '2px solid #e9ecef'
                        }}>
                            <button
                                type="button"
                                onClick={() => navigate(`/items/${documentId}`)}
                                style={{
                                    padding: '0.75rem 2rem',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#5a6268';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#6c757d';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '0.75rem 2rem',
                                    background: saving 
                                        ? '#dee2e6' 
                                        : 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                    color: saving ? '#6c757d' : 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: saving ? 'none' : '0 2px 4px rgba(124, 111, 214, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (!saving) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!saving) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = '0 2px 4px rgba(124, 111, 214, 0.2)';
                                    }
                                }}
                            >
                                {saving ? (
                                    <>
                                        <div style={{
                                            width: '1rem',
                                            height: '1rem',
                                            border: '2px solid #6c757d',
                                            borderTop: '2px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }}></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>💾</span>
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// Styles
const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#495057'
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: 'white',
    color: '#495057',
    boxSizing: 'border-box'
};

const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    fontFamily: 'inherit'
};

const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
};

export default EditItem;