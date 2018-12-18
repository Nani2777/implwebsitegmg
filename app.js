var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var nunjucks = require('nunjucks');
var logger = require('morgan');



var app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

// view engine setup
app.set('port', process.env.PORT || 2777);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'nunjucks');
//app.set('views', path.join(__dirname, 'img')); - To give permissions to that folder

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/public",express.static(__dirname + "/public"));



// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;*/

app.get('/',function(req,res){
  res.send('We can host the HTML here by using below render method'); 
  //res.render('test.html'); 
});
app.get('/home',function(req,res){
  //res.send('Coming from home directory'); 
  res.render('index.html'); 
});
app.listen(app.get('port'),function(){
  console.log('server started');
});