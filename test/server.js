var mosca = require('mosca');

var settings = {
  logger: {
    level: 'info'
  },
  persistence: {
    factory: mosca.persistence.Memory
  },
  port: 1883,
  http: {
    port: 8083,
    static: './',
    bundle: true
  }

};

var server = new mosca.Server(settings);
server.on('ready', setup);

function setup() {

  console.log('Mosca Broker and Web Server are up and running!');
  console.log('MQTT Websocket Port: 8083');
  console.log('Hostname: localhost');
}
