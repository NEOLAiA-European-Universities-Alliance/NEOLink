import Button from 'react-bootstrap/Button';
import { Container, Row, Col } from 'react-bootstrap';
const logo_neolaia = `${import.meta.env.BASE_URL}logoNEOLAiA.png`;
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;
const logo_neolink = `${import.meta.env.BASE_URL}logo.png`;
import { Link } from 'react-router-dom';

function Homepage(){
    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            margin: 0, 
            padding: 0, 
            width: '100vw',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ffffff'
        }}>
            {/* Header Section */}
            <div className="py-3 py-md-4 border-bottom bg-white" style={{ width: '100%', flexShrink: 0 }}>
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center px-3 px-md-5 gap-3" style={{ maxWidth: '100%' }}>
                    <div className="d-flex align-items-center gap-2 gap-md-3">
                        <img 
                            src={logo_neolaia} 
                            alt='Logo NEOLAiA' 
                            className="img-fluid" 
                            style={{ maxHeight: '50px', height: 'auto' }}
                        />
                        <h1 className='h5 h-md-4 mb-0 fw-bold' style={{ color: '#667eea', fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}></h1>
                    </div>
                    <img 
                        src={eu_logo} 
                        alt='Logo EU' 
                        className="img-fluid" 
                        style={{ maxHeight: '45px', height: 'auto' }}
                    />
                </div>
            </div>

            {/* Main Content Section - Takes remaining space */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%', 
                backgroundColor: '#fafafa',
                padding: '2rem 1rem'
            }}>
                <div className="text-center" style={{ maxWidth: '600px', width: '100%' }}>
                    <div className="mb-4 mb-md-5">
                        <img 
                            src={logo_neolink} 
                            alt='Logo NEOLink' 
                            className="img-fluid" 
                            style={{ 
                                maxWidth: '350px',
                                width: '100%',
                                height: 'auto',
                                margin: '0 auto'
                            }}
                        />
                    </div>
                    
                    <h2 style={{ 
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
                        fontWeight: '700', 
                        marginBottom: '1rem',
                        color: '#213547'
                    }}>
                        Welcome to NEOLink
                    </h2>
                    
                    <p style={{ 
                        fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                        color: '#6c757d',
                        marginBottom: '2rem'
                    }}>
                        Your gateway to innovative collaboration and networking
                    </p>
                    
                    <Button 
                        as={Link} 
                        to="/login" 
                        size="lg"
                        className="fw-semibold shadow-sm"
                        style={{
                            background: 'linear-gradient(135deg, #7c6fd6 0%, #8b7ad6 100%)',
                            border: 'none',
                            borderRadius: '50px',
                            transition: 'all 0.3s ease',
                            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                            minWidth: '200px',
                            padding: '0.75rem 2.5rem',
                            color: '#ffffff'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(124, 111, 214, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '';
                        }}
                    >
                        Enter NEOLink
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Homepage;