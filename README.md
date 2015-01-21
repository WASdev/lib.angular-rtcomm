lib.angular-rtcomm
==================
This repository contains the Rtcomm Angular.js module. The Rtcomm Angular module exposes a set of real-time communication features in the form of a set of AngularJS directives. 
These directives are built on the [rtcomm.js](https://github.com/WASdev/lib.rtcomm.clientjs) open source JavaScript library which wraps [WebRTC](http://www.webrtc.org/) with call 
signaling and a number of advanced real-time communications capabilities like presence and chat.

##Requirements
Rtcomm utilizes MQTT for call signaling so at a minimum you will need an MQTT message broker that supports web sockets. There are many open source versions of MQTT message brokers
available. Another option is to download the [WebSphere Liberty Server](https://developer.ibm.com/wasdev/downloads/liberty-profile-beta/) 
which includes an embedded MQTT broker and a number of backend Rtcomm services such as call queueing. The WebSphere Liberty server is free for development.

##Install
To install the angular-rtcomm module for use in an AngularJS application, you can use bower:

**bower install angular-rtcomm**

##Build
To modify build the angular-rtcomm module, you can use npm:

This is useful if you want to modify the angular-rtcomm templates.

##Use
To use the module, you will need to include the following js and css files with your project:

	<script	src="bower_components/angular-rtcomm/dist/angular-rtcomm.js"></script>
	<link href="bower_components/angular-rtcomm/dist/css/angular-rtcomm.css" rel="stylesheet">
	
Minified versions are also available.

##List of AngularJS directives
Here is a complete list of all the currently supported directives and controllers:

Directives:

Directive used to register an endpoint with a backend Rtcomm service (only needed when working with WebSphere): 
```html
<rtcomm-register></rtcomm-register>
```

Directive used to view and join any available call queue. Can be used by helpdesk agents (only availble when working with WebSphere): 
```html
<rtcomm-queues>
```

Directive used to view presence information: 
```html
<rtcomm-presence>
```

Directive used to contain a single endpoint and all its related media sessions: 
```html
<rtcomm-endpoint>
```

Directive used to display a chat window: 
```html
<rtcomm-chat>
```

Directive that contains a WebRTC video window (both self and remote views): 
```html
<rtcomm-video>
```

Directive that contains all the controls for an endpoint (disconnect, enable A/V): 
```html
<rtcomm-endpointctrl>
```

Directive that manages multiple endpoints and their associated sessions. For instance, used by a helpdesk agent to manage multiple sessions: 
```html
<rtcomm-sessionmgr>
```

Controllers:

This controller can read configuration from a specified JSON file:
**RtcommConfigController**

This controller displays the alerting modal which allows the user to accept or reject an inbound call:
**RtcommAlertModalController**

This controller displays an outbound call modal:
**RtcommCallModalController** 

