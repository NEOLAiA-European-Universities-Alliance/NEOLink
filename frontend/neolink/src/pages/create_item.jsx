import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import CreateItemFormStep1 from "../components/create_item_form.jsx";
import CreateItemFormStep2 from "../components/discourse_setting.jsx";
import axios from "axios";
import { base_url } from "../api";
import { token_is_valid } from "../utils";

function CreateItem() {
    const location = useLocation();
    const navigate = useNavigate();
    const token = location.state?.token || localStorage.getItem("token");
    
    // Track current step
    const [currentStep, setCurrentStep] = useState(1);
    
    // Store all form data across steps
    const [formData, setFormData] = useState({
        // Step 1 fields
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
        cover: null,
        group_name: '',
        group_display_name: '',
        group_description: '',
        category_name: '',
        category_color: '',
    });

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    useEffect(() => {        
        // Check on mount and periodically
        const checkToken = async () => {
            if (!token_is_valid()) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        };
        const interval = setInterval(checkToken, 60000); // every minute
        return () => clearInterval(interval);
    }, [token, navigate]);

    // Handle moving to next step
    const handleNextStep = (stepData) => {
        setFormData(prev => ({
            ...prev,
            ...stepData
        }));
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle going back to previous step
    const handlePreviousStep = () => {
        setCurrentStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle final submission
    const handleFinalSubmit = async (stepData) => {
        const finalData = {
            ...formData,
            ...stepData
        };
        console.log("Submitting final data:", finalData);
        
        try {
            let coverId = null;

            if (finalData.cover && finalData.cover instanceof File) {
                const fileFormData = new FormData();
                fileFormData.append('files', finalData.cover);
                
                const uploadResponse = await axios.post(`${base_url}/upload`, fileFormData);
                coverId = uploadResponse.data[0].id;
            }

            const response = await axios.post(`${base_url}/custom-item/`, {
                ...finalData,
                cover: coverId,
                token: token
            });
            
            console.log("Final form data:", finalData);
            
            // Return both values as an object
            return { finalData, response };
            
        } catch (error) {
            console.error("Submission failed:", error);
            if (error.response && error.response.data) {
                setErrorMessage(error.response.data);
            } else {
                setErrorMessage("An unexpected error occurred. Please try again.");
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Return null or throw to indicate failure
            return null;
        }
    };


    if (!token) {
        return null;
    }

    return (
        <>
            {currentStep === 1 && (
                <CreateItemFormStep1 
                    token={token}
                    initialData={formData}
                    onNext={handleNextStep}
                />
            )}
            {currentStep === 2 && (
                <CreateItemFormStep2 
                    token={token}
                    initialData={formData}
                    onBack={handlePreviousStep}
                    onSubmit={handleFinalSubmit}
                />
            )}
        </>
    );
}

export default CreateItem;