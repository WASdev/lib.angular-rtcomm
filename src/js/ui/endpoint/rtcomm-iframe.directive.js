(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommIframe', rtcommIframe);

    /* @ngInject */
    function rtcommIframe() {
        var directive = {
            restrict: 'E',
            templateUrl: "templates/rtcomm/rtcomm-iframe.html",
            controller: IFrameController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;
    }

    IFrameController.$inject = ['RtcommService', '$scope', '$log'];

    /* @ngInject */
    function IFrameController(RtcommService, $scope, $log) {
        var vm = this;
        vm.iframeActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.iframeURL = null;
        vm.initiframeURL = null;
        vm.syncSource = false;

        /*
         * syncSourcing means you a providing the URL source but no UI. Typically used in
         * customer/agent scenarios.
         */
        vm.init = function(syncSource) {
            if (syncSource == true) {
                vm.syncSource = true;
                vm.initiframeURL = $location.absUrl(); // init to current URL
            }
        };


        vm.setURL = function(newURL) {
            $log.debug('rtcommIframe: setURL: newURL: ' + newURL);
            RtcommService.putIframeURL(vm.iframeActiveEndpointUUID, newURL);
            vm.iframeURL = $sce.trustAsResourceUrl(newURL);
        };

        vm.forward = function() {};

        vm.backward = function() {};

        $scope.$on('session:started', function(event, eventObject) {
            $log.debug('session:started received: endpointID = ' + eventObject.endpoint.id);

            if (vm.syncSource == true) {
                RtcommService.putIframeURL(eventObject.endpoint.id, vm.initiframeURL); //Update on the current or next endpoint to be activated.
            }
        });

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            $log.debug('rtcommIframe: endpointActivated =' + endpointUUID);

            if (vm.syncSource == false) {
                vm.iframeURL = $sce.trustAsResourceUrl(RtcommService.getIframeURL(endpointUUID));
                vm.iframeActiveEndpointUUID = endpointUUID;
            }
        });

        $scope.$on('noEndpointActivated', function(event) {
            if (vm.syncSource == false) {
                vm.iframeURL = $sce.trustAsResourceUrl('about:blank');
                vm.iframeActiveEndpointUUID = null;
            }
        });

        $scope.$on('rtcomm::iframeUpdate', function(eventType, endpointUUID, url) {
            if (vm.syncSource == false) {
                $log.debug('rtcomm::iframeUpdate: ' + url);
                //	This is needed to prevent rtcomm from logging in when the page is loaded in the iFrame.
                url = url + "?disableRtcomm=true";
                vm.iframeURL = $sce.trustAsResourceUrl(url);
            } else {
                $log.debug('rtcomm::iframeUpdate: load this url in a new tab: ' + url);
                // In this case we'll open the pushed URL in a new tab.
                $window.open($sce.trustAsResourceUrl(url), '_blank');
            }
        });
        activate();

        function activate() {

        }
    }
})();
