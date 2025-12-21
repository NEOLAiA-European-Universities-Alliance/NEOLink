
module.exports = {
    async find(ctx, next){
        try{
            const { erc_area } = ctx.query;
            
            const entries = await strapi.entityService.findMany("api::erc-panel.erc-panel", {
                fields: ['documentId', 'name'],
                filters: {
                    erc_area: erc_area
                },
            });

            if (entries && entries.length > 0){
                return ctx.send(entries);
            } else {
                return ctx.notFound('No structure found');
            }
        } catch (error){
            console.log(error);
            return ctx.internalServerError(error.message);
        }
    }
}