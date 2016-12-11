var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/webhook', function(req, res) {
  var key = 'EAAZAdh4yZAgXcBAMdX9U6kUTd2Ow5oWyg6QMVy95UXvbnfALZCvovTiflTqHGhMChSqzdLyGWgIg1Sivp4dW8H5my5EIxt4TEZB3hchmNcDOkZBZBZC6aan9IVFhiVlYag6wRB6ZBsHlEFCpZAdAnCUSvLrXvF16AZC6U0Pf9pyqneuwZDZD'
  if (req.query['hub.verify_token'] === key) {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})





// app.post('/webhook', function (req, res) {
//   var data = req.body;
//
//   // Make sure this is a page subscription
//   if (data.object === 'page') {
//
//     // Iterate over each entry - there may be multiple if batched
//     data.entry.forEach(function(entry) {
//       var pageID = entry.id;
//       var timeOfEvent = entry.time;
//
//       // Iterate over each messaging event
//       entry.messaging.forEach(function(event) {
//         if (event.message) {
//           receivedMessage(event);
//         } else {
//           // console.log("Webhook received unknown event: ", event);
//         }
//       });
//     });
//
//     // Assume all went well.
//     //
//     // You must send back a 200, within 20 seconds, to let us know
//     // you've successfully received the callback. Otherwise, the request
//     // will time out and we will keep trying to resend.
//     res.sendStatus(200);
//   }
// });

app.post('/webhook/', function (req, res) {
  let messaging_events = req.body.entry[0].messaging
  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i]
    let sender = event.sender.id
    if (event.message && event.message.text) {
      let text = event.message.text
      var location = event.message.text
      var weatherEndpoint = 'http://api.openweathermap.org/data/2.5/weather?q=' +location+ '&units=metric&appid=efb29b6eb141f534bfca1523000078ca'
      request({
        url: weatherEndpoint,
        json: true
      }, function(error, response, body) {
        try {
          var condition = body.main;
          sendTextMessage(sender, "Today is " + condition.temp + "Celsius in " + location);
        } catch(err) {
          console.error('error caught', err);
          sendTextMessage(sender, "There was an error.");
        }
      })

      if (text === 'Generic') {
        sendGenericMessage(sender)
        continue
      }
      var text2 = text.split(' ')
      sendTextMessage(sender, parseInt(text2[0]) + parseInt(text2[1]) )
    }
    if (event.postback) {
      let text = JSON.stringify(event.postback)
      sendTextMessage(sender, 'Postback received: ' + text.substring(0, 200), token)
      continue
    }
  }
  res.sendStatus(200)
})

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  // console.log("Received message for user %d and page %d at %d with message:",
    // senderID, recipientID, timeOfMessage);
  // console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // api(messageText)

    // app.post('http://api.openweathermap.org/data/2.5/weather?q=' + str + '&APPID=efb29b6eb141f534bfca1523000078ca', function (req, res) {
    //   sendTextMessage(senderID, res.data.name)
    //   sendTextMessage(senderID, res.data.weather[0].description)
    //   sendTextMessage(senderID, res.data.main.temp)
    // })
    // if (messageText === 'hello') {
    //   sendTextMessage(senderID, "สวัสดี อยากทราบอุณภูมิจังหวัดไหนว่ามา <3");
    // }
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}
function sendGenericMessage(recipientId, messageText) {
  // To be expanded in later sections
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAAZAdh4yZAgXcBABVjIsKHFWDvLmeuARXQYDYIuonG4MUnRi2DLZBsVuJZAnHhEo5I0XjSmb9Qc7x2ZAmK9JqCksGRI7hal2B4sufmaQjcxoyiXAmKZCzMqdfGofCQccMMIyTpUAimRbOsEQagekugUJx3aFadcKneB7fT74uZCaQZDZD' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      // console.log("Successfully sent generic message with id %s to recipient %s",
        // messageId, recipientId);
    } else {
      // console.error("Unable to send message.");
      // console.error(response);
      // console.error(error);
    }
  });
}

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})