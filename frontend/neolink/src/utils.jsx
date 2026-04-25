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

function getCategoryFallbackImage(categoryName, size = 'card') {
    const name = categoryName?.toLowerCase().replace(/[\s_-]/g, '') || '';
    const isBanner = size === 'banner';

    if (name.includes('bip')) {
        return `${import.meta.env.BASE_URL}${isBanner ? 'bip_banner.png' : 'bip_banner_small.png'}`;
    }
    if (name.includes('coil')) {
        return `${import.meta.env.BASE_URL}${isBanner ? 'coil_banner.png' : 'coil_banner_small.png'}`;
    }
    if (name.includes('focus')) {
        return `${import.meta.env.BASE_URL}${isBanner ? 'focus_banner.png' : 'focus_banner_small.png'}`;
    }
    if (name.includes('neoteach')) {
        return `${import.meta.env.BASE_URL}${isBanner ? 'neoteach_banner.png' : 'neoteach_banner_small.png'}`;
    }
    if (name.includes('virtual')) {
        return `${import.meta.env.BASE_URL}${isBanner ? 'virtual_banner.png' : 'virtual_banner_small.png'}`;
    }
    if (name.includes('summer') || name.includes('summer')) {
        return `${import.meta.env.BASE_URL}${isBanner ? 'summer_banner.png' : 'summer_banner_small.png'}`;
    }

    return `${import.meta.env.BASE_URL}${isBanner ? 'default_banner.png' : 'default_banner_small.png'}`;
}


export {token_is_valid, getCategoryIcon, getCategoryFallbackImage};
