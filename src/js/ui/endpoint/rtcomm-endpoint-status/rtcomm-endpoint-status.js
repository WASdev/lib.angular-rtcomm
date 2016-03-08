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
