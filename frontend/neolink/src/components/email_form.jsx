import React, { useState } from 'react';

const EmailForm = ({ onNext, privacy_policy, accept_policy_message }) => {
    const [email, setEmail] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
    const [policyMessage, setPolicyMessage] = useState('');

    const handle_submit = (e) => {
        e.preventDefault();
        const regex = /\b[A-Za-z0-9._%+-]+@.*?(osu\.cz|usv\.ro|usm\.ro|unic\.ac\.cy|oru\.se|svako\.lt|ujaen\.es|univ-tours\.fr|uni-bielefeld\.de|unisa\.it|osu\.eu|inrae\.fr|cnrs\.fr|inserm\.fr|sumdu\.edu\.ua|kubg\.edu\.ua)\b/;
        
        let hasErrors = false;

        if (!isPolicyAccepted) {
            setPolicyMessage('You must accept our Privacy Policy and Data Use License Agreement in order to submit your information. \nPlease note that your data will be used strictly for institutional, academic, and organisational purposes and will not be made publicly available. \nEmail addresses will remain confidential.\n');
            hasErrors = true;
        } else {
            setPolicyMessage('');
        }

        if (!regex.test(email)) {
            setIsValid(false);
            hasErrors = true;
        } else {
            setIsValid(true);
        }

        if (!hasErrors) {
            onNext(email);
        }
    };

    return (
        <form onSubmit={handle_submit} style={{ width: '100%' }}>
            {/* Privacy Policy */}
            <div style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '0.9rem'
            }}>
                {privacy_policy}
            </div>

            {/* Checkbox with Policy Agreement */}
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <label style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    alignItems: 'start',
                    gap: '0.75rem',
                    cursor: 'pointer',
                    marginBottom: '1rem'
                }}>
                    <input
                        type="checkbox"
                        checked={isPolicyAccepted}
                        onChange={(e) => setIsPolicyAccepted(e.target.checked)}
                        style={{ 
                            marginTop: '0.2rem',
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#7c6fd6'
                        }}
                    />
                    <span style={{ 
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        color: '#555'
                    }}>
                        {accept_policy_message}
                    </span>
                </label>
                {policyMessage && (
                    <div style={{ 
                        color: '#dc3545',
                        fontSize: '0.85rem',
                        marginTop: '0.5rem',
                        marginLeft: '1.75rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-line'
                    }}>
                        {policyMessage}
                    </div>
                )}
            </div>

            {/* Email Input */}
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Insert your institutional email'
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        border: `2px solid ${!isValid ? '#dc3545' : '#dee2e6'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                        if (isValid) e.target.style.borderColor = '#7c6fd6';
                    }}
                    onBlur={(e) => {
                        if (isValid) e.target.style.borderColor = '#dee2e6';
                    }}
                />
            </div>

            {/* Error Message */}
            {!isValid && (
                <div style={{ 
                    padding: '1rem',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c2c7',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    <span style={{ color: '#842029', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                        Invalid e-mail address
                    </span>
                    <p style={{ color: '#842029', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
                        Please use your institutional email from one of the accepted domains:
                    </p>
                    <ul style={{ 
                        color: '#842029',
                        fontSize: '0.85rem',
                        margin: 0,
                        paddingLeft: '1.5rem',
                        columns: 2,
                        columnGap: '1rem'
                    }}>
                        <li>osu.cz</li>
                        <li>usv.ro</li>
                        <li>usm.ro</li>
                        <li>unic.ac.cy</li>
                        <li>oru.se</li>
                        <li>svako.lt</li>
                        <li>ujaen.es</li>
                        <li>univ-tours.fr</li>
                        <li>uni-bielefeld.de</li>
                        <li>unisa.it</li>
                        <li>osu.eu</li>
                        <li>inrae.fr</li>
                        <li>cnrs.fr</li>
                        <li>inserm.fr</li>
                        <li>sumdu.edu.ua</li>
                        <li>kubg.edu.ua</li>
                    </ul>
                </div>
            )}

            {/* Submit Button */}
            <button 
                type="submit"
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
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
                Send me the OTP
            </button>
        </form>
    );
};

export default EmailForm;