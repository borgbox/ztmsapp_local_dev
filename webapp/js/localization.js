sap.ui.define([
	"./localization",
	"sap/ui/model/resource/ResourceModel"
], function(Localization, ResourceModel) {
	return {
		i18nModel : new ResourceModel({
			bundleName: "com.infineon.ztmsapp.i18n.i18n"
		}),

		getText: function(text, params) {

			var result = this.i18nModel.getResourceBundle().getText(text, params);
			return result;
		}
	};
});