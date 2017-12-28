module.exports = {

    ucwords(string) {
        return (string + '')
            .toLowerCase()
            .replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, result => {
                return result.toUpperCase();
            });
    },

    slugify(string) {
        return (string + '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9 ]+/g,'')
            .replace(/ +/g,'-');
    }

};