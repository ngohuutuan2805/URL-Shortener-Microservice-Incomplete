var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb').MongoClient;


var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// Setup mongo database

var mongodbURL = 'mongodb://localhost:27017/URLShortberMicroserviceDB'

var database;

mongo.connect(mongodbURL, function (err, db) {

    if(err) throw err

    console.log('Successfully connect to  MongoDB at port 27017')

    db.createCollection("urls");
    database = db
})


app.get('/new/:url', function (req, res, next) {

    //var url = decodeURIComponent(req.params.new)

    var url = decodeURIComponent(req.originalUrl.substring(5))

    //console.log("req.originalUrl: " + req.originalUrl);
    //console.log("req.path: " + req.path)
    //console.log("req.baseURL: " + req.baseUrl)
    //console.log("req.params: " + JSON.stringify(req.params))

    var urlRex = new RegExp("https?:\/\/w{3}\.(.+)\.com")

    console.log("Origin URL: " + url)

    if(urlRex.test(url)){

        console.log("Valid URL")


        console.log("Searching the origin-url: " + url)

        var urlCollection = database.collection("urls");

        urlCollection.findOne({
            "original_url":url
        }, function (err, document) {

            if(err){
                console.log("findOne() error:" + err);
                throw err
            } else {

                if(document != null){
                    console.log("Searching original_url success:" + JSON.stringify(document))

                    res.send({
                        "original_url":document.original_url,
                        "shorten_url":document.shorten_url
                    })
                }else{
                    console.log("Searching original_url error: " + err)
                    console.log("Creating new short_url");

                    var newURL = createNewShortLink(req)

                    var newDocument = {
                        "original_url":url,
                        "shorten_url":newURL
                    }
                    console.log("Creating new short_url 2");
                    saveURL(newDocument, database)
                    console.log("Creating new short_url 3");
                    res.send({
                        "original_url":newDocument.original_url,
                        "shorten_url":newDocument.shorten_url
                    })

                }

            }


        })

    }else{
        console.log("Invalid URL")
        next(new Error());
    }

})

app.get('/:random', function (req, res, next) {

    console.log("\nreq.params: " + JSON.stringify(req.params))

    var shortenURL = req.protocol + ":" + req.get('Host') + "/" + req.params.random;

    console.log("Shorten-url: " + shortenURL)

    if(req.params.random != 'favicon.ico'){
        findURL(shortenURL, database, res)
    }

})

// app.get('/favicon.ico', function(req, res) {
//     res.send(200);
// });

function  createNewShortLink(req) {

    var randomNum = "/";

    for(var i = 0; i < 4; i++){

        var randomDigit = Math.floor(Math.random()*10);
        randomNum += randomDigit.toString();
    }

    var result = req.protocol + ":" + req.get('Host') + randomNum
    console.log("New shorten-url: " + result)

    return result

}

function  findURL(link, db, res) {

    console.log("Finding the shorten-url: " + link)

    var urlCollection = db.collection("urls");

    urlCollection.findOne({
        "shorten_url":link
    }, function (err, document) {

        if(err){
            console.log("Founding error:" + err)
            throw err
        } else{

            if(document){

                console.log("Founded link:" + JSON.stringify(document))
                res.redirect(document.original_url)

            } else {
                console.log("Did not found link:" + JSON.stringify(document))
                res.send({
                    "error":"This url is not on the database"
                })
            }
        }
    })

}

function saveURL(document, db) {

    var urlCollection = db.collection("urls")

    urlCollection.insertOne(document, function (err, result) {

        if(err) {
            console.log("Save document error: " + err)
            throw  err
        }else{
            console.log("Save document success: " + result)
        }

    })

}



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

    console.log("Error:")
    res.send({
        "error":"Wrong url format, make sure you have a valid protocol and real site."
    });
});

module.exports = app;
