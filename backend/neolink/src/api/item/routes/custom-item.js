module.exports = {
    routes: [
         {
            method: 'POST',
            path: '/custom-item/',
            handler: 'custom-item.create',
            config:{
                middlewares: ["global::otp-auth"]
            }
        }
    ]
}