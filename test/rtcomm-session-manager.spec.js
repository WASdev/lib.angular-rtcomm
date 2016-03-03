describe('Unit Testing: RtcommSessionManager directive', function(){
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
    var element = $compile('<rtcomm-session-manager></rtcomm-session-manager>')($rootScope);
    $rootScope.$digest();
    console.log(element[0]);
    expect(element.html()).to.include('class="session-manager"');
  });
})
