

/**
 *(C) Copyright IBM Corporation 2016.
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


describe('Unit Testing: RtcommAlert directive', function(){
  var _$rootScope, element;
  beforeEach(module("rtcomm.templates"));

  beforeEach(module('angular-rtcomm-ui'));  beforeEach(module("rtcomm.templates"));

  beforeEach(inject(function($compile, $rootScope) {
      _$rootScope = $rootScope;
      element = $compile('<rtcomm-alert></rtcomm-alert>')(_$rootScope);
      _$rootScope.$digest();

  }));

  it('alert directive should be available', function(){
    expect(element.html()).to.include('alert in alertVM.alerts');
  });

  it('should create an alert object on rtcomm::alert', function(){
    var type = 'error', msg = 'Disconnected from the server!';
    _$rootScope.$broadcast('rtcomm::alert', createEventObject(type, msg) );
    _$rootScope.$digest();

    var alertElements = element.find('.alert');
    expect(angular.element(alertElements[0]).html()).to.include(msg);
  });

  it('should delete an alert object on close click', function(){
    var type = 'error', msg = 'Disconnected from the server!';
    _$rootScope.$broadcast('rtcomm::alert', createEventObject(type, msg) );
    _$rootScope.$digest();
    var alertElements = element.find('.alert');
    var alert = angular.element(alertElements[0]);
    var closeBtn = alert.find('button');
    closeBtn.click();
    _$rootScope.$digest();

    var alertElements = element.find('.alert');

    expect(alertElements.length).to.equal(0);
  })

  function createEventObject(_type, _msg){
    return {
      type: _type,
      msg: _msg
    }
  }
  // it()
})
