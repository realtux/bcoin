module.exports.session = {

    secret: '0b822d625a7d98578013fa0af66a6311',
    adapter: 'redis',
    cookie: {
        maxAge: 60 * 60 * 24 * 20 * 1000
    }

};
