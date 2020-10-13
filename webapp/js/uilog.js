sap.ui.define([
	"./localization",
	"sap/ui/model/resource/ResourceModel",
	'sap/m/MessageStrip'
], function (Localization, ResourceModel, MessageStrip) {
	return {

		reportErrorMsg: function (text, params, elem) {
			this._reportMsg(text, params, "Error", elem);
		},

		reportSuccessMsg: function (text, params, elem) {
			this._reportMsg(text, params, "Success", elem);
		},		
		
		reportInformationMsg: function (text, params, elem) {
			this._reportMsg(text, params, "Success", elem);
		},	
		
		reportWarningMsg: function (text, params, elem) {
			this._reportMsg(text, params, "Warning", elem);
		},	
		
		_reportMsg: function (text, params, type, elem) {
			var oMsgStrip = new MessageStrip(undefined, {
				text: text,
				showCloseButton: true,
				showIcon: true,
				type: type
			});
			elem.addContent(oMsgStrip);
		}
	};
});