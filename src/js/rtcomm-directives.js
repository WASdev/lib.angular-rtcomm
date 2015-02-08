
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
      controller: function ($scope) {

		$scope.sessions = RtcommService.getSessions();
		$scope.sessMgrActiveEndpointUUID = RtcommService.getActiveEndpoint();
		$scope.publishPresence = false;
		$scope.sessionPresenceData = [];

		$scope.init = function(publishPresence) {
			$scope.publishPresence = publishPresence;
	    	$scope.updatePresence();
	  	};

	  	$scope.$on('endpointActivated', function (event, endpointUUID) {
        	//	Not to do something here to show that this button is live.
            $log.debug('rtcommSessionmgr: endpointActivated =' + endpointUUID);
        	$scope.sessMgrActiveEndpointUUID = endpointUUID;
        });
        
		$scope.$on('session:started', function (event, eventObject) {
            $log.debug('rtcommSessionmgr: session:started: uuid =' + eventObject.endpoint.id);

	    	$scope.updatePresence();
	    	RtcommService.setActiveEndpoint(eventObject.endpoint.id);
        });
		
        $scope.activateSession = function(endpointUUID) {
            $log.debug('rtcommSessionmgr: activateEndpoint =' + endpointUUID);
            if ($scope.sessMgrActiveEndpointUUID != endpointUUID){
		    	RtcommService.setActiveEndpoint(endpointUUID);
            }
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
			$scope.queueFilter = null;
			
			/**
			 * autoJoinQueues - automatically join any queues that are not filtered out
			 * queuePublishedPresence - will add to the presence document information about what queues this person joins.
			 * queueFilter - If defined, this specifies which queues should be joined. All others will be ignored. 
			 */
			$scope.init = function(autoJoinQueues, queuePublishPresence, queueFilter) {
				$log.debug('rtcommQueues: autoJoinQueues = ' + autoJoinQueues);
				$scope.autoJoinQueues = autoJoinQueues;
				$scope.queuePublishPresence = queuePublishPresence;
				
				if (typeof queueFilter !== "undefined")
					$scope.queueFilter = queueFilter;
    	  	};

			$scope.$on('queueupdate', function(event, queues) {
				$log.debug('rtcommQueues: scope queues', $scope.rQueues);
				
				Object.keys(queues).forEach(function(key) {
					$log.debug('rtcommQueues: Push queue: ' + queues[key]);
					$log.debug('rtcommQueues: autoJoinQueues: ' + $scope.autoJoinQueues);
					
					//	Check to make sure queue is not filteres out before adding it.
					if ($scope.filterOutQueue(queues[key]) == false){
						$scope.rQueues.push(queues[key]);
						
						// If autoJoin we go ahead and join the queue as soon as we get the queue update.
						if ($scope.autoJoinQueues == true){
							$scope.onQueueClick(queues[key]);
						}
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
	        
	        //
			$scope.filterOutQueue = function(queue){
				var returnValue = true;
				
				if ($scope.queueFilter != null){

					for (var index = 0; index < $scope.queueFilter.length; ++index) {
					    var entry = $scope.queueFilter[index];
					    if (entry == queue.endpointID) {
					    	returnValue = false;
					        break;
					    }
					}
				}
				else
					returnValue = false;
				
				return (returnValue);
			};

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
    	  $scope.expandedNodes = [];
    	  
    	  // Default protocol list initiated from presence. Start with chat only.
    	  $scope.protocolList = {
    			  			chat : true,
    			  			webrtc : false};
    	  
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

    	  $scope.init = function(protocolList) {
    		  $scope.protocolList = protocolList;
		  };

    	  $scope.onCallClick = function(calleeEndpointID){
			  var endpoint = RtcommService.getEndpoint();
			  RtcommService.setActiveEndpoint(endpoint.id);
			  
			  if ($scope.protocolList.chat == true)
				  endpoint.chat.enable();
			  
			  if ($scope.protocolList.webrtc == true){
					endpoint.webrtc.enable(function(value, message) {
		          		if (!value) {
		          			alertMessage('Failed to get local Audio/Video - nothing to broadcast');
		          		}
		          	});				  
			  }

			  endpoint.connect(calleeEndpointID);
    	  };
    	  
	      $scope.$on('rtcomm::init', function (event, success, details) {
	    	  RtcommService.publishPresence();
	    	  var presenceMonitor = RtcommService.getPresenceMonitor();
	    	  
	    	  presenceMonitor.on('updated', function(){
					$log.debug('<<------rtcommPresence: updated------>>');
	    		  	$scope.$apply();
	    	  });
	    	  
		      $scope.presenceData = presenceMonitor.getPresenceData();

		      if ($scope.presenceData.length >= 1)
		    	  $scope.expandedNodes.push($scope.presenceData[0]);
		      
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

        	$scope.epActiveEndpointUUID = RtcommService.getActiveEndpoint();
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
        	$scope.epCtrlActiveEndpointUUID = RtcommService.getActiveEndpoint();
        	$scope.epCtrlAVConnected = RtcommService.isWebrtcConnected($scope.epCtrlActiveEndpointUUID);
        	$scope.epCtrlRemoteEndpointID = RtcommService.getRemoteEndpoint($scope.epCtrlActiveEndpointUUID);
        	$scope.sessionState = RtcommService.getSessionState($scope.epCtrlActiveEndpointUUID);;
        	$scope.failureReason = '';
        	$scope.queueCount = 0;	// FIX: Currently not implemented!
        	$scope.controlEnableAV = true;
        	$scope.controlDisconnect = true;
        	
			$scope.init = function(controlEnableAV,controlDisconnect) {
				if (typeof controlEnableAV !== "undefined")
					$scope.controlEnableAV = controlEnableAV;
				
				if (typeof controlDisconnect !== "undefined")
					$scope.controlDisconnect = controlDisconnect;
    	  	};

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

				$scope.sessionState = 'session:stopped';
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

       	  $scope.videoActiveEndpointUUID = RtcommService.getActiveEndpoint();
       	  
       	  if (typeof $scope.videoActiveEndpointUUID !== "undefined" && $scope.videoActiveEndpointUUID != null){
              $log.debug('rtcommVideo: setting local media');
	          var endpoint = RtcommService.getEndpoint($scope.videoActiveEndpointUUID);
	          
	          endpoint.webrtc.setLocalMedia(
	  	            { mediaOut: document.querySelector('#selfView'),
	  	              mediaIn: document.querySelector('#remoteView')});
       	  }
          
       	  $scope.$on('endpointActivated', function (event, endpointUUID) {
          	//	Not to do something here to show that this button is live.
              $log.debug('rtcommVideo: endpointActivated =' + endpointUUID);

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
		  $scope.chatActiveEndpointUUID = RtcommService.getActiveEndpoint();
		  $scope.chats = RtcommService.getChats($scope.chatActiveEndpointUUID);
		  
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

/**
 * This directive manages the shared iFrame.
 */
rtcommModule.directive("rtcommIframe", ['RtcommService', '$log', '$sce', '$location', '$window', function(RtcommService, $log, $sce, $location, $window) {
    return {
      restrict: 'E',
      templateUrl: "templates/rtcomm/rtcomm-iframe.html",
      controller: ["$scope", function ($scope) {
		  $scope.iframeActiveEndpointUUID = RtcommService.getActiveEndpoint();
		  $scope.iframeURL = null;
		  $scope.initiframeURL = null;
		  $scope.syncSource = false;
		  
		  /*
		   * syncSourcing means you a providing the URL source but no UI. Typically used in
		   * customer/agent scenarios.
		   */
		  $scope.init = function(syncSource) {
			  if (syncSource == true){
				  $scope.syncSource = true;
				  $scope.initiframeURL = $location.absUrl();	// init to current URL
			  }
    	  };

	      $scope.$on('session:started', function (event, eventObject) {
			    $log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);
			    
			    if ($scope.syncSource == true){
			    	RtcommService.putIframeURL(eventObject.endpoint.id,$scope.initiframeURL);	//Update on the current or next endpoint to be activated.
			    }
	      });

    	  $scope.$on('endpointActivated', function (event, endpointUUID) {
			  $log.debug('rtcommIframe: endpointActivated =' + endpointUUID);
                
		      if ($scope.syncSource == false){
				  $scope.iframeURL = $sce.trustAsResourceUrl(RtcommService.getIframeURL(endpointUUID));
				  $scope.iframeActiveEndpointUUID = endpointUUID;
		      }
	      });
		  
	      $scope.$on('noEndpointActivated', function (event) {
		      if ($scope.syncSource == false){
				  $scope.iframeURL = $sce.trustAsResourceUrl('about:blank');
				  $scope.iframeActiveEndpointUUID = null;
		      }
	      });
	       	
	      $scope.$on('rtcomm::iframeUpdate', function (eventType, endpointUUID, url) {
		      if ($scope.syncSource == false){
				  $log.debug('rtcomm::iframeUpdate: ' + url);
		    	  $scope.iframeURL = $sce.trustAsResourceUrl(url);
		      }
		      else{
				  $log.debug('rtcomm::iframeUpdate: load this url in a new tab: ' + url);
		    	  // In this case we'll open the pushed URL in a new tab.
		    	  $window.open($sce.trustAsResourceUrl(url), '_blank');
		      }
	      });
		  
	      $scope.setURL = function(newURL){
			  $log.debug('rtcommIframe: setURL: newURL: ' + newURL);
	    	  RtcommService.putIframeURL($scope.iframeActiveEndpointUUID, newURL);
	    	  $scope.iframeURL = $sce.trustAsResourceUrl(newURL);
	      };
	      
		  $scope.forward = function() {
	  		};

	  	  $scope.backward = function() {
	  		};
      }],
	  controllerAs: 'rtcommiframe'
    };
}]);



/******************************** Rtcomm Modals ************************************************/

/**
 * This modal is displayed on receiving an inbound call. It handles the alerting event.
 * Note that it can also auto accept requests for enabling A/V.
 */
rtcommModule.controller('RtcommAlertModalController', ['$scope', 'RtcommService', '$modal', '$log', function ($scope,  RtcommService, $modal, $log) {

    $scope.alertingEndpointObject = null;
    $scope.autoAnswerNewMedia = false;
    $scope.alertActiveEndpointUUID = RtcommService.getActiveEndpoint();
    $scope.caller = null;

	$scope.init = function(autoAnswerNewMedia) {
	      $log.debug('rtcommAlert: autoAnswerNewMedia = ' + autoAnswerNewMedia);
	      $scope.autoAnswerNewMedia = autoAnswerNewMedia;
  	};
  	
    $scope.$on('endpointActivated', function (event, endpointUUID) {
        $scope.alertActiveEndpointUUID = endpointUUID;
    });

   	$scope.$on('session:alerting', function (event, eventObject) {
    		
		if (($scope.alertActiveEndpointUUID == eventObject.endpoint.id && $scope.autoAnswerNewMedia == false) ||
				($scope.alertActiveEndpointUUID != eventObject.endpoint.id))
		{
			$log.debug('rtcommAlert: display alterting model: alertActiveEndpointUUID = ' + eventObject.endpoint + ' autoAnswerNewMedia = ' + $scope.autoAnswerNewMedia);
            $scope.caller = eventObject.endpoint.getRemoteEndpointID();
            $scope.alertingEndpointObject = eventObject.endpoint;
            $scope.showAlerting();
		}
		else{
	            $log.debug('Accepting media from: ' + eventObject.endpoint.getRemoteEndpointID() + ' for endpoint: ' + eventObject.endpoint.id);
	            eventObject.endpoint.accept();
		}
    });

    $scope.showAlerting = function (size) {

	    var modalInstance = $modal.open({
		  templateUrl: 'templates/rtcomm/rtcomm-modal-alert.html',
		  controller: 'RtcommAlertModalInstanceCtrl',
		  size: size,
		  resolve: {
		        caller: function () {
		          return $scope.caller;
		        }}
	    	});

	    modalInstance.result.then(
  		    	function() {
   		            $log.debug('Accepting call from: ' + $scope.caller + ' for endpoint: ' + $scope.alertingEndpointObject.id);
   		            $scope.alertingEndpointObject.accept();
	            	$scope.alertingEndpointObject = null;
 	    	     }, 
		     	function () {
		            $log.debug('Rejecting call from: ' + $scope.caller + ' for endpoint: ' + $scope.alertingEndpointObject.id);
		            $scope.alertingEndpointObject.reject();
		            $scope.alertingEndpointObject = null;
 	    });
    };
}]);

rtcommModule.controller('RtcommAlertModalInstanceCtrl', function ($scope, $modalInstance, $log, caller) {
  $scope.caller = caller;
	  
  $scope.ok = function () {
    $log.debug('Accepting alerting call');
    $modalInstance.close();
  };

  $scope.cancel = function () {
	$log.debug('Rejecting alerting call');
    $modalInstance.dismiss('cancel');
  };
});

/**
 * This is a modal controller for placing an outbound call to a static callee such as a queue.
 */
rtcommModule.controller('RtcommCallModalController', ['$scope',  'RtcommService', '$modal', '$log', function ($scope,  RtcommService, $modal, $log) {

	    $scope.calleeID = null;
	    $scope.callerID = null;
	    
	    $scope.enableCallModel = false;
	    $scope.mediaToEnable = ['chat'];

	    $scope.init = function(calleeID, mediaToEnable) {
		    $scope.calleeID = calleeID;
		    
		    if (typeof mediaToEnable !== "undefined")
		    	$scope.mediaToEnable = mediaToEnable;
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
	    
	    $scope.placeCall = function (size) {

		    var modalInstance = $modal.open({
			  templateUrl: 'templates/rtcomm/rtcomm-modal-call.html',
			  controller: 'RtcommCallModalInstanceCtrl',
			  size: size,
			  resolve: {}
		    	});

		    modalInstance.result.then(
		    	function (resultName) {
		            $log.debug('rtcommCallModal: Calling calleeID: ' + $scope.calleeID);
		            $log.debug('rtcommCallModal: CallerID: ' + resultName);
		            
		            //	This is used to set an alias when the endoint is not defined.
		            if ($scope.callerID == null && (typeof resultName !== "undefined") && resultName != ''){
		            	$scope.callerID = resultName;
		            	RtcommService.setAlias(resultName);
		            }
		            
		            RtcommService.placeCall($scope.calleeID, $scope.mediaToEnable);
		     	}, 
		     	function () {
		     		$log.info('Modal dismissed at: ' + new Date());
		    });
	    };
}]);

rtcommModule.controller('RtcommCallModalInstanceCtrl', ['$scope',  '$modalInstance', 'RtcommService', function ($scope, $modalInstance) {

	  $scope.endpointAlias = '';

	  $scope.ok = function () {
	    $modalInstance.close($scope.endpointAlias);
	  };

	  $scope.cancel = function () {
	    $modalInstance.dismiss('cancel');
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
	
	$scope.extendedConfig = null;

    $log.debug('RtcommConfigController: configURL = ' + $scope.configURL);

	$scope.setConfig = function(data) {
		$log.debug('RtcommConfigController: setting config data:' + data);
		RtcommService.setConfig(data);
  	};

  	$scope.init = function(configURL,extendedConfig) {
			$log.debug('RtcommConfigController: initing configURL = ' + configURL);
			$scope.configURL = configURL;
			
		    if (typeof extendedConfig !== "undefined")
		    	$scope.extendedConfig = extendedConfig;
		    
			$scope.getConfig();
	  	};

	$scope.getConfig = function() {
		$http.get($scope.configURL).success (function(config){
			
			// Now we need to update the config with any extensions passed in on init.
			if ($scope.extendedConfig != null){
				angular.extend(config, $scope.extendedConfig);
				$log.debug('RtcommConfigController: extended config object: ' + config);
			}
			
			RtcommService.setConfig(config);
		}).error(function(data, status, headers, config) {
			$log.debug('RtcommConfigController: error accessing config: ' + status);
		});
	};
}]);
