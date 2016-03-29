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
 * @version v1.0.3 - 2016-03-29
 * @link https://github.com/WASdev/lib.angular-rtcomm
 * @author Brian Pulito <brian_pulito@us.ibm.com> (https://github.com/bpulito)
 */
/**
 * (C) Copyright IBM Corporation 2016.
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
 */
(function() {
  angular.module('angular-rtcomm', [
    'ui.bootstrap',
    'treeControl',
    'angular-rtcomm-ui',
    'angular-rtcomm-presence',
    'angular-rtcomm-service'
  ]);
})();


/**
 *(C) Copyright IBM Corporation 2016.
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
 */


(function() {
	'use strict';

	angular
		.module('angular-rtcomm-service', []);
})();

/**
 * (C) Copyright IBM Corporation 2016.
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
 */
/*
 * The angular-rtcomm-ui module
 * This has controllers and directives in it.
 */
(function(){

angular
  .module('angular-rtcomm-ui', [
    'ui.bootstrap',
    'angular-rtcomm-service']);

})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */
/*
 * The angular-rtcomm-presence  module
 * This has controllers and directives in it.
 */
(function(){
  angular
    .module('angular-rtcomm-presence', [
      'ui.bootstrap',
      'treeControl',
      'angular-rtcomm-service'])
    .directive('rtcommPresence', rtcommPresence);

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
  rtcommPresence.$inject=['RtcommService', '$log'];
  function rtcommPresence(RtcommService, $log) {
    return {
      restrict: 'E',
      templateUrl: "templates/rtcomm/rtcomm-presence.html",
      controller: ["$scope", "$rootScope", function ($scope, $rootScope) {

        $scope.monitorTopics = [];
        $scope.presenceData = [];
        $scope.expandedNodes = [];

        // Default protocol list initiated from presence. Start with chat only.
        $scope.protocolList = {
            chat : true,
            webrtc : false};

        // use a tree view or flatten.
        $scope.flatten = false;
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

        $scope.init = function(options) {
          $scope.protocolList.chat = (typeof options.chat === 'boolean') ? options.chat : $scope.protocolList.chat;
          $scope.protocolList.webrtc = (typeof options.webrtc === 'boolean') ? options.webrtc : $scope.protocolList.webrtc;
          $scope.flatten  = (typeof options.flatten === 'boolean') ? options.flatten: $scope.flatten;
        };

        $scope.onCallClick = function(calleeEndpointID){
          var endpoint = RtcommService.getEndpoint();
          RtcommService.setActiveEndpoint(endpoint.id);

          if ($scope.protocolList.chat == true)
            endpoint.chat.enable();

          if ($scope.protocolList.webrtc == true){
            endpoint.webrtc.enable(function(value, message) {
              if (!value) {
                RtcommService.alert({type: 'danger', msg: message});
              }
            });
          }

          endpoint.connect(calleeEndpointID);
          $rootScope.$broadcast('rtcomm::presence-click');
        };

        $scope.$on('rtcomm::init', function (event, success, details) {
          RtcommService.publishPresence();
          var presenceMonitor = RtcommService.getPresenceMonitor();

          presenceMonitor.on('updated', function(presenceData){
            $log.debug('<<------rtcommPresence: updated------>>');
            if ($scope.flatten) {
              $log.debug('<<------rtcommPresence: updated using flattened data ------>>');
              $scope.presenceData = presenceData[0].flatten();
            }
            $scope.$apply();
          });

          // Binding data if we are going to flatten causes a flash in the UI when it changes.
          if (!$scope.flatten) {
            $scope.presenceData = presenceMonitor.getPresenceData();
          }

          if ($scope.presenceData.length >= 1)
            $scope.expandedNodes.push($scope.presenceData[0]);

          for (var index = 0; index < $scope.monitorTopics.length; index++) {
            $log.debug('rtcommPresence: monitorTopic: ' + $scope.monitorTopics[index]);
            presenceMonitor.add($scope.monitorTopics[index]);
          }
        });

      }],
      controllerAs: 'presence'
    };
  };
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

(function() {
  'use strict';

  angular
    .module('angular-rtcomm-service')
    .factory('RtcommConfigService', RtcommConfigService);

  /* @ngInject */
  function RtcommConfigService($location, $log, $window) {
    var service = {
      setProviderConfig: setProviderConfig,
      getProviderConfig: getProviderConfig,
      getWebRTCEnabled: getWebRTCEnabled,
      getChatEnabled: getChatEnabled,
      getBroadcastAudio: getBroadcastAudio,
      getBroadcastVideo: getBroadcastVideo,
      getRingTone: getRingTone,
      getRingBackTone: getRingBackTone,
      getRtcommDebug: getRtcommDebug,
      isRtcommDisabled: isRtcommDisabled,
      getMediaConfig: getMediaConfig
    };

    //Default provider
    var providerConfig = {
      server: $location.host(),
      port: $location.port(),
      rtcommTopicPath: '/rtcomm/',
      createEndpoint: false,
      appContext: 'default',
      userid: '',
      presence: {
        topic: ''
      }
    };

    //Rtcomm Endpoint Config Defaults
    var mediaConfig = {
      chat: true,
      webrtc: true,
      webrtcConfig: {
        broadcast: {
          audio: true,
          video: true
        },
        trickleICE: true
      },
      ringbacktone: null,
      ringtone: null
    };

    //Rtcomm Debug
    var rtcommDebug = 'DEBUG';

    $log.debug('RtcommConfigService: Abs Url: ' + $location.absUrl());
    $log.debug('providerConfig.server: ' + providerConfig.server);
    $log.debug('providerConfig.port: ' + providerConfig.port);

    return service;

    function setProviderConfig(config) {

      //Provider Config
      providerConfig = {

        server: (typeof config.server !== 'undefined') ? config.server : providerConfig.server,
        port: (typeof config.port !== 'undefined') ? config.port : providerConfig.port,
        rtcommTopicPath: (typeof config.rtcommTopicPath !== 'undefined') ? config.rtcommTopicPath : providerConfig.rtcommTopicPath,
        createEndpoint: (typeof config.createEndpoint !== 'undefined') ? config.createEndpoint : providerConfig.createEndpoint,
        appContext: (typeof config.appContext !== 'undefined') ? config.appContext : providerConfig.appContext,
        presence: {
          topic: (typeof config.presenceTopic !== 'undefined') ? config.presenceTopic : providerConfig.presence.topic,
        },
        userid: (typeof config.userid !== 'undefined') ? config.userid : providerConfig.userid
      };

      //Media Configuration
      mediaConfig = {
        chat: (typeof config.chat !== 'undefined') ? config.chat : mediaConfig.chat,
        webrtc: (typeof config.video !== 'undefined') ? config.webrtc : mediaConfig.webrtc,
        webrtcConfig: {
          broadcast: {
            video: typeof config.broadcastVideo !== 'undefined' ? config.broadcastVideo : mediaConfig.webrtcConfig.broadcast.video,
            audio: typeof config.broadcastAudio !== 'undefined' ? config.broadcastAudio : mediaConfig.webrtcConfig.broadcast.audio
          },
          trickleICE: typeof config.trickleICE !== 'undefined' ? config.trickleICE : mediaConfig.webrtcConfig.trickleICE
        },
        ringbacktone: typeof config.ringbacktone !== 'undefined' ? config.ringbacktone : mediaConfig.ringbacktone,
        ringtone: typeof config.ringtone !== 'undefined' ? config.ringtone : mediaConfig.ringtone
      };

      rtcommDebug = (typeof config.rtcommDebug !== 'undefined') ? config.rtcommDebug : rtcommDebug;

      $log.debug('rtcommDebug from config is: ' + config.rtcommDebug);

      $log.debug('providerConfig is: ' + providerConfig);
    }

    function getProviderConfig() {
      return providerConfig;
    }

    function getWebRTCEnabled() {
      return mediaConfig.webrtc;
    }

    function getChatEnabled() {
      return mediaConfig.chat;
    }

    function getBroadcastAudio() {
      return mediaConfig.webrtcConfig.broadcast.audio;
    }

    function getBroadcastVideo() {
      return mediaConfig.webrtcConfig.broadcast.video;
    }

    function getRingTone() {
      return mediaConfig.ringtone;
    }

    function getRingBackTone() {
      return mediaConfig.ringbacktone;
    }

    function getRtcommDebug() {
      return rtcommDebug;
    }

    function isRtcommDisabled() {
      return false;
    }

    function getMediaConfig() {
      return mediaConfig;
    }
  }
  RtcommConfigService.$inject = ["$location", "$log", "$window"];
})();

/**
 *(C) Copyright IBM Corporation 2015.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * Definition for the rtcommModule
 */

(function() {
  angular.module('angular-rtcomm-service')
    /**
     * Set debugEnabled to true to enable the debug messages in this rtcomm angular module.
     */
    .config(["$logProvider", function($logProvider) {
      $logProvider.debugEnabled(true);
    }])
    .constant('rtcomm', rtcomm)
    .factory('RtcommService', RtcommService);
  RtcommService.$inject = ['$rootScope', '$log', 'RtcommConfigService', 'RtcommSessions', 'rtcomm', '$http'];

  function RtcommService($rootScope, $log, RtcommConfigService, RtcommSessions, rtcomm, $http) {
    /** Setup the endpoint provider first **/

    var service = {

      alert: alert,

      isInitialized: isInitialized,

      setConfig: setConfig,

      getPresenceMonitor: getPresenceMonitor,

      publishPresence: publishPresence,

      addToPresenceRecord: addToPresenceRecord,

      removeFromPresenceRecord: removeFromPresenceRecord,

      setPresenceRecordState: setPresenceRecordState,

      getEndpoint: getEndpoint,

      destroyEndpoint: destroyEndpoint,

      register: register,

      unregister: unregister,

      joinQueue: joinQueue,

      leaveQueue: leaveQueue,

      getQueues: getQueues,

      sendChatMessage: sendChatMessage,

      getChats: getChats,

      isWebrtcConnected: isWebrtcConnected,

      getSessionState: getSessionState,

      setAlias: setAlias,

      setUserID: setUserID,

      setPresenceTopic: setPresenceTopic,

      getIframeURL: getIframeURL,

      putIframeURL: putIframeURL,

      placeCall: placeCall,

      getSessions: getSessions,

      endCall: endCall,

      setActiveEndpoint: setActiveEndpoint,

      getActiveEndpoint: getActiveEndpoint,

      getRemoteEndpoint: getRemoteEndpoint,

      setDefaultViewSelector: setDefaultViewSelector,

      setViewSelector: setViewSelector,

      setVideoView: setVideoView
    };


    var endpointProviderInitialized = false;
    var queueList = null;
    var presenceRecord = null;
    var _selfView = 'selfView'; //	Default self view
    var _remoteView = 'remoteView'; //	Default remote view
    var myEndpointProvider = null;
    activate();
    return service;

    function activate() {
      myEndpointProvider = new rtcomm.EndpointProvider();

      myEndpointProvider.setLogLevel(RtcommConfigService.getRtcommDebug());

      $log.debug('rtcomm-service - endpointProvider log level is: ' + myEndpointProvider.getLogLevel());
      $log.debug('rtcomm-service - endpointProvider log level should be: ' + RtcommConfigService.getRtcommDebug());
      myEndpointProvider.setAppContext(RtcommConfigService.getProviderConfig().appContext);


      myEndpointProvider.on('reset', function(event_object) {
        // Should have a reason.
        alert({
          type: 'danger',
          msg: event_object.reason
        });
      });


      myEndpointProvider.on('queueupdate', function(queuelist) {
        $log.debug('<<------rtcomm-service------>> - Event: queueupdate');
        $log.debug('queueupdate', queuelist);
        $rootScope.$evalAsync(
          function() {
            $rootScope.$broadcast('queueupdate', queuelist);
          }
        );
      });

      myEndpointProvider.on('newendpoint', function(endpoint) {
        $log.debug('<<------rtcomm-service------>> - Event: newendpoint remoteEndpointID: ' + endpoint.getRemoteEndpointID());

        $rootScope.$evalAsync(
          function() {
            $rootScope.$broadcast('newendpoint', endpoint);
          }
        );
      });

      function sessionEstablishmentCallback(eventObject) {
        var id = eventObject.endpoint.id;

        var session = RtcommSessions.getSession(id);
        if (session === null) session = RtcommSessions.createSession(id);


        session.state = eventObject.eventName;
        broadcastRtcommEvent(eventObject);
      };


      /**
       * Setup all the callbacks here because they are all static.
       */
      myEndpointProvider.setRtcommEndpointConfig({
        // These are all the session related events.

        'onetimemessage': function(eventObject) {
          $log.debug('<<------- rtcomm-service ----->> - Event: ' + eventObject);

          if (eventObject.onetimemessage.type !== 'undefined' && eventObject.onetimemessage.type === 'iFrameURL') {
            var id = eventObject.endpoint.id;

            var session = RtcommSessions.getSession(id);
            if (session === null) {
              session = RtcommSessions.createSession(id);
            }
            session.iFrameURL = eventObject.onetimemessage.iFrameURL;
            $rootScope.$evalAsync(
              function() {
                $rootScope.$broadcast('rtcomm::iframeUpdate', eventObject.endpoint.id, eventObject.onetimemessage.iFrameURL);
              }
            );
          }
        },
        'session:started': function(eventObject) {
          $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
          var id = eventObject.endpoint.id;
          var endpoint = eventObject.endpoint;
          var session = RtcommSessions.getSession(id);

          if (session === null) $log.error('Session:started but a previous session hasn\'t been created!');
          else {
            _setActiveEndpoint(id);
            session.started = true;
            session.remoteEndpointID = endpoint.getRemoteEndpointID();
            broadcastRtcommEvent(eventObject);
          }
        },
        'session:alerting': sessionEstablishmentCallback,

        'session:trying': sessionEstablishmentCallback,

        'session:ringing': sessionEstablishmentCallback,

        'session:queued': sessionEstablishmentCallback,

        'session:failed': function(eventObject) {

          RtcommSessions.removeSession(eventObject.endpoint.id);
          broadcastRtcommEvent(eventObject);
        },

        /**
         * Handle when the endpoint stops the session
         */
        'session:stopped': function(eventObject) {
          //Remove the session
          RtcommSessions.removeSession(eventObject.endpoint.id);

          broadcastRtcommEvent(eventObject);
        },

        // These are all the WebRTC related events.
        'webrtc:connected': function(eventObject) {

          var session = RtcommSessions.getSession(eventObject.endpoint.id);
          if (session !== null) {
            session.webrtcConnected = true;
            broadcastRtcommEvent(eventObject);
          }
        },
        'webrtc:remotemuted': function(eventObject) {
          broadcastRtcommEvent(eventObject);
        },

        'webrtc:disconnected': function(eventObject) {

          var session = RtcommSessions.getSession(eventObject.endpoint.id);
          if (session !== null)
            session.webrtcConnected = false;
          broadcastRtcommEvent(eventObject);
        },

        // These are all the chat related events.
        'chat:connected': broadcastRtcommEvent,
        'chat:disconnected': broadcastRtcommEvent,

        'chat:message': function(eventObject) {

          //Create a message object

          var chat = {
            time: new Date(),
            name: eventObject.message.from,
            message: angular.copy(eventObject.message.message)
          };

          var session = RtcommSessions.getSession(eventObject.endpoint.id);

          if (session !== null) {
            session.chats.push(chat);
            broadcastRtcommEvent(eventObject);
          }
        },

        // Endpoint destroyed
        'destroyed': broadcastRtcommEvent
      });
    }

    function broadcastRtcommEvent(eventObject) {

      $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
      $rootScope.$evalAsync(
        function() {
          $rootScope.$broadcast(eventObject.eventName, eventObject);
        }
      );
    }

    function getPresenceRecord() {
      if (presenceRecord == null)
        presenceRecord = {
          'state': 'available',
          userDefines: []
        };

      return (presenceRecord);
    };

    function initSuccess(event) {
      $log.debug('<<------rtcomm-service------>> - Event: Provider init succeeded');

      if (presenceRecord != null) {
        $log.debug('RtcommService: initSuccess: updating presence record');
        myEndpointProvider.publishPresence(presenceRecord);
      }

      $rootScope.$evalAsync(
        function() {
          var broadcastEvent = {
            'ready': event.ready,
            'registered': event.registered,
            'endpoint': event.endpoint,
            'userid': RtcommConfigService.getProviderConfig().userid
          };

          $rootScope.$broadcast('rtcomm::init', true, broadcastEvent);
        }
      );
    };

    function initFailure(error) {
      $log.debug('<<------rtcomm-service------>> - Event: Provider init failed: error: ', error);
      $rootScope.$evalAsync(
        function() {
          $rootScope.$broadcast('rtcomm::init', false, error);
        }
      );
    };

    function _getEndpoint(uuid) {
      var endpoint = null;

      if (typeof uuid === 'undefined' || uuid === null) {
        $log.debug('getEndpoint: create new endpoint');
        endpoint = myEndpointProvider.createRtcommEndpoint();
      } else {
        $log.debug('getEndpoint: get an endpoint with id -> ' + uuid);
        endpoint = myEndpointProvider.getRtcommEndpoint(uuid);
      }

      return (endpoint);
    };

    function _setActiveEndpoint(endpointID) {

      var activeEndpoint = _getActiveEndpointUUID();

      if ((activeEndpoint !== null) && (activeEndpoint !== endpointID)) {
        var session = RtcommSessions.getSession(activeEndpoint);
        if (session !== null)
          session.activated = false;
      }
      var session = RtcommSessions.getSession(endpointID);

      if (session === null) session = RtcommSessions.createSession(endpointID);
      session.activated = true;


      $rootScope.$broadcast('endpointActivated', endpointID);
    };

    function _getActiveEndpointUUID() {
      var activeEndpoint = null;
      var sessions = RtcommSessions.getAllSessions();

      for (var index = 0; index < sessions.length; index++) {
        if (sessions[index].activated === true) {
          activeEndpoint = sessions[index].endpointUUID;
          break;
        }
      }
      return (activeEndpoint);
    };

    function alert(alertObject) {
      var a = {
        type: 'info',
        msg: 'default message'
      };
      if (typeof alertObject === 'string') {
        a.msg = alertObject;
      } else {
        a = alertObject;
      }
      $rootScope.$evalAsync(
        function() {
          $rootScope.$broadcast('rtcomm::alert', a);
        }
      );
    };

    /** External functionalities fror the RtcommService API */
    function isInitialized() {
      return endpointProviderInitialized;
    }

    function setConfig(config) {

      if (RtcommConfigService.isRtcommDisabled() == true) {
        $log.debug('RtcommService:setConfig: isRtcommDisabled = true; return with no setup');
        return;
      }

      if (config.rtcommDebug === 'INFO' || config.rtcommDebug === 'DEBUG') {
        myEndpointProvider.setLogLevel(config.rtcommDebug);
      }
      $log.debug('rtcomm-services: setConfig: config: ', config);

      RtcommConfigService.setProviderConfig(config);
      myEndpointProvider.setRtcommEndpointConfig(RtcommConfigService.getMediaConfig());

      if (endpointProviderInitialized === false) {

        if (typeof config.identityServlet !== "undefined" && config.identityServlet != null) {
          $http.get(config.identityServlet).success(function(data) {

            if (typeof data.userid !== "undefined") {
              RtcommConfigService.setProviderConfig(data);
              myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
              endpointProviderInitialized = true;
            } else
              $log.error('RtcommService: setConfig promise: Invalid JSON object return from identityServlet: ', data);
          }).error(function(data, status, headers, config) {
            $log.debug('RtcommService: setConfig promise: error accessing userid from identityServlet: ' + status);
          });
        } else {
          // If the user does not specify a userid, that says one will never be specified so go ahead
          // and initialize the endpoint provider and let the provider assign a name. If a defined empty
          // string is passed in, that means to wait until the end user registers a name.
          if (typeof config.userid === 'undefined' || RtcommConfigService.getProviderConfig().userid !== '') {
            myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
            endpointProviderInitialized = true;
          }
        }
      }
    }


    function getPresenceMonitor(topic) {
      return myEndpointProvider.getPresenceMonitor(topic);
    }

    function publishPresence() {

      if (endpointProviderInitialized === true)
        myEndpointProvider.publishPresence(getPresenceRecord());
    }

    function addToPresenceRecord(userDefines) {

      for (var index = 0; index < userDefines.length; index++) {
        getPresenceRecord().userDefines.push(userDefines[index]);
      }

      if (endpointProviderInitialized === true) {
        $log.debug('RtcommService: addToPresenceRecord: updating presence record to: ', getPresenceRecord());
        myEndpointProvider.publishPresence(getPresenceRecord());
      }
    }

    function removeFromPresenceRecord(userDefines, doPublish) {

      for (var i = 0; i < userDefines.length; i++) {
        for (var j = 0; j < getPresenceRecord().userDefines.length; j++) {

          if (getPresenceRecord().userDefines[j].name === userDefines[i].name) {
            getPresenceRecord().userDefines.splice(j, 1);
            break;
          }
        }
      }

      if ((endpointProviderInitialized === true) && doPublish) {
        $log.debug('RtcommService: removeFromPresenceRecord: updating presence record to: ', getPresenceRecord());
        myEndpointProvider.publishPresence(getPresenceRecord());
      }
    }

    function setPresenceRecordState(state) {

      getPresenceRecord().state = state;
      return myEndpointProvider.publishPresence(getPresenceRecord());
    }

    function getEndpoint(uuid) {
      return _getEndpoint(uuid);
    }

    function destroyEndpoint(uuid) {
      myEndpointProvider.getRtcommEndpoint(uuid).destroy();
    }

    function register(userid) {

      if (endpointProviderInitialized === false) {
        RtcommConfigService.getProviderConfig().userid = userid;

        myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
        endpointProviderInitialized = true;
      } else
        $log.error('rtcomm-services: register: ERROR: endpoint provider already initialized');
    }

    function unregister() {

      if (endpointProviderInitialized == true) {
        myEndpointProvider.destroy();
        endpointProviderInitialized = false;
        initFailure('destroyed');
      } else
        $log.error('rtcomm-services: unregister: ERROR: endpoint provider not initialized');
    }


    /**
     * Queue API
     */
    function joinQueue(queueID) {
      myEndpointProvider.joinQueue(queueID);
    }

    function leaveQueue(queueID) {
      myEndpointProvider.leaveQueue(queueID);
    }

    function getQueues() {
      return queueList;
    }

    /**
     * Chat API
     */
    function sendChatMessage(chat, endpointUUID) {

      var session;
      //	Save this chat in the local session store
      session = RtcommSessions.getSession(endpointUUID);
      if (session === null) session = RtcommSessions.createSession(endpointUUID);

      session.chats.push(chat);

      myEndpointProvider.getRtcommEndpoint(endpointUUID).chat.send(chat.message);

    }

    function getChats(endpointUUID) {

      if (typeof endpointUUID !== 'undefined' && endpointUUID != null) {
        var session = RtcommSessions.getSession(endpointUUID);
        if (session !== null)
          return (session.chats);
        else
          return (null);
      } else
        return (null);

    }

    function isWebrtcConnected(endpointUUID) {

      if (typeof endpointUUID !== 'undefined' && endpointUUID != null) {
        var session = RtcommSessions.getSession(endpointUUID);
        if (session != null)
          return (session.webrtcConnected);
        else
          return (false);
      } else
        return (false);
    }

    function getSessionState(endpointUUID) {

      if (typeof endpointUUID !== 'undefined' && endpointUUID != null)
        return (myEndpointProvider.getRtcommEndpoint(endpointUUID).getState());
      else
        return ('session:stopped');
    }

    function setAlias(aliasID) {

      if ((typeof aliasID !== 'undefined') && aliasID !== '')
        myEndpointProvider.setUserID(aliasID);
    }

    function setUserID(userID) {

      if ((typeof userID !== 'undefined') && userID !== '') {
        RtcommConfigService.setProviderConfig({
          userid: userID
        });
        myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
      }
    }

    function setPresenceTopic(presenceTopic) {

      if ((typeof presenceTopic !== 'undefined') && presenceTopic !== '') {
        RtcommConfigService.setProviderConfig({
          presenceTopic: presenceTopic
        });
        myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
      }

    }

    function getIframeURL(endpointUUID) {

      if (typeof endpointUUID !== 'undefined' && endpointUUID != null) {
        var session = RtcommSessions.getSession(endpointUUID);
        if (session != null)
          return (session.iFrameURL);
        else
          return (null);
      } else
        return (null);
    }

    function putIframeURL(endpointUUID, newUrl) {


      $log.debug('RtcommService: putIframeURL: endpointUUID: ' + endpointUUID + ' newURL: ' + newUrl);
      var endpoint = myEndpointProvider.getRtcommEndpoint(endpointUUID);

      if (endpoint != null) {
        var session = RtcommSessions.getSession(endpointUUID);

        if (session === null) session = RtcommSessions.createSession(endpointUUID);
        session.iFrameURL = newUrl;

        var message = {
          type: 'iFrameURL',
          iFrameURL: newUrl
        };

        $log.debug('RtcommService: putIframeURL: sending new iFrame URL');
        endpoint.sendOneTimeMessage(message);
      }
    }

    function placeCall(calleeID, mediaToEnable) {

      //Create new endpoint
      var endpoint = _getEndpoint();

      if (mediaToEnable.indexOf('chat') > -1)
        endpoint.chat.enable();

      if (mediaToEnable.indexOf('webrtc') > -1) {
        // Support turning off trickle ICE
        var trickleICE = true;
        if (mediaToEnable.indexOf('disableTrickleICE') > -1) {
          trickleICE = false;
        }
        endpoint.webrtc.enable({
          'trickleICE': trickleICE
        });
      }
      _setActiveEndpoint(endpoint.id);
      endpoint.connect(calleeID);
      return (endpoint.id);
    }

    function getSessions() {
      return RtcommSessions.getAllSessions();
    }

    function endCall(endpoint) {
      endpoint.disconnect();
    }

    function setActiveEndpoint(endpointID) {
      _setActiveEndpoint(endpointID);
    }

    function getActiveEndpoint() {
      return _getActiveEndpointUUID();
    }

    function getRemoteEndpoint(localEndpointID) {


      var remoteEndpointID = null;

      if (localEndpointID != null) {
        var session = RtcommSessions.getSession(localEndpointID);

        if (session != null) {
          remoteEndpointID = session.remoteEndpointID;
        }
      }

      return (remoteEndpointID);
    }

    function setDefaultViewSelector() {

      _selfView = 'selfView';
      _remoteView = 'remoteView';
    }

    function setViewSelector(selfView, remoteView) {
      _selfView = selfView;
      _remoteView = remoteView;
    }

    function setVideoView(endpointUUID) {

      $log.debug('rtcommVideo: setting local media');
      var endpoint = null;

      if (typeof endpointUUID !== 'undefined' && endpointUUID !== null)
        endpoint = _getEndpoint(endpointUUID);
      else if (_getActiveEndpointUUID() != null)
        endpoint = _getEndpoint(_getActiveEndpointUUID());

      if (endpoint != null) {
        $log.debug(endpoint);
        endpoint.webrtc.setLocalMedia({
          mediaOut: document.querySelector('#' + _selfView),
          mediaIn: document.querySelector('#' + _remoteView)
        });
      }
    }
  }
})();

(function() {
  'use strict';

  angular
    .module('angular-rtcomm-service')
    .factory('RtcommSessions', RtcommSessions);

  /* @ngInject */
  function RtcommSessions($log) {
    var service = {
      getAllSessions: getAllSessions,
      createSession: createSession,
      getSession: getSession,
      updateSession: updateSession,
      removeSession: removeSession

    };

    var sessions = [];
    return service;

    ////////////////

    function getAllSessions() {
      return sessions;
    }

    function removeAllSessions() {

      sessions.forEach(function(session) {
        removeSession(session.endpointUUID);
      });
    }

    function getSession(endpointUUID) {
      $log.debug('Retrieving session linked to EndpointUUID: ' + endpointUUID);

      var session = null;
      sessions.forEach(function(_session) {
        if (_session.endpointUUID === endpointUUID) {
          session = _session;
        }
      });

      return session;
    }

    function createSession(endpointUUID) {
      $log.debug('Creating a session for EndpointUUID: ' + endpointUUID);

      var session;

      /* Define a session */
      session = {

        endpointUUID: endpointUUID,
        remoteEndpointID: null,
        chats: [],
        webrtcConnected: false,
        started: false,
        state: 'session:stopped',
        activated: true,
        iFrameURL: 'about:blank',
      };
      sessions.push(session);
      return session;

    }

    function updateSession(endpointUUID, config) {

      $log.debug('Updating session for EndpointUUID: ' + endpointUUID);

      var session = getSession(endpointUUID);

      if (typeof session === 'undefined')
        $log.debug('Unable to update endpoint due to it not existing');
      else {

        for (var property in session) {
          if (session.hasOwnProperty(property)) {

            session[property] = typeof config[property] !== 'undefined' ? config[property] : session[property];
          }
        }
      }

      return session;

    }

    function removeSession(endpointUUID) {
      $log.debug('Destroy session for EndpointUUID: ' + endpointUUID);
      var session;
      for (var i = 0; i < sessions.length; i++) {
        session = sessions[i];

        if (session.endpointUUID === endpointUUID) {
          sessions.splice(i, 1);

          $log.debug('Session with endpointUUID === ' + endpointUUID + 'has been removed');
          break;
        }
      }

      if (session === null) {
        $log.debug('Unable to destroy session due to it not existing');
      }
      return session;

    }


  }
  RtcommSessions.$inject = ["$log"];
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */
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

(function() {
  'use strict';

  angular
    .module('angular-rtcomm-ui')
    .controller('RtcommConfigController', RtcommConfigController);

  RtcommConfigController.$inject = ['RtcommService', '$http', '$scope', '$log'];

  /* @ngInject */
  function RtcommConfigController(RtcommService, $http, $scope, $log) {
    var vm = this;
    vm.extendedConfig = null;

    $log.debug('RtcommConfigController: configURL = ' + vm.configURL);

    $scope.init = function(configURL, extendedConfig) {

      $log.debug('RtcommConfigController: initing configURL = ' + configURL);
      vm.configURL = configURL;

      if (typeof extendedConfig !== 'undefined')
        vm.extendedConfig = extendedConfig;

      vm.getConfig();
    };

    vm.getConfig = function() {
      $http.get(vm.configURL).success(function(config) {

        // Now we need to update the config with any extensions passed in on init.
        if (vm.extendedConfig != null) {
          angular.extend(config, vm.extendedConfig);
          $log.debug('RtcommConfigController: extended config object: ' + config);
        }

        RtcommService.setConfig(config);
      }).error(function(data, status, headers, config) {
        $log.debug('RtcommConfigController: error accessing config: ' + status);
      });
    };
  }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommAlert', rtcommAlert);

    /* @ngInject */
    function rtcommAlert() {
        var directive = {
            restrict: 'E',
            templateUrl: "templates/rtcomm/rtcomm-alert.html",
            controller: AlertController,
            controllerAs: 'alertVM',
            bindToController: true
        };

        return directive;
    }

    AlertController.$inject = ['$scope', '$log'];

    /* @ngInject */
    function AlertController($scope, $log) {
        var vm = this;
        vm.alerts = [];
        vm.addAlert = function(alert) {
          vm.alerts.push(alert);
        };
        vm.closeAlert = function(index) {
          vm.alerts.splice(index, 1);
        };
        $scope.$on('rtcomm::alert', function(event, eventObject) {
          vm.addAlert(eventObject);
        });
    }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

/**
 * This directive manages call queues. It provides the ability to display all the available queues
 * (along with their descriptions) and by clicking on a queue, allows an agent (or any type of user)
 * to subscribe on that queue.
 */
(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommQueues', rtcommQueues);

    /* @ngInject */
    function rtcommQueues() {
        var directive = {
            restrict: 'E',
            templateUrl: 'templates/rtcomm/rtcomm-queues.html',
            controller: QueuesController,
            controllerAs: 'queuesVM',
            bindToController: true
        };

        return directive;

    }

    QueuesController.$inject = ['RtcommService', '$scope', '$log'];

    /* @ngInject */
    function QueuesController(RtcommService, $scope, $log) {
        var vm = this;

        vm.rQueues = [];
        vm.autoJoinQueues = false;
        vm.queuePresenceData = [];
        vm.queuePublishPresence = false;
        vm.queueFilter = null;

        /**
         * autoJoinQueues - automatically join any queues that are not filtered out
         * queuePublishedPresence - will add to the presence document information about what queues this person joins.
         * queueFilter - If defined, this specifies which queues should be joined. All others will be ignored.
         */
        $scope.init = function(autoJoinQueues, queuePublishPresence, queueFilter) {
            $log.debug('rtcommQueues: autoJoinQueues = ' + autoJoinQueues);
            vm.autoJoinQueues = autoJoinQueues;
            vm.queuePublishPresence = queuePublishPresence;
            if (typeof queueFilter !== "undefined")
                vm.queueFilter = queueFilter;
        };

        //
        vm.filterOutQueue = function(queue) {
            var returnValue = true;

            if (vm.queueFilter != null) {

                for (var index = 0; index < vm.queueFilter.length; ++index) {
                    var entry = vm.queueFilter[index];
                    if (entry == queue.endpointID) {
                        returnValue = false;
                        break;
                    }
                }
            } else
                returnValue = false;

            return (returnValue);
        };

        vm.onQueueClick = function(queue) {
            $log.debug('rtcommQueues: onClick: TOP');
            for (var index = 0; index < vm.rQueues.length; index++) {
                if (vm.rQueues[index].endpointID === queue.endpointID) {
                    $log.debug('rtcommQueues: onClick: queue.endpointID = ' + queue.endpointID);

                    if (queue.active == false) {
                        RtcommService.joinQueue(queue.endpointID);
                        vm.rQueues[index].active = true;
                    } else {
                        RtcommService.leaveQueue(queue.endpointID);
                        vm.rQueues[index].active = false;
                    }
                } else if (index == (vm.rQueues.length - 1)) {
                    $log.debug('rtcommQueues: ERROR: queue.endpointID: ' + queue.endpointID + ' not found in list of queues');

                }
            }

            vm.updateQueuePresence();
        };

        vm.updateQueuePresence = function() {
            //	Update the presence record if enabled
            if (vm.queuePublishPresence == true) {
                RtcommService.removeFromPresenceRecord(vm.queuePresenceData, false);

                vm.queuePresenceData = [];

                for (var index = 0; index < vm.rQueues.length; index++) {
                    if (vm.rQueues[index].active === true) {
                        vm.queuePresenceData.push({
                            'name': "queue",
                            'value': vm.rQueues[index].endpointID
                        });
                    }
                }

                RtcommService.addToPresenceRecord(vm.queuePresenceData);
            }
        }

        $scope.$on('queueupdate', function(event, queues) {
            $log.debug('rtcommQueues: scope queues', vm.rQueues);
            Object.keys(queues).forEach(function(key) {
                $log.debug('rtcommQueues: Push queue: ' + queues[key]);
                $log.debug('rtcommQueues: autoJoinQueues: ' + vm.autoJoinQueues);

                //	Check to make sure queue is not filteres out before adding it.
                if (vm.filterOutQueue(queues[key]) == false) {
                    vm.rQueues.push(queues[key]);
                    // If autoJoin we go ahead and join the queue as soon as we get the queue update.
                    if (vm.autoJoinQueues == true) {
                        vm.onQueueClick(queues[key]);
                    }
                }
            });

            vm.updateQueuePresence();
        });

        $scope.$on('rtcomm::init', function(event, success, details) {
            if (success == false) {
                $log.debug('rtcommQueues: init: clear queues');
                vm.rQueues = [];
            }
        });

    }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

/**
 * This directive is used to manage the registration of an endpoint provider. Since the registered name can only
 * be set on initialization of the endpoint provider, this directive actually controls the initialization of the
 * provider. Note that the endpoint provider must be initialized before any sessions can be created or received.
 */
(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommRegister', rtcommRegister);

    /* @ngInject */
    function rtcommRegister() {
        var directive = {
            restrict: 'E',
            templateUrl: 'templates/rtcomm/rtcomm-register.html',
            controller: RegisterController,
            controllerAs: 'registerVM',
            bindToController: true
        };

        return directive;

    }

    RegisterController.$inject = ['RtcommService', '$scope', '$log'];

    // /* @ngInject */
    function RegisterController(RtcommService, $scope, $log) {
        var vm = this;

        vm.nextAction = 'Register';
        vm.reguserid = '';
        vm.invalid = false;

        var invalidCharacters = /(\$|#|\+|\/|\\)+/i; //Invalid characters for MQTT Topic Path

        vm.onRegClick = function() {
            if (vm.nextAction === 'Register' && !invalidCharacters.test(vm.reguserid)) {
                $log.debug('Register: reguserid =' + vm.reguserid);
                RtcommService.register(vm.reguserid);
            } else {
                $log.debug('Unregister: reguserid =' + vm.reguserid);
                RtcommService.unregister();
            }
        };

        //Watch for changes in reguserid
        $scope.$watch(function(){ return vm.reguserid}, function() {

            if (vm.reguserid.length < 1 || invalidCharacters.test(vm.reguserid)) {
                vm.invalid = true;
            } else {
                vm.invalid = false;
            }
        });

        $scope.$on('rtcomm::init', function(event, success, details) {

            vm.nextAction = success ? 'Unregister' : 'Register';

            if (success === true) {
                vm.reguserid = details.userid;
            } else {
                if (details === 'destroyed')
                    vm.reguserid = '';
                else
                    vm.reguserid = 'Init failed:' + details;
            }
        });
    }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

/**
 * This directive is used to manage multiple sessions. If you are only supporting at most one session you wont need
 * this directive. The associated template provides a way to switch between active sessions. The session must be in
 * the started state to be managed by this directive and is removed when the session stops.
 */

(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommSessionManager', rtcommSessionManager);

    /* @ngInject */
    function rtcommSessionManager() {
        var directive = {
            restrict: 'E',
            templateUrl: 'templates/rtcomm/rtcomm-sessionmgr.html',
            controller: SessionManagerController,
            controllerAs: 'sessionMgrVM',
            bindToController: true
        };

        return directive;

        function linkFunc(scope, el, attr, ctrl) {

        }
    }

    SessionManagerController.$inject = ['RtcommService', '$scope', '$log'];

    /* @ngInject */
    function SessionManagerController(RtcommService, $scope, $log) {
        var vm = this;
        vm.sessions = RtcommService.getSessions();
        vm.sessMgrActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.publishPresence = false;
        vm.sessionPresenceData = [];

        $scope.init = function(publishPresence) {
            vm.publishPresence = publishPresence;
            vm.updatePresence();
        };

        vm.activateSession = function(endpointUUID) {
            $log.debug('rtcommSessionmgr: activateEndpoint =' + endpointUUID);
            if (vm.sessMgrActiveEndpointUUID !== endpointUUID) {
                RtcommService.setActiveEndpoint(endpointUUID);
            }
        };

        vm.updatePresence = function() {
            //	Update the presence record if enabled
            if (vm.publishPresence === true) {
                RtcommService.removeFromPresenceRecord(vm.sessionPresenceData, false);

                vm.sessionPresenceData = [{
                    'name': "sessions",
                    'value': String(vm.sessions.length)
                }];

                RtcommService.addToPresenceRecord(vm.sessionPresenceData);
            }
        }

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            $log.debug('rtcommSessionmgr: endpointActivated =' + endpointUUID);
            vm.sessMgrActiveEndpointUUID = endpointUUID;
        });

        $scope.$on('session:started', function(event, eventObject) {
            $log.debug('rtcommSessionmgr: session:started: uuid =' + eventObject.endpoint.id);

            vm.updatePresence();
        });
    }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */
(function() {
  'use strict';

  angular
    .module('angular-rtcomm-ui')
    .controller('RtcommEndpointController', RtcommEndpointController);

  RtcommEndpointController.$inject = ['RtcommService', '$scope', '$log'];

  /* @ngInject */
  function RtcommEndpointController(RtcommService, $scope, $log) {
    $scope.epCtrlActiveEndpointUUID = RtcommService.getActiveEndpoint();
    $scope.epCtrlAVConnected = RtcommService.isWebrtcConnected($scope.epCtrlActiveEndpointUUID);
    $scope.sessionState = RtcommService.getSessionState($scope.epCtrlActiveEndpointUUID);

    $scope.disconnect = function() {
      $log.debug('Disconnecting call for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
      RtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).disconnect();

    };

    $scope.toggleAV = function() {
      $log.debug('Enable AV for endpoint: ' + $scope.epCtrlActiveEndpointUUID);

      if ($scope.epCtrlAVConnected == false) {
        RtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).webrtc.enable(function(value, message) {
          if (!value) {
            $log.debug('Enable failed: ', message);
            RtcommService.alert({
              type: 'danger',
              msg: message
            });
          }
        });
      } else {
        $log.debug('Disable AV for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
        RtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).webrtc.disable();
      }
    };

    $scope.$on('session:started', function(event, eventObject) {
      $log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);
      if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
        $scope.sessionState = 'session:started';
      }
    });

    $scope.$on('session:stopped', function(event, eventObject) {
      $log.debug('session:stopped received: endpointID = ' + eventObject.endpoint.id);
      if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
        $scope.sessionState = 'session:stopped';
      }
    });

    $scope.$on('session:failed', function(event, eventObject) {
      $log.debug('session:failed received: endpointID = ' + eventObject.endpoint.id);
      if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
        $scope.sessionState = 'session:failed';
      }
    });

    $scope.$on('webrtc:connected', function(event, eventObject) {
      if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id)
        $scope.epCtrlAVConnected = true;
    });

    $scope.$on('webrtc:disconnected', function(event, eventObject) {
      if ($scope.epCtrlActiveEndpointUUID == eventObject.endpoint.id)
        $scope.epCtrlAVConnected = false;
    });


    $scope.$on('endpointActivated', function(event, endpointUUID) {
      $scope.epCtrlActiveEndpointUUID = endpointUUID;
      $scope.epCtrlAVConnected = RtcommService.isWebrtcConnected(endpointUUID);
    });

    $scope.$on('noEndpointActivated', function(event) {
      $scope.epCtrlAVConnected = false;
    });
  }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

/**
 * This directive manages the chat portion of a session. The data model for chat
 * is maintained in the RtcommService. This directive handles switching between
 * active endpoints.
 */
(function() {
  'use strict';

  angular
    .module('angular-rtcomm-ui')
    .directive('rtcommChat', rtcommChat);

  rtcommChat.$inject = ['RtcommService', '$log'];

  /* @ngInject */
  function rtcommChat(RtcommService, $log) {
    var directive = {
      restrict: 'E',
      templateUrl: 'templates/rtcomm/rtcomm-chat.html',
      link: chatLink,
      controller: ChatController,
      controllerAs: 'chatVM',
      bindToController: true
    };

    return directive;

    function chatLink(scope, element, attr, ctrl) {
      var chatPanel = angular.element(element.find('.panel-body')[0]);

      var bottom = true;

      //Chooses if the scrollbar should be forced to the bottom on the next lifecycle
      ctrl.scrollToBottom = function(flag) {
        bottom = flag;
        scope.bottom = flag;

      }
      if (chatPanel.length > 0) {
        //Watch scroll events
        chatPanel.bind('scroll', function() {
          if (chatPanel.prop('scrollTop') + chatPanel.prop('clientHeight') == chatPanel.prop('scrollHeight')) {
            ctrl.scrollToBottom(true);
          } else {
            ctrl.scrollToBottom(false);
          }
        });

        //Watch the chat messages, if the scroll bar is in the bottom keep it on the bottom so the user can view incoming chat messages, else possibly send a notification and don't scroll down
        scope.$watch(function() {
          return ctrl.chats
        }, function() {
          $log.debug('rtcommChat - Link > $watch on chats called');
          if (bottom) {
            chatPanel.scrollTop(chatPanel.prop('scrollHeight'));
          } else {
            //In this else, a notification could be sent
          }
        }, true);

      }
    }

  }

  //Controller should be used to listen for events from Rtcmo
  ChatController.$inject = ['$scope', 'RtcommService', '$log'];

  /* @ngInject */
  function ChatController($scope, RtcommService, $log) {
    var vm = this;

    vm.chatActiveEndpointUUID = RtcommService.getActiveEndpoint();
    vm.chats = RtcommService.getChats(vm.chatActiveEndpointUUID);

    vm.keySendMessage = function(keyEvent) {
      if (keyEvent.which === 13)
        vm.sendMessage();
    };

    vm.sendMessage = function() {
      $log.debug('rtcommChat: sendMessage() -> ' + vm.message);
      var chat = {
        time: new Date(),
        name: RtcommService.getEndpoint(vm.chatActiveEndpointUUID).getLocalEndpointID(),
        message: angular.copy(vm.message)
      };

      vm.message = '';
      vm.scrollToBottom(true);
      $scope.bottom = true;
      RtcommService.sendChatMessage(chat, vm.chatActiveEndpointUUID);
    }

    $scope.$on('endpointActivated', function(event, endpointUUID) {
      $log.debug('rtcommChat: endpointActivated =' + endpointUUID);

      //	The data model for the chat is maintained in the RtcommService.
      vm.chats = RtcommService.getChats(endpointUUID);
      vm.chatActiveEndpointUUID = endpointUUID;
    });

    $scope.$on('noEndpointActivated', function(event) {
      vm.chats = [];
      vm.chatActiveEndpointUUID = null;
    });
  }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

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

(function() {
  'use strict';

  angular
    .module('angular-rtcomm-ui')
    .directive('rtcommEndpointStatus', rtcommEndpointStatus);

  /* @ngInject */
  function rtcommEndpointStatus() {
    var directive = {
      restrict: 'E',
      templateUrl: 'templates/rtcomm/rtcomm-endpoint-status.html',
      controller: EndpointStatusController,
      controllerAs: 'endpointStatusVM',
      bindToController: true
    };

    return directive;
  }

  EndpointStatusController.$inject = ['RtcommService', '$scope', '$log'];

  /* @ngInject */
  function EndpointStatusController(RtcommService, $scope, $log) {
    var vm = this;
    vm.epCtrlActiveEndpointUUID = RtcommService.getActiveEndpoint();
    vm.epCtrlRemoteEndpointID = RtcommService.getRemoteEndpoint(vm.epCtrlActiveEndpointUUID);
    vm.sessionState = RtcommService.getSessionState(vm.epCtrlActiveEndpointUUID);
    vm.failureReason = '';
    vm.queueCount = 0; //TODO FIX: Currently not implemented!

    $scope.$on('session:started', function(event, eventObject) {
      $log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);
      if (vm.epCtrlActiveEndpointUUID === eventObject.endpoint.id) {
        vm.sessionState = 'session:started';
        vm.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
      }
    });

    $scope.$on('session:stopped', function(event, eventObject) {
      $log.debug('session:stopped received: endpointID = ' + eventObject.endpoint.id);
      if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
        vm.sessionState = 'session:stopped';
        vm.epCtrlRemoteEndpointID = null;
      }
    });

    $scope.$on('session:failed', function(event, eventObject) {
      $log.debug('session:failed received: endpointID = ' + eventObject.endpoint.id);
      if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
        vm.sessionState = 'session:failed';
        vm.failureReason = eventObject.reason;
        vm.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
      }
    });

    $scope.$on('session:alerting', function(event, eventObject) {
      $log.debug('session:alerting received: endpointID = ' + eventObject.endpoint.id);
      if (vm.epCtrlActiveEndpointUUID != eventObject.endpoint.id) {
        vm.sessionState = 'session:alerting';
        vm.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
      }
    });

    $scope.$on('session:connecting', function(event, eventObject) {
      $log.debug('session:connecting received: endpointID = ' + eventObject.endpoint.id);
      // if ($scope.epCtrlActiveEndpointUUID != eventObject.endpoint.id){
      vm.sessionState = 'session:connecting';
      vm.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
      // }
    });


    $scope.$on('session:queued', function(event, eventObject) {
      $log.debug('session:queued received: endpointID = ' + eventObject.endpoint.id);
      if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
        vm.sessionState = 'session:queued';
        vm.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
      }
    });

    $scope.$on('session:trying', function(event, eventObject) {
      $log.debug('session:trying received: endpointID = ' + eventObject.endpoint.id);
      if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
        vm.sessionState = 'session:trying';
        vm.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
      }
    });

    $scope.$on('session:ringing', function(event, eventObject) {
      $log.debug('session:ringing received: endpointID = ' + eventObject.endpoint.id);
      if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
        vm.sessionState = 'session:ringing';
        vm.epCtrlRemoteEndpointID = eventObject.endpoint.getRemoteEndpointID();
      }
    });

    $scope.$on('endpointActivated', function(event, endpointUUID) {
      vm.epCtrlActiveEndpointUUID = endpointUUID;
      vm.epCtrlRemoteEndpointID = RtcommService.getEndpoint(endpointUUID).getRemoteEndpointID();
      vm.sessionState = RtcommService.getSessionState(endpointUUID);
    });

    $scope.$on('noEndpointActivated', function(event) {
      vm.epCtrlRemoteEndpointID = null;
      vm.sessionState = 'session:stopped';
    });

    $scope.$on('rtcomm::init', function(event, success, details) {
      if (success === true) {
        vm.epCtrlActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.epCtrlRemoteEndpointID = RtcommService.getRemoteEndpoint(vm.epCtrlActiveEndpointUUID);
        vm.sessionState = RtcommService.getSessionState(vm.epCtrlActiveEndpointUUID);
        vm.failureReason = '';
      }
      if (success == false) {
        vm.sessionState = 'session:stopped';
        vm.epCtrlRemoteEndpointID = null;
      }
    });
  }

})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */
(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommIframe', rtcommIframe);

    /* @ngInject */
    function rtcommIframe() {
        var directive = {
            restrict: 'E',
            templateUrl: "templates/rtcomm/rtcomm-iframe.html",
            controller: IFrameController,
            controllerAs: 'iframeVM',
            bindToController: true
        };

        return directive;
    }

    IFrameController.$inject = ['RtcommService', '$sce', '$location', '$window','$scope', '$log'];

    /* @ngInject */
    function IFrameController(RtcommService, $sce, $location, $window, $scope, $log) {
        var vm = this;
        vm.iframeActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.iframeURL = null;
        vm.initiframeURL = null;
        vm.syncSource = false;

        /*
         * syncSourcing means you a providing the URL source but no UI. Typically used in
         * customer/agent scenarios.
         */
        $scope.init = function(syncSource) {
            if (syncSource === true) {
                vm.syncSource = true;
                vm.initiframeURL = $location.absUrl(); // init to current URL
            }
        };


        vm.setURL = function(newURL) {
            $log.debug('rtcommIframe: setURL: newURL: ' + newURL);
            RtcommService.putIframeURL(vm.iframeActiveEndpointUUID, newURL);
            vm.iframeURL = $sce.trustAsResourceUrl(newURL);
        };

        vm.forward = function() {};

        vm.backward = function() {};

        $scope.$on('session:started', function(event, eventObject) {
            $log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);

            if (vm.syncSource == true) {
                RtcommService.putIframeURL(eventObject.endpoint.id, vm.initiframeURL); //Update on the current or next endpoint to be activated.
            }
        });

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            $log.debug('rtcommIframe: endpointActivated =' + endpointUUID);

            if (vm.syncSource == false) {
                vm.iframeURL = $sce.trustAsResourceUrl(RtcommService.getIframeURL(endpointUUID));
                vm.iframeActiveEndpointUUID = endpointUUID;
            }
        });

        $scope.$on('noEndpointActivated', function(event) {
            if (vm.syncSource == false) {
                vm.iframeURL = $sce.trustAsResourceUrl('about:blank');
                vm.iframeActiveEndpointUUID = null;
            }
        });

        $scope.$on('rtcomm::iframeUpdate', function(eventType, endpointUUID, url) {
            if (vm.syncSource === false) {
                $log.debug('rtcomm::iframeUpdate: ' + url);
                //	This is needed to prevent rtcomm from logging in when the page is loaded in the iFrame.
                url = url + "?disableRtcomm=true";
                vm.iframeURL = $sce.trustAsResourceUrl(url);
            } else {
                $log.debug('rtcomm::iframeUpdate: load this url in a new tab: ' + url);
                // In this case we'll open the pushed URL in a new tab.
                $window.open($sce.trustAsResourceUrl(url), '_blank');
            }
        });
    }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

/**
 * This directive manages the WebRTC video screen, including both the self view and the remote view. It
 * also takes care of switching state between endpoints based on which endpoint is "actively" being viewed.
 */

(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommVideo', rtcommVideo)
	.controller('RtcommVideoController', VideoController);
    /* @ngInject */
    function rtcommVideo() {
        var directive = {
            restrict: 'E',
            templateUrl: 'templates/rtcomm/rtcomm-video.html',
            controller: VideoController,
            controllerAs: 'videoVM',
            bindToController: true
        };

        return directive;
    }

    VideoController.$inject = ['RtcommService', '$scope', '$log'];

    // /* @ngInject */
    function VideoController(RtcommService, $scope, $log) {
        var vm = this;
        $log.debug('VideoController Starting');
        vm.avConnected = RtcommService.isWebrtcConnected(RtcommService.getActiveEndpoint());
        // $scope.init = function(selfView, remoteView) {
        //     RtcommService.setViewSelector(selfView, remoteView);
        //
        //     var videoActiveEndpointUUID = RtcommService.getActiveEndpoint();
        //     if (typeof videoActiveEndpointUUID !== "undefined" && videoActiveEndpointUUID != null)
        //         RtcommService.setVideoView(videoActiveEndpointUUID);
        // };

        // Go ahead and initialize the local media here if an endpoint already exist.
        var videoActiveEndpointUUID = RtcommService.getActiveEndpoint();
        if (typeof videoActiveEndpointUUID !== "undefined" && videoActiveEndpointUUID != null){
          RtcommService.setVideoView(videoActiveEndpointUUID);

        }

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            //	Not to do something here to show that this button is live.
            $log.debug('rtcommVideo: endpointActivated =' + endpointUUID);
            RtcommService.setVideoView(endpointUUID);
            vm.avConnected = RtcommService.isWebrtcConnected(RtcommService.getActiveEndpoint());
        });
        // //
        // $scope.$on('noEndpointActivated', function(event) {
        //     vm.avConnected = false;
        // });
        //
        // $scope.$on('webrtc:connected', function(event, eventObject) {
        //     if (RtcommService.getActiveEndpoint() == eventObject.endpoint.id)
        //         vm.avConnected = true;
        // });
        //
        // $scope.$on('webrtc:disconnected', function(event, eventObject) {
        //     if (RtcommService.getActiveEndpoint() == eventObject.endpoint.id)
        //         vm.avConnected = false;
        // });
    }
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

/**
 * This modal is displayed on receiving an inbound call. It handles the alerting event.
 * Note that it can also auto accept requests for enabling A/V.
 */

(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .controller('RtcommAlertModalController', RtcommAlertModalController)
        .controller('RtcommAlertModalInstanceController', RtcommAlertModalInstanceController);

    RtcommAlertModalController.$inject = ['RtcommService', '$uibModal', '$rootScope', '$scope', '$log'];

    /* @ngInject */
    function RtcommAlertModalController(RtcommService, $uibModal, $rootScope, $scope, $log) {
        var vm = this;
        vm.alertingEndpointUUID = null;
        vm.autoAnswerNewMedia = false;
        vm.alertActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.caller = null;

        vm.showAlerting = function(size) {

            var modalInstance = $uibModal.open({
                templateUrl: 'templates/rtcomm/rtcomm-modal-alert.html',
                controller: 'RtcommAlertModalInstanceController',
                size: size,
                backdrop: 'static',
                resolve: {
                    caller: function() {
                        return vm.caller;
                    }
                }
            });

            modalInstance.result.then(
                function() {
                    var alertingEndpointObject = RtcommService.getEndpoint(vm.alertingEndpointUUID);

                    if (alertingEndpointObject) {
                        $log.debug('Accepting call from: ' + vm.caller + ' for endpoint: ' + vm.alertingEndpointUUID);
                        alertingEndpointObject.accept();
                        $rootScope.$broadcast('rtcomm::alert-success');
                        alertingEndpointObject = null;
                    }
                },
                function() {
                    var alertingEndpointObject = RtcommService.getEndpoint(vm.alertingEndpointUUID);
                    if (alertingEndpointObject) {
                        $log.debug('Rejecting call from: ' + vm.caller + ' for endpoint: ' + vm.alertingEndpointUUID);
                        alertingEndpointObject.reject();
                        alertingEndpointObject = null;
                    }
                });
        };

        $scope.init = function(autoAnswerNewMedia) {
            $log.debug('rtcommAlert: autoAnswerNewMedia = ' + autoAnswerNewMedia);
            vm.autoAnswerNewMedia = autoAnswerNewMedia;
        };

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            vm.alertActiveEndpointUUID = endpointUUID;
        });

        $scope.$on('session:alerting', function(event, eventObject) {

            if ((vm.alertActiveEndpointUUID == eventObject.endpoint.id && vm.autoAnswerNewMedia == false) ||
                (vm.alertActiveEndpointUUID != eventObject.endpoint.id)) {
                $log.debug('rtcommAlert: display alterting model: alertActiveEndpointUUID = ' + eventObject.endpoint + ' autoAnswerNewMedia = ' + vm.autoAnswerNewMedia);
                vm.caller = eventObject.endpoint.getRemoteEndpointID();
                vm.alertingEndpointUUID = eventObject.endpoint.id;
                vm.showAlerting();
            } else {
                $log.debug('Accepting media from: ' + eventObject.endpoint.getRemoteEndpointID() + ' for endpoint: ' + eventObject.endpoint.id);
                eventObject.endpoint.accept();
            }
        });

    }

    RtcommAlertModalInstanceController.$inject = ['$scope', '$uibModalInstance', '$log', 'caller'];

    function RtcommAlertModalInstanceController($scope, $uibModalInstance, $log, caller) {
    	$scope.caller = caller;
    	$scope.ok = function () {
    		$log.debug('Accepting alerting call');
    		$uibModalInstance.close();
    	};

    	$scope.cancel = function () {
    		$log.debug('Rejecting alerting call');
    		$uibModalInstance.dismiss('cancel');

    	};
    };
})();

/**
 * (C) Copyright IBM Corporation 2015.
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
 */

/**
 * This is a modal controller for placing an outbound call to a static callee such as a queue.
 */
(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .controller('RtcommCallModalController', RtcommCallModalController)
        .controller('RtcommCallModalInstanceController', RtcommCallModalInstanceController);

    RtcommCallModalController.$inject = ['RtcommService', '$uibModal', '$scope', '$log'];

    /* @ngInject */
    function RtcommCallModalController(RtcommService, $uibModal, $scope, $log){
        var vm = this;
        vm.calleeID = null;
        vm.callerID = null;

        vm.enableCallModel = false;
        vm.mediaToEnable = ['chat'];

        vm.init = function(calleeID, mediaToEnable) {
            vm.calleeID = calleeID;

            if (typeof mediaToEnable !== "undefined")
                vm.mediaToEnable = mediaToEnable;
        };

        vm.placeCall = function(size) {

            var modalInstance = $uibModal.open({
                templateUrl: 'templates/rtcomm/rtcomm-modal-call.html',
                controller: 'RtcommCallModalInstanceController',
                size: size,
                resolve: {}
            });

            modalInstance.result.then(
                function(resultName) {
                    $log.debug('rtcommCallModal: Calling calleeID: ' + vm.calleeID);
                    $log.debug('rtcommCallModal: CallerID: ' + resultName);

                    //	This is used to set an alias when the endoint is not defined.
                    if (vm.callerID == null && (typeof resultName !== "undefined") && resultName != '') {
                        vm.callerID = resultName;
                        RtcommService.setAlias(resultName);
                    }

                    RtcommService.placeCall(vm.calleeID, vm.mediaToEnable);
                },
                function() {
                    $log.info('Modal dismissed at: ' + new Date());
                });
        };

        $scope.$on('rtcomm::init', function(event, success, details) {
            $log.debug('RtcommCallModalController: rtcomm::init: success = ' + success);
            if (success == true)
                vm.enableCallModel = true;
            else
                vm.enableCallModel = false;
        });

        $scope.$on('session:started', function(event, eventObject) {
            vm.enableCallModel = false;
        });

        $scope.$on('session:stopped', function(event, eventObject) {
            vm.enableCallModel = true;
        });

    }

    function RtcommCallModalInstanceController($scope, $uibModalInstance, RtcommService) {
        $scope.endpointAlias = '';
        $scope.ok = function() {
            $uibModalInstance.close($scope.endpointAlias);
        };
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        };
    }
    RtcommCallModalInstanceController.$inject = ["$scope", "$uibModalInstance", "RtcommService"];;

})();
angular.module('angular-rtcomm-ui').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/rtcomm/rtcomm-alert.html',
    "<div class=\"row\"><uib-alert ng-repeat=\"alert in alertVM.alerts\" type=\"{{alert.type}}\" close=\"alertVM.closeAlert($index)\">{{alert.msg}}</uib-alert></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-chat.html',
    "<div><div class=\"panel panel-primary vertical-stretch\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-comment\"></span> Chat</div><div class=\"panel-body\"><ul class=\"chat\"><li class=\"right clearfix\" ng-repeat=\"chat in chatVM.chats\"><div id=\"{{$index}}\" class=\"header\"><strong class=\"primary-font\">{{chat.name}}</strong> <small class=\"pull-right text-muted\">{{chat.time | date:'HH:mm:ss'}}</small></div><p>{{chat.message}}</p></li></ul></div><div class=\"panel-footer\"><div class=\"input-group\"><input id=\"chat-input\" type=\"text\" class=\"form-control input-sm\" placeholder=\"Type your message here...\" type=\"text\" ng-model=\"chatVM.message\" ng-keypress=\"chatVM.keySendMessage($event)\"> <span class=\"input-group-btn\"><button class=\"btn btn-primary btn-sm\" id=\"btn-chat\" ng-click=\"chatVM.sendMessage()\" focusinput=\"true\" ng-disabled=\"(chatVM.chatActiveEndpointUUID == null)\">Send</button></span></div></div></div></div><!-- chat list ng-controller div -->"
  );


  $templateCache.put('templates/rtcomm/rtcomm-endpoint-status.html',
    "<div class=\"endpoint-status\"><p class=\"endpoint-controls-title navbar-text pull-right\" ng-switch on=\"endpointStatusVM.sessionState\"><span ng-switch-when=\"session:started\">Connected to {{endpointStatusVM.epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:stopped\">No active sessions, waiting...</span> <span ng-switch-when=\"session:alerting\">Inbound call from {{endpointStatusVM.epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:trying\">Attempting to call {{endpointStatusVM.epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:ringing\">Call to {{endpointStatusVM.epCtrlRemoteEndpointID}} is ringing</span> <span ng-switch-when=\"session:queued\">Waiting in queue at: {{endpointStatusVM.queueCount}}</span> <span ng-switch-when=\"session:failed\">Call failed with reason: {{endpointStatusVM.failureReason}}</span> <span ng-switch-when=\"session:connecting\">Connecting to {{endpointStatusVM.epCtrlRemoteEndpointID}} ...</span></p></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-iframe.html',
    "<div><div class=\"panel panel-primary vertical-stretch\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-link\"></span> URL Sharing</div><div class=\"rtcomm-iframe\"><iframe width=\"100%\" height=\"100%\" ng-src=\"{{iframeVM.iframeURL}}\"></iframe></div><div class=\"row\"><div class=\"col-lg-2\"><button id=\"btnBackward\" class=\"btn btn-primary\" ng-click=\"iframeVM.backward()\" focusinput=\"true\" ng-disabled=\"(iframeVM.iframeUrl == null)\"><span class=\"glyphicon glyphicon-arrow-left\" aria-hidden=\"true\" aria-label=\"Backward\"></span> Backward</button></div><div class=\"col-lg-2\"><button id=\"btnForward\" class=\"btn btn-primary\" ng-click=\"iframeVM.forward()\" ng-disabled=\"(iframeVM.iframeUrl == null)\"><span class=\"glyphicon glyphicon-arrow-right\" aria-hidden=\"true\" aria-label=\"Forward\"></span> Forward</button></div><div class=\"col-lg-8\"><div class=\"input-group\"><input id=\"setUrl\" type=\"text\" class=\"form-control\" type=\"text\" ng-model=\"iframeVM.newUrl\"><span class=\"input-group-btn\"><button class=\"btn btn-primary\" id=\"btn-send-url\" ng-click=\"iframeVM.setURL(iframeVM.newUrl)\" focusinput=\"true\">Set URL</button></span></div><!-- /input-group --></div></div></div></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-modal-alert.html',
    "<div class=\"modal-header\"><button type=\"button\" class=\"close\" ng-click=\"close(false)\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button><h4 class=\"modal-title\">New call alert</h4></div><div class=\"modal-body\"><p>Do you want to accept a call from {{caller}}.</p></div><div class=\"modal-footer\"><button type=\"button\" ng-click=\"ok()\" class=\"btn btn-default\" data-dismiss=\"modal\">Yes</button> <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-primary\" data-dismiss=\"modal\">No</button></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-modal-call.html',
    "<div class=\"modal-header\"><button type=\"button\" class=\"close\" ng-click=\"close(false)\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button><h4 class=\"modal-title\">Get Help</h4></div><div class=\"modal-body\"><p>To help us serve you better, please provide some information before we begin.</p><form class=\"form-horizontal\" role=\"form\"><div class=\"form-group\"><label for=\"name\" class=\"col-sm-2 control-label\">Name</label><div class=\"col-sm-10\"><input type=\"text\" class=\"form-control\" id=\"name\" placeholder=\"Your Name\" ng-model=\"endpointAlias\"></div></div></form></div><div class=\"modal-footer\"><button type=\"button\" ng-click=\"ok()\" class=\"btn btn-default\" data-dismiss=\"modal\">Connect</button> <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-default\" data-dismiss=\"modal\">Cancel</button></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-queues.html',
    "<div><div class=\"panel panel-primary\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-sort-by-attributes-alt\"></span> Queues</div><div class=\"queueContainer\"><button type=\"button\" ng-class=\"{'btn btn-primary btn-default btn-block': queue.active, 'btn btn-default btn-default btn-block': !queue.active}\" ng-repeat=\"queue in queuesVM.rQueues\" ng-click=\"queuesVM.onQueueClick(queue)\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"{{queue.description}}\">{{queue.active ? 'Leave' : 'Join'}} {{queue.endpointID}}</button></div></div></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-register.html',
    "<div><div class=\"panel panel-primary\"><div class=\"input-group\"><input id=\"register-input\" type=\"text\" class=\"form-control input-sm\" placeholder=\"Enter your ID here...\" type=\"text\" ng-model=\"registerVM.reguserid\" ng-disabled=\"(registerVM.nextAction=='Unregister')\"><span class=\"input-group-btn\"><button class=\"btn btn-primary btn-sm\" id=\"btn-register\" ng-click=\"registerVM.onRegClick(registerVM.reguserid)\" ng-disabled=\"registerVM.invalid\" focusinput=\"true\">{{registerVM.nextAction}}</button></span></div></div></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-sessionmgr.html',
    "<div class=\"session-manager\"><div class=\"btn-group pull-left\" style=\"padding: 10px\"><div><button class=\"session-manager-button\" type=\"button\" ng-switch on=\"session.activated\" ng-class=\"{'btn btn-primary btn-sm': session.activated, 'btn btn-default btn-sm': !session.activated}\" ng-repeat=\"session in sessionMgrVM.sessions\" ng-click=\"sessionMgrVM.activateSession(session.endpointUUID)\"><span class=\"glyphicon glyphicon-eye-open\" aria-hidden=\"true\" ng-switch-when=\"true\"></span> <span class=\"glyphicon glyphicon-eye-close\" aria-hidden=\"true\" ng-switch-when=\"false\"></span> {{session.remoteEndpointID}}</button></div></div><p class=\"session-manager-title navbar-text pull-right\">Sessions</p></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-video.html',
    "<div id=\"videoContainer\"><div id=\"selfViewContainer\"><video title=\"selfView\" id=\"selfView\" class=\"selfView\" autoplay muted></video></div><video title=\"remoteView\" id=\"remoteView\" class=\"remoteView\" autoplay></video><!-- video title=\"remoteView\" id=\"remoteView\" class=\"remoteView\" autoplay=\"true\" poster=\"../views/rtcomm/images/video_camera_big.png\"></video --></div>"
  );

}]);
angular.module('angular-rtcomm-presence').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/rtcomm/rtcomm-presence.html',
    "<div treecontrol class=\"tree-light\" tree-model=\"presenceData\" options=\"treeOptions\" on-selection=\"showSelected(node)\" expanded-nodes=\"expandedNodes\"><button type=\"button\" class=\"btn btn-primary btn-xs\" aria-label=\"Left Align\" ng-show=\"(node.record && !node.self)\" ng-click=\"onCallClick(node.name)\"><span class=\"glyphicon glyphicon-facetime-video\" aria-hidden=\"true\" aria-label=\"expand record\"></span></button> {{node.name}} {{node.value ? ': ' + node.value : ''}}</div>"
  );

}]);
