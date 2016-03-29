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
    };

})();
