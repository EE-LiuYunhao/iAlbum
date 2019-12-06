var express = require('express');
var path = require('path');
var routes = require('./routes/albums.js');
var monk = require('monk');

var app = express();
var db = monk('localhost:27017/assignment2');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next)
{
    req.db = db;
    next();
});
app.use("/",routes);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = app.listen(3002, function()
{
    var host = server.address().address;
    var port = server.address().port;
    console.log("iAlbum app listening at http://%s:%s",host, port);
});
