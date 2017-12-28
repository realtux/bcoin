module.exports.http = {

    middleware: {
        xframe: require('lusca').xframe('SAMEORIGIN'),
        order: [
            'startRequestTimer',
            'xframe',
            'cookieParser',
            'session',
            'bodyParser',
            'compress',
            'methodOverride',
            '$custom',
            'router',
            'www',
            'favicon',
            '404',
            '500'
        ]
    },

    bodyParser() {
        return require('skipper')({ limit:'50mb' });
    }

};
