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
 * This directive manages call queues. It provides the ability to display all the available queues
 * (along with their descriptions) and by clicking on a queue, allows an agent (or any type of user)
 * to subscribe on that queue.
 */
(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommQueues', rtcommQueues);

    /* @ngInject */
    function rtcommQueues() {
        var directive = {
            restrict: 'E',
            templateUrl: 'templates/rtcomm/rtcomm-queues.html',
            controller: QueuesController,
            controllerAs: 'queuesVM',
            bindToController: true
        };

        return directive;

    }

    QueuesController.$inject = ['RtcommService', '$scope', '$log'];

    /* @ngInject */
    function QueuesController(RtcommService, $scope, $log) {
        var vm = this;

        vm.rQueues = [];
        vm.autoJoinQueues = false;
        vm.queuePresenceData = [];
        vm.queuePublishPresence = false;
        vm.queueFilter = null;

        /**
         * autoJoinQueues - automatically join any queues that are not filtered out
         * queuePublishedPresence - will add to the presence document information about what queues this person joins.
         * queueFilter - If defined, this specifies which queues should be joined. All others will be ignored.
         */
        $scope.init = function(autoJoinQueues, queuePublishPresence, queueFilter) {
            $log.debug('rtcommQueues: autoJoinQueues = ' + autoJoinQueues);
            vm.autoJoinQueues = autoJoinQueues;
            vm.queuePublishPresence = queuePublishPresence;
            if (typeof queueFilter !== "undefined")
                vm.queueFilter = queueFilter;
        };

        //
        vm.filterOutQueue = function(queue) {
            var returnValue = true;

            if (vm.queueFilter != null) {

                for (var index = 0; index < vm.queueFilter.length; ++index) {
                    var entry = vm.queueFilter[index];
                    if (entry == queue.endpointID) {
                        returnValue = false;
                        break;
                    }
                }
            } else
                returnValue = false;

            return (returnValue);
        };

        vm.onQueueClick = function(queue) {
            $log.debug('rtcommQueues: onClick: TOP');
            for (var index = 0; index < vm.rQueues.length; index++) {
                if (vm.rQueues[index].endpointID === queue.endpointID) {
                    $log.debug('rtcommQueues: onClick: queue.endpointID = ' + queue.endpointID);

                    if (queue.active == false) {
                        RtcommService.joinQueue(queue.endpointID);
                        vm.rQueues[index].active = true;
                    } else {
                        RtcommService.leaveQueue(queue.endpointID);
                        vm.rQueues[index].active = false;
                    }
                } else if (index == (vm.rQueues.length - 1)) {
                    $log.debug('rtcommQueues: ERROR: queue.endpointID: ' + queue.endpointID + ' not found in list of queues');

                }
            }

            vm.updateQueuePresence();
        };

        vm.updateQueuePresence = function() {
            //	Update the presence record if enabled
            if (vm.queuePublishPresence == true) {
                RtcommService.removeFromPresenceRecord(vm.queuePresenceData, false);

                vm.queuePresenceData = [];

                for (var index = 0; index < vm.rQueues.length; index++) {
                    if (vm.rQueues[index].active === true) {
                        vm.queuePresenceData.push({
                            'name': "queue",
                            'value': vm.rQueues[index].endpointID
                        });
                    }
                }

                RtcommService.addToPresenceRecord(vm.queuePresenceData);
            }
        }

        $scope.$on('queueupdate', function(event, queues) {
            $log.debug('rtcommQueues: scope queues', vm.rQueues);
            Object.keys(queues).forEach(function(key) {
                $log.debug('rtcommQueues: Push queue: ' + queues[key]);
                $log.debug('rtcommQueues: autoJoinQueues: ' + vm.autoJoinQueues);

                //	Check to make sure queue is not filteres out before adding it.
                if (vm.filterOutQueue(queues[key]) == false) {
                    vm.rQueues.push(queues[key]);
                    // If autoJoin we go ahead and join the queue as soon as we get the queue update.
                    if (vm.autoJoinQueues == true) {
                        vm.onQueueClick(queues[key]);
                    }
                }
            });

            vm.updateQueuePresence();
        });

        $scope.$on('rtcomm::init', function(event, success, details) {
            if (success == false) {
                $log.debug('rtcommQueues: init: clear queues');
                vm.rQueues = [];
            }
        });

    }
})();
