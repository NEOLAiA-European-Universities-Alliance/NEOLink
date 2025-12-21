module.exports = {
    routes: [
         {
            method: 'GET',
            path: '/custom-erc-panel/',
            handler: 'custom-erc-panel.find',
            config: {
                auth: false,
            },
        }
    ]
}