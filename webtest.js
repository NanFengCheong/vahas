// initialize everything, web server, socket.io, filesystem, johnny-five
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url')
  , five = require("johnny-five")
  , mysql = require('mysql')
  , connectionsArray = []
  , connection = mysql.createConnection({
    host: 'localhost',
    user: 'dbuser',
    password: 'dbpass',
    database: 'nodejs',
    port: 3306
  })
  , POLLING_INTERVAL = 500
  , pollingTimer
  , board1, board2,
  servo,
  led, led1, led2, led3, led4, led5,
  sensor1, sensor2, sensor3, sensor4, sensor5;

// If there is an error connecting to the database
connection.connect(function(err) {
  // connected! (unless `err` is set)
  if (err) {
    console.log(err);
  }
});

var uno = new five.Board({ port: "COM7" });
//uno2 = new five.Board();
// on board ready
uno.on("ready", function() {

  // init a led on pin 13, strobe every 1000ms
  led = new five.Led(13).strobe(1000);

  led1 = new five.Led(2);
  led2 = new five.Led(3);
  led3 = new five.Led(4);
  led4 = new five.Led(5);
  led5 = new five.Led(6);

  // setup a stanard servo, center at start
  servo = new five.Servo({
    pin:10,
    range: [0,180],
    type: "standard",
    center:true
  });

  // poll this sensor every second
  sensor1 = new five.Sensor({
    pin: "A0",
    freq: 1000
  });

  sensor2 = new five.Sensor({
    pin: "A1",
    freq: 1000
  });

});




// handle web server
function handler (req, res) {
   var path = url.parse(req.url).pathname;
    var fsCallback = function(error, data) {
        if(error) throw error;

        res.writeHead(200);
        res.write(data);
        res.end();
    }

    switch(path) {
        case '/client':
            doc = fs.readFile(__dirname + '/client.html', fsCallback);
        break;
        default:
            doc = fs.readFile(__dirname + '/index.html', fsCallback);
        break;
    }
  }

// make web server listen on port 80
app.listen(8080);

var pollingLoop = function() {

  // Doing the database query
  var query = connection.query('SELECT * FROM users'),
    users = []; // this array will contain the result of our db query

  // setting the query listeners
  query
    .on('error', function(err) {
      // Handle error, and 'end' event will be emitted after this as well
      console.log(err);
      updateSockets(err);
    })
    .on('result', function(user) {
      // it fills our array looping on each user row inside the db
      users.push(user);
    })
    .on('end', function() {
      // loop on itself only if there are sockets still connected
      if (connectionsArray.length) {

        pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);

        updateSockets({
          users: users
        });
      } else {

        console.log('The server timer was stopped because there are no more socket connections on the app')

      }
    });
};

var sensor1tmp;
// on a socket connection
io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
 
  // if board is ready
  if(uno.isReady){
    // read in sensor data, pass to browser
    sensor1.on("data",function(){
      if(this.value>336)
        led1.on();
      else
        led1.off();
      //check if sensor1's value changed 
      //if changed, perform 

      if(sensor1tmp != this.value) { 
        socket.emit('sensor1', { raw: this.value }); } 
        sensor1tmp = this.value;
    });
  }

  // if servo message received
  socket.on('servo', function (data) {
    console.log(data);
    if(uno.isReady){ servo.to(data.pos);  }
  });
  

  // if led message received
  socket.on('led1on', function () {
     if(uno.isReady){  led1.on(); } 
  });
    socket.on('led1off', function () {
     if(uno.isReady){    led1.off(); } 
  });

  // if led message received
  socket.on('led2on', function () {
     if(uno.isReady){    led2.on(); } 
  });
  socket.on('led2off', function () {
     if(uno.isReady){    led2.off(); } 
  });

  // if led message received
  socket.on('led3on', function () {
     if(uno.isReady){    led3.on(); } 
  });
  socket.on('led3off', function () {
     if(uno.isReady){    led3.off(); } 
  });

  // if led message received
  socket.on('led4on', function () {
     if(uno.isReady){    led4.on(); } 
  });
    socket.on('led4off', function () {
     if(uno.isReady){    led4.off(); } 
  });

  // if led message received
  socket.on('led5on', function () {
     if(uno.isReady){    led5.on(); } 
  });
    socket.on('led5off', function () {
     if(uno.isReady){    led5.off(); } 
  });

  // if led message received
  socket.on('led', function (data) {
    console.log(data);
     if(uno.isReady){    led.strobe(data.delay); } 
  });

});