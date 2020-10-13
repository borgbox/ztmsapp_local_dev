sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("com.infineon.ztmsapp.controller.NotAvailable", {

		/**
		 * Navigates to the worklist when the link is pressed
		 * @public
		 */
		onInit: function () {

			let oRouter, oTarget;
			oRouter = this.getRouter();
			oTarget = oRouter.getTarget("NotAvailable");
			let msgPage = this.getView().byId("pageNotAvailable");

			oTarget.attachDisplay((oEvent) => {
				this._oData = oEvent.getParameter("data");
				msgPage.setTitle(this._oData.title);
				msgPage.setText(this._oData.text);
			});

		},
		onLinkPressed: function () {
			this.getRouter().navTo("MainView");
		},

	});

});