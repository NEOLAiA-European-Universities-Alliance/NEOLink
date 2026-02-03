import React from 'react';

const AcceptPolicy = () => {
    return (
        <span style={{ 
            fontSize: '0.9rem', 
            color: '#555', 
            lineHeight: '1.5'
        }}>
            By completing the form and ticking the box, you confirm that you have read and understood our{' '}
            <a 
                href="/privacy_policy" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                    color: '#7c6fd6',
                    textDecoration: 'underline'
                }}
            >
                Privacy Policy and the Data Use License Agreement
            </a>
            , and you consent to the processing of your information strictly for institutional, academic, and organisational purposes as described therein.         
        </span>
    );
}

export default AcceptPolicy;