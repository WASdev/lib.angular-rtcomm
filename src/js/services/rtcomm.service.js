(function() {
    'use strict';

    angular
        .module('angular-rtcomm-service')
        .factory('RtcommService', RtcommService);

    RtcommService.$inject = ['$rootScope', '$log', '$http', 'RtcommConfigService', 'rtcomm'];

    /* @ngInject */
    function RtcommService(dependencies) {
        var service = {
            alert: alert,
            setKarmaTesting: setKarmaTesting,
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



        };

        return service;

        function

        function() {

        }
    }
})();
