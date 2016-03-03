describe('Unit Testing: RtcommChat directive', function(){
  var $compile, $rootScope;
  beforeEach(module("rtcomm.templates"));

  beforeEach(module('angular-rtcomm'));
  beforeEach(inject(
    ['$compile', '$rootScope', function($c, $r){
      $compile = $c;
      $rootScope = $r;
    }]
  ));

  it('chat directive should be available', function(){
    var element = $compile('<rtcomm-video></rtcomm-video>')($rootScope);
    $rootScope.$digest();
    expect(element.html()).to.include('id="videoContainer"');
  });
})
