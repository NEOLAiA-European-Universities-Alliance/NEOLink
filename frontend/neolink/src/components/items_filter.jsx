import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { base_url } from "../api";
import { shouldShowField } from "../category_field_config";
import { LANGUAGES } from "../config/languages";

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

function ItemsFilter({ filters, onFilterChange, onClearFilters, onSubscribeRequest = () => {}, canSubscribe = true, subscriptionHint = '' }) {
    const [categories, setCategories] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [ercPanels, setErcPanels] = useState([]);
    const [ercKeywords, setErcKeywords] = useState([]);
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [showDateFilters, setShowDateFilters] = useState(false);
    const [languageSearch, setLanguageSearch] = useState('');
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const languageDropdownRef = useRef(null);

    const itemStatusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'running', label: 'Running' },
        { value: 'expired', label: 'Expired' }
    ];

    const ercAreaOptions = [
        { value: 'Life Sciences (LS)', label: 'Life Sciences (LS)' },
        { value: 'Physical Sciences and Engineering (PE)', label: 'Physical Sciences and Engineering (PE)' },
        { value: 'Social Sciences and Humanities (SH)', label: 'Social Sciences and Humanities (SH)' }
    ];

    const extractList = (payload) => {
        if (Array.isArray(payload)) {
            return payload;
        }
        if (Array.isArray(payload?.data)) {
            return payload.data;
        }
        return [];
    };

    const getEntityDocumentId = (entity) => entity?.documentId || entity?.attributes?.documentId || entity?.id || '';
    const getEntityName = (entity) => entity?.attributes?.name || entity?.name || '';

    useEffect(() => {
        loadFilterOptions();
    }, []);

    // Update selected category name when category filter changes
    useEffect(() => {
        if (filters.category_id) {
            const selectedCategory = categories.find(
                cat => cat.documentId === filters.category_id
            );
            if (selectedCategory) {
                setSelectedCategoryName(selectedCategory.attributes?.name || selectedCategory.name || '');
            }
        } else {
            setSelectedCategoryName('');
        }
    }, [filters.category_id, categories]);

    useEffect(() => {
        if (filters.erc_area) {
            loadErcPanels(filters.erc_area);
        } else {
            setErcPanels([]);
        }
    }, [filters.erc_area]);

    useEffect(() => {
        if (filters.erc_panel) {
            loadErcKeywords(filters.erc_panel);
        } else {
            setErcKeywords([]);
        }
    }, [filters.erc_panel]);

    const loadFilterOptions = async () => {
        try {
            const [categoriesRes, universitiesRes] = await Promise.all([
                axios.get(`${base_url}/item-categories`),
                axios.get(`${base_url}/universities`)
            ]);

            setCategories(categoriesRes.data.data || []);
            setUniversities(universitiesRes.data.data || []);
        } catch (err) {
            console.error("Error loading filter options:", err);
        }
    };

    const loadErcPanels = async (area) => {
        try {
            const response = await axios.get(
                `${base_url}/custom-erc-panel/?erc_area=${area}`
            );
            console.log("ERC Panels response:", response.data);
            setErcPanels(extractList(response.data));
        } catch (err) {
            console.error("Error loading ERC panels:", err);
        }
    };

    const loadErcKeywords = async (panelId) => {
        try {
            const response = await axios.get(
                `${base_url}/erc-keywords?filters[erc_panel][documentId][$eq]=${panelId}`
            );
            console.log("ERC Keywords response:", response.data);
            setErcKeywords(extractList(response.data));
        } catch (err) {
            console.error("Error loading ERC keywords:", err);
        }
    };

    const handleChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        
        // Reset dependent filters
        if (field === 'erc_area') {
            newFilters.erc_panel = '';
            newFilters.erc_keyword = '';
        }
        if (field === 'erc_panel') {
            newFilters.erc_keyword = '';
        }
        
        // Clear fields that aren't shown for the selected category
        if (field === 'category_id') {
            const selectedCategory = categories.find(cat => cat.documentId === value);
            const categoryName = selectedCategory?.attributes?.name || selectedCategory?.name || '';
            
            // Clear fields that won't be shown for this category
            if (!shouldShowField('university', categoryName)) {
                newFilters.university = '';
            }
            if (!shouldShowField('erc_area', categoryName)) {
                newFilters.erc_area = '';
                newFilters.erc_panel = '';
                newFilters.erc_keyword = '';
            }
            if (!shouldShowField('languages', categoryName)) {
                newFilters.languages = '';
            }
            if (!shouldShowField('level_of_study', categoryName)) {
                newFilters.level_of_study = '';
            }
            if (!shouldShowField('start_date', categoryName)) {
                newFilters.start_date_from = '';
                newFilters.start_date_to = '';
            }
            if (!shouldShowField('end_date', categoryName)) {
                newFilters.end_date_from = '';
                newFilters.end_date_to = '';
            }
            if (!shouldShowField('expiration', categoryName)) {
                newFilters.expiration_from = '';
                newFilters.expiration_to = '';
            }
        }
        
        onFilterChange(newFilters);
    };

    const hasActiveDateFilters = () => {
        return filters.start_date_from || filters.start_date_to || 
               filters.end_date_from || filters.end_date_to ||
               filters.expiration_from || filters.expiration_to;
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '2px solid #dee2e6',
        borderRadius: '8px',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        backgroundColor: 'white',
        color: '#495057'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#495057'
    };

    const sectionHeaderStyle = {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#6c757d',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginTop: '1.5rem',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid #e9ecef'
    };

    const dateInputStyle = {
        ...inputStyle,
        cursor: 'pointer',
        position: 'relative',
        paddingRight: '2.5rem',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236c757d\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Crect x=\'3\' y=\'4\' width=\'18\' height=\'18\' rx=\'2\' ry=\'2\'%3E%3C/rect%3E%3Cline x1=\'16\' y1=\'2\' x2=\'16\' y2=\'6\'%3E%3C/line%3E%3Cline x1=\'8\' y1=\'2\' x2=\'8\' y2=\'6\'%3E%3C/line%3E%3Cline x1=\'3\' y1=\'10\' x2=\'21\' y2=\'10\'%3E%3C/line%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '18px 18px'
    };

    const showDateSection = !selectedCategoryName || 
                           shouldShowField('start_date', selectedCategoryName) || 
                           shouldShowField('end_date', selectedCategoryName) || 
                           shouldShowField('expiration', selectedCategoryName);

    const selectedLanguages = parseLanguages(filters.languages);
    const filteredLanguages = LANGUAGES.filter((lang) =>
        lang.name.toLowerCase().includes(languageSearch.toLowerCase())
    );

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

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            maxHeight: '70vh',
            overflowY: 'auto'
        }}>
            <style>{`
                @media (max-width: 768px) {
                    .filter-date-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                
                /* Custom scrollbar */
                div::-webkit-scrollbar {
                    width: 6px;
                }
                
                div::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                div::-webkit-scrollbar-thumb {
                    background: #7c6fd6;
                    border-radius: 10px;
                }
                
                div::-webkit-scrollbar-thumb:hover {
                    background: #6b5ec5;
                }

                /* Ensure calendar picker shows on mobile */
                input[type="date"]::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    opacity: 1;
                    width: 18px;
                    height: 18px;
                }
            `}</style>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#213547',
                    margin: 0
                }}>
                    Filters
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClearFilters}
                            style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: 'transparent',
                                color: '#7c6fd6',
                                border: '1px solid #7c6fd6',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: 'pointer',
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
                            Clear All
                        </button>
                        <button
                            onClick={onSubscribeRequest}
                            disabled={!canSubscribe}
                            style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: !canSubscribe ? '#e9ecef' : '#7c6fd6',
                                color: !canSubscribe ? '#adb5bd' : 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                cursor: !canSubscribe ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                display: 'inline-flex'
                            }}
                            title={!canSubscribe ? 'Login to save alerts' : 'Get notified when new items match these filters'}
                        >
                            🔔 Notify me
                        </button>
                    </div>
                    {subscriptionHint && (
                        <span style={{ fontSize: '0.75rem', color: '#dc3545' }}>
                            {subscriptionHint}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Search - Always shown */}
                <div>
                    <label style={labelStyle}>Search</label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleChange('search', e.target.value)}
                        placeholder="Search by name..."
                        style={inputStyle}
                    />
                </div>

                {/* Category - Always shown */}
                <div>
                    <label style={labelStyle}>Category</label>
                    <select
                        value={filters.category_id}
                        onChange={(e) => handleChange('category_id', e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.documentId} value={cat.documentId}>
                                {cat.attributes?.name || cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status - Always shown */}
                <div>
                    <label style={labelStyle}>Status</label>
                    <select
                        value={filters.item_status}
                        onChange={(e) => handleChange('item_status', e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                        <option value="">All Statuses</option>
                        {itemStatusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Filters Section with Toggle */}
                {showDateSection && (
                    <>
                        <div style={{
                            marginTop: '0.5rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid #e9ecef'
                        }}>
                            <button
                                onClick={() => setShowDateFilters(!showDateFilters)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: showDateFilters ? '#f0f0ff' : '#f8f9fa',
                                    border: showDateFilters ? '2px solid #7c6fd6' : '2px solid #dee2e6',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    color: showDateFilters ? '#7c6fd6' : '#495057'
                                }}
                                onMouseEnter={(e) => {
                                    if (!showDateFilters) {
                                        e.target.style.backgroundColor = '#f0f0ff';
                                        e.target.style.borderColor = '#7c6fd6';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!showDateFilters) {
                                        e.target.style.backgroundColor = '#f8f9fa';
                                        e.target.style.borderColor = '#dee2e6';
                                    }
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    📅 Date Filters
                                    {hasActiveDateFilters() && (
                                        <span style={{
                                            display: 'inline-block',
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#7c6fd6',
                                            borderRadius: '50%'
                                        }}></span>
                                    )}
                                </span>
                                <span style={{
                                    fontSize: '1.2rem',
                                    transition: 'transform 0.2s',
                                    transform: showDateFilters ? 'rotate(180deg)' : 'rotate(0deg)'
                                }}>
                                    ▼
                                </span>
                            </button>
                        </div>

                        {/* Collapsible Date Filters */}
                        {showDateFilters && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.25rem',
                                animation: 'slideDown 0.3s ease-out',
                                paddingTop: '0.5rem'
                            }}>
                                <style>{`
                                    @keyframes slideDown {
                                        from {
                                            opacity: 0;
                                            max-height: 0;
                                            overflow: hidden;
                                        }
                                        to {
                                            opacity: 1;
                                            max-height: 1000px;
                                        }
                                    }
                                `}</style>

                                {/* Start Date Range */}
                                {(!selectedCategoryName || shouldShowField('start_date', selectedCategoryName)) && (
                                    <div>
                                        <label style={labelStyle}>Start Date Range</label>
                                        <div className="filter-date-grid" style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '1fr 1fr', 
                                            gap: '0.75rem' 
                                        }}>
                                            <div>
                                                <input
                                                    type="date"
                                                    value={filters.start_date_from || ''}
                                                    onChange={(e) => handleChange('start_date_from', e.target.value)}
                                                    style={dateInputStyle}
                                                />
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.35rem',
                                                    fontSize: '0.75rem',
                                                    color: '#6c757d',
                                                    fontWeight: '500'
                                                }}>
                                                    From
                                                </small>
                                            </div>
                                            <div>
                                                <input
                                                    type="date"
                                                    value={filters.start_date_to || ''}
                                                    onChange={(e) => handleChange('start_date_to', e.target.value)}
                                                    style={dateInputStyle}
                                                />
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.35rem',
                                                    fontSize: '0.75rem',
                                                    color: '#6c757d',
                                                    fontWeight: '500'
                                                }}>
                                                    To
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* End Date Range */}
                                {(!selectedCategoryName || shouldShowField('end_date', selectedCategoryName)) && (
                                    <div>
                                        <label style={labelStyle}>End Date Range</label>
                                        <div className="filter-date-grid" style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '1fr 1fr', 
                                            gap: '0.75rem' 
                                        }}>
                                            <div>
                                                <input
                                                    type="date"
                                                    value={filters.end_date_from || ''}
                                                    onChange={(e) => handleChange('end_date_from', e.target.value)}
                                                    style={dateInputStyle}
                                                />
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.35rem',
                                                    fontSize: '0.75rem',
                                                    color: '#6c757d',
                                                    fontWeight: '500'
                                                }}>
                                                    From
                                                </small>
                                            </div>
                                            <div>
                                                <input
                                                    type="date"
                                                    value={filters.end_date_to || ''}
                                                    onChange={(e) => handleChange('end_date_to', e.target.value)}
                                                    style={dateInputStyle}
                                                />
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.35rem',
                                                    fontSize: '0.75rem',
                                                    color: '#6c757d',
                                                    fontWeight: '500'
                                                }}>
                                                    To
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Expiration Date Range */}
                                {(!selectedCategoryName || shouldShowField('expiration', selectedCategoryName)) && (
                                    <div>
                                        <label style={labelStyle}>Expiration Date Range</label>
                                        <div className="filter-date-grid" style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '1fr 1fr', 
                                            gap: '0.75rem' 
                                        }}>
                                            <div>
                                                <input
                                                    type="date"
                                                    value={filters.expiration_from || ''}
                                                    onChange={(e) => handleChange('expiration_from', e.target.value)}
                                                    style={dateInputStyle}
                                                />
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.35rem',
                                                    fontSize: '0.75rem',
                                                    color: '#6c757d',
                                                    fontWeight: '500'
                                                }}>
                                                    From
                                                </small>
                                            </div>
                                            <div>
                                                <input
                                                    type="date"
                                                    value={filters.expiration_to || ''}
                                                    onChange={(e) => handleChange('expiration_to', e.target.value)}
                                                    style={dateInputStyle}
                                                />
                                                <small style={{ 
                                                    display: 'block',
                                                    marginTop: '0.35rem',
                                                    fontSize: '0.75rem',
                                                    color: '#6c757d',
                                                    fontWeight: '500'
                                                }}>
                                                    To
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Institutional Section */}
                {(!selectedCategoryName || shouldShowField('university', selectedCategoryName)) && (
                    <>
                        <div style={sectionHeaderStyle}>Institutional</div>
                        <div>
                            <label style={labelStyle}>University</label>
                            <select
                                value={filters.university}
                                onChange={(e) => handleChange('university', e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                <option value="">All Universities</option>
                                {universities.map(uni => (
                                    <option key={uni.documentId} value={uni.documentId}>
                                        {uni.attributes?.name || uni.university_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {/* Research Classification Section */}
                {(!selectedCategoryName || shouldShowField('erc_area', selectedCategoryName)) && (
                    <>
                        <div style={sectionHeaderStyle}>Research Classification</div>
                        <div>
                            <label style={labelStyle}>ERC Area</label>
                            <select
                                value={filters.erc_area}
                                onChange={(e) => handleChange('erc_area', e.target.value)}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                <option value="">All Areas</option>
                                {ercAreaOptions.map(area => (
                                    <option key={area.value} value={area.value}>
                                        {area.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {(!selectedCategoryName || shouldShowField('erc_panel', selectedCategoryName)) && (
                            <div>
                                <label style={labelStyle}>ERC Panel</label>
                                <select
                                    value={filters.erc_panel}
                                    onChange={(e) => handleChange('erc_panel', e.target.value)}
                                    style={{
                                        ...inputStyle,
                                        cursor: filters.erc_area ? 'pointer' : 'not-allowed',
                                        opacity: filters.erc_area ? 1 : 0.6
                                    }}
                                    disabled={!filters.erc_area}
                                >
                                    <option value="">
                                        {filters.erc_area ? 'All Panels' : 'Select area first'}
                                    </option>
                                    {ercPanels.map(panel => (
                                        <option key={getEntityDocumentId(panel)} value={getEntityDocumentId(panel)}>
                                            {getEntityName(panel)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {(!selectedCategoryName || shouldShowField('erc_keyword', selectedCategoryName)) && (
                            <div>
                                <label style={labelStyle}>ERC Keyword</label>
                                <select
                                    value={filters.erc_keyword}
                                    onChange={(e) => handleChange('erc_keyword', e.target.value)}
                                    style={{
                                        ...inputStyle,
                                        cursor: filters.erc_panel ? 'pointer' : 'not-allowed',
                                        opacity: filters.erc_panel ? 1 : 0.6
                                    }}
                                    disabled={!filters.erc_panel}
                                >
                                    <option value="">
                                        {filters.erc_panel ? 'All Keywords' : 'Select panel first'}
                                    </option>
                                    {ercKeywords.map(keyword => (
                                        <option key={getEntityDocumentId(keyword)} value={getEntityDocumentId(keyword)}>
                                            {getEntityName(keyword)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </>
                )}

                {/* Content Details Section */}
                {(!selectedCategoryName || shouldShowField('languages', selectedCategoryName) || shouldShowField('level_of_study', selectedCategoryName)) && (
                    <>
                        <div style={sectionHeaderStyle}>Content Details</div>
                        {(!selectedCategoryName || shouldShowField('languages', selectedCategoryName)) && (
                            <div style={{ position: 'relative' }} ref={languageDropdownRef}>
                                <label style={labelStyle}>Languages</label>
                                <div style={{ position: 'relative' }}>
                                    <div
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
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <span style={{ color: selectedLanguages.length > 0 ? '#495057' : '#6c757d' }}>
                                            {selectedLanguages.length > 0
                                                ? selectedLanguages.join(', ')
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

                                            <div style={{ overflowY: 'auto', maxHeight: '280px' }}>
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
                                                    filteredLanguages.map((lang) => (
                                                        <div
                                                            key={lang.code}
                                                            onClick={() => {
                                                                const alreadySelected = selectedLanguages.includes(lang.name);
                                                                const updatedLanguages = alreadySelected
                                                                    ? selectedLanguages.filter((entry) => entry !== lang.name)
                                                                    : [...selectedLanguages, lang.name];
                                                                handleChange('languages', serializeLanguages(updatedLanguages));
                                                            }}
                                                            style={{
                                                                padding: '0.75rem 1rem',
                                                                cursor: 'pointer',
                                                                backgroundColor: selectedLanguages.includes(lang.name) ? '#f0f0ff' : 'transparent',
                                                                borderLeft: selectedLanguages.includes(lang.name) ? '3px solid #7c6fd6' : '3px solid transparent',
                                                                transition: 'all 0.2s',
                                                                fontSize: '0.9rem',
                                                                color: '#495057'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!selectedLanguages.includes(lang.name)) {
                                                                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!selectedLanguages.includes(lang.name)) {
                                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                                }
                                                            }}
                                                        >
                                                            {lang.name}
                                                            {selectedLanguages.includes(lang.name) && (
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
                            </div>
                        )}
                        {(!selectedCategoryName || shouldShowField('level_of_study', selectedCategoryName)) && (
                            <div>
                                <label style={labelStyle}>Level of Study</label>
                                <select
                                    value={filters.level_of_study || ''}
                                    onChange={(e) => handleChange('level_of_study', e.target.value)}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    <option value="">All levels</option>
                                    <option value="PhD">PhD</option>
                                    <option value="Master degree">Master degree</option>
                                    <option value="Bachelor degree">Bachelor degree</option>
                                    <option value="Undergraduate students">Undergraduate students</option>
                                </select>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ItemsFilter;