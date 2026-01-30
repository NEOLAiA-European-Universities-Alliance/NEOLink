import { useContext, useEffect, useState } from "react"; 
import { AuthContext } from "../components/AuthContext";
import Auth from "../components/auth";
import { token_is_valid } from "../utils";
import PrivacyPolicy from "../components/privacy_policy"; 
import AcceptPolicy from "../components/accept_policy";
import { useNavigate, useLocation } from "react-router-dom";

const logo_neolaia = `${import.meta.env.BASE_URL}logoNEOLAiA.png`;
const eu_logo = `${import.meta.env.BASE_URL}eu_logo.png`;
const logo_neolink = `${import.meta.env.BASE_URL}logo.png`;

function Login(){
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { token, loading } = authContext;
    const [token_validity, setTokenValidity] = useState(false);
    
    // Get the redirect path from location state, default to personal page
    const from = location.state?.from || "/personal-page";
    
    useEffect(() => {
        if (loading){
            return;
        }
        const isValid = token_is_valid();
        setTokenValidity(isValid);
        
        if(token && isValid){
            // Navigate to the intended destination (either the original page or personal page)
            navigate(from, { state: { token } });
        }
    }, [loading, token, navigate, from]);
    
    return(
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            width: '100vw',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fafafa'
        }}>
            {/* Header Section */}
            <div className="py-3 py-md-4 border-bottom bg-white" style={{ width: '100%', flexShrink: 0 }}>
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center px-3 px-md-5 gap-3">
                    <div className="d-flex align-items-center gap-2 gap-md-3">
                        <img 
                            src={logo_neolaia} 
                            alt='Logo NEOLAiA' 
                            className="img-fluid" 
                            style={{ maxHeight: '50px', height: 'auto' }}
                        />
                    </div>
                    <img 
                        src={eu_logo} 
                        alt='Logo EU' 
                        className="img-fluid" 
                        style={{ maxHeight: '45px', height: 'auto' }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '2rem 1rem'
            }}>
                {loading ? (
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Caricamento...</p>
                    </div>
                ) : (
                    <div style={{ 
                        maxWidth: '600px', 
                        width: '100%',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        padding: '2rem'
                    }}>
                        <div className="text-center mb-4">
                            <img 
                                src={logo_neolink} 
                                alt='Logo NEOLink' 
                                className="img-fluid mb-3" 
                                style={{ maxWidth: '250px' }}
                            />
                            <h2 className="h4 fw-bold mb-2" style={{ color: '#213547' }}>
                                Welcome
                            </h2>
                            <p className="text-muted">
                                Sign in to access your NEOLink account
                            </p>
                        </div>
                        
                        <Auth 
                            accept_policy_message={<AcceptPolicy />} 
                            privacy_policy={<PrivacyPolicy />} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;