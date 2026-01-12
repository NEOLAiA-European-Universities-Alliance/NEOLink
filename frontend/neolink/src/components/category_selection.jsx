import { useState, useEffect } from "react";
import axios from "axios";
import { base_url } from "../api";

const logo_neolink = `${import.meta.env.BASE_URL}logo.png`;
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;

function CategorySelection({ token, onNext, initialCategory }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await axios.get(`${base_url}/item-categories`);
                setCategories(response.data.data || response.data || []);
                setLoading(false);
            } catch (err) {
                console.error("Error loading categories:", err);
                setError("Failed to load categories. Please try again.");
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedCategory) {
            onNext(selectedCategory);
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
                    <p style={{ marginTop: '1rem', color: '#6c757d' }}>Loading categories...</p>
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
                
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .category-card {
                    transition: all 0.3s ease;
                }
                
                .category-card:hover {
                    transform: translateY(-4px);
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
                            backgroundColor: '#7c6fd6',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600'
                        }}>
                            1
                        </div>
                        <span style={{ color: '#7c6fd6', fontWeight: '600' }}>Select Category</span>
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
                            2
                        </div>
                        <span style={{ color: '#6c757d', fontWeight: '500' }}>Basic Info</span>
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
                        <span style={{ color: '#6c757d', fontWeight: '500' }}>Virtual Café Settings</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ 
                flex: 1,
                padding: '3rem 1rem',
                maxWidth: '1200px',
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
                    textAlign: 'center',
                    marginBottom: '3rem',
                    animation: 'fadeInUp 0.6s ease'
                }}>
                    <h1 style={{ 
                        marginBottom: '0.5rem',
                        color: '#213547',
                        fontSize: '2.5rem',
                        fontWeight: '700'
                    }}>
                        What type of item are you creating?
                    </h1>
                    <p style={{
                        color: '#6c757d',
                        fontSize: '1.1rem',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        Select a category to get started. This will help us show you the most relevant fields for your item.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '3rem'
                    }}>
                        {categories.map((category, index) => {
                            const categoryName = category.attributes?.name || category.name;
                            const categoryId = category.documentId || category.id;
                            const isSelected = selectedCategory?.documentId === categoryId || 
                                             selectedCategory?.id === categoryId;
                            
                            return (
                                <div
                                    key={categoryId}
                                    className="category-card"
                                    onClick={() => setSelectedCategory(category)}
                                    style={{
                                        backgroundColor: 'white',
                                        borderRadius: '16px',
                                        padding: '2rem',
                                        cursor: 'pointer',
                                        border: isSelected ? '3px solid #7c6fd6' : '2px solid #dee2e6',
                                        boxShadow: isSelected 
                                            ? '0 8px 24px rgba(124, 111, 214, 0.2)' 
                                            : '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        animation: `fadeInUp 0.6s ease ${index * 0.1}s both`
                                    }}
                                >
                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            backgroundColor: '#7c6fd6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: '700',
                                            fontSize: '1.1rem'
                                        }}>
                                            ✓
                                        </div>
                                    )}
                                    
                                    {/* Icon placeholder - you can customize these per category */}
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        backgroundColor: isSelected ? '#7c6fd6' : '#f0f0ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.8rem',
                                        marginBottom: '1.25rem',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {getCategoryIcon(categoryName)}
                                    </div>
                                    
                                    <h3 style={{
                                        margin: '0 0 0.5rem 0',
                                        color: isSelected ? '#7c6fd6' : '#213547',
                                        fontSize: '1.3rem',
                                        fontWeight: '600',
                                        transition: 'color 0.3s ease'
                                    }}>
                                        {categoryName}
                                    </h3>
                                    
                                    <p style={{
                                        margin: 0,
                                        color: '#6c757d',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5'
                                    }}>
                                        {getCategoryDescription(categoryName)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation Buttons */}
                    <div style={{ 
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center'
                    }}>
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            style={{
                                padding: '0.875rem 2.5rem',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#5a6268';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#6c757d';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedCategory}
                            style={{
                                padding: '0.875rem 2.5rem',
                                background: selectedCategory 
                                    ? 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)' 
                                    : '#dee2e6',
                                color: selectedCategory ? 'white' : '#6c757d',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                cursor: selectedCategory ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s',
                                boxShadow: selectedCategory 
                                    ? '0 4px 12px rgba(124, 111, 214, 0.3)' 
                                    : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedCategory) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 6px 20px rgba(124, 111, 214, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = selectedCategory 
                                    ? '0 4px 12px rgba(124, 111, 214, 0.3)' 
                                    : 'none';
                            }}
                        >
                            Continue to Basic Info →
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

//assign icon to a category
function getCategoryIcon(categoryName) {
    const name = categoryName?.toLowerCase() || '';
    
    if (name.includes('course') || name.includes('class')) return '📚';
    if (name.includes('event') || name.includes('workshop')) return '🎯';
    if (name.includes('research') || name.includes('project')) return '🔬';
    if (name.includes('seminar') || name.includes('lecture')) return '🎓';
    if (name.includes('conference')) return '🎤';
    if (name.includes('resource') || name.includes('material')) return '📖';
    if (name.includes('thesis') || name.includes('dissertation')) return '📝';
    
    // Default icon
    return '✨';
}

// Show a description for each category
function getCategoryDescription(categoryName) {
    const name = categoryName?.toLowerCase() || '';
    
    if (name.includes('course') || name.includes('class')) {
        return 'Academic courses, classes, and structured learning programs';
    }
    if (name.includes('event') || name.includes('workshop')) {
        return 'Workshops, training sessions, and hands-on learning events';
    }
    if (name.includes('research') || name.includes('project')) {
        return 'Research projects, studies, and academic investigations';
    }
    if (name.includes('seminar') || name.includes('lecture')) {
        return 'Seminars, lectures, and academic presentations';
    }
    if (name.includes('conference')) {
        return 'Academic conferences, symposiums, and gatherings';
    }
    if (name.includes('resource') || name.includes('material')) {
        return 'Educational resources, materials, and learning tools';
    }
    if (name.includes('thesis') || name.includes('dissertation')) {
        return 'Thesis work, dissertations, and major academic papers';
    }
    
    return 'Select this category for your item';
}

export default CategorySelection;