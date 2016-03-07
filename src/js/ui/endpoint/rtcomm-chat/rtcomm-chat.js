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
 * This directive manages the chat portion of a session. The data model for chat
 * is maintained in the RtcommService. This directive handles switching between
 * active endpoints.
 */
(function() {
    'use strict';

    angular
        .module('angular-rtcomm-ui')
        .directive('rtcommChat', rtcommChat);

    rtcommChat.$inject = ['RtcommService', '$log'];

    /* @ngInject */
    function rtcommChat(RtcommService, $log) {
        var directive = {
            restrict: 'E',
            templateUrl: 'templates/rtcomm/rtcomm-chat.html',
            link: chatLink,
            controller: ChatController,
            controllerAs: 'chatVM',
            bindToController: true
        };

        return directive;

        function chatLink(scope, element, attr, ctrl) {
            var chatPanel = angular.element(element.find('.panel-body')[0]);

            var bottom = true;

            //Chooses if the scrollbar should be forced to the bottom on the next lifecycle
            ctrl.scrollToBottom = function(flag) {
                bottom = flag;
                scope.bottom = flag;

            }

            //Watch scroll events
            chatPanel.bind('scroll', function() {
                if (chatPanel.prop('scrollTop') + chatPanel.prop('clientHeight') == chatPanel.prop('scrollHeight')) {
                    ctrl.scrollToBottom(true);
                } else {
                    ctrl.scrollToBottom(false);
                }
            });

            //Watch the chat messages, if the scroll bar is in the bottom keep it on the bottom so the user can view incoming chat messages, else possibly send a notification and don't scroll down
            scope.$watch(function() {
                return ctrl.chats
            }, function() {
                $log.debug('rtcommChat - Link > $watch on chats called');
                if (bottom) {
                    chatPanel.scrollTop(chatPanel.prop('scrollHeight'));
                } else {
                    //In this else, a notification could be sent
                }
            }, true);

        }

    }

    //Controller should be used to listen for events from Rtcmo
    ChatController.$inject = ['$scope', 'RtcommService', '$log'];

    /* @ngInject */
    function ChatController($scope, RtcommService, $log) {
        var vm = this;

        vm.chatActiveEndpointUUID = RtcommService.getActiveEndpoint();
        vm.chats = RtcommService.getChats(vm.chatActiveEndpointUUID);

        vm.keySendMessage = function(keyEvent) {
            if (keyEvent.which === 13)
                vm.sendMessage();
        };

        vm.sendMessage = function() {
            $log.debug('rtcommChat: sendMessage() -> ' + vm.message);
            var chat = {
                time: new Date(),
                name: RtcommService.getEndpoint(vm.chatActiveEndpointUUID).getLocalEndpointID(),
                message: angular.copy(vm.message)
            };

            vm.message = '';
            vm.scrollToBottom(true);
            $scope.bottom = true;
            RtcommService.sendChatMessage(chat, vm.chatActiveEndpointUUID);
        }

        $scope.$on('endpointActivated', function(event, endpointUUID) {
            $log.debug('rtcommChat: endpointActivated =' + endpointUUID);

            //	The data model for the chat is maintained in the RtcommService.
            vm.chats = RtcommService.getChats(endpointUUID);
            vm.chatActiveEndpointUUID = endpointUUID;
        });

        $scope.$on('noEndpointActivated', function(event) {
            vm.chats = [];
            vm.chatActiveEndpointUUID = null;
        });
    }
})();
