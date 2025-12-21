module.exports = {
    routes: [
         {
            method: 'GET',
            path: '/custom-second-level/',
            handler: 'custom-second-level.find',
            config: {
                auth: false,
            },
        }
    ]
}