const moment = require('moment');
const q = require('q');

module.exports = {

    home(req, res) {
        return res.view();
    },

    fourohfour(req, res) {
        res.status(404);
        return res.view('home/fourohfour');
    },

    _config: {}

};
