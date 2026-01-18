module.exports = {
    routes: [
         {
            method: 'POST',
            path: '/custom-item/',
            handler: 'custom-item.create',
            config:{
                middlewares: ["global::otp-auth"]
            }
        },
        {
            method: 'POST',
            path: '/custom-item/interest/',
            handler: 'custom-item.interest',
            config:{
                middlewares: ["global::otp-auth"]
            }
        },
        {
            method: 'POST',
            path: '/custom-item/remove-interest/',
            handler: 'custom-item.removeInterest',
            config:{
                middlewares: ["global::otp-auth"]
            }
        },
        {
            method: 'POST',
            path: '/custom-item/remove-item/',
            handler: 'custom-item.removeItem',
            config:{
                middlewares: ["global::otp-auth"]
            }
        },
        {
            method: 'POST',
            path: '/custom-item/update-item/',
            handler: 'custom-item.updateItem',
            config:{
                middlewares: ["global::otp-auth"]
            }
        },
        {
            method: 'POST',
            path: '/custom-item/my-items/',
            handler: 'custom-item.getItemsSelled',
            config:{
                middlewares: ["global::otp-auth"]
            }
        }
    ]
}