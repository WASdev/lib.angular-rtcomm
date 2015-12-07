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
 * @version v1.0.3 - 2015-12-07
 * @link https://github.com/WASdev/lib.angular-rtcomm
 * @author Brian Pulito <brian_pulito@us.ibm.com> (https://github.com/bpulito)
 */
/*
 * This is the main angular-rtcomm module.
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
 * Definition for the rtcommModule
 */

(function() {
  angular.module('angular-rtcomm-service', [])
    /**
     * Set debugEnabled to true to enable the debug messages in this rtcomm angular module.
     */
    .config(["$logProvider", function($logProvider){
	     $logProvider.debugEnabled(true);
    }])
    /* This causes a problem in ionic/iosrtc
    .config(function($locationProvider) {
	      $locationProvider.html5Mode(  {enabled: true,
		    requireBase: false});
    }) */
    .factory('RtcommConfigService', RtcommConfigService)
    .factory('RtcommService', RtcommService);
    /**
     *
     */
    RtcommConfigService.$inject = ['$location', '$log', '$window'];
    function RtcommConfigService($location, $log, $window) {
      //	First we check to see if the URL includes the query string disableRtcomm=true.
      //	This is typically done when a URL is being shared vian an iFrame that includes Rtcomm directives.
      //	If it is set we just return without setting up Rtcomm.
      $log.debug('RtcommConfigService: Abs URL: ' + $location.absUrl());
      var _disableRtcomm = $location.search().disableRtcomm;
      if (typeof _disableRtcomm === "undefined" || _disableRtcomm === null) {
        _disableRtcomm = false;
      } else if (_disableRtcomm === "true") {
        _disableRtcomm = true;
      } else {
        _disableRtcomm = false;
      }

      $log.debug('RtcommConfigService: _disableRtcomm = ' + _disableRtcomm);

      var providerConfig = {
          server : $location.host(),
          port : $location.port(),
          rtcommTopicPath : "/rtcomm/",
          createEndpoint : false,
          appContext: 'default',
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

        // We no longer need to set 'useSSL'  This will be set based on how page is served.
//        providerConfig.useSSL = (typeof config.useSSL !== "undefined")? config.useSSL : providerConfig.useSSL;
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
  };

  RtcommService.$inject=['$rootScope', '$log', '$http', 'RtcommConfigService'];
  function RtcommService($rootScope, $log, $http, RtcommConfigService) {
      /** Setup the endpoint provider first **/
    var myEndpointProvider = new rtcomm.EndpointProvider();
    var endpointProviderInitialized = false;
    var queueList = null;
    var sessions = [];
    var presenceRecord = null;
    var karmaTesting = false;
    var _selfView = "selfView";		//	Default self view
    var _remoteView = "remoteView";	//	Default remote view

    myEndpointProvider.setLogLevel(RtcommConfigService.getRtcommDebug());
    $log.debug('rtcomm-service - endpointProvider log level is: '+myEndpointProvider.getLogLevel());
    $log.debug('rtcomm-service - endpointProvider log level should be: '+RtcommConfigService.getRtcommDebug());
    myEndpointProvider.setAppContext(RtcommConfigService.getProviderConfig().appContext);

    var getPresenceRecord = function(){
      if (presenceRecord == null)
        presenceRecord = {'state': 'available', userDefines: []};

      return (presenceRecord);
    };

    //	This defines all the media related configuration and is controlled through external config.
    var getMediaConfig = function() {

      var mediaConfig = {
          ringbacktone: RtcommConfigService.getRingBackTone(),
          ringtone: RtcommConfigService.getRingTone(),
          broadcast : {
            audio : RtcommConfigService.getBroadcastAudio(),
            video : RtcommConfigService.getBroadcastVideo()
          },
          webrtc : RtcommConfigService.getWebRTCEnabled(),
          chat : RtcommConfigService.getChatEnabled(),
      };

      return (mediaConfig);
    };

    myEndpointProvider.on('reset', function(event_object) {
      // Should have a reason.
      _alert({type:'danger', msg: event_object.reason});
    });


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
                $rootScope.$broadcast('rtcomm::iframeUpdate', event.endpoint.id, event.onetimemessage.iFrameURL);
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
      ringtone: RtcommConfigService.getRingTone(),
      ringbacktone: RtcommConfigService.getRingBackTone(),
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
      // These are all the WebRTC related events.
      'webrtc:remotemuted' : function(eventObject) {
        $log.debug('<<------rtcomm-service------>> - Event: ' + eventObject.eventName + ' remoteEndpointID: ' + eventObject.endpoint.getRemoteEndpointID());
        $rootScope.$evalAsync(
            function () {
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
                'userid' : RtcommConfigService.getProviderConfig().userid
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
    var _alert = function _alert(alertObject) {
        var a = { type: 'info',
                  msg: 'default message'};
        if (typeof alertObject === 'string') {
          a.msg = alertObject;
        } else {
          a = alertObject;
        }
        $rootScope.$evalAsync(
          function () {
            $rootScope.$broadcast('rtcomm::alert', a);
          }
        );
      };


    return {

      alert: _alert,

      setKarmaTesting : function(){
        karmaTesting = true;
      },

      isInitialized : function(){
        return(endpointProviderInitialized);
      },

      setConfig : function(config){
        if (RtcommConfigService.isRtcommDisabled() == true){
          $log.debug('RtcommService:setConfig: isRtcommDisabled = true; return with no setup');
          return;
        }


        $log.debug('rtcomm-services: setConfig: config: ', config);

        RtcommConfigService.setProviderConfig(config);
        myEndpointProvider.setRtcommEndpointConfig(getMediaConfig());

        if (endpointProviderInitialized == false){
          //	If an identityServlet is defined we will get the User ID from the servlet.
          //	This is used when the user ID needs to be derived from an SSO token like LTPA.
          if (typeof config.identityServlet !== "undefined" && config.identityServlet != null){
            $http.get(config.identityServlet).success (function(data){

              if (typeof data.userid !== "undefined"){
                RtcommConfigService.setProviderConfig(data);
                myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
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
            if (typeof config.userid == "undefined" || RtcommConfigService.getProviderConfig().userid != ''){
              myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
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
          RtcommConfigService.getProviderConfig().userid = userid;

          myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
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
          RtcommConfigService.setProviderConfig({userid: userID});
          myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
        }
      },

      setPresenceTopic : function(presenceTopic) {
        if ((typeof presenceTopic !== "undefined") && presenceTopic != ''){
          RtcommConfigService.setProviderConfig({presenceTopic : presenceTopic});
          myEndpointProvider.init(RtcommConfigService.getProviderConfig(), initSuccess, initFailure);
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

      endCall : function(endpoint) {
        endpoint.disconnect();
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
  };

})();

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

rtcommSessionManager.$inject=['RtcommService', '$log'];
function rtcommSessionManager (RtcommService, $log) {
  return {
    restrict: 'E',
    templateUrl: 'templates/rtcomm/rtcomm-sessionmgr.html',
    controller: ["$scope", function ($scope) {
      $scope.sessions = RtcommService.getSessions();
      $scope.sessMgrActiveEndpointUUID = RtcommService.getActiveEndpoint();
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

    }],
    controllerAs: 'sessionmgr'
  };
};

/**
 * This directive is used to manage the registration of an endpoint provider. Since the registered name can only
 * be set on initialization of the endpoint provider, this directive actually controls the initialization of the
 * provider. Note that the endpoint provider must be initialized before any sessions can be created or received.
 */
rtcommRegister.$inject=['RtcommService', '$log'];
function rtcommRegister(RtcommService, $log) {
	return {
		restrict: 'E',
		templateUrl: 'templates/rtcomm/rtcomm-register.html',
		controller: ["$scope", function ($scope) {

			$scope.nextAction = 'Register';
			
			$scope.reguserid = '';
			
			$scope.invalid = false;

			var invalidCharacters = /(\$|#|\+|\/|\\)+/i; //Invalid characters for MQTT Topic Path
			
			//Watch for changes in reguserid 
                        $scope.$watch('reguserid', function(){

                                if($scope.reguserid.length < 1 || invalidCharacters.test($scope.reguserid)){

                                        $scope.invalid = true;
                                }
                                else{
                                        $scope.invalid = false;
                                }
                        });


			$scope.onRegClick = function() {
				if ($scope.nextAction === 'Register' && !invalidCharacters.test($scope.reguserid)){

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
						$scope.reguserid = '';
					else
						$scope.reguserid = 'Init failed:' +  details;
				}
			});
		}],
		controllerAs: 'register'
	};
};

/**
 * This directive manages call queues. It provides the ability to display all the available queues
 * (along with their descriptions) and by clicking on a queue, allows an agent (or any type of user)
 * to subscribe on that queue.
 */
rtcommQueues.$inject = ['RtcommService', '$log'];
function rtcommQueues(RtcommService, $log) {
	return {
		restrict : 'E',
		templateUrl : 'templates/rtcomm/rtcomm-queues.html',
		controller : ["$scope", function($scope) {
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
		}],
		controllerAs : 'queues'
	};
};

//rtcommModule.controller('RtcommAlertController', ['$scope', '$log', function($scope, $log){
rtcommAlert.$inject = ['$log'];
function rtcommAlert($log) {
	return {
		restrict: 'E',
		templateUrl: "templates/rtcomm/rtcomm-alert.html",
		controller: ["$scope", function ($scope) {
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
    }]
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
rtcommEndpointStatus.$inject = ['RtcommService', '$log'];
function rtcommEndpointStatus(RtcommService, $log){
	return {
		restrict: 'E',
		templateUrl: 'templates/rtcomm/rtcomm-endpoint-status.html',
		controller: ["$scope", function ($scope) {

			//	Session states.
			$scope.epCtrlActiveEndpointUUID = RtcommService.getActiveEndpoint();
			$scope.epCtrlRemoteEndpointID = RtcommService.getRemoteEndpoint($scope.epCtrlActiveEndpointUUID);
			$scope.sessionState = RtcommService.getSessionState($scope.epCtrlActiveEndpointUUID);
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
				if ($scope.epCtrlActiveEndpointUUID != eventObject.endpoint.id){
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
				$scope.epCtrlRemoteEndpointID = RtcommService.getEndpoint(endpointUUID).getRemoteEndpointID();
				$scope.sessionState = RtcommService.getSessionState(endpointUUID);
			});

			$scope.$on('noEndpointActivated', function (event) {
				$scope.epCtrlRemoteEndpointID = null;
				$scope.sessionState = 'session:stopped';
			});

			$scope.$on('rtcomm::init', function(event, success, details){

				if(success == false){
					$scope.sessionState = 'session:stopped';
					$scope.epCtrlRemoteEndpointID = null;
                                }
                        });



		}]
	};
};

/**
 * This directive manages the WebRTC video screen, including both the self view and the remote view. It
 * also takes care of switching state between endpoints based on which endpoint is "actively" being viewed.
 */
rtcommVideo.$inject = ['RtcommService', '$log'];
function rtcommVideo(RtcommService, $log) {
	return {
		restrict: 'E',
		templateUrl: 'templates/rtcomm/rtcomm-video.html',
		controller: 'RtcommVideoController'
	};
};

/**
 * This directive manages the chat portion of a session. The data model for chat
 * is maintained in the RtcommService. This directive handles switching between
 * active endpoints.
 */
rtcommChat.$inject = ['RtcommService', '$log'];
function rtcommChat(RtcommService, $log) {
	return {
		restrict: 'E',
		templateUrl: "templates/rtcomm/rtcomm-chat.html",
		controller: ["$scope", function ($scope) {
			$scope.chatActiveEndpointUUID = RtcommService.getActiveEndpoint();
			$scope.chats = RtcommService.getChats($scope.chatActiveEndpointUUID);
			// This forces the scroll bar to the bottom and watches the $location.hash
			//$anchorScroll();

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

				$scope.message = '';
				$scope.scrollToBottom(true);
				RtcommService.sendChatMessage(chat, $scope.chatActiveEndpointUUID);
			};

		}],
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
					}
					else {
						scope.scrollToBottom(false);
					}
				});
				//Watch the chat messages, if the scroll bar is in the bottom keep it on the bottom so the user can view incoming chat messages, else possibly send a notification and don't scroll down
				scope.$watch('chats', function(){
					if(bottom){
						chatPanel.scrollTop(chatPanel.prop('scrollHeight'));
					}
					else {
						//In this else, a notification could be sent
					}
				},true);
			} 
			else {
			        $log.warn('chatPanel not found: most likely you need to load jquery prior to angular');
			}
		}
	};

};

/**
 * This directive manages the shared iFrame.
 */
rtcommIframe.$inject = ['RtcommService', '$log', '$sce', '$location', '$window'];
function rtcommIframe(RtcommService, $log, $sce, $location, $window) {
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
};



/******************************** Rtcomm Modals ************************************************/

/**
 * This modal is displayed on receiving an inbound call. It handles the alerting event.
 * Note that it can also auto accept requests for enabling A/V.
 */

RtcommAlertModalController.$inject=['$rootScope', '$scope', 'RtcommService', '$modal', '$log'];
function RtcommAlertModalController($rootScope, $scope, RtcommService, $modal, $log) {

	$scope.alertingEndpointUUID = null;
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
			backdrop: 'static',
			resolve: {
				caller: function () {
					return $scope.caller;
				}}
		});

		modalInstance.result.then(
				function() {
					var alertingEndpointObject = RtcommService.getEndpoint($scope.alertingEndpointUUID);

					if(alertingEndpointObject){
						$log.debug('Accepting call from: ' + $scope.caller + ' for endpoint: ' + $scope.alertingEndpointUUID);
						alertingEndpointObject.accept();
						$rootScope.$broadcast('rtcomm::alert-success');
						alertingEndpointObject = null;
					}
				},
				function () {
					var alertingEndpointObject = RtcommService.getEndpoint($scope.alertingEndpointUUID);
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
RtcommCallModalController.$inject = ['$scope',  'RtcommService', '$modal', '$log'];
function RtcommCallModalController($scope, RtcommService, $modal, $log) {
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
						RtcommService.setAlias(resultName);
					}

					RtcommService.placeCall($scope.calleeID, $scope.mediaToEnable);
				},
				function () {
					$log.info('Modal dismissed at: ' + new Date());
				});
	};
};

RtcommCallModalInstanceController.$inject = ['$scope',  '$modalInstance', 'RtcommService'];
function RtcommCallModalInstanceController($scope, $modalInstance, RtcommService) {
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

RtcommConfigController.$inject = ['$scope','$http', 'RtcommService', '$log'];
function RtcommConfigController($scope, $http, RtcommService, $log) {
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
};


RtcommVideoController.$inject= ['$scope','$http', 'RtcommService', '$log'];
function RtcommVideoController($scope, $http, RtcommService, $log) {
	$scope.avConnected = RtcommService.isWebrtcConnected(RtcommService.getActiveEndpoint());
	$scope.init = function(selfView,remoteView) {
		RtcommService.setViewSelector(selfView,remoteView);

		var videoActiveEndpointUUID = RtcommService.getActiveEndpoint();
		if (typeof videoActiveEndpointUUID !== "undefined" && videoActiveEndpointUUID != null)
			RtcommService.setVideoView(videoActiveEndpointUUID);
	};

	// Go ahead and initialize the local media here if an endpoint already exist.
	var videoActiveEndpointUUID = RtcommService.getActiveEndpoint();
	if (typeof videoActiveEndpointUUID !== "undefined" && videoActiveEndpointUUID != null)
		RtcommService.setVideoView(videoActiveEndpointUUID);

	$scope.$on('endpointActivated', function (event, endpointUUID) {
		//	Not to do something here to show that this button is live.
		$log.debug('rtcommVideo: endpointActivated =' + endpointUUID);
		RtcommService.setVideoView(endpointUUID);
		$scope.avConnected = RtcommService.isWebrtcConnected(RtcommService.getActiveEndpoint());
	});

	$scope.$on('noEndpointActivated', function (event) {
		$scope.avConnected = false;
	});

	$scope.$on('webrtc:connected', function (event, eventObject) {
		if (RtcommService.getActiveEndpoint() == eventObject.endpoint.id)
			$scope.avConnected = true;
	});

	$scope.$on('webrtc:disconnected', function (event, eventObject) {
		if (RtcommService.getActiveEndpoint() == eventObject.endpoint.id)
			$scope.avConnected = false;
	});
};


RtcommEndpointController.$inject = ['$scope', '$rootScope', '$http', 'RtcommService', '$log'];
function RtcommEndpointController($scope, $rootScope, $http, RtcommService, $log) {
	//	Session states.
	$scope.epCtrlActiveEndpointUUID = RtcommService.getActiveEndpoint();
	$scope.epCtrlAVConnected = RtcommService.isWebrtcConnected($scope.epCtrlActiveEndpointUUID);
	$scope.sessionState = RtcommService.getSessionState($scope.epCtrlActiveEndpointUUID);

	$scope.disconnect = function() {
		$log.debug('Disconnecting call for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
		RtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).disconnect();
	};

	$scope.toggleAV = function() {
		$log.debug('Enable AV for endpoint: ' + $scope.epCtrlActiveEndpointUUID);

		if ($scope.epCtrlAVConnected == false){
			RtcommService.getEndpoint($scope.epCtrlActiveEndpointUUID).webrtc.enable(function(value, message) {
				if (!value) {
          $log.debug('Enable failed: ',message);
          RtcommService.alert({type: 'danger', msg: message});
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
		$scope.epCtrlAVConnected = RtcommService.isWebrtcConnected(endpointUUID);
	});

	$scope.$on('noEndpointActivated', function (event) {
		$scope.epCtrlAVConnected = false;
	});
};

})();

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
angular.module('angular-rtcomm-ui').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/rtcomm/rtcomm-alert.html',
    "<div class=\"row\"><alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert($index)\">{{alert.msg}}</alert></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-chat.html',
    "<div><div class=\"panel panel-primary vertical-stretch\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-comment\"></span> Chat</div><div class=\"panel-body\"><ul class=\"chat\"><li class=\"right clearfix\" ng-repeat=\"chat in chats\"><div id=\"{{$index}}\" class=\"header\"><strong class=\"primary-font\">{{chat.name}}</strong> <small class=\"pull-right text-muted\">{{chat.time | date:'HH:mm:ss'}}</small></div><p>{{chat.message}}</p></li></ul></div><div class=\"panel-footer\"><div class=\"input-group\"><input id=\"chat-input\" type=\"text\" class=\"form-control input-sm\" placeholder=\"Type your message here...\" type=\"text\" ng-model=\"message\" ng-keypress=\"keySendMessage($event)\"> <span class=\"input-group-btn\"><button class=\"btn btn-primary btn-sm\" id=\"btn-chat\" ng-click=\"sendMessage()\" focusinput=\"true\" ng-disabled=\"(chatActiveEndpointUUID == null)\">Send</button></span></div></div></div></div><!-- chat list ng-controller div -->"
  );


  $templateCache.put('templates/rtcomm/rtcomm-endpoint-status.html',
    "<div class=\"endpoint-status\"><p class=\"endpoint-controls-title navbar-text pull-right\" ng-switch on=\"sessionState\"><span ng-switch-when=\"session:started\">Connected to {{epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:stopped\">No active sessions, waiting...</span> <span ng-switch-when=\"session:alerting\">Inbound call from {{epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:trying\">Attempting to call {{epCtrlRemoteEndpointID}}</span> <span ng-switch-when=\"session:ringing\">Call to {{epCtrlRemoteEndpointID}} is ringing</span> <span ng-switch-when=\"session:queued\">Waiting in queue at: {{queueCount}}</span> <span ng-switch-when=\"session:failed\">Call failed with reason: {{failureReason}}</span></p></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-iframe.html',
    "<div><div class=\"panel panel-primary vertical-stretch\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-link\"></span> URL Sharing</div><div class=\"rtcomm-iframe\"><iframe width=\"100%\" height=\"100%\" ng-src=\"{{iframeURL}}\"></iframe></div><div class=\"row\"><div class=\"col-lg-2\"><button id=\"btnBackward\" class=\"btn btn-primary\" ng-click=\"backward()\" focusinput=\"true\" ng-disabled=\"(iframeUrl == null)\"><span class=\"glyphicon glyphicon-arrow-left\" aria-hidden=\"true\" aria-label=\"Backward\"></span> Backward</button></div><div class=\"col-lg-2\"><button id=\"btnForward\" class=\"btn btn-primary\" ng-click=\"forward()\" ng-disabled=\"(iframeUrl == null)\"><span class=\"glyphicon glyphicon-arrow-right\" aria-hidden=\"true\" aria-label=\"Forward\"></span> Forward</button></div><div class=\"col-lg-8\"><div class=\"input-group\"><input id=\"setUrl\" type=\"text\" class=\"form-control\" type=\"text\" ng-model=\"newUrl\"><span class=\"input-group-btn\"><button class=\"btn btn-primary\" id=\"btn-send-url\" ng-click=\"setURL(newUrl)\" focusinput=\"true\">Set URL</button></span></div><!-- /input-group --></div></div></div></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-modal-alert.html',
    "<div class=\"modal-header\"><button type=\"button\" class=\"close\" ng-click=\"close(false)\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button><h4 class=\"modal-title\">New call alert</h4></div><div class=\"modal-body\"><p>Do you want to accept a call from {{caller}}.</p></div><div class=\"modal-footer\"><button type=\"button\" ng-click=\"ok()\" class=\"btn btn-default\" data-dismiss=\"modal\">Yes</button> <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-primary\" data-dismiss=\"modal\">No</button></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-modal-call.html',
    "<div class=\"modal-header\"><button type=\"button\" class=\"close\" ng-click=\"close(false)\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button><h4 class=\"modal-title\">Get Help</h4></div><div class=\"modal-body\"><p>To help us serve you better, please provide some information before we begin.</p><form class=\"form-horizontal\" role=\"form\"><div class=\"form-group\"><label for=\"name\" class=\"col-sm-2 control-label\">Name</label><div class=\"col-sm-10\"><input type=\"text\" class=\"form-control\" id=\"name\" placeholder=\"Your Name\" ng-model=\"endpointAlias\"></div></div></form></div><div class=\"modal-footer\"><button type=\"button\" ng-click=\"ok()\" class=\"btn btn-default\" data-dismiss=\"modal\">Connect</button> <button type=\"button\" ng-click=\"cancel()\" class=\"btn btn-default\" data-dismiss=\"modal\">Cancel</button></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-queues.html',
    "<div><div class=\"panel panel-primary\"><div class=\"panel-heading\"><span class=\"glyphicon glyphicon-sort-by-attributes-alt\"></span> Queues</div><div class=\"queueContainer\"><button type=\"button\" ng-class=\"{'btn btn-primary btn-default btn-block': queue.active, 'btn btn-default btn-default btn-block': !queue.active}\" ng-repeat=\"queue in rQueues\" ng-click=\"onQueueClick(queue)\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"{{queue.description}}\">{{queue.active ? 'Leave' : 'Join'}} {{queue.endpointID}}</button></div></div></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-register.html',
    "<div><div class=\"panel panel-primary\"><div class=\"input-group\"><input id=\"register-input\" type=\"text\" class=\"form-control input-sm\" placeholder=\"Enter your ID here...\" type=\"text\" ng-model=\"reguserid\" ng-disabled=\"(nextAction=='Unregister')\"><span class=\"input-group-btn\"><button class=\"btn btn-primary btn-sm\" id=\"btn-register\" ng-click=\"onRegClick(reguserid)\" ng-disabled=\"invalid\" focusinput=\"true\">{{nextAction}}</button></span></div></div></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-sessionmgr.html',
    "<div class=\"session-manager\"><div class=\"btn-group pull-left\" style=\"padding: 10px\"><div><button class=\"session-manager-button\" type=\"button\" ng-switch on=\"session.activated\" ng-class=\"{'btn btn-primary btn-sm': session.activated, 'btn btn-default btn-sm': !session.activated}\" ng-repeat=\"session in sessions\" ng-click=\"activateSession(session.endpointUUID)\"><span class=\"glyphicon glyphicon-eye-open\" aria-hidden=\"true\" ng-switch-when=\"true\"></span> <span class=\"glyphicon glyphicon-eye-close\" aria-hidden=\"true\" ng-switch-when=\"false\"></span> {{session.remoteEndpointID}}</button></div></div><p class=\"session-manager-title navbar-text pull-right\">Sessions</p></div>"
  );


  $templateCache.put('templates/rtcomm/rtcomm-video.html',
    "<div id=\"videoContainer\"><div id=\"selfViewContainer\"><video title=\"selfView\" id=\"selfView\" class=\"selfView\" autoplay muted></video></div><video title=\"remoteView\" id=\"remoteView\" class=\"remoteView\" autoplay></video><!--  video title=\"remoteView\" id=\"remoteView\" class=\"remoteView\" autoplay=\"true\" poster=\"../views/rtcomm/images/video_camera_big.png\"></video --></div>"
  );

}]);
angular.module('angular-rtcomm-presence').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/rtcomm/rtcomm-presence.html',
    "<div treecontrol class=\"tree-light\" tree-model=\"presenceData\" options=\"treeOptions\" on-selection=\"showSelected(node)\" expanded-nodes=\"expandedNodes\"><button type=\"button\" class=\"btn btn-primary btn-xs\" aria-label=\"Left Align\" ng-show=\"(node.record && !node.self)\" ng-click=\"onCallClick(node.name)\"><span class=\"glyphicon glyphicon-facetime-video\" aria-hidden=\"true\" aria-label=\"expand record\"></span></button> {{node.name}} {{node.value ? ': ' + node.value : ''}}</div>"
  );

}]);
