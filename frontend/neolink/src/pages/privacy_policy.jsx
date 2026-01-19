import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#fafafa',
            padding: '2rem 1rem 4rem'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <header style={{
                    textAlign: 'center',
                    marginBottom: '3rem',
                    paddingBottom: '2rem',
                    borderBottom: '2px solid #e9ecef'
                }}>
                    <span style={{
                        display: 'inline-block',
                        backgroundColor: '#f0f0ff',
                        color: '#7c6fd6',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}>
                        NEOLink - NEOLAiA
                    </span>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: '#213547',
                        margin: '0 0 0.5rem 0'
                    }}>
                        Privacy Policy
                    </h1>
                    <p style={{
                        color: '#6c757d',
                        fontSize: '0.95rem',
                        margin: '0 0 0.5rem 0'
                    }}>
                        University of Salerno
                    </p>
                    <p style={{
                        color: '#6c757d',
                        fontSize: '0.85rem',
                        margin: 0
                    }}>
                        Via Giovanni Paolo II, 132 - 84084 Fisciano (SA) | P.IVA 00851300657
                    </p>
                    <p style={{
                        color: '#adb5bd',
                        fontSize: '0.85rem',
                        marginTop: '1rem'
                    }}>
                        Last updated: January 19, 2026
                    </p>
                </header>

                {/* Content */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    padding: '2rem'
                }}>
                    <Section title="1. Name of the Service">
                        <p>NEOLink – NEOLAiA</p>
                    </Section>

                    <Section title="2. Description of the Service">
                        <p>
                            The NEOLink Service is designed to gather data from researchers at the nine universities 
                            in the NEOLAiA alliance, making this information available for querying. The goal is to 
                            enhance collaboration and synergy among these universities.
                        </p>
                    </Section>

                    <Section title="3. Data Controller and Data Protection Officer">
                        <p>
                            The Data Controller is the University of Salerno with registered office in 
                            Via Giovanni Paolo II, 132 - 84084 Fisciano (SA).
                        </p>
                        <p>
                            The University of Salerno has also appointed a Data Protection Officer. 
                            Communications should be sent to:
                        </p>

                            <p><a href="mailto:protezionedati@unisa.it" style={linkStyle}>protezionedati@unisa.it</a></p>
                            <p><a href="mailto:protezionedati@pec.unisa.it" style={linkStyle}>protezionedati@pec.unisa.it</a> (PEC)</p>

                    </Section>

                    <Section title="4. Purpose and Duration of the Processing">
                        <p>The processing involves recording the following personal data:</p>
                        
                        <p><strong>For all visitors:</strong></p>
                            <p>IP address</p>
                            <p>Referrer address</p>

                        <p><strong>For authenticated users:</strong></p>
                        <p>
                            E-mail (used for registration and authentication)
                        </p>

                        <p>
                            No special categories of personal data referred to in articles 9 and 10 of the 
                            GDPR are processed.
                        </p>

                        <p>
                            The purposes of the processing are the organisational needs related to the 
                            NEOLAiA Project funded under the ERASMUS-EDU-2023-EUR-UNIV programme.
                        </p>

                        <p>
                            <strong>Data Retention:</strong> Logs will be stored for 6 months and automatically deleted.
                        </p>

                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginTop: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            <strong>Data License:</strong> By submitting data, users grant the University of Salerno 
                            a non-exclusive, non-transferable, royalty-free licence for institutional, academic, 
                            and organisational purposes. Data is not released as Open Data.
                        </div>
                    </Section>

                    <Section title="5. Disclosure to Third Parties">
                        <p>
                            The University may disclose data to external companies for specific services. 
                            Authorised personnel act as Data Processors.
                        </p>
                        <p>
                            Data will not be transferred to countries outside the European Union.
                        </p>
                    </Section>

                    <Section title="6. Rights of the Data Subject">
                        <p>You have the right to:</p>
                        <p>Obtain confirmation of the existence of your data</p>
                        <p>Know the origin, purposes, and processing methods</p>
                        <p>Request update, rectification, or completion</p>
                        <p>Request erasure (right to be forgotten) or anonymisation</p>
                        <p>Withdraw consent at any time</p>
                        <p>Object to processing for legitimate interest</p>
                        <p>Request data portability</p>
                        <p>Lodge a complaint with the Data Protection Supervisor</p>
                        <p>Request restriction of processing</p>
                        <p>
                            To exercise these rights, contact the Data Protection Officer at the addresses 
                            provided in Section 3.
                        </p>
                    </Section>

                    <Section title="7. Cookies Policy">
                        <p>
                            The service uses only <strong>essential cookies</strong> necessary for authentication 
                            and proper functioning. These are automatically deleted after 1 hour.
                        </p>
                        <p>
                            No analytics cookies, cross-site cookies, or ad targeting cookies are used.
                        </p>
                    </Section>

                    <Section title="8. Legal Basis and Updates">
                        <p>
                            Data is processed based on explicit consent. The University may amend this policy 
                            following changes to privacy regulations.
                        </p>
                    </Section>

                    <Section title="9. Code of Conduct" isLast>
                        <p>
                            Your data is protected according to the{' '}
                            <a 
                                href="https://geant3plus.archive.geant.net/Documents/GEANT_DP_CoC_ver1.0.pdf" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={linkStyle}
                            >
                                Code of Conduct for Service Providers
                            </a>
                            , a common standard for research and higher education.
                        </p>
                    </Section>
                </div>

                {/* Footer */}
                <footer style={{
                    textAlign: 'center',
                    marginTop: '2rem',
                    paddingTop: '2rem',
                    borderTop: '2px solid #e9ecef',
                    color: '#6c757d',
                    fontSize: '0.85rem'
                }}>
                    <p style={{ margin: '0 0 0.25rem 0' }}>
                        © 2024 University of Salerno - NEOLink | NEOLAiA Project
                    </p>
                    <p style={{ margin: 0 }}>
                        <a href="mailto:ammicent@pec.unisa.it" style={linkStyle}>ammicent@pec.unisa.it</a>
                    </p>
                </footer>
            </div>
        </div>
    );
};

const Section = ({ title, children, isLast = false }) => (
    <section style={{
        marginBottom: isLast ? 0 : '2rem',
        paddingBottom: isLast ? 0 : '2rem',
        borderBottom: isLast ? 'none' : '1px solid #e9ecef'
    }}>
        <h2 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#213547',
            margin: '0 0 1rem 0'
        }}>
            {title}
        </h2>
        <div style={{
            fontSize: '0.95rem',
            lineHeight: '1.7',
            color: '#495057'
        }}>
            {children}
        </div>
    </section>
);

const linkStyle = {
    color: '#7c6fd6',
    textDecoration: 'none'
};

export default PrivacyPolicy;