/********************************************* Rtcomm Controllers ******************************************************/

/**
 * This is the controller for config loader. It reads a JSON object and utilizes the RtcommService to set the configuration.
 * This can also result in the initialization of the endpoint provider if the config JSON object includes a registration name.
 *
 * Here is an example of the config object:
 *
 * {
 *  "server" : "server address",
 *	"port" : 1883,
 *	"rtcommTopicPath" : "/rtcomm-helpdesk/",
 *  "createEndpoint" : false,
 *  "userid" : "registration name",
 *	"broadcastAudio" : true,
 *	"broadcastVideo" : true
 * }
 *
 * NOTE: If the user does not specify a userid, that says one will never be specified so go ahead
 * and initialize the endpoint provider and let the provider assign a name. If a defined empty
 * string is passed in, that means to wait until the end user registers a name before initializing
 * the endpoint provider.
 */

(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .controller('RtcommConfigController', RtcommConfigController);

    RtcommConfigController.$inject = ['RtcommService', '$http', '$scope', '$log'];

    /* @ngInject */
    function RtcommConfigController(dependencies) {
        var vm = this;
        vm.extendedConfig = null;

        $log.debug('RtcommConfigController: configURL = ' + vm.configURL);

        vm.setConfig = function(data) {
            $log.debug('RtcommConfigController: setting config data:' + data);
            RtcommService.setConfig(data);
        };

        $scope.init = function(configURL, extendedConfig) {
            $log.debug('RtcommConfigController: initing configURL = ' + configURL);
            vm.configURL = configURL;

            if (typeof extendedConfig !== "undefined")
                vm.extendedConfig = extendedConfig;

            vm.getConfig();
        };

        vm.getConfig = function() {
            $http.get(vm.configURL).success(function(config) {

                // Now we need to update the config with any extensions passed in on init.
                if (vm.extendedConfig != null) {
                    angular.extend(config, vm.extendedConfig);
                    $log.debug('RtcommConfigController: extended config object: ' + config);
                }

                RtcommService.setConfig(config);
            }).error(function(data, status, headers, config) {
                $log.debug('RtcommConfigController: error accessing config: ' + status);
            });
        };
        activate();

        function activate() {

        }
    }
})();
