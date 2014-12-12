
/**
 * Definition for the rtcommModule
 */
var rtcommModule = angular.module('angular-rtcomm', ['angularModalService','ui.bootstrap','treeControl']);

/**
 * Set debugEnaled to true to enable the debug messages in this rtcomm angule module.
 */
rtcommModule.config(function($logProvider){
	  $logProvider.debugEnabled(true);
	});

/**
 *
 */
rtcommModule.factory('RtcommConfig', function rtcommConfigFactory(){

	var providerConfig = {
		    server : 'svt-msd4.rtp.raleigh.ibm.com',
		    port : 1883,
	    	rtcommTopicPath : "/rtcomm/",
		    createEndpoint : false,
            appContext: 'rtcommHelpdesk',
            userid: "",
            presence : {topic : ""}
		  };

	  var endpointConfig = {
	          chat: true,
	          webrtc: true
	        };
	  
	  var broadcastAudio = false;
	  var broadcastVideo = false;

	return {
		setConfig : function(config){
			providerConfig.server = (typeof config.server !== "undefined")? config.server : providerConfig.server;
			providerConfig.port = (typeof config.port !== "undefined")? config.port : providerConfig.port;
			providerConfig.rtcommTopicPath = (typeof config.rtcommTopicPath !== "undefined")? config.rtcommTopicPath : providerConfig.rtcommTopicPath;
			providerConfig.createEndpoint = (typeof config.createEndpoint !== "undefined")? config.createEndpoint : providerConfig.createEndpoint;
			providerConfig.appContext = (typeof config.appContext !== "undefined")? config.appContext : providerConfig.appContext;
			providerConfig.presence.topic = (typeof config.presenceTopic !== "undefined")? config.presenceTopic : providerConfig.presence.topic;

			//	Protocol related booleans
			endpointConfig.chat= (typeof config.chat!== "undefined")? config.chat: endpointConfig.chat;
			endpointConfig.webrtc = (typeof config.webrtc!== "undefined")? config.webrtc: endpointConfig.webrtc;
			
			broadcastAudio = (typeof config.broadcastAudio !== "undefined")? config.broadcastAudio: broadcastAudio;
			broadcastVideo = (typeof config.broadcastVideo !== "undefined")? config.broadcastVideo: broadcastVideo;

			if (typeof config.userid !== "undefined")
				providerConfig.userid = config.userid;
		},

		getProviderConfig : function(){return providerConfig;},

		getWebRTCEnabled : function(){return endpointConfig.webrtc;},

		getChatEnabled : function(){return endpointConfig.chat;},

		getBroadcastAudio : function(){return broadcastAudio;},

		getBroadcastVideo : function(){return broadcastVideo;}
	};
});

rtcommModule.factory('RtcommService', function ($rootScope, RtcommConfig, $log) {

	  /** Setup the endpoint provider first **/
	  var myEndpointProvider = new ibm.rtcomm.RtcommEndpointProvider();
	  var endpointProviderInitialized = false;
	  var queueList = null;
	  var sessions = [];
	  var presenceRecord = null;
	  var karmaTesting = false;
	  
	  /*
	  myEndpointProvider.setLogLevel('DEBUG');
	  myEndpointProvider.setLogLevel('MESSAGE');
	  */

	  myEndpointProvider.setAppContext(RtcommConfig.getProviderConfig().appContext);
	  
	  var getPresenceRecord = function(){
		  if (presenceRecord == null)
			  presenceRecord = {'state': 'available', userDefines: []};
		  
		  return (presenceRecord);
	  };
	  
	   //	This defines all the media related configuration and is controlled through external config.
	   var getMediaConfig = function() {
		   
		  var mediaConfig = {
				  
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
		 				$rootScope.$broadcast(eventObject.eventName, eventObject);
	 				}
	            );
	 		
	 		//	This is required in karma to get the evalAsync to fire. Ugly be necessary...
	 		if (karmaTesting == true)
	 			 $rootScope.$digest();

	 	};
	 
	 //	Setup all the callbacks here because they are all static.
	 myEndpointProvider.setRtcommEndpointConfig ({
	
		  // These are all the session related events.
		  'session:started' : function(eventObject) {
		 		$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
		 		$rootScope.$evalAsync(
		 				function () {
		 					getSession(eventObject.endpoint.id).sessionStarted = true;
			 				$rootScope.$broadcast(eventObject.eventName, eventObject);
		 				}
		            );
		 		
		 		//	This is required in karma to get the evalAsync to fire. Ugly be necessary...
		 		if (karmaTesting == true)
		 			 $rootScope.$digest();

			 },

		  'session:alerting' : callback,
		  'session:trying' : callback,
		  'session:ringing' : callback,
		  'session:queued' : callback,
		  'session:failed' : callback,
		  
		  'session:stopped' : function(eventObject) { 
	  	 		$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
		 		$rootScope.$evalAsync(
		 				function () {
				  	 		//	Clean up existing data related to this session.
				  	 		if (eventObject.endpoint.id in sessions)
				  	 			delete sessions[eventObject.endpoint.id];
					 		
				  	 		$rootScope.$broadcast(eventObject.eventName, eventObject);
		 				}
		 			);
		 		//	This is required in karma to get the evalAsync to fire. Ugly be necessary...
		 		if (karmaTesting == true)
		 			 $rootScope.$digest();

			  },
		  
		  // These are all the WebRTC related events.
		  'webrtc:connected' : function(eventObject) {
		 		$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
		 		
		 		$rootScope.$evalAsync(
		 				function () {
		 					getSession(eventObject.endpoint.id).webrtcConnected = true;
			 				$rootScope.$broadcast(eventObject.eventName, eventObject);
		 				}
		            );
			 		//	This is required in karma to get the evalAsync to fire. Ugly be necessary...
			 		if (karmaTesting == true)
			 			 $rootScope.$digest();
			 	},
			 	
		  'webrtc:disconnected' : function(eventObject) {
		 		$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
		 		
		 		$rootScope.$evalAsync(
		 				function () {
		 					getSession(eventObject.endpoint.id).webrtcConnected = false;
			 				$rootScope.$broadcast(eventObject.eventName, eventObject);
		 				}
		            );
		 		
			 		//	This is required in karma to get the evalAsync to fire. Ugly be necessary...
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
					  		
					  		getSession(eventObject.endpoint.id).chats.push(chat);
					 		$rootScope.$broadcast(eventObject.eventName, eventObject);
	 				}
	 			);
	 		
	 		//	This is required in karma to get the evalAsync to fire. Ugly be necessary...
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
 		 
 		//	This is required in karma to get the evalAsync to fire. Ugly be necessary...
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
 		//	This is required in karma to get the evalAsync to fire. Ugly be necessary...
 		if (karmaTesting == true)
 			 $rootScope.$digest();
     };
     
     var getSession = function(endpointUUID){
    	 
    	 if (endpointUUID in sessions)
    		 return (sessions[endpointUUID]);
    	 else{
    		 var session = {
    			chats : [],
    			webrtcConnected : false,
    			sessionStarted : false
    		 };
    		 sessions[endpointUUID] = session;
    		 return (session);
    	 }
     };

	  return {
			setKarmaTesting : function(){
				karmaTesting = true;
			},

			isInitialized : function(){
				return(endpointProviderInitialized);
			},

			setConfig : function(config){
				$log.debug('rtcomm-services: setConfig: config: ', config);
				
				RtcommConfig.setConfig(config);
				myEndpointProvider.setRtcommEndpointConfig(getMediaConfig());

				if (endpointProviderInitialized == false){
					// If the user does not specify a userid, that says one will never be specified so go ahead
					// and initialize the endpoint provider and let the provider assign a name. If a defined empty
					// string is passed in, that means to wait until the end user registers a name.
					if (typeof config.userid == "undefined" || RtcommConfig.getProviderConfig().userid != ''){
						  myEndpointProvider.init(RtcommConfig.getProviderConfig(), initSuccess, initFailure);
						  endpointProviderInitialized = true;
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
			  var endpoint = null;

			  if ((typeof uuid === "undefined") || uuid == null)
				  endpoint = myEndpointProvider.createRtcommEndpoint();
			  else
				  endpoint = myEndpointProvider.getRtcommEndpoint(uuid);
				  
			  return (endpoint);
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
			var session = getSession(endpointUUID);
			session.chats.push(chat);
			
			myEndpointProvider.getRtcommEndpoint(endpointUUID).chat.send(chat.message);
		},
			
		getChats : function(endpointUUID) {
			var session = getSession(endpointUUID);
			if (session != null)
				return (session.chats);
			else
				return(null);
		},

		isWebrtcConnected : function(endpointUUID) {
			var session = getSession(endpointUUID);
			if (session != null)
				return (session.webrtcConnected);
			else
				return(false);
		},

		getSessionState : function(endpointUUID) {
			return (myEndpointProvider.getRtcommEndpoint(endpointUUID).getState());
		},
		
		setAlias : function(aliasID) {
			if ((typeof aliasID !== "undefined") && aliasID != '')
				myEndpointProvider.setUserID(aliasID); 
		}
	  };
});
