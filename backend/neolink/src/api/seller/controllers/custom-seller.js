const { randomBytes } = require("node:crypto");
const axios = require('axios');

module.exports = {
    async create(ctx, next){
        try{
            const otp = randomBytes(24 / 2).toString("hex");
            const email = ctx.request.body.email
            const regex = /\b[A-Za-z0-9._%+-]+@.*?(osu\.cz|usv\.ro|usm\.ro|unic\.ac\.cy|oru\.se|svako\.lt|ujaen\.es|univ-tours\.fr|uni-bielefeld\.de|unisa\.it|osu\.eu|inrae\.fr|cnrs\.fr|inserm\.fr|sumdu\.edu\.ua|kubg\.edu\.ua)\b/;
            if(!regex.test(email))
                return ctx.badRequest("The page address must come from one of NEOLAiA's partner university domains", {email : "The page address must come from one of NEOLAiA's partner university domains"})
            const currentTimeStamp = new Date().getTime().toString();
            let entry;
            entry = await strapi.db.query('api::seller.seller').findOne({
                select: ['id', 'email'],
                where: {
                    email: email
                }
            })
            if (entry){
                entry = await strapi.entityService.update("api::seller.seller", entry.id,{
                    data:{
                        OTP: otp,
                        otp_active: true,
                        otp_generation_timestamp: currentTimeStamp
                    }
                })
            } else {
                let full_name = "";
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
                    full_name = virtual_cafe_profile[0].name || "";
                    virtual_cafe_id = virtual_cafe_profile[0].id || false;
                } 
                } catch (error){
                    console.log("Error fetching Discourse profile for email: " + email);
                }
                try{
                        const response_orh = await axios.get(`${process.env.ORH_API_URL}/neolaia-usr/?email=${email}`);
                        const orh_profile = response_orh.data;
                        if (orh_profile){
                            full_name = full_name || (orh_profile ? orh_profile.user_name + orh_profile.user_surname : "");
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
                if (virtual_cafe_id || orh_id){
                    entry = await strapi.entityService.create("api::seller.seller", {
                        data:{
                            email: email,
                            OTP: otp,
                            otp_active: true,
                            otp_generation_timestamp: currentTimeStamp,
                            "full_name": full_name,
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
                } else {
                    entry = await strapi.entityService.create("api::seller.seller", {
                        data:{
                            email: email,
                            OTP: otp,
                            otp_active: true,
                            otp_generation_timestamp: currentTimeStamp,
                        }
                    })
                }
            }
            await strapi.config.email_sender.send_mail(entry.email,entry.OTP)
            return ctx.response.created(entry)
        } catch (error){
            console.log(error)
            return ctx.response.internalServerError(error);
        }
    },
    async active(ctx, next){
        const jwt = require('jsonwebtoken');
        try{
            const email = ctx.request.body.email
            const otp = ctx.request.body.otp
            let entry
            entry = await strapi.db.query('api::seller.seller').findOne({
                select: ['id', 'email', 'full_name', 'research_group_link', 'personal_page_link', 'university_name', 'first_level_structure', 'second_level_structure', 'orcid_link', 'research_units_tours', 'specific_research_units_tours', 'virtual_cafe_id', 'orh_id'],
                where:{
                    email : email,
                    OTP : otp,
                    otp_active: true
                }
            })
            if (entry){
                entry = await strapi.entityService.update("api::seller.seller", entry.id,{
                    data:{
                        first_access: true, //in this way I can delete email from db that haven't done the first access
                        otp_active: false
                    }
                })
            } else {
                return ctx.response.unauthorized('You are not authorized to access this resource, you must authenticate yourself')
            }
            const token = jwt.sign({
                user_id: entry.id, 
                email: entry.email,
                full_name: entry.full_name,
                research_group_link: entry.research_group_link,
                personal_page_link: entry.personal_page_link,
                university_name: entry.university_name,
                first_level_structure: entry.first_level_structure,
                second_level_structure: entry.second_level_structure,
                orcid_link: entry.orcid_link,
                research_units_tours: entry.research_units_tours,
                specific_research_units_tours: entry.specific_research_units_tours,
                virtual_cafe_id: entry.virtual_cafe_id,
                orh_id: entry.orh_id
            }, process.env.JWT_SECRET_CUSTOM_AUTH, {expiresIn: process.env.JWT_EXPIRES_CUSTOM_AUTH_IN})
            ctx.send({ token })
        } catch (error){
            console.log(error)
            ctx.response.internalServerError(error)
        }
    },
    async find(ctx, next){
        try{
            const { email } = ctx.query;
            
            const entries = await strapi.entityService.findMany("api::seller.seller", {
                fields: ['id', 'email'],
                filters: {
                    email: email
                },
                limit: 1
            });

            if (entries && entries.length > 0){
                const user = entries[0]; 
                
                const submissions = await strapi.entityService.findMany("api::research-info-survey.research-info-survey", {
                    fields: ['user_id', 'name', 'surname'],
                    filters: {
                        user_id: user.id
                    },
                    limit: 1
                });
                
                if (submissions && submissions.length > 0){
                    return ctx.send({ 
                        user_id: user.id,
                        user_name: submissions[0].name, 
                        user_surname: submissions[0].surname 
                    });
                } else {
                    return ctx.notFound('No submission info found for this user');
                }
            } else {
                return ctx.notFound('No user found with this email');
            }
        } catch (error){
            console.log(error);
            return ctx.internalServerError(error.message);
        }
    }
}