(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommAlert', rtcommAlert);

    /* @ngInject */
    function rtcommAlert() {
        var directive = {
            restrict: 'E',
            templateUrl: "templates/rtcomm/rtcomm-alert.html",
            controller: AlertController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;
    }

    AlertController.$inject = ['RtcommService', '$scope', '$log'];

    /* @ngInject */
    function AlertController(RtcommService, $scope, $log) {
        var vm = this;
        vm.alerts = [];
        vm.addAlert = function(alert) {
          vm.alerts.push(alert);
        };
        vm.closeAlert = function(index) {
          vm.alerts.splice(index, 1);
        };
        $scope.$on('rtcomm::alert', function(event, eventObject) {
          vm.addAlert(eventObject);
        });
        activate();

        function activate() {

        }
    }
})();
