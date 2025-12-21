
module.exports = {
    async find(ctx, next){
        try{
            const { first_level_structure } = ctx.query;
            
            const entries = await strapi.entityService.findMany("api::second-level-structure.second-level-structure", {
                fields: ['id', 'name'],
                filters: {
                    first_level_structure: first_level_structure
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