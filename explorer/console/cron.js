#!/usr/bin/env node
require('./common');

const moment = require('moment');
const request = require('request-promise');

var actions = {

    test() {

    }

};

var method = process.argv[2]
    .replace(/-/gi, '_')
    .replace(/^_+/gi, '');

actions[method]();
