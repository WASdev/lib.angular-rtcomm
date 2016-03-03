describe('Controller Testing: Rtcomm Alert Modal', function(){
  var $compile, $rootScope, $modal;
  beforeEach(module("rtcomm.templates"));

  beforeEach(module('angular-rtcomm'));

  beforeEach(function(){

  });
  beforeEach(inject(
    ['$compile', '$rootScope','$injector', function($c, $r, $i){
      $compile = $c;
      $rootScope = $r;
      $modal = $i.get('$modal');
    }]
  ));

  it('chat directive should be available', function(){
    //Add the controller to the body
    var element = $compile('<div ng-controller="RtcommAlertModalController"></div>')($rootScope);
    $rootScope.$digest();

    var modalSpy = sinon.spy($modal, 'open');

    //Emit an rtcomm-alerting event
    $rootScope.$broadcast('session:alerting', {
      endpoint: {
        id: 'testid',
        getRemoteEndpointID: function(){
          return 'temp2'
        }
      }
    });

    expect(modalSpy.calledOnce).to.be.true;
  });
})
