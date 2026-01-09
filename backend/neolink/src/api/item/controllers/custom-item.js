const axios = require('axios');
const seller = require('../../seller/controllers/seller');
const crypto = require('crypto');
module.exports = {
    async create(ctx, next){
        try{
            const { item_status, name, description, item_category, expiration, isced_code, erc_area, erc_panel, erc_keyword, start_date, learning_outcomes, multimediarial_material_provided, end_date, languages, speakers, pedagogical_objectives, level_of_study, university, first_level_structure, second_level_structure, offered_by, cover} = ctx.request.body;
            const {group_name, group_display_name, group_description, category_name, category_color} = ctx.request.body;
            const email = ctx.request.body.data.email
            const user_id = ctx.request.body.data.user_id
            try{
                let virtual_cafe_username = "";
                const response_profile = await axios.get(`${process.env.DISCOURSE_URL}/admin/users/list/active.json`, {
                params: {
                    email: email,
                    show_emails: true
                },
                headers: {
                    'Api-Key': process.env.DISCOURSE_API_TOKEN,
                    'Api-Username': 'system'
                }
                });
                const virtual_cafe_profile = response_profile.data;
                if (virtual_cafe_profile && virtual_cafe_profile.length > 0){
                    virtual_cafe_username = virtual_cafe_profile[0].username || "";
                } else {
                    // User doesn't exist, create user via Discourse Connect                    
                    const username = email.split('@')[0];
                    
                    const ssoPayload = new URLSearchParams({
                        external_id: user_id, 
                        email: email,
                        username: username,
                        name: offered_by,
                        require_activation: 'false',
                    });

                    const base64Payload = Buffer.from(ssoPayload.toString()).toString('base64');
                    const signature = crypto
                        .createHmac('sha256', process.env.DISCOURSE_CONNECT_SECRET)
                        .update(base64Payload)
                        .digest('hex');

                    try {
                        const syncResponse = await axios.post(
                            `${process.env.DISCOURSE_URL}/admin/users/sync_sso`,
                            {
                                sso: base64Payload,
                                sig: signature
                            },
                            {
                                headers: {
                                    'Api-Key': process.env.DISCOURSE_API_TOKEN,
                                    'Api-Username': 'system',
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        console.log('User synced successfully:', syncResponse.data);
                        virtual_cafe_username = username;
                }  catch (syncError) {
                        console.error('Error syncing user via Discourse Connect:', syncError.response?.data || syncError.message);
                    }
                }
                let group_name_sanitazed = group_name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
                const group_payload = {
                    name: group_name_sanitazed,
                    full_name: group_display_name || group_name,
                    visibility_level: 0,
                    bio_raw: group_description || "",
                    public_admission: false,
                    public_exit: true,
                    default_notification_level: 3,
                    primary_group: false,
                    skip_validations: true,
                };
                const response = await axios.post(`${process.env.DISCOURSE_URL}/admin/groups.json`, group_payload, {
                    headers: {
                        'Api-Key': process.env.DISCOURSE_API_TOKEN,
                        'Api-Username': 'system'
                    }
                });
                console.log("Group creation response:", response)
                const discourse_group_id = response.data.basic_group.id;
                await axios.put(
                    `${process.env.DISCOURSE_URL}/groups/${discourse_group_id}/members.json`,
                    { usernames: virtual_cafe_username },
                    {
                        headers: {
                            'Api-Key': process.env.DISCOURSE_API_TOKEN,
                            'Api-Username': 'system'
                        }
                    }
                );
                let discourse_category_id = null;
                if (category_name !== null || category_name !== '') {
                    const category_payload = {
                        name: category_name,
                        color: (category_color || "0088CC").replace('#', ''),
                        text_color: "FFFFFF",
                        slug:  category_name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, ''),
                        parent_category_id: null,
                        allow_badges: true,
                        topic_featured_link_allowed: true,
                        permissions: {
                            [group_name_sanitazed]: 1,
                            'staff': 1,
                            'admins': 1,
                        }
                    }
                    const response_cat = await axios.post(`${process.env.DISCOURSE_URL}/categories.json`, category_payload, {
                        headers: {
                            'Api-Key': process.env.DISCOURSE_API_TOKEN,
                            'Api-Username': 'system'
                        }
                    });
                    discourse_category_id = response_cat.data.category.id;
                }
                let entry = await strapi.entityService.create("api::item.item", {
                data:{
                    seller: user_id.toString(),
                    item_status,
                    name,
                    description,
                    item_category,
                    expiration,
                    isced_code,
                    erc_area,
                    erc_panel,
                    erc_keyword: erc_keyword,
                    start_date,
                    learning_outcomes,
                    multimedial_material_provided : multimediarial_material_provided,
                    end_date,
                    languages,
                    speakers,
                    pedagogical_objectives,
                    level_of_study,
                    university,
                    first_level_structure,
                    second_level_structure,
                    seller_name: offered_by,
                    discourse_group_id: discourse_group_id ? parseInt(discourse_group_id) : null,
                    discourse_category_id: discourse_category_id ? parseInt(discourse_category_id) : null,
                    cover: cover ? parseInt(cover) : null,

                }
            });
            const topic_payload = {
                title: `"${name}" has been inserted in the NEOLink platform!`,
                raw: `${name} has been created and is now available on the NEOLink platform. Check it out!`,
                category: 101, 
            }
            await axios.post(`${process.env.DISCOURSE_URL}/posts.json`, topic_payload, {
                headers: {
                    'Api-Key': process.env.DISCOURSE_API_TOKEN,
                    'Api-Username': 'system'
                }
            });
            return ctx.response.created(entry);
            } catch (error){
                console.log("Error creating Discourse group and category: " + error);
                throw error;
            }
        } catch (error){
            console.log(error);
            return ctx.internalServerError(error.message);
        }
    }
}