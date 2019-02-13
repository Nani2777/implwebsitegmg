var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var nunjucks = require('nunjucks');
var logger = require('morgan');
var request = require('request');


var app = express();

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

// view engine setup
app.set('port', process.env.PORT || 2777);
app.set('views', path.join(__dirname, 'views'));
//app.use("/path1",path.join(__dirname + "/path1"));
//app.use("/path2",path.join(__dirname + "/path2"));
app.set('view engine', 'nunjucks');
//app.set('views', path.join(__dirname, 'img')); - To give permissions to that folder

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use("/public", express.static(__dirname + "/public"));
app.use("/path1", express.static(__dirname + "/path1"));
app.use("/path2", express.static(__dirname + "/path2"));
app.use("/", express.static(__dirname + "/"));


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
app.post('/moslwebhook', function (req, res) {
  console.log('MOSL logs');
  console.log(req.body);
  console.log(req.headers);
  res.send({
    "status": "Success"
  });
});
app.post('/iflwebhook', function (req, res) {
  console.log('ifl logs');
  console.log(req.body);
  console.log(req.headers);
  res.send({
    "status": "Success"
  });
});
app.post('/karvywebhook', function (req, res) {
  try {
    var webhookData = req.body;
    if (typeof (webhookData) == 'object') {
      webhookData.forEach(function (each) {
        if (each['EVENT'] == "sent" || each['EVENT'] == "bounced" || each['EVENT'] == "unsubscribed") {
          try {
            var cmp_data = each['X-APIHEADER'];
            var campaign_data = JSON.parse(cmp_data);
            var vid = campaign_data.vid;
            var comp_id = campaign_data.comp_id;
            var camp_data = new Object(campaign_data.custom_params);
            var event = "_email_" + (each['EVENT'] == 'sent' ? 'delivered' : each['EVENT']);
            var _check_bounce = (event == '_email_bounced' ? 'true' : 'false');
            if (_check_bounce == 'true') {
              camp_data['bounce_type'] = each['BOUNCE_TYPE']
              camp_data['bounce_reason'] = each['BOUNCE_REASON']
            }
            var url = "http://evbk.gamooga.com/ev/?c=" + comp_id + "&v=" + vid + "&e=" + event
            Object.entries(camp_data).forEach(
              ([key, value]) => url = url + "&ky=" + key + "&vl=" + value + "&tp=s"
            );
            request.get({
              url: url
            }, function (err, response, body) {
              if (err) {
                console.log("Error in gamooga post event", err);
              }

            })
          } catch (err) {
            console.log('Error in entries for the Mandrill req data', req.body);
            res.writeHead(200);
            res.end("ERROR");
          }
        }
      })
    }
    res.writeHead(200);
    res.end("OK");
  } catch (err) {
    console.log('Error in Webhook from Pepipost \n%s', err);
    res.writeHead(200);
    res.end("ERROR");
  }
});

app.get('/karvywebhook', function (req, res) {
  try {
    console.log('karvy SMS');
    var data = req.query;
    if (typeof (data) == 'object') {
      //console.log(typeof (data));
      //console.log(req.query);
      var cmp_data = data['extra'];
      var campaign_data = JSON.parse(cmp_data);
      var camp_data = new Object(campaign_data.cust_params);
      var vid = campaign_data['vid'];
      var comp_id = campaign_data['comp_id'];
      var mobile = data['phoneNo'];
      var status = data['status'];
      var cause = data['cause'];
      var error = data['errCode'];
      var event = '_sms_delivered';
      camp_data["mobile"] = mobile;
      camp_data["status"] = status;
      camp_data["cause"] = cause;
      camp_data["error"] = error;
      console.log(camp_data);
      try {
        var url = "http://evbk.gamooga.com/ev/?c=107a3b41-1aa3-45c6-a324-f0399a2aa2af&v=" + vid + "&e=" + event
        Object.entries(camp_data).forEach(
          ([key, value]) => url = url + "&ky=" + key + "&vl=" + value + "&tp=s"
        );
        console.log(url)
        request.get({ url: url }, function (err, response, body) {
          if (err) {
            console.log(err)
          }
          console.log("response", response.statusCode)
          res.writeHead(200);
          res.end("OK");
        });
      }
      catch (err) {
        console.log('Error in Webhook from Gamooga Event API', err);
        res.writeHead(200);
        res.end("ERROR");
      }
    }
  }
  catch (err) {
    console.log('Error in Webhook from Gupshups object \n%s', err);
    res.writeHead(200);
    res.end("ERROR");
  }
});

app.post('/karvymailkootwebhook', function (req, res) {
  console.log('Karvy Mailkoot logs');
  console.log(req.body);
  console.log(req.headers);
  res.send({
    "status": "Success"
  });
});

app.post('/stepwebhook', function (req, res) {
  console.log('step logs');
  console.log(req.body);
  console.log(req.headers);
  res.send({
    "status": "Success"
  });
});
app.get('/', function (req, res) {
  //res.send('We can host the HTML here by using below render method'); 
  res.render('home_page.html');
});
app.get('/category', function (req, res) {
  //res.send('We can host the HTML here by using below render method'); 
  res.render('category.html');
});
app.get('/header', function (req, res) {
  //res.send('We can host the HTML here by using below render method'); 
  res.render('header.html');
});
app.get('/seniority', function (req, res) {
  //res.send('Coming from home directory'); 
  res.render('index.html');
});
app.get('/--', function (req, res) {
  //res.send('Coming from home directory'); 
  res.render('--.html');
});
app.get('/path2/', function (req, res) {
  //res.send('Coming from home directory'); 
  res.render('home_page.html');
});
app.listen(app.get('port'), function () {
  console.log('server started');
});