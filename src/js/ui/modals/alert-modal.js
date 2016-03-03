/**
 * This modal is displayed on receiving an inbound call. It handles the alerting event.
 * Note that it can also auto accept requests for enabling A/V.
 */

(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .controller('RtcommAlertModalController', RtcommAlertModalController)
        .controller('RtcommAlertModalInstanceController', RtcommAlertModalInstanceController);

    RtcommAlertModalController.$inject = ['RtcommService', '$modal', '$rootScope', '$scope', '$log'];

    /* @ngInject */
    function RtcommAlertModalController(RtcommService, $modal, $rootScope, $scope, $log) {
        var vm = this;
        vm.alertingEndpointUUID = null;
        vm.autoAnswerNewMedia = false;
        vm.alertActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.caller = null;

        vm.init = function(autoAnswerNewMedia) {
            $log.debug('rtcommAlert: autoAnswerNewMedia = ' + autoAnswerNewMedia);
            vm.autoAnswerNewMedia = autoAnswerNewMedia;
        };

        vm.showAlerting = function(size) {

            var modalInstance = $modal.open({
                templateUrl: 'templates/rtcomm/rtcomm-modal-alert.html',
                controller: 'RtcommAlertModalInstanceController',
                size: size,
                backdrop: 'static',
                resolve: {
                    caller: function() {
                        return vm.caller;
                    }
                }
            });

            modalInstance.result.then(
                function() {
                    var alertingEndpointObject = RtcommService.getEndpoint(vm.alertingEndpointUUID);

                    if (alertingEndpointObject) {
                        $log.debug('Accepting call from: ' + vm.caller + ' for endpoint: ' + vm.alertingEndpointUUID);
                        alertingEndpointObject.accept();
                        $rootScope.$broadcast('rtcomm::alert-success');
                        alertingEndpointObject = null;
                    }
                },
                function() {
                    var alertingEndpointObject = RtcommService.getEndpoint(vm.alertingEndpointUUID);
                    if (alertingEndpointObject) {
                        $log.debug('Rejecting call from: ' + vm.caller + ' for endpoint: ' + vm.alertingEndpointUUID);
                        alertingEndpointObject.reject();
                        alertingEndpointObject = null;
                    }
                });
        };

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            vm.alertActiveEndpointUUID = endpointUUID;
        });

        $scope.$on('session:alerting', function(event, eventObject) {

            if ((vm.alertActiveEndpointUUID == eventObject.endpoint.id && vm.autoAnswerNewMedia == false) ||
                (vm.alertActiveEndpointUUID != eventObject.endpoint.id)) {
                $log.debug('rtcommAlert: display alterting model: alertActiveEndpointUUID = ' + eventObject.endpoint + ' autoAnswerNewMedia = ' + vm.autoAnswerNewMedia);
                vm.caller = eventObject.endpoint.getRemoteEndpointID();
                vm.alertingEndpointUUID = eventObject.endpoint.id;
                vm.showAlerting();
            } else {
                $log.debug('Accepting media from: ' + eventObject.endpoint.getRemoteEndpointID() + ' for endpoint: ' + eventObject.endpoint.id);
                eventObject.endpoint.accept();
            }
        });
        activate();

        function activate() {

        }
    }

    RtcommAlertModalInstanceController.$inject = ['$scope', '$modalInstance', '$log', 'caller'];

    function RtcommAlertModalInstanceController($scope, $modalInstance, $log, caller) {
    	$scope.caller = caller;
    	$scope.ok = function () {
    		$log.debug('Accepting alerting call');
    		$modalInstance.close();
    	};

    	$scope.cancel = function () {
    		$log.debug('Rejecting alerting call');
    		$modalInstance.dismiss('cancel');
    	};
    };
})();
