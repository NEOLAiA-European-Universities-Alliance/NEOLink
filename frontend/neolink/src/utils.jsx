import { jwtDecode } from "jwt-decode";
import { decode } from "base-64";

function token_is_valid(){
    let token = localStorage.getItem('token');
    try{
        let decodedToken = jwtDecode(token)
        let currentDate = new Date();
        //token expired
        if (decodedToken.exp * 1000 < currentDate.getTime()){
            return false
        }
    }catch (error){
        console.log(error)
        return false
    }
    return true
}

function getCategoryIcon(categoryName) {
    const bip_logo = `${import.meta.env.BASE_URL}bip.png`;
    const coil_logo = `${import.meta.env.BASE_URL}coil.png`;
    const focus_logo = `${import.meta.env.BASE_URL}focus.png`;
    const neoteach_logo = `${import.meta.env.BASE_URL}neoteach.png`;
    const virtual_logo = `${import.meta.env.BASE_URL}virtual.png`;
    const other_logo = `${import.meta.env.BASE_URL}other.png`;
    const name = categoryName?.toLowerCase() || '';
    if(name.includes('bip')){
        return bip_logo
    }
    if (name.includes('coil')){
        return coil_logo
    }
    if (name.includes('focus')){
        return focus_logo
    }
    if (name.includes('neoteach')){
        return neoteach_logo
    }
    if (name.includes('virtual')){
        return virtual_logo
    }
    
    if (name.includes('course') || name.includes('class')) return '📚';
    if (name.includes('event') || name.includes('workshop')) return '🎯';
    if (name.includes('research') || name.includes('project')) return '🔬';
    if (name.includes('seminar') || name.includes('lecture')) return '🎓';
    if (name.includes('conference')) return '🎤';
    if (name.includes('resource') || name.includes('material')) return '📖';
    if (name.includes('thesis') || name.includes('dissertation')) return '📝';
    
    // Default icon
    return other_logo;
}


export {token_is_valid, getCategoryIcon};

