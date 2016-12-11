'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const token = 'EAAZAdh4yZAgXcBAMdX9U6kUTd2Ow5oWyg6QMVy95UXvbnfALZCvovTiflTqHGhMChSqzdLyGWgIg1Sivp4dW8H5my5EIxt4TEZB3hchmNcDOkZBZBZC6aan9IVFhiVlYag6wRB6ZBsHlEFCpZAdAnCUSvLrXvF16AZC6U0Pf9pyqneuwZDZD'
app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.get('/', function (req, res) {
  res.send('test test')
})
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'EAAZAdh4yZAgXcBAMdX9U6kUTd2Ow5oWyg6QMVy95UXvbnfALZCvovTiflTqHGhMChSqzdLyGWgIg1Sivp4dW8H5my5EIxt4TEZB3hchmNcDOkZBZBZC6aan9IVFhiVlYag6wRB6ZBsHlEFCpZAdAnCUSvLrXvF16AZC6U0Pf9pyqneuwZDZD') {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})
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

function sendTextMessage (sender, text) {
  let messageData = { text: text }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: token},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: messageData
    }
  }, function (error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

function sendGenericMessage (sender) {
  let messageData = {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': [{
          'title': 'First card',
          'subtitle': 'Element #1 of an hscroll',
          'image_url': 'http://messengerdemo.parseapp.com/img/rift.png',
          'buttons': [{
            'type': 'web_url',
            'url': 'https://www.messenger.com',
            'title': 'web url'
          }, {
            'type': 'postback',
            'title': 'Postback',
            'payload': 'Payload for first element in a generic bubble'
          }]
        }, {
          'title': 'Second card',
          'subtitle': 'Element #2 of an hscroll',
          'image_url': 'http://messengerdemo.parseapp.com/img/gearvr.png',
          'buttons': [{
            'type': 'postback',
            'title': 'Postback',
            'payload': 'Payload for second element in a generic bubble'
          }]
        }]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: token},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: messageData
    }
  }, function (error, response, body) {
    if (error) {
      console.log('Error sending messages: ', error)
    } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}

app.listen(app.get('port'), function () {
  console.log('running on port', app.get('port'))
})
