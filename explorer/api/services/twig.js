const moment = require('moment');

module.exports = {

    now_precise() {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    },

    date_precise() {
        return moment().format('YYYY-MM-DD');
    },

    date_percent_diff(start_date, now, end_date) {
        var total_time = moment(end_date).format('X') - moment(start_date).format('X');
        total_time = total_time / 60 / 60 / 24;

        var completed_time = moment(now).format('X') - moment(start_date).format('X');
        completed_time = completed_time / 60 / 60 / 24;

        return Math.round((completed_time / total_time) * 100);
    },

    substr(string, start, end) {
        return string.slice(start, end);
    },

    to_fixed(float, precision) {
        return float.toFixed(precision);
    },

    date_MMMMDYYYY(date) {
        return moment(date).format('MMMM D, YYYY');
    },

    strtotime(date) {
        return +moment(date) / 1000;
    },

    strip_tags(string) {
        return string.replace(/(<([^>]+)>)/ig, '');
    },

    eq(string) {
        return string.replace(/\"/ig, '&quot;');
    },

    number_format(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    starts_with(string, path) {
        var pattern = new RegExp('^' + string.replace('/', '\\/'));

        return pattern.test(path);
    }

};