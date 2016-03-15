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

        function getActiveEndpoint() {
            return RtcommService.getEndpoint(RtcommService.getActiveEndpoint());
        }

        $scope.disconnect = function() {
            $log.debug('Disconnecting call for endpoint: ' + $scope.epCtrlActiveEndpointUUID);
            var ep = getActiveEndpoint;
	    ep.disconnect();
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
