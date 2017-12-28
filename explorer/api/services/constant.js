const moment = require('moment');

var constant = {

    no: 0,
    yes: 1,

    init() {
        if (sails.config.environment === 'production') {
        } else {
        }

        this.base_url = sails.config.base_url;
    },

    is_prod() {
        return sails.config.environment === 'production';
    }

};

constant.init();

module.exports = constant;
