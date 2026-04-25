/**
 * Shibboleth Authentication Controller for NEOLink
 * 
 * Handles authentication via Shibboleth SP (eduGAIN).
 * User attributes are passed via HTTP headers from Apache mod_shib.
 */
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { normalizePersonName } = require('../../../utils/normalize_text');

module.exports = {
    /**
     * Main authentication endpoint
     * Called after successful Shibboleth authentication
     * Receives user attributes via X-Shib-* headers from Apache
     */
    async authenticate(ctx) {
        try {
            // Extract Shibboleth attributes from headers
            const shibHeaders = {
                cn: ctx.request.headers['x-shib-cn'],
                mail: ctx.request.headers['x-shib-mail'],
                displayName: ctx.request.headers['x-shib-displayname'],
                givenName: ctx.request.headers['x-shib-givenname'],
                surname: ctx.request.headers['x-shib-sn'] || ctx.request.headers['x-shib-surname'],
                affiliation: ctx.request.headers['x-shib-affiliation'] || ctx.request.headers['x-shib-edupersonaffiliation'] || null,
                persistentId: ctx.request.headers['x-shib-persistentid'] || ctx.request.headers['x-shib-pairwiseid'] || ctx.request.headers['x-shib-edupersonid'] || null,
                sessionId: ctx.request.headers['x-shib-session-id'],
            };

            const normalizedShibHeaders = {
                ...shibHeaders,
                cn: normalizePersonName(shibHeaders.cn),
                displayName: normalizePersonName(shibHeaders.displayName),
                givenName: normalizePersonName(shibHeaders.givenName),
                surname: normalizePersonName(shibHeaders.surname),
            };

            // Validate required attributes
            if (!normalizedShibHeaders.cn && !shibHeaders.mail && !shibHeaders.persistentId) {
                return ctx.badRequest('Missing required Shibboleth attributes (cn, mail, or persistentId)');
            }

            // Use cn or mail as primary identifier
            const email = shibHeaders.mail || normalizedShibHeaders.cn;
            const uniqueId = shibHeaders.persistentId || normalizedShibHeaders.cn || email; // Fallback to email or cn if no persistentId

            // Check if user already exists
            let seller = await strapi.db.query('api::seller.seller').findOne({
                select: ['documentId', 'email', 'full_name', 'research_group_link', 'personal_page_link', 
                         'university_name', 'first_level_structure', 'second_level_structure', 'orcid_link',
                         'research_units_tours', 'specific_research_units_tours', 'virtual_cafe_id', 'orh_id',
                         'shibboleth_id'],
                where: {
                    $or: [
                        { email: email },
                        { shibboleth_id: uniqueId }
                    ]
                }
            });

            // Build full name from Shibboleth attributes
            const fullName = normalizedShibHeaders.displayName || normalizedShibHeaders.cn ||
                            (normalizedShibHeaders.givenName && normalizedShibHeaders.surname 
                                ? `${normalizedShibHeaders.givenName} ${normalizedShibHeaders.surname}` 
                                : null);

            if (seller) {
                // Update existing user with latest Shibboleth attributes
                seller = await strapi.documents("api::seller.seller").update({
                    documentId: seller.documentId,
                    data: {
                        shibboleth_id: uniqueId,
                        email: email || seller.email,
                        full_name: fullName || seller.full_name,
                        shibboleth_affiliation: shibHeaders.affiliation,
                        shibboleth_session_id: shibHeaders.sessionId,
                        last_shibboleth_login: new Date().toISOString(),
                        first_access: true,
                    }
                });
            } else {
                let virtual_cafe_id = false;
                let university_name = ""
                let department_name = ""
                let faculty_name = ""
                let orcid_link = ""
                let research_group_link = ""
                let personal_page_link = ""
                let research_units_tours = ""
                let specific_research_units_tours = ""
                let orh_id = ""
                try{
                    const response = await axios.get(`${process.env.DISCOURSE_URL}/admin/users/list/active.json`, {
                        params: {
                            email: email,
                            show_emails: true
                        },
                        headers: {
                            'Api-Key': process.env.DISCOURSE_API_TOKEN,
                            'Api-Username': 'system'
                        }
                });
                    const virtual_cafe_profile = response.data;
                    if (virtual_cafe_profile && virtual_cafe_profile.length > 0){
                        virtual_cafe_id = virtual_cafe_profile[0].id || false;
                    }
                } catch (error){
                                console.log("Error fetching Discourse profile for email: " + email);
                }
                try{
                    const response_orh = await axios.get(`${process.env.ORH_API_URL}/neolaia-usr/?email=${email}`);
                    const orh_profile = response_orh.data;
                    if (orh_profile){
                        university_name = orh_profile ? orh_profile.university_name : "";
                        department_name = orh_profile ? orh_profile.department_name : "";
                        faculty_name = orh_profile ? orh_profile.faculty_name : "";
                        orcid_link = orh_profile ? orh_profile.orcid_link : "";
                        research_group_link = orh_profile ? orh_profile.research_group_link : "";
                        personal_page_link = orh_profile ? orh_profile.personal_page_link : "";
                        research_units_tours = orh_profile ? orh_profile.research_units_tours : "";
                        specific_research_units_tours = orh_profile ? orh_profile.specific_research_units_tours : "";
                        orh_id = orh_profile ? orh_profile.user_id : "";
                    }
                    } catch (error){
                        console.log("Error fetching ORH profile for email: " + email + " " + error);
                    }
                    seller = await strapi.entityService.create("api::seller.seller", {
                            data:{
                                email: email,
                                shibboleth_id: uniqueId,
                                last_shibboleth_login: new Date().toISOString(),
                                // OTP fields not used with Shibboleth
                                otp_active: false,
                                "full_name": fullName,
                                shibboleth_affiliation: shibHeaders.affiliation,
                                shibboleth_session_id: shibHeaders.sessionId,
                                "research_group_link": research_group_link,
                                "personal_page_link": personal_page_link,
                                "university_name": university_name,
                                "first_level_structure": department_name,
                                "second_level_structure": faculty_name,
                                "orcid_link": orcid_link,
                                "research_units_tours": research_units_tours,
                                "specific_research_units_tours": specific_research_units_tours,
                                "virtual_cafe_id": virtual_cafe_id != false ? virtual_cafe_id : null,
                                "orh_id": orh_id != "" ? orh_id : null
                            }
                    })
            }

            // Generate JWT token
            const token = jwt.sign({
                user_id: seller.documentId,
                email: seller.email,
                full_name: seller.full_name,
                research_group_link: seller.research_group_link,
                personal_page_link: seller.personal_page_link,
                university_name: seller.university_name,
                first_level_structure: seller.first_level_structure,
                second_level_structure: seller.second_level_structure,
                orcid_link: seller.orcid_link,
                research_units_tours: seller.research_units_tours,
                specific_research_units_tours: seller.specific_research_units_tours,
                virtual_cafe_id: seller.virtual_cafe_id,
                orh_id: seller.orh_id,
                auth_method: 'shibboleth',
                shibboleth_affiliation: shibHeaders.affiliation,
            }, process.env.JWT_SECRET_CUSTOM_AUTH, {
                expiresIn: process.env.JWT_EXPIRES_CUSTOM_AUTH_IN
            });

            // Redirect to frontend with token
            const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, ''); // Remove trailing slash
            const redirectUrl = `${frontendUrl}/login?token=${encodeURIComponent(token)}`;
            
            ctx.redirect(redirectUrl);
        } catch (error) {
            console.error('Shibboleth authentication error:', error);
            return ctx.internalServerError('Authentication failed');
        }
    },

    /**
     * Session check endpoint (lazy session)
     * Returns session info if user is authenticated, null otherwise
     */
    async session(ctx) {
        try {
            const sessionId = ctx.request.headers['x-shib-session-id'];
            const cn = ctx.request.headers['x-shib-cn'];
            const mail = ctx.request.headers['x-shib-mail'];

            if (!sessionId || (!cn && !mail)) {
                return ctx.send({ authenticated: false, session: null });
            }

            const email = mail || cn;
            
            const seller = await strapi.db.query('api::seller.seller').findOne({
                select: ['documentId', 'email', 'full_name'],
                where: { email: email }
            });

            return ctx.send({
                authenticated: true,
                session: {
                    sessionId,
                    email,
                    displayName: ctx.request.headers['x-shib-displayname'],
                    user: seller ? {
                        id: seller.documentId,
                        email: seller.email,
                        fullName: seller.full_name
                    } : null
                }
            });
        } catch (error) {
            console.error('Session check error:', error);
            return ctx.send({ authenticated: false, session: null });
        }
    },

    /**
     * Logout endpoint
     * Clears local session and redirects to Shibboleth logout
     */
    async logout(ctx) {
        try {
            const frontendUrl = process.env.FRONTEND_URL || '';
            // Redirect to Shibboleth logout, then back to home
            const shibLogoutUrl = `/Shibboleth.sso/Logout?return=${encodeURIComponent(frontendUrl)}`;
            
            ctx.redirect(shibLogoutUrl);
        } catch (error) {
            console.error('Logout error:', error);
            return ctx.internalServerError('Logout failed');
        }
    }
};
