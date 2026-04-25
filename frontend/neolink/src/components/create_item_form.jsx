import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { base_url } from "../api";
import { shouldShowField, getCategoryFieldDescription } from "../category_field_config";
import Navbar from "./navbar";
import { getCategoryIcon } from "../utils";
import { LANGUAGES } from "../config/languages";

const logo_neolink = `${import.meta.env.BASE_URL}logo.png`;
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;
const ITEM_NAME_MAX_LENGTH = 60;

const parseLanguages = (value) => {
    if (Array.isArray(value)) {
        return value.filter((entry) => typeof entry === 'string' && entry.trim() !== '');
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
};

const serializeLanguages = (values) => {
    if (!Array.isArray(values)) {
        return '';
    }
    return values.map((entry) => entry.trim()).filter(Boolean).join(', ');
};

function CreateItemForm({ token, initialData, selectedCategory, onNext, onBack }) {
    const formRef = useRef(null);
    const fieldRefs = useRef({});
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
        languages: parseLanguages(initialData?.languages),
        speakers: initialData?.speakers || '',
        pedagogical_objectives: initialData?.pedagogical_objectives || '',
        level_of_study: initialData?.level_of_study || '',
        university: initialData?.university || '',
        first_level_structure: initialData?.first_level_structure || '',
        second_level_structure: initialData?.second_level_structure || '',
        offered_by: initialData?.offered_by || '',
        cover: initialData?.cover || null,
        notify_on_interest: initialData?.notify_on_interest !== undefined ? initialData.notify_on_interest : true,
        notify_on_interest_email: initialData?.notify_on_interest_email !== undefined ? initialData.notify_on_interest_email : false,
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
    const [fieldErrors, setFieldErrors] = useState({});

    // Language dropdown states
    const [languageSearch, setLanguageSearch] = useState('');
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const languageDropdownRef = useRef(null);

    // Filter languages based on search
    const filteredLanguages = LANGUAGES.filter(lang =>
        lang.name.toLowerCase().includes(languageSearch.toLowerCase())
    );

    // Item status options
    const itemStatusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'running', label: 'Running' },
        { value: 'expired', label: 'Expired' }
    ];

    const fieldLabels = {
        item_status: `${categoryName} status`,
        name: `${categoryName} name`,
        offered_by: 'Inserted by',
        start_date: 'Start date',
        end_date: 'End date',
        expiration: 'Expiration date',
        languages: 'Languages',
        university: 'University',
        first_level_structure: 'First level structure',
        second_level_structure: 'Second level structure'
    };

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

    const getRequiredFields = () => {
        const requiredFields = ['item_status', 'name', 'offered_by'];

        if (shouldShowField('start_date', categoryName)) requiredFields.push('start_date');
        if (shouldShowField('end_date', categoryName)) requiredFields.push('end_date');
        if (shouldShowField('expiration', categoryName)) requiredFields.push('expiration');
        if (shouldShowField('languages', categoryName)) requiredFields.push('languages');
        if (shouldShowField('university', categoryName)) requiredFields.push('university');
        if (shouldShowField('first_level_structure', categoryName)) requiredFields.push('first_level_structure');
        const shouldRequireSecondLevel =
            shouldShowField('second_level_structure', categoryName) &&
            formData.first_level_structure &&
            secondLevelStructures.length > 0;

        if (shouldRequireSecondLevel) requiredFields.push('second_level_structure');

        return requiredFields;
    };

    const clearFieldError = (fieldName) => {
        setFieldErrors(prev => {
            if (!prev[fieldName]) return prev;
            const updated = { ...prev };
            delete updated[fieldName];
            return updated;
        });
    };

    const validateForm = () => {
        const validationErrors = {};
        const requiredFields = getRequiredFields();

        requiredFields.forEach(field => {
            const value = formData[field];
            const isEmpty = Array.isArray(value)
                ? value.length === 0
                : typeof value === 'string'
                    ? value.trim() === ''
                    : !value;
            if (isEmpty) {
                validationErrors[field] = `${fieldLabels[field] || field} is required.`;
            }
        });

        if (Object.keys(dateErrors).length > 0) {
            Object.entries(dateErrors).forEach(([field, message]) => {
                validationErrors[field] = message;
            });
        }

        return validationErrors;
    };

    const focusFirstInvalidField = (validationErrors) => {
        const requiredOrder = getRequiredFields();
        const errorFields = Object.keys(validationErrors);
        const firstInvalidField = requiredOrder.find(field => errorFields.includes(field)) || errorFields[0];

        if (!firstInvalidField) return;

        const targetField = fieldRefs.current[firstInvalidField];
        if (targetField) {
            targetField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof targetField.focus === 'function') {
                targetField.focus();
            }
        }
    };

    const getFieldError = (fieldName) => fieldErrors[fieldName] || dateErrors[fieldName];

    // Click outside handler for language dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
                setIsLanguageDropdownOpen(false);
                setLanguageSearch('');
            }
        };

        if (isLanguageDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLanguageDropdownOpen]);

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
        const normalizedValue = name === 'name' ? value.slice(0, ITEM_NAME_MAX_LENGTH) : value;
        clearFieldError(name);
        if (error) {
            setError(null);
        }
        setFormData(prev => ({
            ...prev,
            [name]: normalizedValue
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

        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setError("Please complete the highlighted fields before proceeding to the next step.");
            focusFirstInvalidField(validationErrors);
            return;
        }

        setFieldErrors({});
        setError(null);
        
        // Pass form data to parent and move to step 3
        onNext({
            ...formData,
            languages: serializeLanguages(formData.languages)
        });
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

                    <form ref={formRef} onSubmit={handleSubmit} noValidate>
                        {/* Item Status */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                {categoryName} Status <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <select
                                ref={(el) => { fieldRefs.current.item_status = el; }}
                                name="item_status"
                                value={formData.item_status}
                                onChange={handleInputChange}
                                required
                                style={{
                                    ...selectStyle,
                                    borderColor: getFieldError('item_status') ? '#dc3545' : '#dee2e6'
                                }}
                            >
                                {itemStatusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {getFieldError('item_status') && (
                                <small style={errorTextStyle}>{getFieldError('item_status')}</small>
                            )}
                        </div>

                        {/* Name - Always shown */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                {categoryName} Name <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                ref={(el) => { fieldRefs.current.name = el; }}
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                maxLength={ITEM_NAME_MAX_LENGTH}
                                style={{
                                    ...inputStyle,
                                    borderColor: getFieldError('name') ? '#dc3545' : '#dee2e6'
                                }}
                                placeholder="Enter item name"
                            />
                            {getFieldError('name') && (
                                <small style={errorTextStyle}>{getFieldError('name')}</small>
                            )}
                            <small style={{
                                display: 'block',
                                marginTop: '0.25rem',
                                fontSize: '0.85rem',
                                color: '#6c757d'
                            }}>
                                Max {ITEM_NAME_MAX_LENGTH} characters ({formData.name.length}/{ITEM_NAME_MAX_LENGTH})
                            </small>
                        </div>

                        {/* Offered By - Always shown (Read-only) */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                Inserted by <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                ref={(el) => { fieldRefs.current.offered_by = el; }}
                                type="text"
                                name="offered_by"
                                value={formData.offered_by}
                                readOnly
                                required
                                style={{
                                    ...inputStyle,
                                    backgroundColor: '#f8f9fa',
                                    cursor: 'not-allowed',
                                    color: '#6c757d',
                                    borderColor: getFieldError('offered_by') ? '#dc3545' : '#dee2e6'
                                }}
                                placeholder="Instructor/Professor name"
                            />
                            {getFieldError('offered_by') && (
                                <small style={errorTextStyle}>{getFieldError('offered_by')}</small>
                            )}
                            <small style={{ 
                                display: 'block',
                                marginTop: '0.25rem',
                                fontSize: '0.85rem',
                                color: '#6c757d'
                            }}>
                                Pre-filled from data provided by your University (cannot be edited).
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
                                                ref={(el) => { fieldRefs.current.start_date = el; }}
                                                type="date"
                                                name="start_date"
                                                value={formData.start_date}
                                                onChange={handleInputChange}
                                                style={{
                                                    ...inputStyle,
                                                    borderColor: getFieldError('start_date') ? '#dc3545' : '#dee2e6'
                                                }}
                                                required
                                            />
                                            {getFieldError('start_date') && (
                                                <small style={errorTextStyle}>{getFieldError('start_date')}</small>
                                            )}
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
                                                ref={(el) => { fieldRefs.current.end_date = el; }}
                                                type="date"
                                                name="end_date"
                                                value={formData.end_date}
                                                onChange={handleInputChange}
                                                style={{
                                                    ...inputStyle,
                                                    borderColor: getFieldError('end_date') ? '#dc3545' : '#dee2e6'
                                                }}
                                                required
                                            />
                                            {getFieldError('end_date') && (
                                                <small style={errorTextStyle}>
                                                    {getFieldError('end_date')}
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
                                            ref={(el) => { fieldRefs.current.expiration = el; }}
                                            type="date"
                                            name="expiration"
                                            value={formData.expiration}
                                            onChange={handleInputChange}
                                            style={{
                                                ...inputStyle,
                                                borderColor: getFieldError('expiration') ? '#dc3545' : '#dee2e6'
                                            }}
                                            required
                                        />
                                        {getFieldError('expiration') && (
                                            <small style={errorTextStyle}>
                                                {getFieldError('expiration')}
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
                                        <select
                                            name="level_of_study"
                                            value={formData.level_of_study}
                                            onChange={handleInputChange}
                                            style={{ ...inputStyle, cursor: 'pointer' }}
                                        >
                                            <option value="">Select level of study</option>
                                            <option value="PhD">PhD</option>
                                            <option value="Master degree">Master degree</option>
                                            <option value="Bachelor degree">Bachelor degree</option>
                                            <option value="Undergraduate students">Undergraduate students</option>
                                        </select>
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
                                    <div style={{ marginBottom: '1.5rem', position: 'relative' }} ref={languageDropdownRef}>
                                        <label style={labelStyle}>
                                            Language <span style={{ color: '#dc3545' }}>*</span>
                                        </label>
                                        
                                        {/* Custom Searchable Select */}
                                        <div style={{ position: 'relative' }}>
                                            {/* Selected Value / Trigger */}
                                            <div
                                                ref={(el) => { fieldRefs.current.languages = el; }}
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                                                    }
                                                }}
                                                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                                                style={{
                                                    ...inputStyle,
                                                    borderColor: getFieldError('languages') ? '#dc3545' : '#dee2e6',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                <span style={{ 
                                                    color: formData.languages.length > 0 ? '#495057' : '#6c757d',
                                                    flex: 1
                                                }}>
                                                    {formData.languages.length > 0
                                                        ? formData.languages.join(', ')
                                                        : 'Select one or more languages'}
                                                </span>
                                                <span style={{ 
                                                    fontSize: '0.8rem',
                                                    color: '#6c757d',
                                                    marginLeft: '0.5rem',
                                                    transform: isLanguageDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s'
                                                }}>
                                                    ▼
                                                </span>
                                            </div>

                                            {/* Dropdown */}
                                            {isLanguageDropdownOpen && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        right: 0,
                                                        marginTop: '0.25rem',
                                                        backgroundColor: 'white',
                                                        border: '2px solid #7c6fd6',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                                        zIndex: 1000,
                                                        maxHeight: '350px',
                                                        display: 'flex',
                                                        flexDirection: 'column'
                                                    }}
                                                >
                                                    {/* Search Input */}
                                                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #dee2e6' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Search languages..."
                                                            value={languageSearch}
                                                            onChange={(e) => setLanguageSearch(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                width: '100%',
                                                                padding: '0.5rem',
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '6px',
                                                                fontSize: '0.9rem',
                                                                outline: 'none'
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>

                                                    {/* Language Options */}
                                                    <div style={{
                                                        overflowY: 'auto',
                                                        maxHeight: '280px'
                                                    }}>
                                                        {filteredLanguages.length === 0 ? (
                                                            <div style={{
                                                                padding: '1rem',
                                                                textAlign: 'center',
                                                                color: '#6c757d',
                                                                fontSize: '0.9rem'
                                                            }}>
                                                                No languages found
                                                            </div>
                                                        ) : (
                                                            filteredLanguages.map(lang => (
                                                                <div
                                                                    key={lang.code}
                                                                    onClick={() => {
                                                                        const alreadySelected = formData.languages.includes(lang.name);
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            languages: alreadySelected
                                                                                ? prev.languages.filter((entry) => entry !== lang.name)
                                                                                : [...prev.languages, lang.name]
                                                                        }));
                                                                        clearFieldError('languages');
                                                                        if (error) {
                                                                            setError(null);
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '0.75rem 1rem',
                                                                        cursor: 'pointer',
                                                                        backgroundColor: formData.languages.includes(lang.name) ? '#f0f0ff' : 'transparent',
                                                                        borderLeft: formData.languages.includes(lang.name) ? '3px solid #7c6fd6' : '3px solid transparent',
                                                                        transition: 'all 0.2s',
                                                                        fontSize: '0.9rem',
                                                                        color: '#495057'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (!formData.languages.includes(lang.name)) {
                                                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (!formData.languages.includes(lang.name)) {
                                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                                        }
                                                                    }}
                                                                >
                                                                    {lang.name}
                                                                    {formData.languages.includes(lang.name) && (
                                                                        <span style={{
                                                                            marginLeft: '0.5rem',
                                                                            color: '#7c6fd6',
                                                                            fontWeight: '600'
                                                                        }}>
                                                                            ✓
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hidden input for form validation */}
                                        <input
                                            type="text"
                                            name="languages"
                                            value={serializeLanguages(formData.languages)}
                                            onChange={() => {}} // Controlled by the custom select
                                            required
                                            style={{ display: 'none' }}
                                        />
                                        {getFieldError('languages') && (
                                            <small style={errorTextStyle}>{getFieldError('languages')}</small>
                                        )}
                                        
                                        <small style={{
                                            display: 'block',
                                            marginTop: '0.5rem',
                                            fontSize: '0.85rem',
                                            color: '#6c757d'
                                        }}>
                                            Select one or more languages for this {categoryName.toLowerCase()}
                                        </small>
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
                                            ref={(el) => { fieldRefs.current.university = el; }}
                                            name="university"
                                            value={formData.university}
                                            onChange={handleInputChange}
                                            required
                                            style={{
                                                ...selectStyle,
                                                backgroundColor: '#f8f9fa',
                                                borderColor: getFieldError('university') ? '#dc3545' : '#dee2e6'
                                            }}
                                        >
                                            <option value="">Select university</option>
                                            {universities.map(uni => (
                                                <option key={uni.documentId} value={uni.documentId}>
                                                    {uni.attributes?.name || uni.university_name}
                                                </option>
                                            ))}
                                        </select>
                                        {getFieldError('university') && (
                                            <small style={errorTextStyle}>{getFieldError('university')}</small>
                                        )}
                                        <small style={{ 
                                            display: 'block',
                                            marginTop: '0.25rem',
                                            fontSize: '0.85rem',
                                            color: '#6c757d'
                                        }}>
                                            Pre-filled with data from the <a href="https://data.neolaiacampus.eu/research-hub" target="_blank" rel="noopener noreferrer">Open Research Hub</a>, if available.
                                        </small>
                                    </div>
                                )}

                                {shouldShowField('first_level_structure', categoryName) && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={labelStyle}>First Level Structure <span style={{ color: '#dc3545' }}>*</span></label>
                                        <select
                                            ref={(el) => { fieldRefs.current.first_level_structure = el; }}
                                            name="first_level_structure"
                                            value={formData.first_level_structure}
                                            onChange={handleInputChange}
                                            style={{
                                                ...selectStyle,
                                                backgroundColor: '#f8f9fa',
                                                cursor: !formData.university ? 'not-allowed' : 'pointer',
                                                opacity: !formData.university ? 0.6 : 1,
                                                borderColor: getFieldError('first_level_structure') ? '#dc3545' : '#dee2e6'
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
                                        {getFieldError('first_level_structure') && (
                                            <small style={errorTextStyle}>{getFieldError('first_level_structure')}</small>
                                        )}
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
                                            ref={(el) => { fieldRefs.current.second_level_structure = el; }}
                                            name="second_level_structure"
                                            value={formData.second_level_structure}
                                            onChange={handleInputChange}
                                            style={{
                                                ...selectStyle,
                                                backgroundColor: '#f8f9fa',
                                                cursor: !formData.first_level_structure ? 'not-allowed' : 'pointer',
                                                opacity: !formData.first_level_structure ? 0.6 : 1,
                                                borderColor: getFieldError('second_level_structure') ? '#dc3545' : '#dee2e6'
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
                                        {getFieldError('second_level_structure') && (
                                            <small style={errorTextStyle}>{getFieldError('second_level_structure')}</small>
                                        )}
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

                        {/* Notification Preferences */}
                        <div style={{
                            marginTop: '2rem',
                            padding: '1.25rem 1.5rem',
                            backgroundColor: '#f8f7ff',
                            borderRadius: '10px',
                            border: '1px solid #e0daf7'
                        }}>
                            <p style={{ margin: '0 0 1rem', fontWeight: '600', color: '#213547', fontSize: '0.95rem' }}>
                                🔔 Notification preferences
                            </p>
                            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#6c757d', lineHeight: '1.5' }}>
                                Choose how you want to be notified when someone expresses interest in this item.
                            </p>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.notify_on_interest}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notify_on_interest: e.target.checked }))}
                                    style={{ width: '17px', height: '17px', accentColor: '#7c6fd6', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.92rem', color: '#495057' }}>
                                    Receive a <strong>platform notification</strong> when someone is interested
                                </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.notify_on_interest_email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notify_on_interest_email: e.target.checked }))}
                                    style={{ width: '17px', height: '17px', accentColor: '#7c6fd6', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.92rem', color: '#495057' }}>
                                    Receive an <strong>email notification</strong> when someone is interested
                                </span>
                            </label>
                        </div>

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

const errorTextStyle = {
    display: 'block',
    marginTop: '0.25rem',
    fontSize: '0.85rem',
    color: '#dc3545'
};

export default CreateItemForm;