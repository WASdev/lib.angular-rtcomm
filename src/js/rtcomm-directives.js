/*
 * The angular-rtcomm-ui module
 * This has controllers and directives in it.
 */
(function(){

angular
  .module('angular-rtcomm-ui', [
    'ui.bootstrap', 
    'angular-rtcomm-service'])
  .directive('rtcommSessionManager', rtcommSessionManager)
  .directive('rtcommRegister', rtcommRegister)
  .directive('rtcommQueues', rtcommQueues)
  .directive('rtcommAlert', rtcommAlert)
  .directive('rtcommEndpointStatus', rtcommEndpointStatus)
  .directive('rtcommVideo', rtcommVideo)
  .directive('rtcommChat', rtcommChat)
  .directive('rtcommIframe', rtcommIframe)
  .controller('RtcommAlertModalController', RtcommAlertModalController)
  .controller('RtcommAlertModalInstanceController', RtcommAlertModalInstanceController)
  .controller('RtcommCallModalController', RtcommCallModalController)
  .controller('RtcommCallModalInstanceController', RtcommCallModalInstanceController)
  .controller('RtcommConfigController', RtcommConfigController)
  .controller('RtcommVideoController', RtcommVideoController)
  .controller('RtcommEndpointController', RtcommEndpointController);

/************* Endpoint Provider Directives *******************************/
/**
 * This directive is used to manage multiple sessions. If you are only supporting at most one session you wont need
 * this directive. The associated template provides a way to switch between active sessions. The session must be in
 * the started state to be managed by this directive and is removed when the session stops.
 */

rtcommSessionManager.$inject=['rtcommService', '$log'];
function rtcommSessionManager (rtcommService, $log) {
  return {
    restrict: 'E',
    templateUrl: 'templates/rtcomm/rtcomm-sessionmgr.html',
    controller: function ($scope) {
      $scope.sessions = rtcommService.getSessions();
      $scope.sessMgrActiveEndpointUUID = rtcommService.getActiveEndpoint();
      $scope.publishPresence = false;
      $scope.sessionPresenceData = [];

      $scope.init = function(publishPresence) {
        $scope.publishPresence = publishPresence;
        $scope.updatePresence();
      };

      $scope.$on('endpointActivated', function (event, endpointUUID) {
        $log.debug('rtcommSessionmgr: endpointActivated =' + endpointUUID);
        $scope.sessMgrActiveEndpointUUID = endpointUUID;
      });

      $scope.$on('session:started', function (event, eventObject) {
        $log.debug('rtcommSessionmgr: session:started: uuid =' + eventObject.endpoint.id);

        $scope.updatePresence();
      });

      $scope.activateSession = function(endpointUUID) {
        $log.debug('rtcommSessionmgr: activateEndpoint =' + endpointUUID);
        if ($scope.sessMgrActiveEndpointUUID != endpointUUID){
          rtcommService.setActiveEndpoint(endpointUUID);
        }
      };

      $scope.updatePresence = function(){
        //	Update the presence record if enabled
        if ($scope.publishPresence == true){
          rtcommService.removeFromPresenceRecord ($scope.sessionPresenceData, false);

          $scope.sessionPresenceData = [{
            'name' : "sessions",
            'value' : String($scope.sessions.length)}];

          rtcommService.addToPresenceRecord ($scope.sessionPresenceData);
        }
      };

    },
    controllerAs: 'sessionmgr'
  };
};

/**
 * This directive is used to manage the registration of an endpoint provider. Since the registered name can only
 * be set on initialization of the endpoint provider, this directive actually controls the initialization of the
 * provider. Note that the endpoint provider must be initialized before any sessions can be created or received.
 */
rtcommRegister.$inject=['rtcommService', '$log'];
function rtcommRegister(rtcommService, $log) {
	return {
		restrict: 'E',
		templateUrl: 'templates/rtcomm/rtcomm-register.html',
		controller: function ($scope) {

			$scope.nextAction = 'Register';

			$scope.onRegClick = function() {
				if ($scope.nextAction === 'Register'){
					$log.debug('Register: reguserid =' + $scope.reguserid);
					rtcommService.register($scope.reguserid);
				}
				else {
					$log.debug('Unregister: reguserid =' + $scope.reguserid);
					rtcommService.unregister();
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
};

/**
 * This directive manages call queues. It provides the ability to display all the available queues
 * (along with their descriptions) and by clicking on a queue, allows an agent (or any type of user)
 * to subscribe on that queue.
 */
rtcommQueues.$inject = ['rtcommService', '$log'];
function rtcommQueues(rtcommService, $log) {
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
							rtcommService.joinQueue(queue.endpointID);
							$scope.rQueues[index].active = true;
						}
						else{
							rtcommService.leaveQueue(queue.endpointID);
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
					rtcommService.removeFromPresenceRecord ($scope.queuePresenceData, false);

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

					rtcommService.addToPresenceRecord ($scope.queuePresenceData);
				}
			};
		},
		controllerAs : 'queues'
	};
};

//rtcommModule.controller('RtcommAlertController', ['$scope', '$log', function($scope, $log){
rtcommAlert.$inject = ['$log'];
function rtcommAlert($log) {
	return {
		restrict: 'E',
		templateUrl: "templates/rtcomm/rtcomm-alert.html",
		controller: function ($scope) {
      $scope.alerts = [];
      $scope.addAlert = function(alert) {
        $scope.alerts.push(alert);
      };
      $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
      };
      $scope.$on('rtcomm::alert', function(event, eventObject) {
        $scope.addAlert(eventObject);
      });
    }
  }
};

/********************** Endpoint Directives *******************************/

/**
 * This endpoint status controller only shows the active endpoint. The $scope.sessionState always contains the
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
rtcommEndpointStatus.$inject = ['rtcommService', '$log'];
function rtcommEndpointStatus(rtcommService, $log){
	return {
		restrict: 'E',
		templateUrl: 'templates/rtcomm/rtcomm-endpoint-status.html',
		controller: function ($scope) {

			//	Session states.
			$scope.epCtrlActiveEndpointUUID = rtcommService.getActiveEndpoint();
			$scope.epCtrlRemoteEndpointID = rtcommService.getRemoteEndpoint($scope.epCtrlActiveEndpointUUID);
			$scope.sessionState = rtcommService.getSessionState($scope.epCtrlActiveEndpointUUID);
			$scope.failureReason = '';
			$scope.queueCount = 0;	// FIX: Currently not implemented!

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

			$scope.$on('endpointActivated', function (event, endpointUUID) {
				$scope.epCtrlActiveEndpointUUID = endpointUUID;
				$scope.epCtrlRemoteEndpointID = rtcommService.getEndpoint(endpointUUID).getRemoteEndpointID();
				$scope.sessionState = rtcommService.getSessionState(endpointUUID);
			});

			$scope.$on('noEndpointActivated', function (event) {
				$scope.epCtrlRemoteEndpointID = null;
				$scope.sessionState = 'session:stopped';
			});

		}
	};
};

/**
 * This directive manages the WebRTC video screen, including both the self view and the remote view. It
 * also takes care of switching state between endpoints based on which endpoint is "actively" being viewed.
 */
rtcommVideo.$inject = ['rtcommService', '$log'];
function rtcommVideo(rtcommService, $log) {
	return {
		restrict: 'E',
		templateUrl: 'templates/rtcomm/rtcomm-video.html',
		controller: 'RtcommVideoController'
	};
};

/**
 * This directive manages the chat portion of a session. The data model for chat
 * is maintained in the rtcommService. This directive handles switching between
 * active endpoints.
 */
rtcommChat.$inject = ['rtcommService', '$log'];
function rtcommChat(rtcommService, $log) {
	return {
		restrict: 'E',
		templateUrl: "templates/rtcomm/rtcomm-chat.html",
		controller: function ($scope) {
			$scope.chatActiveEndpointUUID = rtcommService.getActiveEndpoint();
			$scope.chats = rtcommService.getChats($scope.chatActiveEndpointUUID);
			// This forces the scroll bar to the bottom and watches the $location.hash
			//$anchorScroll();

			$scope.$on('endpointActivated', function (event, endpointUUID) {
				$log.debug('rtcommChat: endpointActivated =' + endpointUUID);

				//	The data model for the chat is maintained in the rtcommService.
				$scope.chats = rtcommService.getChats(endpointUUID);
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
						name : rtcommService.getEndpoint($scope.chatActiveEndpointUUID).getLocalEndpointID(),
						message : angular.copy($scope.message)
				};

				$scope.message = '';
				$scope.scrollToBottom(true);
				rtcommService.sendChatMessage(chat, $scope.chatActiveEndpointUUID);
			};

		},
		controllerAs: 'chat',
		link: function(scope, element){
			var chatPanel = angular.element(element.find('.panel-body')[0]);

			var bottom = true;

			//Chooses if the scrollbar should be forced to the bottom on the next lifecycle
			scope.scrollToBottom = function(flag){
				bottom = flag;
			}

      if (chatPanel.length > 0) {
        //Watch scroll events
        chatPanel.bind('scroll', function(){
          if(chatPanel.prop('scrollTop') + chatPanel.prop('clientHeight') ==  chatPanel.prop('scrollHeight')){
            scope.scrollToBottom(true);
          } else {
            scope.scrollToBottom(false);
          }
        });

        //Watch the chat messages, if the scroll bar is in the bottom keep it on the bottom so the user can view incoming chat messages, else possibly send a notification and don't scroll down
        scope.$watch('chats', function(){
          if(bottom){
            $log.debug('chatPanel is: ', chatPanel);
            chatPanel.scrollTop(chatPanel.prop('scrollHeight'));
          } else {
          //In this else, a notification could be sent
          }
        },true);
      } else {
        $log.warn('chatPanel not found: most likely you need to load jquery prior to angular');
      }
    }
	};

};

/**
 * This directive manages the shared iFrame.
 */
rtcommIframe.$inject = ['rtcommService', '$log', '$sce', '$location', '$window'];
function rtcommIframe(rtcommService, $log, $sce, $location, $window) {
	return {
		restrict: 'E',
		templateUrl: "templates/rtcomm/rtcomm-iframe.html",
		controller: ["$scope", function ($scope) {
			$scope.iframeActiveEndpointUUID = rtcommService.getActiveEndpoint();
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
					rtcommService.putIframeURL(eventObject.endpoint.id,$scope.initiframeURL);	//Update on the current or next endpoint to be activated.
				}
			});

			$scope.$on('endpointActivated', function (event, endpointUUID) {
				$log.debug('rtcommIframe: endpointActivated =' + endpointUUID);

				if ($scope.syncSource == false){
					$scope.iframeURL = $sce.trustAsResourceUrl(rtcommService.getIframeURL(endpointUUID));
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
					//	This is needed to prevent rtcomm from logging in when the page is loaded in the iFrame.
					url = url + "?disableRtcomm=true";
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
				rtcommService.putIframeURL($scope.iframeActiveEndpointUUID, newURL);
				$scope.iframeURL = $sce.trustAsResourceUrl(newURL);
			};

			$scope.forward = function() {
			};

			$scope.backward = function() {
			};
		}],
		controllerAs: 'rtcommiframe'
	};
};



/******************************** Rtcomm Modals ************************************************/

/**
 * This modal is displayed on receiving an inbound call. It handles the alerting event.
 * Note that it can also auto accept requests for enabling A/V.
 */

RtcommAlertModalController.$inject=['$rootScope', '$scope', 'rtcommService', '$modal', '$log'];
function RtcommAlertModalController($rootScope, $scope, rtcommService, $modal, $log) {

	$scope.alertingEndpointUUID = null;
	$scope.autoAnswerNewMedia = false;
	$scope.alertActiveEndpointUUID = rtcommService.getActiveEndpoint();
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
			$scope.alertingEndpointUUID = eventObject.endpoint.id;
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
			controller: 'RtcommAlertModalInstanceController',
			size: size,
			resolve: {
				caller: function () {
					return $scope.caller;
				}}
		});

		modalInstance.result.then(
				function() {
					var alertingEndpointObject = rtcommService.getEndpoint($scope.alertingEndpointUUID);

					if(alertingEndpointObject){
						$log.debug('Accepting call from: ' + $scope.caller + ' for endpoint: ' + $scope.alertingEndpointUUID);
						alertingEndpointObject.accept();
						$rootScope.$broadcast('rtcomm::alert-success');
						alertingEndpointObject = null;
					}
				},
				function () {
					var alertingEndpointObject = rtcommService.getEndpoint($scope.alertingEndpointUUID);
					if(alertingEndpointObject){
						$log.debug('Rejecting call from: ' + $scope.caller + ' for endpoint: ' + $scope.alertingEndpointUUID);
						alertingEndpointObject.reject();
						alertingEndpointObject = null;
					}
				});
	};
};

RtcommAlertModalInstanceController.$inject = ['$scope', '$modalInstance', '$log', 'caller'];

function RtcommAlertModalInstanceController($scope, $modalInstance, $log, caller) {
	$scope.caller = caller;
	$scope.ok = function () {
		$log.debug('Accepting alerting call');
		$modalInstance.close();
	};

	$scope.cancel = function () {
		$log.debug('Rejecting alerting call');
		$modalInstance.dismiss('cancel');
	};
};

/**
 * This is a modal controller for placing an outbound call to a static callee such as a queue.
 */
RtcommCallModalController.$inject = ['$scope',  'rtcommService', '$modal', '$log'];
function RtcommCallModalController($scope, rtcommService, $modal, $log) {
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
			controller: 'RtcommCallModalInstanceController',
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
						rtcommService.setAlias(resultName);
					}

					rtcommService.placeCall($scope.calleeID, $scope.mediaToEnable);
				},
				function () {
					$log.info('Modal dismissed at: ' + new Date());
				});
	};
};

RtcommCallModalInstanceController.$inject = ['$scope',  '$modalInstance', 'rtcommService'];
function RtcommCallModalInstanceController($scope, $modalInstance, rtcommService) {
	$scope.endpointAlias = '';
	$scope.ok = function () {
		$modalInstance.close($scope.endpointAlias);
	};
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
};

/********************************************* Rtcomm Controllers ******************************************************/

/**
 * This is the controller for config loader. It reads a JSON object and utilizes the rtcommService to set the configuration.
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

RtcommConfigController.$inject = ['$scope','$http', 'rtcommService', '$log'];
function RtcommConfigController($scope, $http, rtcommService, $log) {
	$scope.extendedConfig = null;

	$log.debug('RtcommConfigController: configURL = ' + $scope.configURL);

	$scope.setConfig = function(data) {
		$log.debug('RtcommConfigController: setting config data:' + data);
		rtcommService.setConfig(data);
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

			rtcommService.setConfig(config);
		}).error(function(data, status, headers, config) {
			$log.debug('RtcommConfigController: error accessing config: ' + status);
		});
	};
};


RtcommVideoController.$inject= ['$scope','$http', 'rtcommService', '$log'];
function RtcommVideoController($scope, $http, rtcommService, $log) {
	$scope.avConnected = rtcommService.isWebrtcConnected(rtcommService.getActiveEndpoint());
	$scope.init = function(selfView,remoteView) {
		rtcommService.setViewSelector(selfView,remoteView);

		var videoActiveEndpointUUID = rtcommService.getActiveEndpoint();
		if (typeof videoActiveEndpointUUID !== "undefined" && videoActiveEndpointUUID != null)
			rtcommService.setVideoView(videoActiveEndpointUUID);
	};

	// Go ahead and initialize the local media here if an endpoint already exist.
	var videoActiveEndpointUUID = rtcommService.getActiveEndpoint();
	if (typeof videoActiveEndpointUUID !== "undefined" && videoActiveEndpointUUID != null)
		rtcommService.setVideoView(videoActiveEndpointUUID);

	$scope.$on('endpointActivated', function (event, endpointUUID) {
		//	Not to do something here to show that this button is live.
		$log.debug('rtcommVideo: endpointActivated =' + endpointUUID);
		rtcommService.setVideoView(endpointUUID);
		$scope.avConnected = rtcommService.isWebrtcConnected(rtcommService.getActiveEndpoint());
	});

	$scope.$on('noEndpointActivated', function (event) {
		$scope.avConnected = false;
	});

	$scope.$on('webrtc:connected', function (event, eventObject) {
		if (rtcommService.getActiveEndpoint() == eventObject.endpoint.id)
			$scope.avConnected = true;
	});

	$scope.$on('webrtc:disconnected', function (event, eventObject) {
		if (rtcommService.getActiveEndpoint() == eventObject.endpoint.id)
			$scope.avConnected = false;
	});
};


RtcommEndpointController.$inject = ['$scope', '$rootScope', '$http', 'rtcommService', '$log'];
function RtcommEndpointController($scope, $rootScope, $http, rtcommService, $log) {
	//	Session states.
	$scope.epCtrlActiveEndpointUUID = rtcommService.getActiveEndpoint();
	$scope.epCtrlAVConnected = rtcommService.isWebrtcConnected($scope.epCtrlActiveEndpointUUID);
	$scope.sessionState = rtcommService.getSessionState($scope.epCtrlActiveEndpointUUID);

	$scope.disconnect = function() {
		$log.debug('Disconnecting call for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
		rtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).disconnect();
	};

	$scope.toggleAV = function() {
		$log.debug('Enable AV for endpoint: ' + $scope.epCtrlActiveEndpointUUID);

		if ($scope.epCtrlAVConnected == false){
			rtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).webrtc.enable(function(value, message) {
				if (!value) {
          $log.debug('Enable failed: ',message);
          rtcommService.alert({type: 'danger', msg: message});
				}
			});
		}
		else{
			$log.debug('Disable AV for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
			rtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).webrtc.disable();
		}
	};

	$scope.$on('session:started', function (event, eventObject) {
		$log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);
		if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
			$scope.sessionState = 'session:started';
		}
	});

	$scope.$on('session:stopped', function (event, eventObject) {
		$log.debug('session:stopped received: endpointID = ' + eventObject.endpoint.id);
		if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
			$scope.sessionState = 'session:stopped';
		}
	});

	$scope.$on('session:failed', function (event, eventObject) {
		$log.debug('session:failed received: endpointID = ' + eventObject.endpoint.id);
		if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id){
			$scope.sessionState = 'session:failed';
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
		$scope.epCtrlAVConnected = rtcommService.isWebrtcConnected(endpointUUID);
	});

	$scope.$on('noEndpointActivated', function (event) {
		$scope.epCtrlAVConnected = false;
	});
};

})();
