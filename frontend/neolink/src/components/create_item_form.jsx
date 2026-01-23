import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { base_url } from "../api";
import { shouldShowField, getCategoryFieldDescription } from "../category_field_config";
import Navbar from "./navbar";
import { getCategoryIcon } from "../utils";

const logo_neolink = `${import.meta.env.BASE_URL}logo.png`;
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;

function CreateItemForm({ token, initialData, selectedCategory, onNext, onBack }) {
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        item_status: initialData?.item_status || 'active',
        name: initialData?.name || '',
        description: initialData?.description || '',
        item_category: initialData?.item_category || '',
        expiration: initialData?.expiration || '',
        isced_broad_field: initialData?.isced_broad_field || '',
        isced_narrow_field: initialData?.isced_narrow_field || '',
        isced_detailed_field: initialData?.isced_detailed_field || '',
        erc_area: initialData?.erc_area || '',
        erc_panel: initialData?.erc_panel || '',
        erc_keyword: initialData?.erc_keyword || '',
        start_date: initialData?.start_date || '',
        learning_outcomes: initialData?.learning_outcomes || '',
        multimediarial_material_provided: initialData?.multimediarial_material_provided || '',
        end_date: initialData?.end_date || '',
        languages: initialData?.languages || '',
        speakers: initialData?.speakers || '',
        pedagogical_objectives: initialData?.pedagogical_objectives || '',
        level_of_study: initialData?.level_of_study || '',
        university: initialData?.university || '',
        first_level_structure: initialData?.first_level_structure || '',
        second_level_structure: initialData?.second_level_structure || '',
        offered_by: initialData?.offered_by || '',
        cover: initialData?.cover || null,
    });

    // Get category name for field visibility checks
    const categoryName = selectedCategory?.attributes?.name || selectedCategory?.name || '';

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
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateErrors, setDateErrors] = useState({});

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

    // Format name to title case
    const formatName = (name) => {
        if (!name) return '';
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Date validation function
    const validateDates = (startDate, endDate, expirationDate) => {
        const errors = {};
        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.end_date = 'End date cannot be before start date';
        }
        
        if (startDate && expirationDate && new Date(startDate) > new Date(expirationDate)) {
            errors.expiration = 'Expiration date cannot be before start date';
        }
        
        if (endDate && expirationDate && new Date(expirationDate) < new Date(endDate)) {
            errors.expiration = 'Expiration date cannot be before end date';
        }
        
        return errors;
    };

    // Initial load
    useEffect(() => {
        const initializeForm = async () => {
            try {
                const decoded = jwtDecode(token);
                console.log("Decoded token:", decoded);
                setUserData(decoded);

                const [universitiesRes, iscedBroadRes] = await Promise.all([
                    axios.get(`${base_url}/universities`),
                    axios.get(`${base_url}/isced-broad-fields`)
                ]);

                console.log("Universities:", universitiesRes.data);
                console.log("ISCED Broad Fields:", iscedBroadRes.data);
                
                setUniversities(universitiesRes.data.data || universitiesRes.data || []);
                setIscedBroadFields(iscedBroadRes.data.data || iscedBroadRes.data || []);

                // Only set from token if initialData doesn't have values
                if (!initialData?.university) {
                    const universityId = decoded.university_id || decoded.university || decoded.universityId || '';
                    const firstLevelId = decoded.first_level_structure_id || decoded.first_level_structure || decoded.firstLevelStructure || '';
                    const secondLevelId = decoded.second_level_structure_id || decoded.second_level_structure || decoded.secondLevelStructure || '';
                    const fullName = decoded.full_name || decoded.fullName || decoded.name || '';

                    console.log("Pre-filling with:", { universityId, firstLevelId, secondLevelId, fullName });

                    setFormData(prev => ({
                        ...prev,
                        university: universityId,
                        first_level_structure: firstLevelId,
                        second_level_structure: secondLevelId,
                        offered_by: fullName ? formatName(fullName) : ''
                    }));
                }

                setLoading(false);
            } catch (err) {
                console.error("Error initializing form:", err);
                setError("Failed to load form data. Please try again.");
                setLoading(false);
            }
        };

        if (token) {
            initializeForm();
        }
    }, [token]);

    // Validate dates whenever they change
    useEffect(() => {
        const errors = validateDates(
            formData.start_date,
            formData.end_date,
            formData.expiration
        );
        setDateErrors(errors);
    }, [formData.start_date, formData.end_date, formData.expiration]);

    // Load first level structures based on university
    useEffect(() => {
        const loadFirstLevelStructures = async () => {
            if (formData.university) {
                try {
                    const response = await axios.get(
                        `${base_url}/first-level-structures?filters[university][documentId][$eq]=${formData.university}`
                    );
                    setFirstLevelStructures(response.data.data || response.data || []);
                    
                    if (formData.first_level_structure) {
                        const isValid = (response.data.data || response.data || [])
                            .some(struct => struct.id === formData.first_level_structure);
                        if (!isValid) {
                            setFormData(prev => ({
                                ...prev,
                                first_level_structure: '',
                                second_level_structure: ''
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error loading first level structures:", err);
                    setFirstLevelStructures([]);
                }
            } else {
                setFirstLevelStructures([]);
                setFormData(prev => ({
                    ...prev,
                    first_level_structure: '',
                    second_level_structure: ''
                }));
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
                    
                    if (formData.second_level_structure) {
                        const isValid = (response.data.data || response.data || [])
                            .some(struct => struct.id === formData.second_level_structure);
                        if (!isValid) {
                            setFormData(prev => ({
                                ...prev,
                                second_level_structure: ''
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error loading second level structures:", err);
                    setSecondLevelStructures([]);
                }
            } else {
                setSecondLevelStructures([]);
                setFormData(prev => ({
                    ...prev,
                    second_level_structure: ''
                }));
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
                    
                    // Validate current selection
                    if (formData.isced_narrow_field) {
                        const isValid = (response.data.data || response.data || [])
                            .some(field => field.documentId === formData.isced_narrow_field);
                        if (!isValid) {
                            setFormData(prev => ({
                                ...prev,
                                isced_narrow_field: '',
                                isced_detailed_field: ''
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error loading ISCED narrow fields:", err);
                    setIscedNarrowFields([]);
                }
            } else {
                setIscedNarrowFields([]);
                setFormData(prev => ({
                    ...prev,
                    isced_narrow_field: '',
                    isced_detailed_field: ''
                }));
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
                    
                    // Validate current selection
                    if (formData.isced_detailed_field) {
                        const isValid = (response.data.data || response.data || [])
                            .some(field => field.documentId === formData.isced_detailed_field);
                        if (!isValid) {
                            setFormData(prev => ({
                                ...prev,
                                isced_detailed_field: ''
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error loading ISCED detailed fields:", err);
                    setIscedDetailedFields([]);
                }
            } else {
                setIscedDetailedFields([]);
                setFormData(prev => ({
                    ...prev,
                    isced_detailed_field: ''
                }));
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
                    
                    if (formData.erc_panel) {
                        const isValid = (response.data.data || response.data || [])
                            .some(panel => panel.documentId === formData.erc_panel);
                        if (!isValid) {
                            setFormData(prev => ({
                                ...prev,
                                erc_panel: '',
                                erc_keyword: ''
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error loading ERC panels:", err);
                    setErcPanels([]);
                }
            } else {
                setErcPanels([]);
                setFormData(prev => ({
                    ...prev,
                    erc_panel: '',
                    erc_keyword: ''
                }));
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
                    
                    if (formData.erc_keyword) {
                        const isValid = (response.data.data || response.data || [])
                            .some(keyword => keyword.documentId === formData.erc_keyword);
                        if (!isValid) {
                            setFormData(prev => ({
                                ...prev,
                                erc_keyword: ''
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error loading ERC keywords:", err);
                    setErcKeywords([]);
                }
            } else {
                setErcKeywords([]);
                setFormData(prev => ({
                    ...prev,
                    erc_keyword: ''
                }));
            }
        };

        loadErcKeywords();
    }, [formData.erc_panel]);

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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Check if there are any date validation errors
        if (Object.keys(dateErrors).length > 0) {
            setError("Please fix the date validation errors before proceeding.");
            return;
        }
        
        // Pass form data to parent and move to step 3
        onNext(formData);
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
                    <p style={{ marginTop: '1rem', color: '#6c757d' }}>Loading form...</p>
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
                
                .info-tooltip {
                    position: relative;
                    display: inline-block;
                    margin-left: 0.5rem;
                }
                
                .info-tooltip .tooltip-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background-color: #7c6fd6;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: help;
                    transition: all 0.2s;
                }
                
                .info-tooltip .tooltip-icon:hover {
                    background-color: #6b5fc5;
                    transform: scale(1.1);
                }
                
                .info-tooltip .tooltip-text {
                    visibility: hidden;
                    width: 280px;
                    background-color: #2d3748;
                    color: #fff;
                    text-align: left;
                    border-radius: 8px;
                    padding: 0.75rem;
                    position: absolute;
                    z-index: 1000;
                    bottom: 125%;
                    left: 50%;
                    margin-left: -140px;
                    opacity: 0;
                    transition: opacity 0.3s;
                    font-size: 0.85rem;
                    line-height: 1.4;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                
                .info-tooltip .tooltip-text::after {
                    content: "";
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: #2d3748 transparent transparent transparent;
                }
                
                .info-tooltip:hover .tooltip-text {
                    visibility: visible;
                    opacity: 1;
                }
            `}</style>
            
            <Navbar token={token} />


            {/* Progress Indicator */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #dee2e6',
                padding: '1rem 0'
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#28a745',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600'
                        }}>
                            ✓
                        </div>
                        <span style={{ color: '#28a745', fontWeight: '500' }}>Category</span>
                    </div>
                    
                    <div style={{
                        width: '50px',
                        height: '2px',
                        backgroundColor: '#7c6fd6'
                    }}></div>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#7c6fd6',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600'
                        }}>
                            2
                        </div>
                        <span style={{ color: '#7c6fd6', fontWeight: '600' }}>Basic Info</span>
                    </div>
                    
                    <div style={{
                        width: '50px',
                        height: '2px',
                        backgroundColor: '#dee2e6'
                    }}></div>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#dee2e6',
                            color: '#6c757d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600'
                        }}>
                            3
                        </div>
                        <span style={{ color: '#6c757d', fontWeight: '500' }}>Virtual Café</span>
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

                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    padding: '2rem'
                }}>
                    {/* Category Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f0f0ff',
                        borderRadius: '20px',
                        marginBottom: '1rem',
                        border: '1px solid #7c6fd6'
                    }}>
                        <img src={getCategoryIcon(categoryName)} alt={categoryName} style={{ width: '50px', height: '40px', padding: '5px' }} />
                        <span style={{ 
                            fontWeight: '600',
                            color: '#7c6fd6'
                        }}>
                            {categoryName}
                        </span>
                    </div>

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
                                Pre-filled from your profile (cannot be edited).
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
                                            <label style={labelStyle}>
                                                Start Date <span style={{ color: '#dc3545' }}>*</span>
                                            </label>
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
                                            <label style={labelStyle}>
                                                End Date 
                                                <span style={{ color: '#dc3545' }}>*</span>
                                                <div className="info-tooltip">
                                                    <span className="tooltip-icon">i</span>
                                                    <span className="tooltip-text">
                                                        The end date represents when the activity (course, event, etc.) concludes. This is the last day of the actual activity.
                                                    </span>
                                                </div>
                                            </label>
                                            <input
                                                type="date"
                                                name="end_date"
                                                value={formData.end_date}
                                                onChange={handleInputChange}
                                                style={{
                                                    ...inputStyle,
                                                    borderColor: dateErrors.end_date ? '#dc3545' : '#dee2e6'
                                                }}
                                                required
                                            />
                                            {dateErrors.end_date && (
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.25rem',
                                                    fontSize: '0.85rem',
                                                    color: '#dc3545'
                                                }}>
                                                    {dateErrors.end_date}
                                                </small>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {shouldShowField('expiration', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>
                                            Expiration Date 
                                            <span style={{ color: '#dc3545' }}>*</span>
                                            <div className="info-tooltip">
                                                <span className="tooltip-icon">i</span>
                                                <span className="tooltip-text">
                                                    The expiration date is when this listing becomes expired on the platform. It should be on or after the end date to give users time to view and engage with the item after it concludes.
                                                </span>
                                            </div>
                                        </label>
                                        <input
                                            type="date"
                                            name="expiration"
                                            value={formData.expiration}
                                            onChange={handleInputChange}
                                            style={{
                                                ...inputStyle,
                                                borderColor: dateErrors.expiration ? '#dc3545' : '#dee2e6'
                                            }}
                                            required
                                        />
                                        {dateErrors.expiration && (
                                            <small style={{ 
                                                display: 'block',
                                                marginTop: '0.25rem',
                                                fontSize: '0.85rem',
                                                color: '#dc3545'
                                            }}>
                                                {dateErrors.expiration}
                                            </small>
                                        )}
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
                                                    onChange={handleInputChange}
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
                                                    onChange={handleInputChange}
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
                                                    Select narrow field to filter detailed fields
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
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                ...selectStyle,
                                                backgroundColor: '#f8f9fa'
                                            }}
                                        >
                                            <option value="">Select university</option>
                                            {universities.map(uni => (
                                                <option key={uni.documentId} value={uni.documentId}>
                                                    {uni.attributes?.name || uni.university_name}
                                                </option>
                                            ))}
                                        </select>
                                        <small style={{ 
                                            display: 'block',
                                            marginTop: '0.25rem',
                                            fontSize: '0.85rem',
                                            color: '#6c757d'
                                        }}>
                                            Pre-filled from your profile
                                        </small>
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
                                                backgroundColor: '#f8f9fa',
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
                                        <small style={{ 
                                            display: 'block',
                                            marginTop: '0.25rem',
                                            fontSize: '0.85rem',
                                            color: '#6c757d'
                                        }}>
                                            {formData.university ? 'Pre-filled from your profile' : 'Select university to enable'}
                                        </small>
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
                                                backgroundColor: '#f8f9fa',
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
                                        <small style={{ 
                                            display: 'block',
                                            marginTop: '0.25rem',
                                            fontSize: '0.85rem',
                                            color: '#6c757d'
                                        }}>
                                            {formData.first_level_structure ? 'Pre-filled from your profile' : 'Select first level structure to enable'}
                                        </small>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Cover Image - Conditional */}
                        {shouldShowField('cover', categoryName) && (
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={labelStyle}>Cover Image</label>
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
                                        color: '#6c757d'
                                    }}>
                                        Selected: {formData.cover.name}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div style={{ 
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'space-between',
                            marginTop: '2rem'
                        }}>
                            <button
                                type="button"
                                onClick={onBack}
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
                                ← Back to Category
                            </button>
                            <button
                                type="submit"
                                style={{
                                    padding: '0.75rem 2rem',
                                    background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
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
                                Next Step →
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
    color: '#495057'
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

export default CreateItemForm;