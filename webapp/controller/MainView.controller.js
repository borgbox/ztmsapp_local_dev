sap.ui.define([
	"com/infineon/ztmsapp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/infineon/ztmsapp/js/localization",
	"com/infineon/ztmsapp/util/formatter",
], function (Controller, JSONModel, Localization, formatter) {
	"use strict";

	return Controller.extend("com.infineon.ztmsapp.controller.MainView", {
		baseUrl: "/ConfigurationsSet(Uname='')",

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.infineon.ztmsapp.view.MainView
		 */
		_currentRole: null,
		_msgPage: null,
		formatter: formatter,
		onInit: function () {

			var text = Localization.getText("main_tms_unavailable");
			var title = Localization.getText("main_tms_unavailable_title");
			var app = this.getView().byId("idAppControl");
			var empIdTile = this.getView().byId("toEmployeeView");
			var mgrIdTile = this.getView().byId("managertile");
			var approvL2IdTile = this.getView().byId("approvL2tile");
			var reqIdTile = this.getView().byId("requestortile");
			var supervisorIdTile = this.getView().byId("supervisortile");
			var mdLevelIdTile = this.getView().byId("mdleveltile");
			var hrIdTile = this.getView().byId("hradmintile");
			var supportIdTile = this.getView().byId("supportertile");
			this.getOwnerComponent().getRouter().getRoute("MainView").attachMatched(this._onRouteMatched, this);
			var model = this.getView().getModel() || this.getOwnerComponent().getModel();

			//this.getOwnerComponent().getModel().attachMetadataFailed(unavailableFunc);
			model.read(this.baseUrl, {
				success: (oData, oResponse) => {
					var noRole = true;

					if (oData.EmployeeRole && empIdTile) {
						empIdTile.setVisible(true);
						if (oData.EmployeeTile && oData.EmployeeTile != "") {
							empIdTile.setHeader(oData.EmployeeTile);
						}
						if (oData.EmployeeDesc && oData.EmployeeDesc != "") {
							empIdTile.setSubheader(oData.EmployeeDesc);
						}
						noRole = false;
					}
					if (oData.ManagerRole && mgrIdTile) {
						mgrIdTile.setVisible(true);
						if (oData.ManagerTile && oData.ManagerTile != "") {
							mgrIdTile.setHeader(oData.ManagerTile);
						}
						if (oData.ManagerDesc && oData.ManagerDesc != "") {
							mgrIdTile.setSubheader(oData.ManagerDesc);
						}
						noRole = false;
					}
					if (oData.ApprovL2Role && approvL2IdTile) {
						approvL2IdTile.setVisible(true);
						if (oData.ApprovL2Tile && oData.ApprovL2Tile != "") {
							approvL2IdTile.setHeader(oData.ApprovL2Tile);
						}
						if (oData.ApprovL2Desc && oData.ApprovL2Desc != "") {
							approvL2IdTile.setSubheader(oData.ApprovL2Desc);
						}
						noRole = false;
					}
					if (oData.RequestorRole && reqIdTile) {
						reqIdTile.setVisible(true);
						if (oData.RequestorTile && oData.RequestorTile != "") {
							reqIdTile.setHeader(oData.RequestorTile);
						}
						if (oData.RequestorDesc && oData.RequestorDesc != "") {
							reqIdTile.setSubheader(oData.RequestorDesc);
						}
						noRole = false;
					}
					if (oData.HradminRole && hrIdTile) {
						hrIdTile.setVisible(true);
						if (oData.HradminTile && oData.HradminTile != "") {
							hrIdTile.setHeader(oData.HradminTile);
						}
						if (oData.HradminDesc && oData.HradminDesc != "") {
							hrIdTile.setSubheader(oData.HradminDesc);
						}
						noRole = false;
					}
					if (oData.SupportRole && supportIdTile) {
						supportIdTile.setVisible(true);
						if (oData.SupportTile && oData.SupportTile != "") {
							supportIdTile.setHeader(oData.SupportTile);
						}
						if (oData.SupportDesc && oData.SupportDesc != "") {
							supportIdTile.setSubheader(oData.SupportDesc);
						}
						noRole = false;
					}

					if (oData.SupervisorRole && supervisorIdTile) {
						supervisorIdTile.setVisible(true);
						if (oData.SupervisorTile && oData.SupervisorTile != "") {
							supervisorIdTile.setHeader(oData.SupervisorTile);
						}
						if (oData.SupervisorDesc && oData.SupervisorDesc != "") {
							supervisorIdTile.setSubheader(oData.SupervisorDesc);
						}
						noRole = false;
					}
					if (oData.MdLevelRole && mdLevelIdTile) {
						mdLevelIdTile.setVisible(true);
						if (oData.MdLevelTile && oData.MdLevelTile != "") {
							mdLevelIdTile.setHeader(oData.MdLevelTile);
						}
						if (oData.MdLevelDesc && oData.MdLevelDesc != "") {
							mdLevelIdTile.setSubheader(oData.MdLevelDesc);
						}
						noRole = false;
					}
					var configurations = new JSONModel(oData);
					this.getOwnerComponent().setModel(configurations, "configurations");

					//this.getView().setModel(configurations, "configurations");
					if (noRole) {

						this.goUnavailablePage(
							this.getText("appTitle"),
							this.getText("main_tms_norole"));

					} else {
						this.loadEmployeeData();
					}
				},
				error: (err) => {
					this.goUnavailablePage(
						this.getText("appTitle"),
						this.getText("main_tms_generic_error_loading"));
				}
			});

		},
		_onRouteMatched: function () {
			this._clock();
			this.setNotificationVisible(true);
			jQuery.sap.delayedCall(500, null, () => {
				this.updateNotifications();
			});

			/*window.onbeforeunload = () => {
				this._logout();
				return;
			};*/

		},
		goUnavailablePage: function (sTitle, sText) {
			this.getRouter().getTargets().display("NotAvailable", {
				title: sTitle,
				text: sText
			});

		},
		loadEmployeeData: function () {

			this.baseUrlEmp = `/EmployeeDataSet(Employee='00000000',Role='EMPLOYEE')`;
			this.oModel = this.getView().getModel() || this.getOwnerComponent().getModel();
			this.oModel.read(this.baseUrlEmp, {
				success: (oData, oResponse) => {

					if (oData.Employee.length === 0) {
						this.getView().byId("employeeDataHeader").setVisible(false);
						this.getView().byId("msgNoEmployee").setVisible(true);
					} else {
						this.getView().byId("employeeDataHeader").setVisible(true);
						this.getView().byId("msgNoEmployee").setVisible(false);
					}
					let objPage = this.getView().byId("ObjectPageLayoutMain");
					objPage.bindElement(this.baseUrlEmp);
					let employeeData = new JSONModel(oData);

					this.getOwnerComponent().setModel(employeeData, "employeeData");
					this.pernr = oData.Employee;
					this.role = oData.Role;

					jQuery.sap.delayedCall(300, null, () => {
						this.updateNotifications();
					});
					this.setBusy(false);

				},
				error: (err) => {
					this.setBusy(false);
					this.reportErrorMsg(err, "msg_error_load_employee_data");
				}
			});

		},
		tilePressed: function (oEvent, sRole) {
			this.setBusy(true);
			var route = oEvent.getSource().getCustomData()[0].getValue("route");
			var oRouter = this.getOwnerComponent().getRouter();
			this._currentRole = sRole;
			this.currentRoleTitle = oEvent.getSource().getHeader().length > 0 ? oEvent.getSource().getHeader() : this.formatter.getManagerScreenTitle(
				this._currentRole);

			this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({
				currentRole: this._currentRole,
				currentRoleTitle : this.currentRoleTitle
			}), "currentRole");

			oRouter.navTo(route);
		},

	});

});