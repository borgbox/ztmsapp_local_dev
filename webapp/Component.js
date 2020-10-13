sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/infineon/ztmsapp/model/models",
	"./controller/ErrorHandler",
	"./util/ServiceHelper"
], function (UIComponent, Device, models, ErrorHandler, ServiceHelper) {
	"use strict";

	return UIComponent.extend("com.infineon.ztmsapp.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		_serviceHelper: ServiceHelper,
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			//Get session timeout
			this._serviceHelper.read("/TMSParametersSet(Cfgkey1='SESSIONTIMEOUT',Cfgkey2='')", this.getModel(), true, null, null, null, null,
					null)
				.then((res) => {
					//Monitoring HTTP calls
					if (res[0]) {
						let nValue = !isNaN(parseInt(res[0].Cfgvalue)) ? parseInt(res[0].Cfgvalue) : 0;
						this._serviceHelper.startSessionTimerBaseOnRequest("ZHR_TMS_CORE_SRV", this, nValue);
					}
					//Dummy call to start timer
					this._serviceHelper.read("/TMSParametersSet(Cfgkey1='SESSIONTIMEOUT',Cfgkey2='')", this.getModel(), true);
				})
				.catch((err) => {});

			// initialize the error handler with the component
			this._oErrorHandler = new ErrorHandler(this);

			// enable routing
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.getModel().setSizeLimit(10000);

			//this.checkBrowser();

		},
		checkBrowser: function () {
			console.log(this.getModel("device").oData.browser.name);
			if (this.getModel("device").oData.browser.name === "ie") {
				sap.m.MessageBox.error(
					this.getModel("i18n").getResourceBundle().getText("browser_not_supported"), {
						details: this.getModel("i18n").getResourceBundle().getText("browser_not_supported_detail"),
						actions: [sap.m.MessageBox.Action.CLOSE],
						onClose: function () {
						//	this._bMessageOpen = false;
						}.bind(this)
					}
				);
			}
		},
		destroy: function () {
			this._oErrorHandler.destroy();
		}
	});
});