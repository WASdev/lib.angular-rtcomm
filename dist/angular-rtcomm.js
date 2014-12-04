/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Angular module for Rtcomm
 * @version v0.0.1 - 2014-12-04
 * @link https://github.com/WASdev/lib.angular-rtcomm
 * @author Brian Pulito <brian_pulito@us.ibm.com> (https://github.com/bpulito)
 */

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
	  
	  myEndpointProvider.setLogLevel('DEBUG');
	  /*
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
			 	},
			 	
		  'webrtc:disconnected' : function(eventObject) {
		 		$log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
		 		
		 		$rootScope.$evalAsync(
		 				function () {
		 					getSession(eventObject.endpoint.id).webrtcConnected = false;
			 				$rootScope.$broadcast(eventObject.eventName, eventObject);
		 				}
		            );
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
	  };

	  var initFailure = function(error) {
        $log.debug('<<------rtcomm-service------>> - Event: Provider init failed: error: ',error);
 		$rootScope.$evalAsync(
 				function () {
			        $rootScope.$broadcast('rtcomm::init', false, error);
			}
		);
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


/************* Endpoint Provider Directives *******************************/

/**
 * This directive is used to manage multiple sessions. If you are only supporting at most one session you wont need 
 * this directive. The associated template provides a way to switch between active sessions. The session must be in
 * the started state to be managed by this directive and is removed when the session stops.
 */
rtcommModule.directive('rtcommSessionmgr', ['RtcommService', '$log', function(RtcommService, $log) {
    return {
      restrict: 'E',
      templateUrl: 'templates/rtcomm/rtcomm-sessionmgr.html',
      controller: function ($scope, $rootScope) {

		$scope.sessions = [];
		$scope.sessMgrActiveEndpointUUID = null;
		$scope.publishPresence = false;
		$scope.sessionPresenceData = [];

		$scope.init = function(publishPresence) {
			$scope.publishPresence = publishPresence;
	    	$scope.updatePresence();
	  	};

	  	$scope.$on('endpointActivated', function (event, endpointUUID) {
        	//	Not to do something here to show that this button is live.
            $log.debug('rtcommSessionmgr: endpointActivated =' + endpointUUID);
            
            if ($scope.sessMgrActiveEndpointUUID != null){
            	var origSession = $scope.getSession($scope.sessMgrActiveEndpointUUID);
            	
            	if (origSession != null)
            		origSession.activated = false;
            }
        	
        	var newSession = $scope.getSession(endpointUUID);
       		newSession.activated = true;
       		newSession.remoteEndpointID = RtcommService.getEndpoint(endpointUUID).getRemoteEndpointID();
        	
        	$scope.sessMgrActiveEndpointUUID = endpointUUID;
        });
        
		$scope.$on('session:started', function (event, eventObject) {
            $log.debug('rtcommSessionmgr: session:started: uuid =' + eventObject.endpoint.id);

            var session = $scope.getSession(eventObject.endpoint.id);
            session.remoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
			
			$scope.sessions.push(session);
	    	$scope.updatePresence();
			
	        $rootScope.$broadcast('endpointActivated', eventObject.endpoint.id);
        });
		
		$scope.$on('session:failed', function (event, eventObject) {
			$scope.cleanupSession(eventObject.endpoint.id);
        });

		$scope.$on('session:rejected', function (event, eventObject) {
			$scope.cleanupSession(eventObject.endpoint.id);
        });


		$scope.$on('session:stopped', function (event, eventObject) {
			$scope.cleanupSession(eventObject.endpoint.id);
        });
		
        $scope.activateSession = function(endpointUUID) {
            $log.debug('rtcommSessionmgr: activateEndpoint =' + endpointUUID);
            if ($scope.sessMgrActiveEndpointUUID != endpointUUID){
	            $rootScope.$broadcast('endpointActivated', endpointUUID);
            }
        };
        
		$scope.cleanupSession = function(id){
			for	(var index = 0; index < $scope.sessions.length; index++) {
			    if($scope.sessions[index].endpointUUID === id){
		            RtcommService.getEndpoint(id).destroy();

			    	//	Remove the disconnected endpoint from the list.
			    	$scope.sessions.splice(index, 1);
			    	
			    	//	Now we need to set the active endpoint to someone else or to no endpoint if none are left.
			    	if ($scope.sessions.length != 0){
				        $rootScope.$broadcast('endpointActivated', $scope.sessions[0].endpointUUID);
			    	}
			    	else{
				        $rootScope.$broadcast('noEndpointActivated');
			    	}
			    	$scope.updatePresence();
			    	break;
			    }
			}
		};

        $scope.getSession = function(endpointUUID) {
        	var session = null;
			for	(var index = 0; index < $scope.sessions.length; index++) {
			    if($scope.sessions[index].endpointUUID === endpointUUID){
			    	session = $scope.sessions[index];
			    	break;
			    }
			}
			
			if (session == null){
	            session = {
						endpointUUID : endpointUUID,
						remoteEndpointID : null,
						activated : true
				};
			}
			
        	return (session);
        };
        
		$scope.updatePresence = function(){
			//	Update the presence record if enabled
			if ($scope.publishPresence == true){
				RtcommService.removeFromPresenceRecord ($scope.sessionPresenceData, false);
				
				$scope.sessionPresenceData = [{
					'name' : "sessions",
					'value' : String($scope.sessions.length)}];
				
				RtcommService.addToPresenceRecord ($scope.sessionPresenceData);
			}
		};
        
      },
      controllerAs: 'sessionmgr'
    };
}]);

/**
 * This directive is used to manage the registration of an endpoint provider. Since the registered name can only
 * be set on initialization of the endpoint provider, this directive actually controls the initialization of the
 * provider. Note that the endpoint provider must be initialized before any sessions can be created or received.
 */
rtcommModule.directive('rtcommRegister', ['RtcommService', '$log', function(RtcommService, $log) {
    return {
      restrict: 'E',
      templateUrl: 'templates/rtcomm/rtcomm-register.html',
      controller: function ($scope) {

    	$scope.nextAction = 'Register';

         $scope.onRegClick = function() {
          if ($scope.nextAction === 'Register'){
              $log.debug('Register: reguserid =' + $scope.reguserid);
              RtcommService.register($scope.reguserid);
          }
          else {
              $log.debug('Unregister: reguserid =' + $scope.reguserid);
              RtcommService.unregister();
          }
        };

        $scope.$on('rtcomm::init', function (event, success, details) {

			if (success == true){
				$scope.nextAction = 'Unregister';
				$scope.reguserid = details.userid;
			}
			else{
				$scope.nextAction = 'Register';
				
				if (details == 'destroyed')
					$scope.reguserid = null;
				else
					$scope.reguserid = 'Init failed:' +  details;
			}
        });
      },
      controllerAs: 'register'
    };
}]);

/**
 * This directive manages call queues. It provides the ability to display all the available queues
 * (along with their descriptions) and by clicking on a queue, allows an agent (or any type of user)
 * to subscribe on that queue.
 */
rtcommModule.directive('rtcommQueues', ['RtcommService', '$log', function(RtcommService, $log) {
	return {
		restrict : 'E',
		templateUrl : 'templates/rtcomm/rtcomm-queues.html',
		controller : function($scope) {
			$scope.rQueues = [];
			$scope.autoJoinQueues = false;
			$scope.queuePresenceData = [];
			$scope.queuePublishPresence = false;
			
			$scope.init = function(autoJoinQueues, queuePublishPresence) {
				$log.debug('rtcommQueues: autoJoinQueues = ' + autoJoinQueues);
				$scope.autoJoinQueues = autoJoinQueues;
				$scope.queuePublishPresence = queuePublishPresence;
    	  	};

			$scope.$on('queueupdate', function(event, queues) {
				$log.debug('rtcommQueues: scope queues', $scope.rQueues);
				Object.keys(queues).forEach(function(key) {
					$log.debug('rtcommQueues: Push queue: ' + queues[key]);
					$log.debug('rtcommQueues: autoJoinQueues: ' + $scope.autoJoinQueues);
					$scope.rQueues.push(queues[key]);
					
					// If autoJoin we go ahead and join the queue as soon as we get the queue update.
					if ($scope.autoJoinQueues == true){
						$scope.onQueueClick(queues[key]);
					}
				});
				
				$scope.updateQueuePresence();
			});
			
	        $scope.$on('rtcomm::init', function (event, success, details) {
				if (success == false){
					$log.debug('rtcommQueues: init: clear queues');
					$scope.rQueues = [];
				}
	        });

			$scope.onQueueClick = function(queue){
				$log.debug('rtcommQueues: onClick: TOP');
				for	(var index = 0; index < $scope.rQueues.length; index++) {
				    if($scope.rQueues[index].endpointID === queue.endpointID)
				    {
						$log.debug('rtcommQueues: onClick: queue.endpointID = ' + queue.endpointID);

						if (queue.active == false){
							RtcommService.joinQueue(queue.endpointID);
							$scope.rQueues[index].active = true;
						}
						else{
							RtcommService.leaveQueue(queue.endpointID);
							$scope.rQueues[index].active = false;
						}
				    }
				    else if (index == ($scope.rQueues.length - 1)){
						$log.debug('rtcommQueues: ERROR: queue.endpointID: ' + queue.endpointID + ' not found in list of queues');
				    	
				    }
				}
				
				$scope.updateQueuePresence();
			};
			
			$scope.updateQueuePresence = function(){
				//	Update the presence record if enabled
				if ($scope.queuePublishPresence == true){
					RtcommService.removeFromPresenceRecord ($scope.queuePresenceData, false);
					
					$scope.queuePresenceData = [];
					
					for	(var index = 0; index < $scope.rQueues.length; index++) {
					    if($scope.rQueues[index].active === true){
					    	$scope.queuePresenceData.push (
					    			{
					    				'name' : "queue",
										'value' : $scope.rQueues[index].endpointID	
					    			});
					    }
					}

					RtcommService.addToPresenceRecord ($scope.queuePresenceData);
				}
			};
		},
		controllerAs : 'queues'
	};
}]);

/**
 * This directive manages the chat portion of a session. The data model for chat
 * is maintained in the RtcommService. This directive handles switching between
 * active endpoints.
 * 
 * Here is the formate of the presenceData:
 * 
 * 		This is a Node:
 *  	                {
 *	                		"name" : "agents",
 *	                		"record" : false,
 *	                		"nodes" : []
 *	                	}
 *	                	
 *		This is a record with a set of user defines:
 *						{   	            
 *							"name" : "Brian Pulito",
 *    	    	            "record" : true,
 *   	                	"nodes" : [
 *									{
 *	                      				"name" : "queue",
 *	                      			    "value" : "appliances"
 *	                      			},
 *	                      			{
 *										"name" : "sessions",
 *	                      			    "value" : "3"
 *	                      			}
 *								]
 */

rtcommModule.directive("rtcommPresence", ['RtcommService', '$log', function(RtcommService, $log) {
    return {
      restrict: 'E',
      templateUrl: "templates/rtcomm/rtcomm-presence.html",
      controller: function ($scope, $rootScope) {
    	  
    	  $scope.monitorTopics = [];
    	  $scope.presenceData = [];
    	  
    	  $scope.treeOptions = {
  			    nodeChildren: "nodes",
  			    dirSelectable: true,
  			    injectClasses: {
  			        ul: "a1",
  			        li: "a2",
  			        liSelected: "a7",
  			        iExpanded: "a3",
  			        iCollapsed: "a4",
  			        iLeaf: "a5",
  			        label: "a6",
  			        labelSelected: "a8"
  			    }
      	  };   	  

    	  $scope.onCallClick = function(calleeEndpointID){
			  var endpoint = RtcommService.getEndpoint();
			  $rootScope.$broadcast('endpointActivated', endpoint.id);
			  endpoint.chat.enable();
			  endpoint.connect(calleeEndpointID);
    	  };
    	  
	      $scope.$on('rtcomm::init', function (event, success, details) {
	    	  RtcommService.publishPresence();
	    	  var presenceMonitor = RtcommService.getPresenceMonitor();
	    	  
	    	  presenceMonitor.on('updated', function(){
	              $scope.$apply();
	          });
	    	  
		      $scope.presenceData = presenceMonitor.getPresenceData();
		      for (var index = 0; index < $scope.monitorTopics.length; index++) {
		    	  $log.debug('rtcommPresence: monitorTopic: ' + $scope.monitorTopics[index]);
		    	  presenceMonitor.add($scope.monitorTopics[index]);
		      }
	      });

      },
	  controllerAs: 'presence'
    };
}]);

/********************** Endpoint Directives *******************************/

/**
 * This directive is a container for all the endpoint related directives. It provides some
 * control over the display of the container if that is needed but for the most part it is
 * needed for containment and layout of all the directives related to a single endpoint session.
 */
rtcommModule.directive('rtcommEndpoint', ['RtcommService', '$log', function(RtcommService, $log) {
    return {
        restrict: 'E',
        templateUrl: 'templates/rtcomm/rtcomm-endpoint.html',
        transclude: 'true', // Allows other directives to be contained by this one.
        controller: function ($scope) {

        	$scope.epActiveEndpointUUID = null; // Only define endpoint ID at the parent container. All other directives share this one.
        	$scope.displayEndpoint = true;

			$scope.init = function(displayEndpoint) {
			      $log.debug('rtcommEndpoint: displayEndoint = ' + displayEndpoint);
			      $scope.displayEndpoint = displayEndpoint;
      	  	};

			$scope.$on('endpointActivated', function (event, endpointUUID) {
			    $log.debug('endointActivated received: endpointID = ' + endpointUUID);
			    $scope.epActiveEndpointUUID = endpointUUID;
				$scope.displayEndpoint = true;
	        });

			$scope.$on('session:failed', function (event, eventObject) {
				if ($scope.epActiveEndpointUUID == eventObject.endpoint.id){
					$scope.displayEndpoint = false;
				}
	        });

			$scope.$on('session:rejected', function (event, eventObject) {
				if ($scope.epActiveEndpointUUID == eventObject.endpoint.id){
					$scope.displayEndpoint = false;
				}
	        });

			$scope.$on('session:stopped', function (event, eventObject) {
				if ($scope.epActiveEndpointUUID == eventObject.endpoint.id){
					$scope.displayEndpoint = false;
				}
	        });
        },
        controllerAs: 'endpoint'
      };
}]);

/**
 * This directive is used for all the controls related to a single endpoint session. This includes
 * the ability to disconnect the sesssion and the ability to enable A/V for sessions that don't start
 * with A/V. This directive also maintains the enabled and disabled states of all its related controls.
 * 
 * This endpoint controller only shows the active endpoint. The $scope.sessionState always contains the 
 * state of the active endpoint if one exist. It will be one of the following states:
 * 
 * 'session:alerting'
 * 'session:trying' 
 * 'session:ringing' 
 * 'session:queued' - for this one $scope.queueCount will tell you where you are in the queue.
 * 'session:failed' - for this one $scope.reason will tell you why the call failed.
 * 'session:started' 
 * 'session:stopped'
 * 
 * You can bind to $scope.sessionState to track state in the view.
 */
rtcommModule.directive('rtcommEndpointctrl', ['RtcommService', '$log', function(RtcommService, $log) {
    return {
        restrict: 'E',
        templateUrl: 'templates/rtcomm/rtcomm-endpointctrl.html',
        controller: function ($scope) {
        	
        	//	Session states.
        	$scope.epCtrlActiveEndpointUUID = null;
        	$scope.epCtrlAVConnected = false;
        	$scope.sessionState = 'session:stopped';
        	$scope.epCtrlRemoteEndpointID = null;
        	$scope.failureReason = '';
        	$scope.queueCount = 0;

			$scope.disconnect = function() {
				$log.debug('Disconnecting call for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
				RtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).disconnect();
        	};

			$scope.toggleAV = function() {
				$log.debug('Enable AV for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
				
				if ($scope.epCtrlAVConnected == false){
					RtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).webrtc.enable(function(value, message) {
		          		if (!value) {
		          			alertMessage('Failed to get local Audio/Video - nothing to broadcast');
		          		}
		          	});
				}
				else{
					$log.debug('Disable AV for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
					RtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).webrtc.disable();
				}
			};

			$scope.$on('session:started', function (event, eventObject) {
			    $log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);
				if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
					$scope.sessionState = 'session:started';
		        	$scope.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
				}
	        });

			$scope.$on('session:stopped', function (event, eventObject) {
			    $log.debug('session:stopped received: endpointID = ' + eventObject.endpoint.id);
				if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
					$scope.sessionState = 'session:stopped';
		        	$scope.epCtrlRemoteEndpointID = null;
				}
	        });

			$scope.$on('session:failed', function (event, eventObject) {
			    $log.debug('session:failed received: endpointID = ' + eventObject.endpoint.id);
				if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
					$scope.sessionState = 'session:failed';
					$scope.failureReason = eventObject.reason;
		        	$scope.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
				}
	        });

			$scope.$on('session:alerting', function (event, eventObject) {
			    $log.debug('session:alerting received: endpointID = ' + eventObject.endpoint.id);
				if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
					$scope.sessionState = 'session:alerting';
		        	$scope.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
				}
	        });

			$scope.$on('session:queued', function (event, eventObject) {
			    $log.debug('session:queued received: endpointID = ' + eventObject.endpoint.id);
				if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
					$scope.sessionState = 'session:queued';
		        	$scope.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
				}
	        });

			$scope.$on('session:trying', function (event, eventObject) {
			    $log.debug('session:trying received: endpointID = ' + eventObject.endpoint.id);
				if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
					$scope.sessionState = 'session:trying';
		        	$scope.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
				}
	        });

			$scope.$on('session:ringing', function (event, eventObject) {
			    $log.debug('session:ringing received: endpointID = ' + eventObject.endpoint.id);
				if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
					$scope.sessionState = 'session:ringing';
		        	$scope.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
				}
	        });

			$scope.$on('webrtc:connected', function (event, eventObject) {
	       		if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id)
					$scope.epCtrlAVConnected = true; 
	       	});
	       	
	       	$scope.$on('webrtc:disconnected', function (event, eventObject) {
	       		if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id)
					$scope.epCtrlAVConnected = false; 
	       	});
			
			
	       	$scope.$on('endpointActivated', function (event, endpointUUID) {
				$scope.epCtrlActiveEndpointUUID = endpointUUID;
				$scope.epCtrlAVConnected = RtcommService.isWebrtcConnected(endpointUUID);
				$scope.epCtrlRemoteEndpointID = RtcommService.getEndpoint(endpointUUID).getRemoteEndpointID();

				$scope.sessionState = RtcommService.getSessionState(endpointUUID);
	       	});
	       	
	       	$scope.$on('noEndpointActivated', function (event) {
				$scope.epCtrlAVConnected = false; 
				$scope.epCtrlRemoteEndpointID = null;

				$scope.sessionState = $scope.DISCONNECTED;
	       	});
	       	
        },
        controllerAs: 'endpointctrl'
      };
}]);

/**
 * This directive manages the WebRTC video screen, including both the self view and the remote view. It
 * also takes care of switching state between endpoints based on which endpoint is "actively" being viewed.
 */
rtcommModule.directive('rtcommVideo', ['RtcommService', '$log', function(RtcommService, $log) {
    return {
      restrict: 'E',
      templateUrl: 'templates/rtcomm/rtcomm-video.html',

  		controller: function ($scope) {

       	  $scope.videoActiveEndpointUUID = null;
          
       	  $scope.$on('endpointActivated', function (event, endpointUUID) {
          	//	Not to do something here to show that this button is live.
              $log.debug('rtcommEndpointmgr: endpointActivated =' + endpointUUID);

              if ($scope.videoActiveEndpointUUID != endpointUUID){
            	  $scope.videoActiveEndpointUUID = endpointUUID;
		          var endpoint = RtcommService.getEndpoint(endpointUUID);
		          
		          endpoint.webrtc.setLocalMedia(
		  	            { mediaOut: document.querySelector('#selfView'),
		  	              mediaIn: document.querySelector('#remoteView')});
              }
          });
      },
      controllerAs: 'video'
    };
}]);

/**
 * This directive manages the chat portion of a session. The data model for chat
 * is maintained in the RtcommService. This directive handles switching between
 * active endpoints.
 */
rtcommModule.directive("rtcommChat", ['RtcommService', '$log', function(RtcommService, $log) {
    return {
      restrict: 'E',
      templateUrl: "templates/rtcomm/rtcomm-chat.html",
      controller: function ($scope) {
		  $scope.chats = [];
		  $scope.chatActiveEndpointUUID = null;
		  
		  $scope.$on('endpointActivated', function (event, endpointUUID) {
			  $log.debug('rtcommChat: endpointActivated =' + endpointUUID);
                
			  //	The data model for the chat is maintained in the RtcommService.
			  $scope.chats = RtcommService.getChats(endpointUUID);
			  $scope.chatActiveEndpointUUID = endpointUUID;
	      });
		  
	      $scope.$on('noEndpointActivated', function (event) {
	    	  $scope.chats = [];
	    	  $scope.chatActiveEndpointUUID = null;
	      });
	       	
	      $scope.keySendMessage = function(keyEvent){
	    	  if (keyEvent.which === 13)
	    		  $scope.sendMessage();
	      };

		  $scope.sendMessage = function() {
	  		  var chat = {
  				  time : new Date(),
  				  name : RtcommService.getEndpoint($scope.chatActiveEndpointUUID).getLocalEndpointID(),
  				  message : angular.copy($scope.message)
	  		   };

	  		  RtcommService.sendChatMessage(chat, $scope.chatActiveEndpointUUID);
	  		  $scope.message = '';
	  		};

      },
	  controllerAs: 'chat'
    };
}]);

/******************************** Rtcomm Modals ************************************************/

/**
 * This is the controller for all Rtcomm modals.
 */
rtcommModule.controller('ModalController', ['$scope', 'close', '$log', function($scope, close, $log) {

	$scope.close = function(result) {
	 	close(result, 500); // close, but give 500ms for bootstrap to animate
	 };
}]);

/**
 * This model is displayed on receiving an inbound call. It handles the alerting event.
 * Note that it can also auto accept requests for enabling A/V.
 */
rtcommModule.directive('rtcommAlert', ['RtcommService', 'ModalService', '$log', function(RtcommService, ModalService, $log) {
    return {
      restrict: 'E',
      controller: function($scope, ModalService) {
		    $log.debug('RtcommAlertController starting');

		    $scope.alertingEndpointObject = null;
		    $scope.autoAnswerNewMedia = false;
		    $scope.alertActiveEndpointUUID = null;

			$scope.init = function(autoAnswerNewMedia) {
			      $log.debug('rtcommAlert: autoAnswerNewMedia = ' + autoAnswerNewMedia);
			      $scope.autoAnswerNewMedia = autoAnswerNewMedia;
    	  	};

    	  	$scope.showAlerting = function() {
				ModalService.showModal({
		    		      templateUrl: "templates/rtcomm/rtcomm-modal-alert.html",
		    		      controller: "ModalController"
		    		    }).then(function(modal) {
		    		      modal.element.modal();
		    		      modal.close.then(function(result) {
		   		            if (result === true) {
			   		            $log.debug('Accepting call from: ' + $scope.caller + ' for endpoint: ' + $scope.alertingEndpointObject.id);
			   		            $scope.alertingEndpointObject.accept();
		   		            }
		   		            else {
			   		            $log.debug('Rejecting call from: ' + $scope.caller + ' for endpoint: ' + $scope.alertingEndpointObject.id);
			   		            $scope.alertingEndpointObject.reject();
		   		            }
	   		            	$scope.alertingEndpointObject = null;
		    		      });
		   	    });

		   };

	       $scope.$on('endpointActivated', function (event, endpointUUID) {
                $scope.alertActiveEndpointUUID = endpointUUID;
	        });

	       	$scope.$on('session:alerting', function (event, eventObject) {
		    		
	       			if (($scope.alertActiveEndpointUUID == eventObject.endpoint.id && $scope.autoAnswerNewMedia == false) ||
	       					($scope.alertActiveEndpointUUID != eventObject.endpoint.id))
	       			{
	       				$log.debug('rtcommAlert: display alterting model: alertActiveEndpointUUID = ' + $scope.alertActiveEndpointUUID + 'autoAnswerNewMedia = ' + $scope.autoAnswerNewMedia);
			            $scope.caller = eventObject.endpoint.getRemoteEndpointID();
			            $scope.alertingEndpointObject = eventObject.endpoint;
			            $scope.showAlerting();
	       			}
	       			else{
	   		            $log.debug('Accepting call from: ' + eventObject.endpoint.getRemoteEndpointID() + ' for endpoint: ' + eventObject.endpoint.id);
	   		            eventObject.endpoint.accept();
	       			}
		        });
		},

		controllerAs : alert
    };
}]);

/**
 * This is the controller that displays the call modal from a menu or button click. Its designed to 
 * be used in situations where the callee is known during initialization. This would be the case where
 * a call is made to a queue instead of a person. Note that the call modal is currently disabled if there 
 * is an active session.
 */
rtcommModule.controller('RtcommCallModalController', ['$scope', '$log', function($scope, $log){

    $scope.displayCallModal = false;
    $scope.enableCallModel = false;
    $scope.name = null;

    $scope.onDisplayCallModal = function () {
		$log.debug('RtcommCallModalController: onDisplayCallModal');
        $scope.displayCallModal = true;
    };

    $scope.$on('rtcomm::init', function (event, success, details) {
		$log.debug('RtcommCallModalController: rtcomm::init: success = ' + success);
	   	 if (success == true)
	   		 $scope.enableCallModel = true;
	   	 else
	   		 $scope.enableCallModel = false;
   });
    
	$scope.$on('session:started', function (event, eventObject) {
	    $scope.enableCallModel = false;
    });

	$scope.$on('session:stopped', function (event, eventObject) {
	    $scope.enableCallModel = true;
    });
}]);

/**
 * This controller takes care of collecting the result and alias for the call modal.
 */
rtcommModule.controller('CallModalResultController', ['$scope', 'close', '$log', function($scope, close, $log){

    $scope.name = null;
	
	$scope.close = function(result) {
	 	close({name: $scope.name, result: result}, 500); // close, but give 500ms for bootstrap to animate
	 };

}]);

/**
 * This modal can be used to initiate a call to a static callID such as a call queue.
 */
rtcommModule.directive('rtcommCallModal', ['RtcommService', 'ModalService', '$log', function(RtcommService, ModalService, $log) {
    return {
      restrict: 'E',
      controller: function($scope, $rootScope, RtcommService, ModalService) {
		    $scope.calleeID = null;
		    $scope.callerID = null;

		    $scope.init = function(calleeID) {
			    $scope.calleeID = calleeID;
		    };

		    $scope.showCallModal = function() {
				ModalService.showModal({
		    		      templateUrl: "templates/rtcomm/rtcomm-modal-call.html",
		    		      controller: "CallModalResultController"
		    		    }).then(function(modal) {
		    		      modal.element.modal();
		    		      modal.close.then(function(result) {
		   		            if (result.result === true) {
			   		            $log.debug('rtcommCallModal: Calling calleeID: ' + $scope.calleeID);
			   		            $log.debug('rtcommCallModal: CallerID: ' + result.name);
			   		            
			   		            //	This is used to set an alias when the endoint is not defined.
			   		            if ($scope.callerID == null && (typeof result.name !== "undefined") && result.name != ''){
			   		            	$scope.callerID = result.name;
				   		            RtcommService.setAlias(result.name);
			   		            }

			   		            var endpoint = RtcommService.getEndpoint();
			   		            $rootScope.$broadcast('endpointActivated', endpoint.id);
			   		            endpoint.chat.enable();
		   		            	endpoint.connect($scope.calleeID);
		   		            }
	   		            	$scope.displayCallModal = false;
		    		      });
	    		    });
    		  };

              $scope.$watch('displayCallModal', function() {
          		$log.debug('watch: displayCallModal = ' + $scope.displayCallModal);
                  if ($scope.displayCallModal == true) {
                	  $scope.showCallModal();
                  }
             });
              
		}
   };
}]);

/********************************************* Rtcomm Controllers ******************************************************/

/**
 * This is the controller for config loader. It reads a JSON object and utilizes the RtcommService to set the configuration.
 * This can also result in the initialization of the endpoint provider if the config JSON object includes a registration name.
 * 
 * Here is an example of the config object:
 * 
 * {
 *  "server" : "server address",
 *	"port" : 1883,
 *	"rtcommTopicPath" : "/rtcomm-helpdesk/",
 *  "createEndpoint" : false,
 *  "userid" : "registration name",
 *	"broadcastAudio" : true,
 *	"broadcastVideo" : true
 * }
 * 
 * NOTE: If the user does not specify a userid, that says one will never be specified so go ahead
 * and initialize the endpoint provider and let the provider assign a name. If a defined empty
 * string is passed in, that means to wait until the end user registers a name before initializing
 * the endpoint provider.
 */
rtcommModule.controller('RtcommConfigController', ['$scope','$http', 'RtcommService', '$log', function($scope, $http, RtcommService, $log){

    $log.debug('RtcommConfigController: configURL = ' + $scope.configURL);

	$scope.setConfig = function(data) {
		$log.debug('RtcommConfigController: setting config data:' + data);
		RtcommService.setConfig(data);
  	};

  	$scope.init = function(configURL) {
			$log.debug('RtcommConfigController: initing configURL = ' + configURL);
			$scope.configURL = configURL;
			$scope.getConfig();
	  	};

	$scope.getConfig = function() {
		$http.get($scope.configURL).success (function(data){
			RtcommService.setConfig(data);
		});
	};
}]);

angular.module('angular-rtcomm').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/rtcomm-chat.html',
    "<div><div class=\"panel panel-primary vertical-stretch\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-comment\"></span> Chat</div><div class=\"panel-body\"><ul class=\"chat\"><li class=\"right clearfix\" ng-repeat=\"chat in chats\"><div class=\"header\"><strong class=\"primary-font\">{{chat.name}}</strong> <small class=\"pull-right text-muted\"><span class=\"glyphicon glyphicon-time\"></span>{{chat.time | date:'HH:mm:ss MM-dd-yyyy'}}</small></div><p>{{chat.message}}</p></li></ul></div><div class=\"panel-footer\"><div class=\"input-group\"><input id=\"chat-input\" type=\"text\" class=\"form-control input-sm\" placeholder=\"Type your message here...\" type=\"text\" ng-model=\"message\" ng-keypress=\"keySendMessage($event)\"> <span class=\"input-group-btn\"><button class=\"btn btn-primary btn-sm\" id=\"btn-chat\" ng-click=\"sendMessage()\" focusinput=\"true\" ng-disabled=\"(chatActiveEndpointUUID == null)\">Send</button></span></div></div></div></div><!-- chat list ng-controller div -->"
  );


  $templateCache.put('templates/rtcomm-endpoint.html',
    "<div id=\"endpointContainer\" class=\"panel panel-primary\"><div ng-transclude></div></div>"
  );


  $templateCache.put('templates/rtcomm-endpointctrl.html',
    "<div class=\"endpoint-controls\"><div class=\"btn-group pull-left\" style=\"padding: 10px\"><button id=\"btnDisconnectEndpoint\" class=\"btn btn-primary\" ng-click=\"disconnect()\" ng-disabled=\"(sessionState != 'session:started')\"><span class=\"glyphicon glyphicon glyphicon-resize-full\" aria-hidden=\"true\" aria-label=\"Disconnect\"></span> Disconnect</button> <button id=\"btnEnableAV\" class=\"btn btn-primary\" ng-click=\"toggleAV()\" focusinput=\"true\" ng-disabled=\"(sessionState != 'session:started')\"><span class=\"glyphicon glyphicon-facetime-video\" aria-hidden=\"true\" aria-label=\"Enable A/V\"></span> {{epCtrlAVConnected ? 'Disable A/V' : 'Enable A/V'}}</button></div><p class=\"endpoint-controls-title navbar-text pull-right\" ng-switch on=\"sessionState\"><span ng-switch-when=\"session:started\">Connected to {{epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:stopped\">Disconnected</span> <span ng-switch-when=\"session:alerting\">Inbound call from {{epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:trying\">Attempting to call {{epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:ringing\">Call to {{epCtrlRemoteEndpointID}} is ringing</span> <span ng-switch-when=\"session:queued\">Waiting in queue at: {{queueCount}}</span> <span ng-switch-when=\"session:failed\">Call failed with reason: {{failureReason}}</span></p></div>"
  );


  $templateCache.put('templates/rtcomm-modal-alert.html',
    "<div class=\"modal fade\"><div class=\"modal-dialog\"><div class=\"modal-content\"><div class=\"modal-header\"><button type=\"button\" class=\"close\" ng-click=\"close(false)\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button><h4 class=\"modal-title\">New call alert</h4></div><div class=\"modal-body\"><p>Do you want to accept a call from {{caller}}.</p></div><div class=\"modal-footer\"><button type=\"button\" ng-click=\"close(false)\" class=\"btn btn-default\" data-dismiss=\"modal\">No</button> <button type=\"button\" ng-click=\"close(true)\" class=\"btn btn-primary\" data-dismiss=\"modal\">Yes</button></div></div></div></div>"
  );


  $templateCache.put('templates/rtcomm-modal-call.html',
    "<div class=\"modal fade\"><div class=\"modal-dialog\"><div class=\"modal-content\"><div class=\"modal-header\"><button type=\"button\" class=\"close\" ng-click=\"close(false)\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button><h4 class=\"modal-title\">Get Help</h4></div><div class=\"modal-body\"><p>To help us serve you better, please provide some information before we begin.</p><form class=\"form-horizontal\" role=\"form\"><div class=\"form-group\"><label for=\"name\" class=\"col-sm-2 control-label\">Name</label><div class=\"col-sm-10\"><input type=\"text\" class=\"form-control\" id=\"name\" placeholder=\"Your Name\" ng-model=\"name\"></div></div></form></div><div class=\"modal-footer\"><button type=\"button\" ng-click=\"close(true)\" class=\"btn btn-default\" data-dismiss=\"modal\">Connect</button> <button type=\"button\" ng-click=\"close(false)\" class=\"btn btn-default\" data-dismiss=\"modal\">Cancel</button></div></div></div></div>"
  );


  $templateCache.put('templates/rtcomm-presence.html',
    "<!-- as an attribute --><div><div class=\"panel-presence panel-primary vertical-stretch\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-user\"></span> Presence</div><div class=\"panel-presence-body\"><div treecontrol class=\"tree-light\" tree-model=\"presenceData\" options=\"treeOptions\" on-selection=\"showSelected(node)\" selected-node=\"node1\"><button type=\"button\" class=\"btn btn-primary btn-xs\" aria-label=\"Left Align\" ng-show=\"(node.record && !node.self)\" ng-click=\"onCallClick(node.name)\"><span class=\"glyphicon glyphicon-facetime-video\" aria-hidden=\"true\" aria-label=\"expand record\"></span></button> {{node.name}} {{node.value ? ': ' + node.value : ''}}</div></div></div></div>"
  );


  $templateCache.put('templates/rtcomm-queues.html',
    "<div><div class=\"panel panel-primary\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-sort-by-attributes-alt\"></span> Queues</div><div class=\"queueContainer\"><button type=\"button\" ng-class=\"{'btn btn-primary btn-default btn-block': queue.active, 'btn btn-default btn-default btn-block': !queue.active}\" ng-repeat=\"queue in rQueues\" ng-click=\"onQueueClick(queue)\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"{{queue.description}}\">{{queue.active ? 'Leave' : 'Join'}} {{queue.endpointID}}</button></div></div></div>"
  );


  $templateCache.put('templates/rtcomm-register.html',
    "<div><div class=\"panel panel-primary\"><div class=\"input-group\"><input id=\"register-input\" type=\"text\" class=\"form-control input-sm\" placeholder=\"Enter your ID here...\" type=\"text\" ng-model=\"reguserid\"> <span class=\"input-group-btn\"><button class=\"btn btn-primary btn-sm\" id=\"btn-register\" ng-click=\"onRegClick(reguserid)\" focusinput=\"true\">{{nextAction}}</button></span></div></div></div>"
  );


  $templateCache.put('templates/rtcomm-sessionmgr.html',
    "<div class=\"session-manager\"><div class=\"btn-group pull-left\" style=\"padding: 10px\"><div><button type=\"button\" ng-switch on=\"session.activated\" ng-class=\"{'btn btn-primary': session.activated, 'btn btn-default': !session.activated}\" ng-repeat=\"session in sessions\" ng-click=\"activateSession(session.endpointUUID)\"><span class=\"glyphicon glyphicon-eye-open\" aria-hidden=\"true\" ng-switch-when=\"true\"></span> <span class=\"glyphicon glyphicon-eye-close\" aria-hidden=\"true\" ng-switch-when=\"false\"></span> Session with {{session.remoteEndpointID}}</button></div></div><p class=\"session-manager-title navbar-text pull-right\">Sessions</p></div>"
  );


  $templateCache.put('templates/rtcomm-video.html',
    "<div id=\"videoContainer\"><div id=\"selfViewContainer\"><video title=\"selfView\" id=\"selfView\" class=\"selfView\" autoplay muted></video></div><video title=\"remoteView\" id=\"remoteView\" class=\"remoteView\" autoplay></video><!--  video title=\"remoteView\" id=\"remoteView\" class=\"remoteView\" autoplay=\"true\" poster=\"../views/rtcomm/images/video_camera_big.png\"></video --></div>"
  );

}]);
