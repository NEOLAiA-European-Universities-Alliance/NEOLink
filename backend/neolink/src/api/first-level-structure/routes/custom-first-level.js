module.exports = {
    routes: [
         {
            method: 'GET',
            path: '/custom-first-level/',
            handler: 'custom-first-level.find',
            config: {
                auth: false,
            },
        }
    ]
}