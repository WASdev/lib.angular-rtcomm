describe('Unit Testing: Register directive', function(){
  var $compile, $rootScope;
  beforeEach(module("rtcomm.templates"));

  beforeEach(module('angular-rtcomm'));
  beforeEach(inject(
    ['$compile', '$rootScope', function($c, $r){
      $compile = $c;
      $rootScope = $r;
    }]
  ));

  it('directive should compile', function(){
    var element = $compile('<rtcomm-register></rtcomm-register>')($rootScope);
    $rootScope.$digest();
    expect(element.html()).to.include('id="register-input"');
  });

  it('should register')


})
