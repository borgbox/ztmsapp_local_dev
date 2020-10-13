sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox"
], function (UI5Object, MessageBox) {
	"use strict";

	return UI5Object.extend("com.infineon.ztmsapp.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias teste.teste.controller.ErrorHandler
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorText");
			this._sErrorText503 = this._oResourceBundle.getText("service_unavailable");

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();

				if (oParams.response.statusCode === 403 || oParams.response.statusCode === "403") {
					this._oComponent.getRouter().getTargets().display("NotAuthorize");
					return;
				}

				if (oParams.response.statusCode === "503" || oParams.response.statusCode === 503) {
					//this._showServiceError(this._sErrorText503);
					return;
				}

				if (oParams.response.statusCode === 500 || oParams.response.statusCode === "500") {
					this._oComponent.getRouter().getTargets().display("NotAvailable", {
						title: this._oResourceBundle.getText("appTitle"),
						text: this._oResourceBundle.getText("main_tms_unavailable")
					});
					return;
				}

			}, this);

			this._oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though

				if (oParams.response.statusCode === "403") {
					this._oComponent.getRouter().getTargets().display("NotAuthorize");
					return;
				}

				if (oParams.response.statusCode === "400" || oParams.response.statusCode === 400) {
					return;
				}

				if (oParams.response.statusCode === "503" || oParams.response.statusCode === 503) {
					//this._showServiceError(this._sErrorText503);
					return;
				}

				if (oParams.response.statusCode === "504" || oParams.response.statusCode === 504) {
					//Do nothing
					return;
				}

				if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
						"Cannot POST") === 0)) {
					this._showServiceError(oParams.response);
				}
			}, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			MessageBox.error(
				this._sErrorText, {
					id: "serviceErrorMessageBox",
					details: sDetails,
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		}
	});
});