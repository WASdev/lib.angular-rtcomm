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
    .config(function($logProvider) {
      $logProvider.debugEnabled(true);
    })
    .constant('rtcomm', rtcomm)
    .factory('RtcommService', RtcommService);
  RtcommService.$inject = ['$rootScope', '$log', 'RtcommConfigService', 'rtcomm'];

  function RtcommService($rootScope, $log, RtcommConfigService, rtcomm) {
    /** Setup the endpoint provider first **/
    /*var service = {
      alert: alert,
      setKarmaTesting: setKarmaTesting,
      isInitialized: isInitialized,
      setConfig: setConfig
        /* Presence Methods */

    //}/


    var myEndpointProvider = new rtcomm.EndpointProvider();
    var endpointProviderInitialized = false;
    var queueList = null;
    var sessions = [];
    var presenceRecord = null;
    var karmaTesting = false;
    var _selfView = 'selfView'; //	Default self view
    var _remoteView = 'remoteView'; //	Default remote view

    myEndpointProvider.setLogLevel(RtcommConfigService.getRtcommDebug());
    $log.debug('rtcomm-service - endpointProvider log level is: ' + myEndpointProvider.getLogLevel());
    $log.debug('rtcomm-service - endpointProvider log level should be: ' + RtcommConfigService.getRtcommDebug());
    myEndpointProvider.setAppContext(RtcommConfigService.getProviderConfig().appContext);

    var getPresenceRecord = function() {
      if (presenceRecord == null)
        presenceRecord = {
          'state': 'available',
          userDefines: []
        };

      return (presenceRecord);
    };

    //	This defines all the media related configuration and is controlled through external config.
    var getMediaConfig = function() {

      var mediaConfig = {
        ringbacktone: RtcommConfigService.getRingBackTone(),
        ringtone: RtcommConfigService.getRingTone(),
        webrtcConfig: {
          broadcast: {
            audio: RtcommConfigService.getBroadcastAudio(),
            video: RtcommConfigService.getBroadcastVideo()
          }
        },
        webrtc: RtcommConfigService.getWebRTCEnabled(),
        chat: RtcommConfigService.getChatEnabled(),
      };

      return (mediaConfig);
    };

    myEndpointProvider.on('reset', function(event_object) {
      // Should have a reason.
      _alert({
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

      endpoint.on('onetimemessage', function(event) {
        $log.debug('<<------rtcomm-onetimemessage------>> - Event: ', event);
        if (event.onetimemessage.type != 'undefined' && event.onetimemessage.type == 'iFrameURL') {
          var session = _createSession(event.endpoint.id);
          session.iFrameURL = event.onetimemessage.iFrameURL;
          $rootScope.$evalAsync(
            function() {
              $rootScope.$broadcast('rtcomm::iframeUpdate', event.endpoint.id, event.onetimemessage.iFrameURL);
            }
          );
        }
      });

      $rootScope.$evalAsync(
        function() {
          $rootScope.$broadcast('newendpoint', endpoint);
        }
      );
    });

    var callback = function(eventObject) {
      $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
      $rootScope.$evalAsync(
        function() {
          if (eventObject.eventName.indexOf('session:') > -1) {
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
    myEndpointProvider.setRtcommEndpointConfig({
      ringtone: RtcommConfigService.getRingTone(),
      ringbacktone: RtcommConfigService.getRingBackTone(),
      // These are all the session related events.
      'session:started': function(eventObject) {
        $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
        $rootScope.$evalAsync(
          function() {
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

      'session:alerting': callback,
      'session:trying': callback,
      'session:ringing': callback,
      'session:queued': callback,

      'session:failed': function(eventObject) {
        $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
        $rootScope.$evalAsync(
          function() {
            _removeSession(eventObject.endpoint.id);
            $rootScope.$broadcast(eventObject.eventName, eventObject);
          }
        );
        //	This is required in karma to get the evalAsync to fire. Ugly but necessary...
        if (karmaTesting == true)
          $rootScope.$digest();

      },

      'session:stopped': function(eventObject) {
        $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
        $rootScope.$evalAsync(
          function() {
            _removeSession(eventObject.endpoint.id);
            $rootScope.$broadcast(eventObject.eventName, eventObject);
          }
        );
        //	This is required in karma to get the evalAsync to fire. Ugly but necessary...
        if (karmaTesting == true)
          $rootScope.$digest();

      },

      // These are all the WebRTC related events.
      'webrtc:connected': function(eventObject) {
        $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());

        $rootScope.$evalAsync(
          function() {
            _createSession(eventObject.endpoint.id).webrtcConnected = true;
            $rootScope.$broadcast(eventObject.eventName, eventObject);
          }
        );
        //	This is required in karma to get the evalAsync to fire. Ugly but necessary...
        if (karmaTesting == true)
          $rootScope.$digest();
      },
      // These are all the WebRTC related events.
      'webrtc:remotemuted': function(eventObject) {
        $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
        $rootScope.$evalAsync(
          function() {
            $rootScope.$broadcast(eventObject.eventName, eventObject);
          }
        );
        //	This is required in karma to get the evalAsync to fire. Ugly but necessary...
        if (karmaTesting == true)
          $rootScope.$digest();
      },

      'webrtc:disconnected': function(eventObject) {
        $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());

        $rootScope.$evalAsync(
          function() {
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
      'chat:connected': callback,
      'chat:disconnected': callback,

      'chat:message': function(eventObject) {
        $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
        $rootScope.$evalAsync(
          function() {
            var chat = {
              time: new Date(),
              name: eventObject.message.from,
              message: angular.copy(eventObject.message.message)
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
      'destroyed': callback
    });

    var initSuccess = function(event) {
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

      //	This is required in karma to get the evalAsync to fire. Ugly but necessary...
      if (karmaTesting == true)
        $rootScope.$digest();
    };

    var initFailure = function(error) {
      $log.debug('<<------rtcomm-service------>> - Event: Provider init failed: error: ', error);
      $rootScope.$evalAsync(
        function() {
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
    var _getSession = function(endpointUUID) {

      var session = null;

      for (var index = 0; index < sessions.length; index++) {
        if (sessions[index].endpointUUID === endpointUUID) {
          session = sessions[index];
          break;
        }
      }

      return (session);
    };

    /*
     * Get session from local endpoint ID
     */
    var _createSession = function(endpointUUID) {

      var session = null;

      for (var index = 0; index < sessions.length; index++) {
        if (sessions[index].endpointUUID === endpointUUID) {
          session = sessions[index];
          break;
        }
      }

      if (session == null) {
        session = {
          endpointUUID: endpointUUID,
          chats: [],
          webrtcConnected: false,
          sessionStarted: false,
          iFrameURL: 'about:blank',
          remoteEndpointID: null,
          activated: true,
          sessionState: 'session:stopped'
        };
        sessions[sessions.length] = session;
      }

      return (session);
    };

    var _removeSession = function(endpointUUID) {

      for (var index = 0; index < sessions.length; index++) {
        if (sessions[index].endpointUUID === endpointUUID) {

          _getEndpoint(endpointUUID).destroy();

          //	Remove the disconnected endpoint from the list.
          sessions.splice(index, 1);

          //	Now we need to set the active endpoint to someone else or to no endpoint if none are left.
          if (sessions.length == 0) {
            $rootScope.$broadcast('noEndpointActivated');
          } else {
            _setActiveEndpoint(sessions[0].endpointUUID);
          }
          break;
        }
      }
    };


    var _getEndpoint = function(uuid) {
      var endpoint = null;

      if ((typeof uuid === 'undefined') || uuid == null) {
        $log.debug('getEndpoint: create new endpoint and setup onetimemessage event');
        endpoint = myEndpointProvider.createRtcommEndpoint();
        endpoint.on('onetimemessage', function(event) {
          $log.debug('<<------rtcomm-onetimemessage------>> - Event: ', event);
          if (event.onetimemessage.type != 'undefined' && event.onetimemessage.type == 'iFrameURL') {
            var session = _createSession(event.endpoint.id);

            session.iFrameURL = event.onetimemessage.iFrameURL;

            $rootScope.$evalAsync(
              function() {
                $rootScope.$broadcast('rtcomm::iframeUpdate', event.endpoint.id, event.onetimemessage.iFrameURL);
              }
            );
          }
        });
      } else
        endpoint = myEndpointProvider.getRtcommEndpoint(uuid);

      return (endpoint);
    };

    var _setActiveEndpoint = function(endpointID) {

      // First get the old active endpoint
      var activeEndpoint = _getActiveEndpointUUID();
      if ((activeEndpoint != null) && (activeEndpoint != endpointID)) {
        var session = _getSession(activeEndpoint);
        if (session != null)
          session.activated = false;
      }

      var session = _createSession(endpointID);
      session.activated = true;

      $rootScope.$broadcast('endpointActivated', endpointID);
    };

    var _getActiveEndpointUUID = function() {
      var activeEndpoint = null;

      for (var index = 0; index < sessions.length; index++) {
        if (sessions[index].activated == true) {
          activeEndpoint = sessions[index].endpointUUID;
          break;
        }
      }
      return (activeEndpoint);
    };
    var _alert = function _alert(alertObject) {
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

      if (endpointProviderInitialized == false) {
        // If the user does not specify a userid, that says one will never be specified so go ahead
        // and initialize the endpoint provider and let the provider assign a name. If a defined empty
        // string is passed in, that means to wait until the end user registers a name.
        if (typeof config.userid == 'undefined' || RtcommConfigService.getProviderConfig().userid != '') {
          myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
          endpointProviderInitialized = true;
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

      if (endpointProviderInitialized == true) {
        $log.debug('RtcommService: addToPresenceRecord: updating presence record to: ', getPresenceRecord());
        myEndpointProvider.publishPresence(getPresenceRecord());
      }
    }

    function removeFromPresenceRecord(userDefines, doPublish) {

      for (var i = 0; i < userDefines.length; i++) {
        for (var j = 0; j < getPresenceRecord().userDefines.length; j++) {

          if (getPresenceRecord().userDefines[j].name == userDefines[i].name) {
            getPresenceRecord().userDefines.splice(j, 1);
            break;
          }
        }
      }

      if ((endpointProviderInitialized == true) && doPublish) {
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

      if (endpointProviderInitialized == false) {
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

      //	Save this chat in the local session store
      var session = _createSession(endpointUUID);
      session.chats.push(chat);

      myEndpointProvider.getRtcommEndpoint(endpointUUID).chat.send(chat.message);

    }

    function getChats(endpointUUID) {

      if (typeof endpointUUID !== 'undefined' && endpointUUID != null) {
        var session = _getSession(endpointUUID);
        if (session != null)
          return (session.chats);
        else
          return (null);
      } else
        return (null);

    }

    function isWebrtcConnected(endpointUUID) {

      if (typeof endpointUUID !== 'undefined' && endpointUUID != null) {
        var session = _getSession(endpointUUID);
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

      if ((typeof aliasID !== 'undefined') && aliasID != '')
        myEndpointProvider.setUserID(aliasID);
    }

    function setUserID(userID) {

      if ((typeof userID !== 'undefined') && userID != '') {
        RtcommConfigService.setProviderConfig({
          userid: userID
        });
        myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
      }
    }

    function setPresenceTopic(presenceTopic) {

      if ((typeof presenceTopic !== 'undefined') && presenceTopic != '') {
        RtcommConfigService.setProviderConfig({
          presenceTopic: presenceTopic
        });
        myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
      }

    }

    function getIframeURL(endpointUUID) {

      if (typeof endpointUUID !== 'undefined' && endpointUUID != null) {
        var session = _getSession(endpointUUID);
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
        var session = _createSession(endpointUUID);
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
      return sessions;
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
        var session = _getSession(localEndpointID);

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

      if (typeof endpointUUID != 'undefined' && endpointUUID != null)
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
    return {

      alert: _alert,

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
  }
})();
