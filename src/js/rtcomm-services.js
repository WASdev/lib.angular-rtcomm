
/**
 * Definition for the rtcommModule
 */
var rtcommModule = angular.module('angular-rtcomm', ['ui.bootstrap','treeControl']);

/**
 * Set debugEnaled to true to enable the debug messages in this rtcomm angule module.
 */
rtcommModule.config(function($logProvider){
	$logProvider.debugEnabled(true);
});

rtcommModule.config(function($locationProvider) {
	$locationProvider.html5Mode(  {enabled: true,
		requireBase: false});
});

/**
 *
 */
rtcommModule.factory('RtcommConfig', function rtcommConfigFactory($location, $log, $window){

	//	First we check to see if the URL includes the query string disableRtcomm=true.
	//	This is typically done when a URL is being shared vian an iFrame that includes Rtcomm directives.
	//	If it is set we just return without setting up Rtcomm.
	$log.debug('RtcommConfig: Abs URL: ' + $location.absUrl());
	var _disableRtcomm = $location.search().disableRtcomm;
	if (typeof _disableRtcomm === "undefined" || _disableRtcomm === null) {
		_disableRtcomm = false;
  } else if (_disableRtcomm === "true") {
		_disableRtcomm = true;
  } else {
		_disableRtcomm = false;
  }

	$log.debug('RtcommConfig: _disableRtcomm = ' + _disableRtcomm);

	var providerConfig = {
			server : $location.host(),
			port : $location.port(),
			rtcommTopicPath : "/rtcomm/",
			createEndpoint : false,
			appContext: 'default',
      useSSL: false,
			userid: "",
			presence : {topic : ""}
	};

	$log.debug('providerConfig.server: ' + providerConfig.server);
	$log.debug('providerConfig.port: ' + providerConfig.port);

	var endpointConfig = {
			chat: true,
			webrtc: true
	};

	// Default to enabling audio and video. It must be disabled through config.
	var broadcastAudio = true;
	var broadcastVideo = true;
  var rtcommDebug = "DEBUG";
  var ringtone = null;
  var ringbacktone = null;

	var setConfig = function(config){
		providerConfig.server = (typeof config.server !== "undefined")? config.server : providerConfig.server;
		providerConfig.port = (typeof config.port !== "undefined")? config.port : providerConfig.port;
		providerConfig.rtcommTopicPath = (typeof config.rtcommTopicPath !== "undefined")? config.rtcommTopicPath : providerConfig.rtcommTopicPath;
		providerConfig.createEndpoint = (typeof config.createEndpoint !== "undefined")? config.createEndpoint : providerConfig.createEndpoint;
		providerConfig.appContext = (typeof config.appContext !== "undefined")? config.appContext : providerConfig.appContext;
		providerConfig.presence.topic = (typeof config.presenceTopic !== "undefined")? config.presenceTopic : providerConfig.presence.topic;

		providerConfig.useSSL = (typeof config.useSSL !== "undefined")? config.useSSL : providerConfig.useSSL; 
		//	Protocol related booleans
		endpointConfig.chat= (typeof config.chat!== "undefined")? config.chat: endpointConfig.chat;
		endpointConfig.webrtc = (typeof config.webrtc!== "undefined")? config.webrtc: endpointConfig.webrtc;

		broadcastAudio = (typeof config.broadcastAudio !== "undefined")? config.broadcastAudio: broadcastAudio;
		broadcastVideo = (typeof config.broadcastVideo !== "undefined")? config.broadcastVideo: broadcastVideo;

		ringbacktone = (typeof config.ringbacktone !== "undefined")? config.ringbacktone: null;
		ringtone = (typeof config.ringtone !== "undefined")? config.ringtone : null;

		rtcommDebug = (typeof config.rtcommDebug !== "undefined")? config.rtcommDebug: rtcommDebug;

	  $log.debug('rtcommDebug from config is: ' + config.rtcommDebug);

		if (typeof config.userid !== "undefined")
			providerConfig.userid = config.userid;

	  $log.debug('providerConfig is now: ', providerConfig);

	};

	return {
		setProviderConfig : function(config){setConfig(config);},

		getProviderConfig : function(){return providerConfig;},

		getWebRTCEnabled : function(){return endpointConfig.webrtc;},

		getChatEnabled : function(){return endpointConfig.chat;},

		getBroadcastAudio : function(){return broadcastAudio;},

		getBroadcastVideo : function(){return broadcastVideo;},

		getRingTone : function(){return ringtone;},

		getRingBackTone : function(){return ringbacktone;},

		getRtcommDebug: function(){return rtcommDebug;},

		isRtcommDisabled : function(){return _disableRtcomm;}
	};
});

rtcommModule.factory('RtcommService', function ($rootScope, RtcommConfig, $log, $http) {

	/** Setup the endpoint provider first **/
	var myEndpointProvider = new rtcomm.EndpointProvider();
	var endpointProviderInitialized = false;
	var queueList = null;
	var sessions = [];
	var presenceRecord = null;
	var karmaTesting = false;
	var _selfView = "selfView";		//	Default self view
	var _remoteView = "remoteView";	//	Default remote view

	myEndpointProvider.setLogLevel(RtcommConfig.getRtcommDebug());
  $log.debug('rtcomm-service - endpointProvider log level is: '+myEndpointProvider.getLogLevel());
  $log.debug('rtcomm-service - endpointProvider log level should be: '+RtcommConfig.getRtcommDebug());
	myEndpointProvider.setAppContext(RtcommConfig.getProviderConfig().appContext);

	var getPresenceRecord = function(){
		if (presenceRecord == null)
			presenceRecord = {'state': 'available', userDefines: []};

		return (presenceRecord);
	};

	//	This defines all the media related configuration and is controlled through external config.
	var getMediaConfig = function() {

		var mediaConfig = {
			  ringbacktone: RtcommConfig.getRingBackTone(),
			  ringtone: RtcommConfig.getRingTone(),
				broadcast : {
					audio : RtcommConfig.getBroadcastAudio(),
					video : RtcommConfig.getBroadcastVideo()
				},
				webrtc : RtcommConfig.getWebRTCEnabled(),
				chat : RtcommConfig.getChatEnabled(),
		}; 

		return (mediaConfig);		
	};


	myEndpointProvider.on('queueupdate', function(queuelist) {
		$log.debug('<<------rtcomm-service------>> - Event: queueupdate');
		$log.debug('queueupdate', queuelist);
		$rootScope.$evalAsync(
				function () {
					$rootScope.$broadcast('queueupdate', queuelist);
				}
		);
	});

	myEndpointProvider.on('newendpoint', function(endpoint) {
		$log.debug('<<------rtcomm-service------>> - Event: newendpoint remoteEndpointID: ' + endpoint.getRemoteEndpointID());

		endpoint.on('onetimemessage',function(event){
			$log.debug('<<------rtcomm-onetimemessage------>> - Event: ', event);
			if (event.onetimemessage.type != "undefined" && event.onetimemessage.type == 'iFrameURL'){
				var session = _createSession(event.endpoint.id);
				session.iFrameURL = event.onetimemessage.iFrameURL;
				$rootScope.$evalAsync(
						function () {
							$rootScope.$broadcast('rtcomm::iframeUpdate', event.endpoint.id, event.onetimemessage.iFrameURL);Well
						}
				);
			}
		});

		$rootScope.$evalAsync(
				function () {
					$rootScope.$broadcast('newendpoint', endpoint);
				}
		);
	});

	var callback = function(eventObject) {
		$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
		$rootScope.$evalAsync(
				function () {
					if (eventObject.eventName.indexOf("session:") > -1){
						var session = _createSession(eventObject.endpoint.id);
						session.sessionState = eventObject.eventName;
					}
					$rootScope.$broadcast(eventObject.eventName, eventObject);
				}
		);

		//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
		if (karmaTesting == true)
			$rootScope.$digest();

	};

	//	Setup all the callbacks here because they are all static.
	myEndpointProvider.setRtcommEndpointConfig ({
	  ringtone: RtcommConfig.getRingTone(),
	  ringbacktone: RtcommConfig.getRingBackTone(),
		// These are all the session related events.
		'session:started' : function(eventObject) {
			$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
			$rootScope.$evalAsync(
					function () {
						var session = _createSession(eventObject.endpoint.id);
						_setActiveEndpoint(eventObject.endpoint.id);

						session.sessionStarted = true;
						session.remoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
						$rootScope.$broadcast(eventObject.eventName, eventObject);
					}
			);

			//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
			if (karmaTesting == true)
				$rootScope.$digest();

		},

		'session:alerting' : callback,
		'session:trying' : callback,
		'session:ringing' : callback,
		'session:queued' : callback,

		'session:failed' : function(eventObject) { 
			$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
			$rootScope.$evalAsync(
					function () {
						_removeSession(eventObject.endpoint.id);
						$rootScope.$broadcast(eventObject.eventName, eventObject);
					}
			);
			//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
			if (karmaTesting == true)
				$rootScope.$digest();

		},

		'session:stopped' : function(eventObject) { 
			$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
			$rootScope.$evalAsync(
					function () {
						_removeSession(eventObject.endpoint.id);
						$rootScope.$broadcast(eventObject.eventName, eventObject);
					}
			);
			//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
			if (karmaTesting == true)
				$rootScope.$digest();

		},

		// These are all the WebRTC related events.
		'webrtc:connected' : function(eventObject) {
			$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());

			$rootScope.$evalAsync(
					function () {
						_createSession(eventObject.endpoint.id).webrtcConnected = true;
						$rootScope.$broadcast(eventObject.eventName, eventObject);
					}
			);
			//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
			if (karmaTesting == true)
				$rootScope.$digest();
		},

		'webrtc:disconnected' : function(eventObject) {
			$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());

			$rootScope.$evalAsync(
					function () {
						var session = _getSession(eventObject.endpoint.id);
						if (session != null)
							session.webrtcConnected = false;
						$rootScope.$broadcast(eventObject.eventName, eventObject);
					}
			);

			//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
			if (karmaTesting == true)
				$rootScope.$digest();
		},

		// These are all the chat related events.
		'chat:connected' : callback,
		'chat:disconnected' : callback,

		'chat:message' :  function(eventObject) { 
			$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
			$rootScope.$evalAsync(
					function () {
						var chat = {
								time : new Date(),
								name : eventObject.message.from,
								message : angular.copy(eventObject.message.message)
						};

						_createSession(eventObject.endpoint.id).chats.push(chat);
						$rootScope.$broadcast(eventObject.eventName, eventObject);
					}
			);

			//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
			if (karmaTesting == true)
				$rootScope.$digest();
		},

		// Endpoint destroyed
		'destroyed' : callback
	});

	var initSuccess = function(event) {
		$log.debug('<<------rtcomm-service------>> - Event: Provider init succeeded');

		if (presenceRecord != null){
			$log.debug('RtcommService: initSuccess: updating presence record');
			myEndpointProvider.publishPresence(presenceRecord);
		}

		$rootScope.$evalAsync(
				function () {
					var broadcastEvent = {
							'ready': event.ready,
							'registered': event.registered,
							'endpoint': event.endpoint,
							'userid' : RtcommConfig.getProviderConfig().userid
					};

					$rootScope.$broadcast('rtcomm::init', true, broadcastEvent);
				}
		);

		//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
		if (karmaTesting == true)
			$rootScope.$digest();
	};

	var initFailure = function(error) {
		$log.debug('<<------rtcomm-service------>> - Event: Provider init failed: error: ',error);
		$rootScope.$evalAsync(
				function () {
					$rootScope.$broadcast('rtcomm::init', false, error);
				}
		);
		//	This is required in karma to get the evalAsync to fire. Ugly but necessary...
		if (karmaTesting == true)
			$rootScope.$digest();
	};

	/*
	 * Get session from local endpoint ID
	 */
	var _getSession = function(endpointUUID){

		var session = null;

		for	(var index = 0; index < sessions.length; index++) {
			if(sessions[index].endpointUUID === endpointUUID){
				session = sessions[index];
				break;
			}
		}

		return (session);
	};

	/*
	 * Get session from local endpoint ID
	 */
	var _createSession = function(endpointUUID){

		var session = null;

		for	(var index = 0; index < sessions.length; index++) {
			if(sessions[index].endpointUUID === endpointUUID){
				session = sessions[index];
				break;
			}
		}

		if (session == null){
			session = {
					endpointUUID : endpointUUID,
					chats : [],
					webrtcConnected : false,
					sessionStarted : false,
					iFrameURL : 'about:blank',
					remoteEndpointID : null,
					activated : true,
					sessionState : 'session:stopped'
			};
			sessions[sessions.length] = session;
		}

		return (session);
	};

	var _removeSession = function(endpointUUID){

		for (var index = 0; index < sessions.length; index++) {
			if(sessions[index].endpointUUID === endpointUUID){

				_getEndpoint(endpointUUID).destroy();

				//	Remove the disconnected endpoint from the list.
				sessions.splice(index, 1);

				//	Now we need to set the active endpoint to someone else or to no endpoint if none are left.
				if (sessions.length == 0){
					$rootScope.$broadcast('noEndpointActivated');
				}
				else{
					_setActiveEndpoint(sessions[0].endpointUUID);
				}
				break;
			}
		}
	};


	var _getEndpoint = function(uuid) {
		var endpoint = null;

		if ((typeof uuid === "undefined") || uuid == null){
			$log.debug('getEndpoint: create new endpoint and setup onetimemessage event');
			endpoint = myEndpointProvider.createRtcommEndpoint();
			endpoint.on('onetimemessage',function(event){
				$log.debug('<<------rtcomm-onetimemessage------>> - Event: ', event);
				if (event.onetimemessage.type != "undefined" && event.onetimemessage.type == 'iFrameURL'){
					var session = _createSession(event.endpoint.id);

					session.iFrameURL = event.onetimemessage.iFrameURL;

					$rootScope.$evalAsync(
							function () {
								$rootScope.$broadcast('rtcomm::iframeUpdate', event.endpoint.id, event.onetimemessage.iFrameURL);
							}
					);
				}
			});				  
		}
		else
			endpoint = myEndpointProvider.getRtcommEndpoint(uuid);

		return (endpoint);
	};

	var _setActiveEndpoint = function(endpointID){

		// First get the old active endpoint
		var activeEndpoint = _getActiveEndpointUUID();
		if ((activeEndpoint != null) && (activeEndpoint != endpointID)){
			var session = _getSession(activeEndpoint);
			if (session != null)
				session.activated = false;
		}

		var session = _createSession(endpointID);
		session.activated = true;

		$rootScope.$broadcast('endpointActivated', endpointID);
	};

	var _getActiveEndpointUUID = function(){
		var activeEndpoint = null;

		for (var index = 0; index < sessions.length; index++) {
			if(sessions[index].activated == true){
				activeEndpoint = sessions[index].endpointUUID;
				break;
			}
		}
		return (activeEndpoint);
	};


	return {

		setKarmaTesting : function(){
			karmaTesting = true;
		},

		isInitialized : function(){
			return(endpointProviderInitialized);
		},

		setConfig : function(config){
			if (RtcommConfig.isRtcommDisabled() == true){
				$log.debug('RtcommService:setConfig: isRtcommDisabled = true; return with no setup');
				return;
			}


			$log.debug('rtcomm-services: setConfig: config: ', config);

			RtcommConfig.setProviderConfig(config);
			myEndpointProvider.setRtcommEndpointConfig(getMediaConfig());

			if (endpointProviderInitialized == false){
				//	If an identityServlet is defined we will get the User ID from the servlet.
				//	This is used when the user ID needs to be derived from an SSO token like LTPA.
				if (typeof config.identityServlet !== "undefined" && config.identityServlet != null){
					$http.get(config.identityServlet).success (function(data){

						if (typeof data.userid !== "undefined"){
							RtcommConfig.setProviderConfig(data);
							myEndpointProvider.init(RtcommConfig.getProviderConfig(), initSuccess, initFailure);
							endpointProviderInitialized = true;
						}
						else
							$log.error('RtcommService: setConfig promise: Invalid JSON object return from identityServlet: ', data);
					}).error(function(data, status, headers, config) {
						$log.debug('RtcommService: setConfig promise: error accessing userid from identityServlet: ' + status);
					});
				}
				else{
					// If the user does not specify a userid, that says one will never be specified so go ahead
					// and initialize the endpoint provider and let the provider assign a name. If a defined empty
					// string is passed in, that means to wait until the end user registers a name.
					if (typeof config.userid == "undefined" || RtcommConfig.getProviderConfig().userid != ''){
						myEndpointProvider.init(RtcommConfig.getProviderConfig(), initSuccess, initFailure);
						endpointProviderInitialized = true;
					}
				}
			}
		},

		// Presence related methods
		getPresenceMonitor:function(topic) {
			return myEndpointProvider.getPresenceMonitor(topic);
		},

		publishPresence:function() {
			if (endpointProviderInitialized == true)
				myEndpointProvider.publishPresence(getPresenceRecord());
		},

		/**
		 * userDefines is an array of JSON objects that look like:
		 * 
		 * 	{
		 * 		name : "some name",
		 * 		value : "some value"
		 *    }
		 *    
		 *    The only rule is that some name and some value have to both be strings.
		 */
		addToPresenceRecord:function(userDefines) {

			for (var index = 0; index < userDefines.length; index++) {
				getPresenceRecord().userDefines.push(userDefines[index]);
			}

			if (endpointProviderInitialized == true){
				$log.debug('RtcommService: addToPresenceRecord: updating presence record to: ', getPresenceRecord());
				myEndpointProvider.publishPresence(getPresenceRecord());
			}
		},

		/**
		 * userDefines is an array of JSON objects that look like:
		 * 
		 * 	{
		 * 		name : "some name",
		 * 		value : "some value"
		 *    }
		 *    
		 *    The only rule is that some name and some value have to both be strings.
		 */
		removeFromPresenceRecord:function(userDefines, doPublish) {

			for (var i = 0; i < userDefines.length; i++) {
				for (var j = 0; j < getPresenceRecord().userDefines.length; j++) {

					if (getPresenceRecord().userDefines[j].name == userDefines[i].name){
						getPresenceRecord().userDefines.splice(j,1);
						break;
					}
				}
			}

			if ((endpointProviderInitialized == true) && doPublish){
				$log.debug('RtcommService: removeFromPresenceRecord: updating presence record to: ', getPresenceRecord());
				myEndpointProvider.publishPresence(getPresenceRecord());
			}
		},

		setPresenceRecordState:function(state) {
			getPresenceRecord().state = state;
			return myEndpointProvider.publishPresence(getPresenceRecord());
		},

		// Endpoint related methods
		getEndpoint : function(uuid) {
			return(_getEndpoint(uuid));
		},

		destroyEndpoint : function(uuid) {
			myEndpointProvider.getRtcommEndpoint(uuid).destroy();
		},

		//	Registration related methods.
		register : function(userid) {
			if (endpointProviderInitialized == false){
				RtcommConfig.getProviderConfig().userid = userid;

				myEndpointProvider.init(RtcommConfig.getProviderConfig(), initSuccess, initFailure);
				endpointProviderInitialized = true;
			}
			else
				$log.error('rtcomm-services: register: ERROR: endpoint provider already initialized');
		},

		unregister : function() {
			if (endpointProviderInitialized == true){
				myEndpointProvider.destroy();
				endpointProviderInitialized = false;
				initFailure("destroyed");
			}
			else
				$log.error('rtcomm-services: unregister: ERROR: endpoint provider not initialized');
		},

		// Queue related methods
		joinQueue : function(queueID) {
			myEndpointProvider.joinQueue(queueID);
		},

		leaveQueue : function(queueID) {
			myEndpointProvider.leaveQueue(queueID);
		},

		getQueues : function() {
			return(queueList);
		},

		/**
		 * Chat related methods
		 */
		sendChatMessage : function(chat, endpointUUID){
			//	Save this chat in the local session store
			var session = _createSession(endpointUUID);
			session.chats.push(chat);

			myEndpointProvider.getRtcommEndpoint(endpointUUID).chat.send(chat.message);
		},

		getChats : function(endpointUUID) {
			if (typeof endpointUUID !== "undefined" && endpointUUID != null){
				var session = _getSession(endpointUUID);
				if (session != null)
					return (session.chats);
				else
					return(null);
			}
			else
				return(null);
		},

		isWebrtcConnected : function(endpointUUID) {
			if (typeof endpointUUID !== 'undefined' && endpointUUID != null){
				var session = _getSession(endpointUUID);
				if (session != null)
					return (session.webrtcConnected);
				else
					return(false);
			}
			else
				return(false);
		},

		getSessionState : function(endpointUUID) {
			if (typeof endpointUUID !== "undefined" && endpointUUID != null)
				return (myEndpointProvider.getRtcommEndpoint(endpointUUID).getState());
			else
				return ("session:stopped");
		},

		setAlias : function(aliasID) {
			if ((typeof aliasID !== "undefined") && aliasID != '')
				myEndpointProvider.setUserID(aliasID); 
		},

		setUserID : function(userID) {
			if ((typeof userID !== "undefined") && userID != ''){
				RtcommConfig.setProviderConfig({userid: userID});
				myEndpointProvider.init(RtcommConfig.getProviderConfig(), initSuccess, initFailure);
			}
		},

		setPresenceTopic : function(presenceTopic) {
			if ((typeof presenceTopic !== "undefined") && presenceTopic != ''){
				RtcommConfig.setProviderConfig({presenceTopic : presenceTopic});
				myEndpointProvider.init(RtcommConfig.getProviderConfig(), initSuccess, initFailure);
			}
		},

		getIframeURL : function(endpointUUID){
			if (typeof endpointUUID !== "undefined" && endpointUUID != null){
				var session = _getSession(endpointUUID);
				if (session != null)
					return (session.iFrameURL);
				else
					return(null);
			}
			else
				return(null);
		},

		putIframeURL : function(endpointUUID, newUrl){
			$log.debug('RtcommService: putIframeURL: endpointUUID: ' + endpointUUID + ' newURL: ' + newUrl);
			var endpoint = myEndpointProvider.getRtcommEndpoint(endpointUUID);

			if (endpoint != null){
				var session = _createSession(endpointUUID);
				session.iFrameURL = newUrl;

				var message = {	type : 'iFrameURL',
						iFrameURL : newUrl};

				$log.debug('RtcommService: putIframeURL: sending new iFrame URL');
				endpoint.sendOneTimeMessage(message);
			}
		},

		placeCall : function(calleeID, mediaToEnable){
			var endpoint = _getEndpoint();

			if (mediaToEnable.indexOf('chat') > -1)
				endpoint.chat.enable();

			if (mediaToEnable.indexOf('webrtc') > -1) {
					// Support turning off trickle ICE
				var trickleICE = true;
				if (mediaToEnable.indexOf('disableTrickleICE') > -1) {
					trickleICE = false;
				}
				endpoint.webrtc.enable({'trickleICE': trickleICE});
			}
			_setActiveEndpoint(endpoint.id);

			endpoint.connect(calleeID);
			return(endpoint.id);
		},

		getSessions : function(){
			return(sessions);
		},

		setActiveEndpoint : function(endpointID){
			_setActiveEndpoint(endpointID);
		},

		getActiveEndpoint : function(){
			return(_getActiveEndpointUUID());
		},

		getRemoteEndpoint : function(localEndpointID){
			var remoteEndpointID = null;

			if (localEndpointID != null){
				var session = _getSession(localEndpointID);

				if (session != null){
					remoteEndpointID = session.remoteEndpointID;
				}
			}

			return (remoteEndpointID);
		},

		setDefaultViewSelector : function() {
			_selfView = "selfView";
			_remoteView = "remoteView";
		},

		setViewSelector : function(selfView, remoteView) {
			_selfView = selfView;
			_remoteView = remoteView;
		},

		setVideoView : function(endpointUUID){
			$log.debug('rtcommVideo: setting local media');
			var endpoint = null;

			if (typeof endpointUUID != "undefined" &&  endpointUUID != null)
				endpoint = _getEndpoint(endpointUUID);
			else if (_getActiveEndpointUUID() != null)
				endpoint = _getEndpoint(_getActiveEndpointUUID());

			if (endpoint != null){

				endpoint.webrtc.setLocalMedia(
						{ 
							mediaOut: document.querySelector('#' + _selfView),
							mediaIn: document.querySelector('#' + _remoteView)
						});
			}
		},
	};
});
