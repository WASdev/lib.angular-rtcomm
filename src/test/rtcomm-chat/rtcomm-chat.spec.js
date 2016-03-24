
/* globals browser */
/* globals by */

var AngularRtcomm = require('../angular-rtcomm-directives.js');
describe('E2E Integration: rtcomm-chat directive', function(){



	beforeEach(function(){

		browser.get('rtcomm-chat/');
	});

	var client  = new AngularRtcomm(browser);

	var rtcommChat = new client.rtcommChat(),

	rtcommAlertModal = new client.rtcommAlertModal(),
	rtcommRegister = new client.rtcommRegister();

	it('should maintain a chat session between users', function(){
		

	});

});
