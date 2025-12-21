
module.exports = {
    async find(ctx, next){
        try{
            const { erc_panel } = ctx.query;
            
            const entries = await strapi.entityService.findMany("api::erc-keyword.erc-keyword", {
                fields: ['documentId', 'name'],
                filters: {
                    erc_panel: erc_panel
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