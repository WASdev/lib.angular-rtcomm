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
})();
