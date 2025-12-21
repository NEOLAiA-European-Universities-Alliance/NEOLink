module.exports = {
    routes: [
         {
            method: 'GET',
            path: '/custom-erc-keyword/',
            handler: 'custom-erc-keyword.find',
            config: {
                auth: false,
            },
        }
    ]
}