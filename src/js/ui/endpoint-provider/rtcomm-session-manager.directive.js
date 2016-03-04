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
            controllerAs: 'sessionVM',
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

        vm.init = function(publishPresence) {
            vm.publishPresence = publishPresence;
            vm.updatePresence();
        };

        vm.activateSession = function(endpointUUID) {
            $log.debug('rtcommSessionmgr: activateEndpoint =' + endpointUUID);
            if (vm.sessMgrActiveEndpointUUID != endpointUUID) {
                RtcommService.setActiveEndpoint(endpointUUID);
            }
        };

        vm.updatePresence = function() {
            //	Update the presence record if enabled
            if (vm.publishPresence == true) {
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
        activate();

        function activate() {

        }
    }
})();
