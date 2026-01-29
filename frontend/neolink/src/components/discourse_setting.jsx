import { useState } from "react";
import axios from "axios";
import { base_url } from "../api";
import Navbar from "./navbar";

const logo_neolaia = `${import.meta.env.BASE_URL}logoNEOLAiA.png`;
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;
const logo_neolink = `${import.meta.env.BASE_URL}logo.png`;

function CreateItemFormStep2({ token, initialData, onBack, onSubmit }) {
    const [formData, setFormData] = useState({
        group_name: initialData?.group_name || initialData?.name,
        group_display_name: initialData?.group_display_name || initialData?.name,
        group_description: initialData?.group_description || initialData?.description,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const submitData = {
                group_name: formData.group_name,
                group_display_name: formData.group_display_name,
                    group_description: formData.group_description,
                };
            
            const result = await onSubmit(submitData);
            if (result) {
                setSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setError("Failed to create item. Please try again.");
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error("Error submitting form:", err);
            setError("Failed to create item. Please try again.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    // Predefined color options
    const colorOptions = [
        { value: '#7c6fd6', label: 'Purple' },
        { value: '#9EB83B', label: 'Green' },
        { value: '#0088CC', label: 'Blue' },
        { value: '#BF1E2E', label: 'Red' },
        { value: '#FFF000', label: 'Yellow' },
        { value: '#00FFFF', label: 'Cyan' },
        { value: '#F1592A', label: 'Orange' },
        { value: '#652D90', label: 'Indigo' },
        { value: '#FFB6C1', label: 'Pink' },
        { value: '#3AB54A', label: 'Teal' },
    ];

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
            
            <Navbar token={token} />

            {/* Progress Indicator */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #dee2e6',
                padding: '1rem 0'
            }}>
                <div style={{
                    maxWidth: '1000px',
                    margin: '0 auto',
                    padding: '0 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem'
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
                        <span style={{ color: '#28a745', fontWeight: '500' }}>Basic Info</span>
                    </div>
                    
                    <div style={{
                        width: '60px',
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
                        <span style={{ color: '#7c6fd6', fontWeight: '600' }}>Virtual Cafè Settings</span>
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
                {success && (
                    <div style={{
                        padding: '1.5rem',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        color: '#155724'
                    }}>
                        <h3 style={{ marginBottom: '0.5rem' }}>✓ Item Created Successfully!</h3>
                        <p>Your item has been created and is now available.</p>
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
                        marginBottom: '0.5rem',
                        color: '#213547',
                        fontSize: '1.75rem',
                        fontWeight: '600'
                    }}>
                       Virtual Cafè Group Settings
                    </h2>
                    <p style={{
                        marginBottom: '2rem',
                        color: '#6c757d',
                        fontSize: '0.95rem'
                    }}>
                        Interaction with users who show interest in your item will take place on the <a href="https://virtualcafe.neolaiacampus.eu/" target="_blank" rel="noopener noreferrer">Virtual Café</a>. You can customize certain aspects, such as the name of the private group that will be created and if you want to make it public on the Virtual Cafè.
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Group Section */}
                        <div style={{
                            marginBottom: '2rem',
                            padding: '1.5rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            border: '1px solid #e9ecef'
                        }}>
                            <h3 style={{
                                marginBottom: '1rem',
                                color: '#495057',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: '#7c6fd6',
                                    color: 'white',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                }}>👥</span>
                                Private Group Information
                            </h3>

                            {/* Group Name */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>
                                    Private Group Name <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="group_name"
                                    value={formData.group_name.slice(0, 20)}
                                    onChange={handleInputChange}
                                    placeholder="Enter a unique identifier for the group"
                                    required
                                    maxLength={20}
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = '#7c6fd6'}
                                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                />
                                <small style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                                    This is the internal identifier used by the system, must be unique (max 20 characters).
                                </small>
                            </div>

                            {/* Group Display Name */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>
                                    Group Display Name <span style={{ color: '#dc3545' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="group_display_name"
                                    value={formData.group_display_name}
                                    onChange={handleInputChange}
                                    placeholder="Enter the name users will see"
                                    required
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = '#7c6fd6'}
                                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                />
                                <small style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                                    This is the friendly name displayed to users (e.g., "Virtual Cafè 2024")
                                </small>
                            </div>

                            {/* Group Description */}
                            <div>
                                <label style={labelStyle}>
                                    Private Group Description
                                </label>
                                <textarea
                                    name="group_description"
                                    value={formData.group_description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the purpose of this group..."
                                    rows={4}
                                    style={textareaStyle}
                                    onFocus={(e) => e.target.style.borderColor = '#7c6fd6'}
                                    onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
                                />
                                <small style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                                    Provide additional details about this group's purpose and scope
                                </small>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div style={{ 
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'space-between'
                        }}>
                            <button
                                type="button"
                                onClick={onBack}
                                disabled={submitting}
                                style={{
                                    padding: '0.75rem 2rem',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s',
                                    opacity: submitting ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!submitting) e.target.style.backgroundColor = '#5a6268';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#6c757d';
                                }}
                            >
                                ← Back to Step 1
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
                                {submitting ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid white',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }}></span>
                                        Creating Item...
                                    </span>
                                ) : (
                                    'Create Item'
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

export default CreateItemFormStep2;