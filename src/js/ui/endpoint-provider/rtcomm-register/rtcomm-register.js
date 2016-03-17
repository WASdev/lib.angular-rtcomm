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
