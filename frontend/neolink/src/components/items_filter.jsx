import { useState, useEffect } from "react";
import axios from "axios";
import { base_url } from "../api";
import { shouldShowField } from "../category_field_config";

function ItemsFilter({ filters, onFilterChange, onClearFilters }) {
    const [categories, setCategories] = useState([]);
    const [universities, setUniversities] = useState([]);
    const [ercPanels, setErcPanels] = useState([]);
    const [ercKeywords, setErcKeywords] = useState([]);
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [showDateFilters, setShowDateFilters] = useState(false);

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
            setErcPanels(response.data.data || []);
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
            setErcKeywords(response.data.data || []);
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
                                        <option key={panel.documentId} value={panel.documentId}>
                                            {panel.attributes?.name || panel.name}
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
                                        <option key={keyword.documentId} value={keyword.documentId}>
                                            {keyword.attributes?.name || keyword.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </>
                )}

                {/* Content Details Section */}
                {(!selectedCategoryName || shouldShowField('languages', selectedCategoryName)) && (
                    <>
                        <div style={sectionHeaderStyle}>Content Details</div>
                        <div>
                            <label style={labelStyle}>Languages</label>
                            <input
                                type="text"
                                value={filters.languages || ''}
                                onChange={(e) => handleChange('languages', e.target.value)}
                                placeholder="e.g., English, Spanish"
                                style={inputStyle}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ItemsFilter;