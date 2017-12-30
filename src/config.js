// Copyright (c) 2017 Brian Seymour
// Distributed under the MIT software license, see the accompanying
// file "license" or http://www.opensource.org/licenses/mit-license.php.

require('nocamel');

const fs = require('fs');
const ld = require('lodash');

var config = {
    master_node: {
        host: '104.197.55.138',
        port: 4343
    }
}

var user_config;

try {
    user_config = JSON.parse(fs.read_file_sync('config.json').toString());

    // deep merge config
    config = ld.merge(config, user_config);
} catch (e) {
    console.log('user supplied config invalid, using defaults');
}

module.exports = config;
