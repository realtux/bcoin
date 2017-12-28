process.env.TZ = 'UTC';

require('nocamel');

root_dir = require('path').resolve(__dirname + '/../../');

var local = require('../config/local.js');

sails = {
    config: {
        environment: local.environment,
        base_url: local.base_url,
        db: local.db
    }
};

constant = require('../api/services/constant.js');
util = require('../api/services/util.js');
views = require('../api/services/views.js');
db = require('../models/index.js');
