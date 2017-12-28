module.exports.routes = {

    // home
    'GET /': 'HomeController.home',
    'GET /old': 'HomeController.old_home',

    // catch all (404)
    'ALL r|^/(?:(?!css|img|js|lib|other|robots\.txt|google*).)*$|': 'HomeController.fourohfour'

};
