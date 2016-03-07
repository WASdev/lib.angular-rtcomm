describe('Unit Testing: Register directive', function() {
    var $compile, _$rootScope, sandbox, scope, ctrl, element;


    var input, btn;

    beforeEach(module("rtcomm.templates"));

    beforeEach(module('angular-rtcomm-ui'));

    //Mock RtcommService
    beforeEach(function() {
        RtcommService = {
            register: function(userid) {
                _$rootScope.$broadcast('rtcomm::init', true, {
                    userid: userid
                });
            },
            unregister: function() {
                _$rootScope.$broadcast('rtcomm::init', false, 'destroyed');
            }
        }

        module(function($provide) {
            $provide.value('RtcommService', RtcommService);
        });
    });

    //Setup Test
    beforeEach(inject(function($compile, $rootScope) {
        _$rootScope = $rootScope;


        scope = $rootScope;
        element = $compile('<rtcomm-register></rtcomm-register>')(scope);
        scope.$digest();

        sandbox = sinon.sandbox.create();
        input = element.find('input');
        btn = element.find('button');

    }));

    afterEach(function() {
        sandbox.restore();

    })

    it('directive should compile', function() {
        expect(element.html()).to.include('id="register-input"');
    });

    it('initial state should be defined as nextAction = Register and userid empty', function() {

        expect(btn.html()).to.include('Register');
        expect(input.val()).to.be.empty;

        //Empty input should be disabled
        expect(btn.is(':disabled')).to.be.true;

    });

    it('should say "Unregister" when initialized and back to "Register" when uninitialized', function() {

        sandbox.spy(_$rootScope, '$broadcast'); //Spy for broadcasts called

        //Emit the 'rtcomm::init' event
        _$rootScope.$broadcast('rtcomm::init', true, {
            userid: 'MockUser'
        });
        // Force changes on UI
        _$rootScope.$digest();

        expect(_$rootScope.$broadcast.calledOnce).to.be.true;
        expect(btn.html()).to.include('Unregister');
        expect(input.val()).to.include('MockUser');


        _$rootScope.$broadcast('rtcomm::init', false, 'destroyed');
        _$rootScope.$digest();

        expect(_$rootScope.$broadcast.called).to.be.true;
        expect(btn.html()).to.include('Register');
        expect(input.val()).to.be.empty;

    });

    it('should display an error with details when failure to initialize', function() {
        sandbox.spy(_$rootScope, '$broadcast');
        var error = 'SERVICE_QUERY_FAILED';

        _$rootScope.$broadcast('rtcomm::init', false, error);

        _$rootScope.$digest();

        expect(_$rootScope.$broadcast.calledOnce).to.be.true;
        expect(input.val()).to.include(error);
    });

    it('should successfully register using the input and btn -> Input should be disabled', function() {

        //Fill input
        input.val('MockUser');
        input.trigger('input');

        _$rootScope.$digest();
        expect(input.val()).to.include('MockUser');
        expect(btn.html()).to.include('Register');


        btn.click(); //Register
        _$rootScope.$digest();

        expect(input.val()).to.include('MockUser');
        expect(btn.html()).to.include('Unregister');
        expect(input.is(':disabled')).to.be.true; //Input field should be disabled

    });

    it('should unregister using the "Unregister" button', function() {
        input.val('MockUser');
        input.trigger('input');

        expect(btn.html()).to.equal('Register');

        btn.click();

        _$rootScope.$digest();

        expect(btn.html()).to.equal('Unregister');

        btn.click();
        _$rootScope.$digest();

        // _$rootScope.$digest();

        expect(btn.html()).to.equal('Register');
        expect(input.is(':enabled')).to.be.true;
        expect(input.val()).to.be.empty;
    });

    it('should disable input fields on invalid characters', function(done) {
        var invalidCharacters = ['$', '#', '+', '/', '\\']; //Invalid characters for MQTT Topic Path


        invalidCharacters.forEach(function(invalid_char) {

            inputHelper(invalid_char);
            expect(btn.is(':disabled')).to.be.true;

            //Clear
            inputHelper('');

            inputHelper('MockUser' + invalid_char);
            expect(btn.is(':disabled')).to.be.true;

            inputHelper('');

            inputHelper(invalid_char + 'MockUser');
            expect(btn.is(':disabled')).to.be.true;
        });

        function inputHelper(value) {
            input.val(value);
            input.trigger('input'); //Trigger user input action
            _$rootScope.$digest();
        }
        //TODO Test permutations and combinations between all characters

        done();
    });
});
