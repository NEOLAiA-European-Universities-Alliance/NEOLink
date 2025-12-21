
module.exports = {
    async find(ctx, next){
        try{
            const { university } = ctx.query;
            
            const entries = await strapi.entityService.findMany("api::first-level-structure.first-level-structure", {
                fields: ['documentId', 'name'],
                filters: {
                    university: university
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