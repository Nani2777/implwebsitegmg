var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var nunjucks = require('nunjucks');
var logger = require('morgan');
var request = require('request');
var axios = require('axios');
var app = express();
var Logger = require('./logger').Logger;
var bodyParser = require('body-parser');


app.use(function timeLog(req, res, next) {
  // this is an example of how you would call our new logging system to log an info message
  Logger.info("Test Message");
  next();
});

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
app.use(bodyParser.text());
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
  try {
    let data = req.body;
    console.log(typeof (data));
    if (typeof (data) == 'object') {
      if (data.jobname && data.jobname !== "null") {
        let div = data.jobname.split(',');
        let params = {};
        for (i = 0; i < div.length; i++) {
          let fin = div[i].split(':');
          params[fin[0]] = fin[1];
        }
        var custom_params = Object.keys(params).reduce((object, key) => {
          if (key != "comp_id" && key != "vid") {
            object[key] = params[key]
          }
          return object
        }, {});
        var Server = (params.comp_id == "fcbe3928-6512-48a6-8cb5-c8c51e100539" ? "js3in1.gamooga.com" : "evbk.gamooga.com");
        var url = "http://" + Server + "/ev/?c=" + params.comp_id + "&v=" + params.vid + "&e=_sms_delivered"
        Object.entries(custom_params).forEach(
          ([key, value]) => url = url + "&ky=" + key + "&vl=" + value + "&tp=s"
        );
        console.log(url);
        axios.get(url).then(function (response) {
          console.log(response.statusText);
        }).catch(function (error) {
          console.log(error);
        });
      } else {
        console.log("jobname was not paasing while sending sms");
      }
    }
  } catch {
    console.log('Error in entries for MOSL req data', err);
    res.writeHead(200);
    res.end("ERROR");
  }
  res.end("OK");
});
app.post('/iflwebhook', function (req, res) {
  console.log(req.body);
  let cb_data = req.body;
  try {
    cb_data.forEach(function (each) {
      if (each['event'] == 'delivered' || each['event'] == 'bounce' || each['event'] == 'dropped' || each['event'] == "unsubscribe") {
        let comp_id = each.comp_id;
        let vid = each.vid;
        let cp_type = each.cp_type;
        let cp_id = each.cp_id;
        let tpid = each.tpid;
        let mail_type = each.mail_type;
        let email = each.emailid;
        let custom_args = {
          "cp_type": cp_type,
          "cp_id": cp_id,
          "tpid": tpid,
          "mail_type": mail_type,
          "email": email
        }
        let event = "_email_" + each['event'];
        if (event == "_email_dropped" || event == "_email_unsubscribe") {
          custom_args['reason'] = each.reason;
        }
        if (event == "_email_bounce") {
          custom_args['reason'] = each.reason;
          custom_args['bounce_category'] = each.bounce_category;
          custom_args['type'] = each.type;
        }

        let url = "http://evbk.gamooga.com/ev/?c=" + comp_id + "&v=" + vid + "&e=" + event
        Object.entries(custom_args).forEach(
          ([key, value]) => url = url + "&ky=" + key + "&vl=" + value + "&tp=s"
        );
        console.log(url);
        axios.get(url).then(function (response) {
          console.log("Successfull to send data to gamooga");
          console.log(response.statusText);
        }).catch(function (error) {
          console.log(error);
        });
      }
    })
  } catch (e) {
    console.log("Error in incoming data from value first", e);
    res.writeHead(200);
    res.end("ERROR");
  }
  res.writeHead(200);
  res.end("OK");
});
/*
app.post('/karvywebhook', function (req, res) {
  try {
    var webhookData = req.body;
    //console.log(webhookData);
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
            axios.get(url).then(function (response) {
              console.log(response)
            }).catch(function (error) {
              console.log(error);
            });
          } catch (err) {
            console.log('Error in entries for the Pepipost req data', err);
            res.writeHead(200);
            res.end("ERROR");
          }
        }
      })
    }
    res.writeHead(200);
    res.end("OK");
  } catch (err) {
    console.log('Error in Webhook from Pepipost');
    res.writeHead(200);
    res.end("ERROR");
  }
});
*/
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
        axios.get(url).then(function (response) {
          console.log("Api Success done");
        }).catch(function (error) {
          console.log("Error present in API");
        });
      } catch (err) {
        console.log('Error in Webhook from Gamooga Event API', err);
        res.writeHead(200);
        res.end("ERROR");
      }
    }
  } catch (err) {
    console.log('Error in Webhook from Gupshups object \n%s', err);
    res.writeHead(200);
    res.end("ERROR");
  }
});

app.post('/karvymailkootwebhook', function (req, res) {
  let webhookData = req.body;
  if (typeof (webhookData) == 'object') {
    console.log(webhookData);
    if ((webhookData['event_type'] == "delivery_attempt" && webhookData["status"]=="success") || webhookData['event_type'] == "bounce_all") {
      try {
        var cmp_data = webhookData['click_tracking_id'];
        var campaign_data = JSON.parse(cmp_data);
        var vid = campaign_data.vid;
        var comp_id = campaign_data.comp_id;
        var camp_data = new Object(campaign_data.custom_params);
        var event = "_email_delivered"; 
        if (webhookData['event_type'] == "bounce_all"){
          event = "_email_bounce"
          camp_data["bounce_text"] = webhookData.bounce_text;
        }
        var url = "http://evbk.gamooga.com/ev/?c=" + comp_id + "&v=" + vid + "&e=" + event
        Object.entries(camp_data).forEach(
          ([key, value]) => url = url + "&ky=" + key + "&vl=" + value + "&tp=s"
        );
        console.log(url);
        axios.get(url).then(function (response) {
          console.log(response.statusText)
        }).catch(function (error) {
          console.log(error);
        });
      } catch (err) {
        console.log('Error in entries for the Mailkoot req data', err);
        //Log.L(Log.E, 'Error in entries for the Mailkoot req data', err);
        res.writeHead(200);
        res.end("ERROR");
      }
    }
  }
  res.writeHead(200);
  res.end("OK");
});

app.post('/stepwebhook', function (req, res) {
  Logger.info('step Email logs Post');
  console.log('step logs');
  console.log(req.body);
  console.log(req.query);
  console.log(req.params);
  console.log(req.headers);
  Logger.info(req.body);
  Logger.info(req.query);
  Logger.info(req.params);
  Logger.info(req.headers);
  //console.log("req", req);
  res.writeHead(200);
  res.end("OK");
});

app.get('/stepwebhook', function (req, res) {
  Logger.info('step Email logs Get');
  console.log('step logs');
  console.log(req.body);
  console.log(req.query);
  console.log(req.params);
  console.log(req.headers);
  Logger.info(req.body);
  Logger.info(req.query);
  Logger.info(req.params);
  Logger.info(req.headers);
  //console.log("req", req);
  res.writeHead(200);
  res.end("OK");
});

app.post('/stepwebhooksms', function (req, res) {
  Logger.info('step SMS logs');
  console.log('step logs');
  console.log(req.query);
  var qury = req.query;
  /*var cp_id = qury['cp_id'];
  var tpid = qury['tpid'];
  var cp_type = qury['cp_type'];
  var tp = qury['tp'];
  var visid = qury['visid'];
  var event = 'test_apl';
  var camp_data = new Object();
  camp_data["cp_id"] = cp_id;
  camp_data["tpid"] = tpid;
  camp_data["cp_type"] = cp_type;
  camp_data["tp"] = tp;*/
  var event = 'test_apl';
  var custom_params = Object.keys(qury).reduce((object, key) => {
    if (key != "comp_id" && key != "vid") {
      object[key] = qury[key]
    }
    return object
  }, {});
  Logger.info(custom_params);
  var url = "http://evbk.gamooga.com/ev/?c="+ qury.comp_id +"&v=" + qury.vid + "&e=" + event
  Object.entries(custom_params).forEach(
    ([key, value]) => url = url + "&ky=" + key + "&vl=" + value + "&tp=s"
  );
  console.log(url)
  axios.get(url).then(function (response) {}).catch(function (error) {
    console.log(error);
    Logger.error(error);
  });  
  console.log(req.body);
  console.log(req.headers);
  Logger.info(req.query);
  Logger.info(JSON.stringify(req.body));
  Logger.info(JSON.stringify(req.headers));
  let webhookData = req.body;
  if (typeof (webhookData) == 'object') {
    //console.log(webhookData);
    if(webhookData['Status'] == 'sent'){
      console.log('sms_delivered');
    }
  }
  //console.log("req", req);
  res.writeHead(200);
  res.end("OK");
});

app.get('/wooplrwebhook', function (req, res) {
  try {
    //console.log('Wooplr SMS');
    Logger.info('Wooplr SMS');
    var data = req.query;
    if (typeof (data) == 'object') {
      //console.log(typeof (data));
      //console.log(req.query);
      Logger.debug(JSON.stringify(req.query));
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
      Logger.debug(camp_data);
      try {
        var url = "http://evbk.gamooga.com/ev/?c=107a3b41-1aa3-45c6-a324-f0399a2aa2af&v=" + vid + "&e=" + event
        Object.entries(camp_data).forEach(
          ([key, value]) => url = url + "&ky=" + key + "&vl=" + value + "&tp=s"
        );
        console.log(url)
        axios.get(url).then(function (response) {}).catch(function (error) {
          console.log(error);
          Logger.error(error);
        });
      } catch (err) {
        console.log('Error in Webhook from Gamooga Event API', err);
        res.writeHead(200);
        res.end("ERROR");
      }
    }
  } catch (err) {
    //console.log('Wooplr Error in Webhook from Gupshups object \n%s', err);
    Logger.error('Wooplr Error in Webhook from Gupshups object \n%s', err);
    res.writeHead(200);
    res.end("ERROR");
  }
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
app.get('/testiflpage', function (req, res) {
  //res.send('Coming from home directory'); 
  res.render('testifl.html');
});
app.get('/--', function (req, res) {
  //res.send('Coming from home directory'); 
  res.render('--.html');
});
app.get('/path2/', function (req, res) {
  //res.send('Coming from home directory'); 
  res.render('home_page.html');
});

app.get('/samplehtmljson',function(req,res){
	var h = `<tr><td style="width:100%; font-size:0px;  text-align:left;"><h3>You May Also Like</h3></td></tr><tr><td width="80%"><table align="center"><tr><td width="25%"><a style="border:none; text-decoration:none; display: block;" href=http://www.nykaa.com/vega-lip-filler/p/3843 target="_blank"><img style="border:none; margin: 3px ; padding:0 0 0 0;" src=https://adn-static1.nykaa.com/media/catalog/product/tr:h-220,w-150,cm-pad_resize/e/v/ev-13.jpg align="top"></a><div style="color:#fc2779;font-family: Arial;" align="center">Rs. 90.0</div><br /><div style="height: 100px;width: 120px;color: #333333;text-overflow-ellipsis: 1">Vega Lip Filler</div></td><td width="25%"><a style="border:none; text-decoration:none; display: block;" href="http://www.nykaa.com/l-a-girl-shady-slim-brow-pencil/p/81921" target="_blank"><img style="border:none; margin: 3px ; padding:0 0 0 0;" src="https://adn-static3.nykaa.com/media/catalog/product/tr:h-220,w-150,cm-pad_resize/l/a/lag_shady_slim_brow_gb357_brunette_1.jpg"></a><div style="color:#fc2779;font-family: Arial;" align="center">Rs. 625.0</div><br /><div style="height: 100px;width: 120px;color: #333333;text-overflow-ellipsis: 1">L.A Girl Shady Slim Brow Pencil</div></td><td width="25%"><a style="border:none; text-decoration:none; display: block;" href="http://www.nykaa.com/ocean-professional-foundation-brush/p/155271" target="_blank"><img style="border:none; margin: 3px ; padding:0 0 0 0;" src="https://adn-static3.nykaa.com/media/catalog/product/tr:h-220,w-150,cm-pad_resize/N/Y/NYKONPL000010.jpg"></a><div style="color:#fc2779;font-family: Arial;" align="center">Rs.180.0</div><br /><div style="height: 100px;width: 120px;color: #333333;text-overflow-ellipsis: 1">Ocean Professional Brush(1Pc)</div></td><td width="25%"><a style="border:none; text-decoration:none; display: block;" href="http://www.nykaa.com/ocean-professional-contour-brush/p/155272" target="_blank"><img style="border:none; margin: 3px ; padding:0 0 0 0;" src="https://adn-static3.nykaa.com/media/catalog/product/tr:h-220,w-150,cm-pad_resize/N/Y/NYKONPL000011.jpg"></a><div style="color:#fc2779;font-family: Arial;" align="center">Rs. 180.0</div><br /><div style="height: 100px;width: 120px;color: #333333;text-overflow-ellipsis: 1">Ocean Professional Contour Brush</div></td></tr></table></td></tr>`
	res.send({"html":h});
	
})
app.get('/samplehtml',function(req,res){
	var h = `<tr><td style="width:100%; font-size:0px;  text-align:left;"><h3>You May Also Like</h3></td></tr><tr><td width="80%"><table align="center"><tr><td width="25%"><a style="border:none; text-decoration:none; display: block;" href=http://www.nykaa.com/vega-lip-filler/p/3843 target="_blank"><img style="border:none; margin: 3px ; padding:0 0 0 0;" src=https://adn-static1.nykaa.com/media/catalog/product/tr:h-220,w-150,cm-pad_resize/e/v/ev-13.jpg align="top"></a><div style="color:#fc2779;font-family: Arial;" align="center">Rs. 90.0</div><br /><div style="height: 100px;width: 120px;color: #333333;text-overflow-ellipsis: 1">Vega Lip Filler</div></td><td width="25%"><a style="border:none; text-decoration:none; display: block;" href="http://www.nykaa.com/l-a-girl-shady-slim-brow-pencil/p/81921" target="_blank"><img style="border:none; margin: 3px ; padding:0 0 0 0;" src="https://adn-static3.nykaa.com/media/catalog/product/tr:h-220,w-150,cm-pad_resize/l/a/lag_shady_slim_brow_gb357_brunette_1.jpg"></a><div style="color:#fc2779;font-family: Arial;" align="center">Rs. 625.0</div><br /><div style="height: 100px;width: 120px;color: #333333;text-overflow-ellipsis: 1">L.A Girl Shady Slim Brow Pencil</div></td><td width="25%"><a style="border:none; text-decoration:none; display: block;" href="http://www.nykaa.com/ocean-professional-foundation-brush/p/155271" target="_blank"><img style="border:none; margin: 3px ; padding:0 0 0 0;" src="https://adn-static3.nykaa.com/media/catalog/product/tr:h-220,w-150,cm-pad_resize/N/Y/NYKONPL000010.jpg"></a><div style="color:#fc2779;font-family: Arial;" align="center">Rs.180.0</div><br /><div style="height: 100px;width: 120px;color: #333333;text-overflow-ellipsis: 1">Ocean Professional Brush(1Pc)</div></td><td width="25%"><a style="border:none; text-decoration:none; display: block;" href="http://www.nykaa.com/ocean-professional-contour-brush/p/155272" target="_blank"><img style="border:none; margin: 3px ; padding:0 0 0 0;" src="https://adn-static3.nykaa.com/media/catalog/product/tr:h-220,w-150,cm-pad_resize/N/Y/NYKONPL000011.jpg"></a><div style="color:#fc2779;font-family: Arial;" align="center">Rs. 180.0</div><br /><div style="height: 100px;width: 120px;color: #333333;text-overflow-ellipsis: 1">Ocean Professional Contour Brush</div></td></tr></table></td></tr>`
	res.send(h);
	
})
app.listen(app.get('port'), function () {
  console.log('server started');
});