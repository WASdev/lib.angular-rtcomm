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
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

    }

    RegisterController.$inject = ['RtcommService', '$scope', '$log'];

    /* @ngInject */
    function RegisterController(RtcommService, $scope, $log) {
        var vm = this;

        vm.nextAction = 'Register';

        vm.reguserid = '';

        vm.invalid = false;

        var invalidCharacters = /(\$|#|\+|\/|\\)+/i; //Invalid characters for MQTT Topic Path

        //Watch for changes in reguserid
        $scope.$watch('reguserid', function() {

            if (vm.reguserid.length < 1 || invalidCharacters.test(vm.reguserid)) {

                vm.invalid = true;
            } else {
                vm.invalid = false;
            }
        });


        vm.onRegClick = function() {
            if (vm.nextAction === 'Register' && !invalidCharacters.test(vm.reguserid)) {

                $log.debug('Register: reguserid =' + vm.reguserid);
                RtcommService.register(vm.reguserid);
            } else {
                $log.debug('Unregister: reguserid =' + vm.reguserid);
                RtcommService.unregister();
            }
        };

        $scope.$on('rtcomm::init', function(event, success, details) {

            if (success == true) {
                vm.nextAction = 'Unregister';
                vm.reguserid = details.userid;
            } else {
                vm.nextAction = 'Register';

                if (details == 'destroyed')
                    vm.reguserid = '';
                else
                    vm.reguserid = 'Init failed:' + details;
            }
        });
        activate();

        function activate() {

        }
    }
})();
