const axios = require('axios');
const seller = require('../../seller/controllers/seller');
const crypto = require('crypto');
const { connect } = require('http2');
const { disconnect } = require('cluster');
module.exports = {
    async create(ctx, next){
        try{
            const { 
                item_status, 
                name, 
                description, 
                item_category, 
                expiration, 
                isced_broad_field,
                isced_narrow_field,
                isced_detailed_field,
                erc_area, 
                erc_panel, 
                erc_keyword, 
                start_date, 
                learning_outcomes, 
                multimediarial_material_provided, 
                end_date, 
                languages, 
                speakers, 
                pedagogical_objectives, 
                level_of_study, 
                university, 
                first_level_structure, 
                second_level_structure, 
                offered_by, 
                cover
            } = ctx.request.body;
            
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
                let group_name_sanitazed = group_name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 20);
                const group_payload = {
                    name: group_name_sanitazed,
                    full_name: `[NEOLink] ${group_display_name || group_name}`,
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
                    const category_name_sanitized = category_name.slice(0, 50);
                    const category_payload = {
                        name: `[NEOLink] ${category_name_sanitized}`,
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
                        erc_area,
                        ...(erc_panel && {
                            erc_panel: {
                                connect: [
                                    { documentId: erc_panel }
                                ]
                            }
                        }),
                        ...(erc_keyword && {
                            erc_keyword: {
                                connect: [
                                    { documentId: erc_keyword }
                                ]
                            }
                        }),
                        start_date,
                        learning_outcomes,
                        multimedial_material_provided: multimediarial_material_provided,
                        end_date,
                        languages,
                        speakers,
                        pedagogical_objectives,
                        level_of_study,
                        university,
                        // First level structure relation
                        first_level_structure: {
                            connect: [
                                { documentId: first_level_structure }
                            ]
                        },
                        // Second level structure relation (optional)
                        ...(second_level_structure && {
                            second_level_structure: {
                                connect: [
                                    { documentId: second_level_structure }
                                ]
                            }
                        }),
                        // ISCED Broad Field relation (optional - user can stop here)
                        ...(isced_broad_field && {
                            isced_broad_field: {
                                connect: [
                                    { documentId: isced_broad_field }
                                ]
                            }
                        }),
                        // ISCED Narrow Field relation (optional - user can stop here)
                        ...(isced_narrow_field && {
                            isced_narrow_field: {
                                connect: [
                                    { documentId: isced_narrow_field }
                                ]
                            }
                        }),
                        // ISCED Detailed Field relation (optional - most specific level)
                        ...(isced_detailed_field && {
                            isced_detailed_field: {
                                connect: [
                                    { documentId: isced_detailed_field }
                                ]
                            }
                        }),
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
    },
    async interest(ctx, next){
        const email = ctx.request.body.data.email
        const user_id = ctx.request.body.data.user_id
        const {item_id} = ctx.request.body;

        const entry = await strapi.db.query("api::item.item").findOne({
            select: ['discourse_group_id'],
            where: { documentId: item_id },
            populate: {
                interested_users: {
                    select: ['documentId']
                }
            }
        });

        if (entry && entry.discourse_group_id){

            // Check if user is already interested
            const isAlreadyInterested = entry.interested_users?.some(
                user => user.documentId === user_id
            );

            if (isAlreadyInterested) {
                return ctx.send({message: 'User is already interested in this item'});
            }

            const user_entry = await strapi.db.query("api::seller.seller").findOne({
                select: ['virtual_cafe_id'],
                where: { documentId: user_id },
            });
            
            let virtual_cafe_username = "";
            if (!user_entry || !user_entry.virtual_cafe_id){
                // User doesn't exist, create user via Discourse Connect                    
                virtual_cafe_username = email.split('@')[0];
                
                const ssoPayload = new URLSearchParams({
                    external_id: user_id, 
                    email: email,
                    username: virtual_cafe_username,
                    name: virtual_cafe_username,
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
                    // Note: You may want to save the username to the database here
                } catch (error) {
                    console.log("Error syncing user: " + error);
                    return ctx.internalServerError('Error syncing user');
                }
            } else {
                    try{
                        const response = await axios.get(`${process.env.DISCOURSE_URL}/admin/users/${user_entry.virtual_cafe_id}`, {
                            headers: {
                                'Api-Key': process.env.DISCOURSE_API_TOKEN,
                                'Api-Username': 'system'
                            }
                    });
                    const virtual_cafe_profile = response.data;
                    if (virtual_cafe_profile){
                        virtual_cafe_username = virtual_cafe_profile.username || "";
                    } 
                    } catch (error){
                        console.log("Error fetching Discourse profile for email: " + email);
                        console.log(error);
                    }
            }
            try{
                const virtual_cafe_response = await axios.put(
                    `${process.env.DISCOURSE_URL}/groups/${entry.discourse_group_id}/members.json`,
                    { usernames: user_entry?.virtual_cafe_username || email.split('@')[0] },
                    {
                        headers: {
                            'Api-Key': process.env.DISCOURSE_API_TOKEN,
                            'Api-Username': 'system'
                        }
                    }
                );
                if (virtual_cafe_response.status === 200){
                    // Add user to interested_users relation
                    try {
                        await strapi.documents("api::item.item").update({
                            documentId: item_id,
                            data: {
                                interested_users: {
                                    connect: [{ documentId: user_id }]
                                }
                            }
                        });

                        await strapi.documents("api::item.item").publish({
                            documentId: item_id
                        });
                        
                        console.log('User added to interested_users relation');
                    } catch (error) {
                        console.log("Error adding user to interested_users relation: " + error);
                        return ctx.internalServerError('Error adding user to interested_users relation');
                    }
                    return ctx.send({message: 'User added to the group successfully'});
                }
            } catch (error){
                console.log("Error adding user to the group: " + error);
                return ctx.internalServerError('Error adding user to the group');
            }
        } else {
            return ctx.notFound('Item or discourse group not found');
        }
    },
    async removeInterest(ctx, next) {
        const email = ctx.request.body.data.email;
        const user_id = ctx.request.body.data.user_id;
        const { item_id } = ctx.request.body;

        try {
            const entry = await strapi.db.query("api::item.item").findOne({
                select: ['discourse_group_id'],
                where: { documentId: item_id },
                populate: {
                    interested_users: {
                        select: ['documentId']
                    }
                }
            });

            if (!entry || !entry.discourse_group_id) {
                return ctx.notFound('Item or discourse group not found');
            }

            // Check if user is actually interested
            const isInterested = entry.interested_users?.some(
                user => user.documentId === user_id
            );

            if (!isInterested) {
                return ctx.send({ message: 'User is not interested in this item' });
            }

            const user_entry = await strapi.db.query("api::seller.seller").findOne({
                select: ['virtual_cafe_id'],
                where: { documentId: user_id },
            });

            let virtual_cafe_username = "";
            console.log("User entry:", user_entry);
            console.log(user_entry.virtual_cafe_id);
            if (user_entry && user_entry.virtual_cafe_id) {
                try {
                    const response = await axios.get(`${process.env.DISCOURSE_URL}/admin/users/${user_entry.virtual_cafe_id}.json`, {
                        headers: {
                            'Api-Key': process.env.DISCOURSE_API_TOKEN,
                            'Api-Username': 'system'
                        }
                    });
                    console.log("Discourse profile response data:", response.data);
                    const virtual_cafe_profile = response.data;
                    console.log("Discourse profile response:", virtual_cafe_profile);
                    if (virtual_cafe_profile) {
                        virtual_cafe_username = virtual_cafe_profile.username || "";
                    }
                } catch (error) {
                    console.log("Error fetching Discourse profile: " + error);
                }
            } else {
                virtual_cafe_username = email.split('@')[0];
            }

            // Remove user from Discourse group
            try {
                const virtual_cafe_response = await axios.delete(
                    `${process.env.DISCOURSE_URL}/groups/${entry.discourse_group_id}/members.json`,
                    {
                        params: { username: virtual_cafe_username },
                        headers: {
                            'Api-Key': process.env.DISCOURSE_API_TOKEN,
                            'Api-Username': 'system'
                        }
                    }
                );

                if (virtual_cafe_response.status === 200) {
                    // Remove user from interested_users relation
                    try {
                        await strapi.documents("api::item.item").update({
                            documentId: item_id,
                            data: {
                                interested_users: {
                                    disconnect: [{ documentId: user_id }]
                                }
                            }
                        });

                        await strapi.documents("api::item.item").publish({
                            documentId: item_id
                        });
                        
                        console.log('User removed from interested_users relation');
                        return ctx.send({ message: 'User removed from the group successfully' });
                    } catch (error) {
                        console.log("Error removing user from interested_users relation: " + error);
                        return ctx.internalServerError('Error removing user from interested_users relation');
                    }
                }
            } catch (error) {
                console.log("Error removing user from the group: " + error);
                return ctx.internalServerError('Error removing user from the group');
            }
        } catch (error) {
            console.log(error);
            return ctx.internalServerError(error.message);
        }
    },
    async removeItem(ctx, next){
        const { item_id } = ctx.request.body;
        try{
            const entry = await strapi.db.query("api::item.item").findOne({
                select: ['discourse_group_id', 'discourse_category_id'],
                where: { documentId: item_id },
            });
            if (entry){
                if (entry.discourse_group_id){
                    try{
                        await axios.delete(`${process.env.DISCOURSE_URL}/admin/groups/${entry.discourse_group_id}.json`, {
                            headers: {
                                'Api-Key': process.env.DISCOURSE_API_TOKEN,
                                'Api-Username': 'system'
                            }
                        });
                    } catch (error){
                        console.log("Error deleting Discourse group: " + error);
                    }
                }
                if (entry.discourse_category_id){
                    try{
                        await axios.delete(`${process.env.DISCOURSE_URL}/categories/${entry.discourse_category_id}.json`, {
                            headers: {
                                'Api-Key': process.env.DISCOURSE_API_TOKEN,
                                'Api-Username': 'system'
                            }
                        });
                    } catch (error){
                        console.log("Error deleting Discourse category: " + error);
                    }
                }
                await strapi.documents("api::item.item").delete({
                    documentId: item_id
                });
                return ctx.send({message: 'Item and associated Discourse group/category deleted successfully'});
            } else {
                return ctx.notFound('Item not found');
            }
        } catch (error){
            console.log(error);
            return ctx.internalServerError(error.message);
        }
    },
    async updateItem(ctx, next){
        const { item_id, cover, data, token } = ctx.request.body; 
        console.log("Update data received:", data);
        
        try{
            const entry = await strapi.db.query("api::item.item").findOne({
                select: ['documentId', 'name', 'discourse_group_id', 'discourse_category_id'],
                where: { documentId: item_id },
            });
            
            if (!entry){
                return ctx.notFound('Item not found');
            }

            // Build the update data object
            const updatePayload = {
                item_status: data.item_status, 
                name: data.name,
                description: data.description,
                expiration: data.expiration || null,
                erc_area: data.erc_area || null,
                start_date: data.start_date || null,
                learning_outcomes: data.learning_outcomes || null,
                multimedial_material_provided: data.multimediarial_material_provided || null,
                end_date: data.end_date || null,
                languages: data.languages || null,
                speakers: data.speakers || null,
                pedagogical_objectives: data.pedagogical_objectives || null,
                level_of_study: data.level_of_study || null,
            };

            // Handle university relation
            if (data.university) {
                updatePayload.university = {
                    connect: [{ documentId: data.university }]
                };
            }

            // Handle first_level_structure relation
            if (data.first_level_structure) {
                updatePayload.first_level_structure = {
                    connect: [{ documentId: data.first_level_structure }]
                };
            }

            // Handle second_level_structure relation
            if (data.second_level_structure) {
                updatePayload.second_level_structure = {
                    connect: [{ documentId: data.second_level_structure }]
                };
            } else {
                updatePayload.second_level_structure = null;
            }

            // Handle ISCED Broad Field relation (user can stop at this level)
            if (data.isced_broad_field) {
                updatePayload.isced_broad_field = {
                    connect: [{ documentId: data.isced_broad_field }]
                };
            } else {
                // Disconnect/clear if no value provided
                updatePayload.isced_broad_field = null
            }

            // Handle ISCED Narrow Field relation (user can stop at this level)
            if (data.isced_narrow_field) {
                updatePayload.isced_narrow_field = {
                    connect: [{ documentId: data.isced_narrow_field }]
                };
            } else {
                // Disconnect/clear if no value provided
                updatePayload.isced_narrow_field = null
            }

            // Handle ISCED Detailed Field relation (most specific level)
            if (data.isced_detailed_field) {
                updatePayload.isced_detailed_field = {
                    connect: [{ documentId: data.isced_detailed_field }]
                };
            } else {
                // Disconnect/clear if no value provided
                updatePayload.isced_detailed_field = null
            }

            // Handle ERC Panel relation
            if (data.erc_panel) {
                updatePayload.erc_panel = {
                    connect: [{ documentId: data.erc_panel }]
                };
            }

            // Handle ERC Keyword relation
            if (data.erc_keyword) {
                updatePayload.erc_keyword = {
                    connect: [{ documentId: data.erc_keyword }]
                };
            }

            // Handle cover image
            if (cover) {
                updatePayload.cover = parseInt(cover);
            }

            console.log("Update payload:", JSON.stringify(updatePayload, null, 2));
            
            const updatedEntry = await strapi.documents("api::item.item").update({
                documentId: item_id,
                data: updatePayload
            });
            
            console.log("Updated entry:", updatedEntry);

            await strapi.documents("api::item.item").publish({
                documentId: item_id
            });

            // Update Discourse if name changed
            if (data.name && data.name !== entry.name){
                const discourse_group_id = entry.discourse_group_id;
                const discourse_category_id = entry.discourse_category_id;
                
                if (discourse_group_id){
                    try{
                        const group_name_sanitazed = data.name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '').slice(0, 20);
                        await axios.put(`${process.env.DISCOURSE_URL}/groups/${discourse_group_id}.json`, {
                            name: group_name_sanitazed,
                            full_name: `[NEOLink] ${data.name}`,
                        }, {
                            headers: {
                                'Api-Key': process.env.DISCOURSE_API_TOKEN,
                                'Api-Username': 'system'
                            }
                        });
                    } catch (error){
                        console.log("Error updating Discourse group name: " + error);
                    }
                }
                
                if (discourse_category_id){
                    try{
                        const categories_name_sanitazed = data.name.slice(0, 50);
                        await axios.put(`${process.env.DISCOURSE_URL}/categories/${discourse_category_id}.json`, {
                            name: `[NEOLink] ${categories_name_sanitazed}`,
                        }, {
                            headers: {
                                'Api-Key': process.env.DISCOURSE_API_TOKEN,
                                'Api-Username': 'system'
                            }
                        });
                    } catch (error){
                        console.log("Error updating Discourse category name: " + error);
                    }
                }
            }
            
            return ctx.send(updatedEntry);

        } catch (error){
            console.log(error);
            return ctx.internalServerError(error.message);
        }
    },
    async getItemsSelled(ctx, next){
        const { user_id } = ctx.request.body.data;
        try{
            const items = await strapi.documents('api::item.item').findMany({
            filters: {
                seller: {
                documentId: user_id  
                }
            },
            populate: '*'
            });
            return ctx.send(items);
        } catch (error){
            console.log(error);
            return ctx.internalServerError(error.message);
        }
    }   
}