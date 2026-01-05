module.exports = (config, { strapi }) => {
    return async (ctx, next) => {
        const jwt = require('jsonwebtoken');
        const token = ctx.request.body.token;
        
        if (typeof ctx.request.body.data === 'undefined')
            ctx.request.body.data = {};
        
        if (!token) return ctx.unauthorized("Access denied.");
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_CUSTOM_AUTH);
            ctx.request.body.data.email = decoded.email;
            ctx.request.body.data.user_id = decoded.user_id;
            return next();
        } catch (error) {
            console.log("JWT verification error:", error.message); 
            return ctx.unauthorized("This action is unauthorized.");
        }
    }
}