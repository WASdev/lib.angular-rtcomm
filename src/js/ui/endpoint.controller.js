(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .controller('RtcommEndpointController', RtcommEndpointController);

    RtcommEndpointController.$inject = ['RtcommService', '$http', '$rootScope', '$scope', '$log'];

    /* @ngInject */
    function RtcommEndpointController(RtcommService, $http, $rootScope, $scope, $log) {
        var vm = this;
        vm.epCtrlActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.epCtrlAVConnected = RtcommService.isWebrtcConnected(vm.epCtrlActiveEndpointUUID);
        vm.sessionState = RtcommService.getSessionState(vm.epCtrlActiveEndpointUUID);

        vm.disconnect = function() {
            $log.debug('Disconnecting call for endpoint: ' + vm.epCtrlActiveEndpointUUID);
            RtcommService.getEndpoint(vm.epCtrlActiveEndpointUUID).disconnect();
        };

        vm.toggleAV = function() {
            $log.debug('Enable AV for endpoint: ' + vm.epCtrlActiveEndpointUUID);

            if (vm.epCtrlAVConnected == false) {
                RtcommService.getEndpoint(vm.epCtrlActiveEndpointUUID).webrtc.enable(function(value, message) {
                    if (!value) {
                        $log.debug('Enable failed: ', message);
                        RtcommService.alert({
                            type: 'danger',
                            msg: message
                        });
                    }
                });
            } else {
                $log.debug('Disable AV for endpoint: ' + vm.epCtrlActiveEndpointUUID);
                RtcommService.getEndpoint(vm.epCtrlActiveEndpointUUID).webrtc.disable();
            }
        };

        $scope.$on('session:started', function(event, eventObject) {
            $log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);
            if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
                vm.sessionState = 'session:started';
            }
        });

        $scope.$on('session:stopped', function(event, eventObject) {
            $log.debug('session:stopped received: endpointID = ' + eventObject.endpoint.id);
            if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
                vm.sessionState = 'session:stopped';
            }
        });

        $scope.$on('session:failed', function(event, eventObject) {
            $log.debug('session:failed received: endpointID = ' + eventObject.endpoint.id);
            if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id) {
                vm.sessionState = 'session:failed';
            }
        });

        $scope.$on('webrtc:connected', function(event, eventObject) {
            if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id)
                vm.epCtrlAVConnected = true;
        });

        $scope.$on('webrtc:disconnected', function(event, eventObject) {
            if (vm.epCtrlActiveEndpointUUID == eventObject.endpoint.id)
                vm.epCtrlAVConnected = false;
        });


        $scope.$on('endpointActivated', function(event, endpointUUID) {
            vm.epCtrlActiveEndpointUUID = endpointUUID;
            vm.epCtrlAVConnected = RtcommService.isWebrtcConnected(endpointUUID);
        });

        $scope.$on('noEndpointActivated', function(event) {
            vm.epCtrlAVConnected = false;
        });
        activate();

        function activate() {

        }
    }
})();
