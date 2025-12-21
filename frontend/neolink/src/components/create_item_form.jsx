import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { base_url } from "../api";

const logo_neolaia = "/logoNEOLAiA.png";
const eu_logo = "/eu_logo.png";
const logo_neolink = "/logo.png";

function CreateItemForm({ token }) {
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        item_status: 'active',
        name: '',
        description: '',
        category_id: '',
        expiration: '',
        isced_code: '',
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
        cover: null
    });

    // Dropdown options from database
    const [universities, setUniversities] = useState([]);
    const [firstLevelStructures, setFirstLevelStructures] = useState([]);
    const [secondLevelStructures, setSecondLevelStructures] = useState([]);
    const [ercPanels, setErcPanels] = useState([]);
    const [ercKeywords, setErcKeywords] = useState([]);
    const [categories, setCategories] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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

    // Initial load - without dependent dropdowns (loaded separately)
    useEffect(() => {
        const initializeForm = async () => {
            try {
                const decoded = jwtDecode(token);
                console.log("Decoded token:", decoded);
                setUserData(decoded);

                const [
                    universitiesRes,
                    categoriesRes
                ] = await Promise.all([
                    axios.get(`${base_url}/universities`),
                    axios.get(`${base_url}/item-categories`)
                ]);

                console.log("Universities:", universitiesRes.data);

                setUniversities(universitiesRes.data.data || universitiesRes.data || []);
                setCategories(categoriesRes.data.data || categoriesRes.data || []);

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

    // Load first level structures based on university
    useEffect(() => {
        const loadFirstLevelStructures = async () => {
            if (formData.university) {
                try {
                    const response = await axios.get(
                        `${base_url}/custom-first-level/?university=${formData.university}`
                    );
                    setFirstLevelStructures(response.data.data || response.data || []);
                    console.log("First level structures:", response.data);
                    
                    if (formData.first_level_structure) {
                        const isValid = (response.data.data || response.data || [])
                            .some(struct => struct.id === formData.first_level_structure);
                        if (!isValid) {
                            setFormData(prev => ({
                                ...prev,
                                first_level_structure: '',
                                second_level_structure: '' // Also reset second level
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
                    console.log("Second level structures:", response.data);
                    
                    // Reset second_level_structure if it's not valid for the new first level
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
                // Clear second_level_structure if no first level is selected
                setFormData(prev => ({
                    ...prev,
                    second_level_structure: ''
                }));
            }
        };

        loadSecondLevelStructures();
    }, [formData.first_level_structure]);

    // Load ERC panels based on selected ERC area
    useEffect(() => {
        const loadErcPanels = async () => {
            if (formData.erc_area) {
                try {
                    const response = await axios.get(
                        `${base_url}/custom-erc-panel/?erc_area=${formData.erc_area}`
                    );
                    console.log("ERC Panels for area", formData.erc_area, ":", response.data);
                    setErcPanels(response.data.data || response.data || []);
                    
                    // Reset erc_panel if it's not valid for the new area
                    if (formData.erc_panel) {
                        const isValid = (response.data.data || response.data || [])
                            .some(panel => panel.documentId === formData.erc_panel);
                        if (!isValid) {
                            setFormData(prev => ({
                                ...prev,
                                erc_panel: '',
                                erc_keyword: '' // Also reset keyword when panel is reset
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error loading ERC panels:", err);
                    setErcPanels([]);
                }
            } else {
                setErcPanels([]);
                // Clear erc_panel and erc_keyword if no area is selected
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
                    console.log("ERC Keywords for panel", formData.erc_panel, ":", response.data);
                    setErcKeywords(response.data.data || response.data || []);
                    
                    // Reset erc_keyword if it's not valid for the new panel
                    if (formData.erc_keyword) {
                        const isValid = (response.data.data || response.data || [])
                            .some(keyword => keyword.id === formData.erc_keyword);
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
                // Clear erc_keyword if no panel is selected
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const submitData = new FormData();
            
            const decoded = jwtDecode(token);
            const userId = decoded.sub || decoded.id || decoded.user_id || decoded.userId;
            
            console.log("Submitting with user_id:", userId);
            submitData.append('data[user_id]', userId);
            
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== '') {
                    if (key === 'cover' && formData[key]) {
                        submitData.append('files.cover', formData[key]);
                    } else if (key !== 'cover') {
                        submitData.append(`data[${key}]`, formData[key]);
                    }
                }
            });

            console.log("Form data being sent:");
            for (let pair of submitData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const response = await axios.post(
                `${base_url}/items`,
                submitData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log("Response:", response.data);
            setSuccess(true);
            setSubmitting(false);
            
            setTimeout(() => {
                setSuccess(false);
                const universityId = userData?.university_id || userData?.university_name || '';
                const firstLevelId = userData?.first_level_structure_id || userData?.first_level_structure || '';
                const secondLevelId = userData?.second_level_structure_id || userData?.second_level_structure || '';
                const fullName = userData?.full_name || userData?.fullName || userData?.name || '';
                
                setFormData({
                    item_status: 'active',
                    name: '',
                    description: '',
                    category_id: '',
                    expiration: '',
                    isced_code: '',
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
                    university: universityId,
                    first_level_structure: firstLevelId,
                    second_level_structure: secondLevelId,
                    offered_by: fullName ? formatName(fullName) : '',
                    cover: null
                });
            }, 2000);

        } catch (err) {
            console.error("Error submitting form:", err);
            console.error("Error response:", err.response?.data);
            setError(err.response?.data?.error?.message || "Failed to create item. Please try again.");
            setSubmitting(false);
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
            `}</style>
            
            {/* Header */}
            <div style={{
                padding: '1rem 0',
                borderBottom: '1px solid #dee2e6',
                backgroundColor: 'white',
                width: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img 
                            src={logo_neolink} 
                            alt='Logo NEOLink' 
                            style={{ maxHeight: '50px', height: 'auto' }}
                        />
                    </div>
                    <img 
                        src={eu_logo} 
                        alt='Logo EU' 
                        style={{ maxHeight: '45px', height: 'auto' }}
                    />
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
                {success && (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: '#d1e7dd',
                        border: '1px solid #badbcc',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        color: '#0f5132'
                    }}>
                        ✓ Item created successfully!
                    </div>
                )}

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
                    <h2 style={{ 
                        marginBottom: '2rem',
                        color: '#213547',
                        fontSize: '1.75rem',
                        fontWeight: '600'
                    }}>
                        Create New Item
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Item Status */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                Item Status <span style={{ color: '#dc3545' }}>*</span>
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

                        {/* Name */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                Name <span style={{ color: '#dc3545' }}>*</span>
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

                        {/* Offered By */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                Inserted by <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="offered_by"
                                value={formData.offered_by}
                                onChange={handleInputChange}
                                required
                                style={{
                                    ...inputStyle,
                                    backgroundColor: '#f8f9fa'
                                }}
                                placeholder="Instructor/Professor name"
                            />
                            <small style={{ 
                                display: 'block',
                                marginTop: '0.25rem',
                                fontSize: '0.85rem',
                                color: '#6c757d'
                            }}>
                                Pre-filled from your profile. You can edit if needed.
                            </small>
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                style={textareaStyle}
                                placeholder="Enter item description"
                            />
                        </div>

                        {/* Category */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>
                                Category <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleInputChange}
                                required
                                style={selectStyle}
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.attributes?.name || cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dates */}
                        <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div>
                                <label style={labelStyle}>Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleInputChange}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleInputChange}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>Expiration Date</label>
                            <input
                                type="date"
                                name="expiration"
                                value={formData.expiration}
                                onChange={handleInputChange}
                                style={inputStyle}
                            />
                        </div>

                        {/* ISCED Code */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>ISCED Code</label>
                            <input
                                type="text"
                                name="isced_code"
                                value={formData.isced_code}
                                onChange={handleInputChange}
                                style={inputStyle}
                                placeholder="Enter ISCED code"
                            />
                        </div>

                        {/* ERC Area, Panel and Keyword */}
                        <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '1.5rem',
                            marginBottom: '1.5rem'
                        }}>
                            {/* ERC Area */}
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

                            {/* ERC Panel */}
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

                            {/* ERC Keyword */}
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
                                        <option key={keyword.id} value={keyword.id}>
                                            {keyword.attributes?.name || keyword.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Learning Outcomes */}
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

                        {/* Multimedia Material */}
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

                        {/* Languages */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>Languages</label>
                            <input
                                type="text"
                                name="languages"
                                value={formData.languages}
                                onChange={handleInputChange}
                                style={inputStyle}
                                placeholder="e.g., English, Spanish, French"
                            />
                        </div>

                        {/* Speakers */}
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

                        {/* Pedagogical Objectives */}
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

                        {/* Level of Study */}
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

                        {/* University */}
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
                                    <option key={uni.id} value={uni.id}>
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

                        {/* First Level Structure */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>First Level Structure</label>
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

                        {/* Second Level Structure */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={labelStyle}>Second Level Structure</label>
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
                            >
                                <option value="">
                                    {formData.first_level_structure ? 'Select second level structure' : 'Select first level first'}
                                </option>
                                {secondLevelStructures.map(struct => (
                                    <option key={struct.id} value={struct.id}>
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

                        {/* Cover Image */}
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

                        {/* Submit Buttons */}
                        <div style={{ 
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                type="button"
                                onClick={() => window.history.back()}
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
                                disabled={submitting}
                                style={{
                                    padding: '0.75rem 2rem',
                                    background: submitting 
                                        ? '#9b8fd6' 
                                        : 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: '0 2px 4px rgba(124, 111, 214, 0.2)'
                                }}
                                onMouseEnter={(e) => {
                                    if (!submitting) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(124, 111, 214, 0.4)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = '0 2px 4px rgba(124, 111, 214, 0.2)';
                                }}
                            >
                                {submitting ? 'Creating...' : 'Create Item'}
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