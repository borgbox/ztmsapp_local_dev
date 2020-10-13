/*global history */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/message/Message",
	"sap/ui/core/MessageType",
	"sap/m/MessageToast",
	"com/infineon/ztmsapp/js/localization",
	"sap/ui/export/Spreadsheet",
	"sap/m/MessagePopover",
	"sap/m/MessageItem",
	"sap/ui/model/json/JSONModel",
	"com/infineon/ztmsapp/service/Service",
	"sap/ui/core/Fragment",
	"com/infineon/ztmsapp/util/ServiceHelper",
	"com/infineon/ztmsapp/util/formatter",
	"com/infineon/ztmsapp/js/Constants",
], function (Controller, History, Message, MessageType, MessageToast, Localization, Spreadsheet, MessagePopover, MessageItem, JSONModel,
	Service, Fragment, ServiceHelper, formatter, Constants) {
	"use strict";
	return Controller.extend("com.infineon.ztmsapp.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		oMessagePopover: null,
		_Service: Service,
		oUploadEmployeesPopup: null,
		sEmployeeRange: "",
		_serviceHelper: ServiceHelper,
		formatter: formatter,
		_constants: Constants,
		getUploadEmployeesPopup: function (oView, oControl, oControlMultiInput) {

			if (!this.oUploadEmployeesPopup) {
				Fragment.load({
					name: "com.infineon.ztmsapp.fragments.UploadEmployeesPopup",
					controller: this
				}).then((pPopover) => {
					this.oUploadEmployeesPopup = pPopover;
					this.oUploadEmployeesPopup.setPlacement(sap.m.PlacementType.Horizontal);
					oView.addDependent(this.oUploadEmployeesPopup);
					this.oUploadEmployeesPopup.openBy(oControl);
					this.oUploadEmployeesPopup.oControlMultiInput = oControlMultiInput;
				});
				this.sEmployeeRange = {
					employees: ""
				};
				oView.setModel(new JSONModel({}, true), "employeeRange")
			} else {
				this.oUploadEmployeesPopup.openBy(oControl);
				this.oUploadEmployeesPopup.oControlMultiInput = oControlMultiInput;
			}
		},
		setNotificationVisible: function (bVisible) {
			//appView	notification
			if (!this.getOwnerComponent().getModel("notification")) {
				this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({
					visible: bVisible,
					notificaonbusy: false
				}), "notification");
			} else {
				this.getOwnerComponent().getModel("notification").setProperty("/visible", bVisible);
				this.getOwnerComponent().getModel("notification").setProperty("/notificaonbusy", bVisible);
			}

		},
		initDropDownModel: function () {
			let oData = {
				OrgUnitSet: [],
				CostCenterSet: [],
				EmployeeGroupSet: [],
				ShiftGroupSet: [],
				StatusSet: [],
				busy: true
			};
			let oModel = new sap.ui.model.json.JSONModel(oData);
			this.getOwnerComponent().setModel(oModel, "intervalsTMS");
		},
		loadDropDownModel: function (sEmployee, sRole) {

			let aPromise = [];
			let aFilters = [];

			aFilters.push(new sap.ui.model.Filter({
				path: "Employee",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sEmployee
			}));
			aFilters.push(new sap.ui.model.Filter({
				path: "Role",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sRole
			}));

			aPromise.push(this._serviceHelper.read("/OrgUnitSet", this.getOwnerComponent().getModel(), true, null, null, null, aFilters,
				null));
			aPromise.push(this._serviceHelper.read("/CostCenterSet", this.getOwnerComponent().getModel(), true, null, null, null, aFilters,
				null));
			aPromise.push(this._serviceHelper.read("/EmployeeGroupSet", this.getOwnerComponent().getModel(), true, null, null, null, aFilters,
				null));
			aPromise.push(this._serviceHelper.read("/ShiftGroupSet", this.getOwnerComponent().getModel(), true, null, null, null, aFilters,
				null));
			aPromise.push(this._serviceHelper.read("/StatusSet", this.getOwnerComponent().getModel(), true, null, null, null, aFilters,
				null));
			Promise.all(aPromise)
				.then((res) => {
					let oData = {
						OrgUnitSet: res[0][0].results,
						CostCenterSet: res[1][0].results,
						EmployeeGroupSet: res[2][0].results,
						ShiftGroupSet: res[3][0].results,
						StatusSet: res[4][0].results,
						busy: false
					};
					let oModel = new sap.ui.model.json.JSONModel(oData);
					this.getOwnerComponent().setModel(oModel, "intervalsTMS");
				})
				.catch((err) => {
					this.reportErrorMsg(err, "msg_err_service_dropdown");
				});
		},
		onNotifications: function (oEvt) {

			let oControl = oEvt.getSource();

			//this._initPopupNotification();

			if (!this._oPopoverNotification) {
				Fragment.load({
					name: "com.infineon.ztmsapp.fragments.NotificationPopup",
					controller: this
				}).then((pPopover) => {
					this._oPopoverNotification = pPopover;
					this._oPopoverNotification.setPlacement(sap.m.PlacementType.Bottom);
					this.getView().addDependent(this._oPopoverNotification);

					this._oPopoverNotification.openBy(oControl);
					this._oPopoverNotification.myControl = oControl;

				});

			} else {
				if (this._oPopoverNotification.isOpen()) {
					this._oPopoverNotification.close();
				} else {
					this._oPopoverNotification.openBy(oControl);
					this._oPopoverNotification.myControl = oControl;
				}
			}

		},
		onListItemPress: function (sEntity, sRole) {
			switch (sEntity) {
			case "timeCorrection":
				this.onGoPendingTime(sRole);
				break;
			case "OTApproval":
				this.onGoOTApproval(sRole);
				break;
			case "PreOTShiftApproval":
				this.onGoPreOTApproval(sRole);
				break;
			}
		},
		onGoPendingTime: function (sRole) {
			this.gotTo(sRole, "TimeCorrection");
		},
		onGoOTApproval: function (sRole) {
			this.gotTo(sRole, "OTApproval");
		},
		onGoPreOTApproval: function (sRole) {
			this.gotTo(sRole, "PreOTShiftApproval");
		},
		gotTo: function (sRole, sTab) {

			let oDataConfig = this.getView().getModel("configurations").oData;
			this.setBusy(true);
			this._currentRole = sRole;

			switch (this._currentRole) {
			case this._constants.MANAGER:
				this.currentRoleTitle = oDataConfig.ManagerTile && oDataConfig.ManagerTile.length > 0 ? oDataConfig.ManagerTile : this.getText(
					"manager");
				break;
			case this._constants.APPROV_L2:
				this.currentRoleTitle = oDataConfig.ApprovL2Tile && oDataConfig.ApprovL2Tile.length > 0 ? oDataConfig.ApprovL2Tile : this.getText(
					"approver_l2");
				break;
			case this._constants.SUPERVISOR:
				this.currentRoleTitle = oDataConfig.SupervisorTile
				break;
			case this._constants.MD_LEVEL:
				this.currentRoleTitle = oDataConfig.MdLevelTile && oDataConfig.MdLevelTile.length > 0 ? oDataConfig.MdLevelTile : this.getText(
					"md_level");
				break;
			case this._constants.HR_ADMIN:
				this.currentRoleTitle = oDataConfig.HradminTile
				break;
			case this._constants.REQUESTOR:
				this.currentRoleTitle = oDataConfig.RequestorTile
				break;
			}

			this.currentRoleTitle = this.currentRoleTitle || this.currentRoleTitle.length === 0 ? this.currentRoleTitle : this.formatter.getManagerScreenTitle(
				this._currentRole);

			this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({
				currentRole: this._currentRole,
				currentRoleTitle: this.currentRoleTitle
			}), "currentRole");

			this.getOwnerComponent().getRouter().navTo("ManagerView", {
				tab: sTab
			});
		},
		handleCloseNotification: function () {

			if (this._oPopoverNotification && this._oPopoverNotification.isOpen()) {
				this._oPopoverNotification.close();
				this._oPopoverNotification.destroy();
				this._oPopoverNotification = null;
			}
		},
		getEmployeesRange: function () {
			let oModel = this.getView().getModel("employeeRange")
			return oModel.getData().employees;
		},
		setEmployeesRange: function (sValue) {
			this.getView().getModel("employeeRange").setProperty("/employees", "");
		},
		handleCloseUploadEmployee: function (oEvt) {
			this.oUploadEmployeesPopup.close();
			this.oUploadEmployeesPopup.destroy();
			if (this.oUploadEmployeesPopup) {
				this.oUploadEmployeesPopup = null;
			}
		},
		uploadEmployees: function (oEvt) {

			this.oUploadEmployeesPopup.close();

			let sEmployees = this.getEmployeesRange();

			if (!sEmployees || sEmployees.length === 0) {
				this.showToast("no_employees_uploaded", false);
				return;
			}

			let sEmployeeRange = [];
			if (sEmployees.includes(",")) {
				sEmployeeRange = sEmployees.split(",");
			} else if (sEmployees.includes(";")) {
				sEmployeeRange = sEmployees.split(";");
			} else {
				sEmployeeRange = sEmployees.split("\n");
			}

			this.oUploadEmployeesPopup.oControlMultiInput.setBusy(true);
			//SearchStr Employee
			let filtersEmployees = this.createFilterOrMultipleValues("SearchStr", sEmployeeRange, false);

			this._Service.getInstance(this).getEmployeeList(filtersEmployees).then((oData) => {

				for (let employee of oData.results) {
					let oToken = new sap.m.Token({
						key: employee.Employee,
						text: `${employee.Fullname} (${employee.Employee})`
					});
					this.oUploadEmployeesPopup.oControlMultiInput.addToken(oToken);
				}
				if (oData.results.length === 0) {
					this.showToast("msg_invalid_employee_upload", false);
				}

				this.oUploadEmployeesPopup.oControlMultiInput.setBusy(false);
				this.setEmployeesRange("");
			}).catch((err) => {
				this.oUploadEmployeesPopup.oControlMultiInput.setBusy(false);
				this.reportErrorMsg(err, "msg_error_get_employees");
			});

		},
		getMessagePopover: function () {

			if (this.oMessagePopover) {
				return this.oMessagePopover;
			} else {

				var oMessageTemplate = new MessageItem({
					type: '{messages>type}',
					title: '{messages>title}',
					activeTitle: "{messages>active}",
					description: '{messages>description}',
					subtitle: '{messages>subtitle}',
					counter: '{messages>counter}'
				});

				this.oMessagePopover = new MessagePopover({
					items: {
						path: 'messages>/',
						template: oMessageTemplate
					}
				});

				let oModel = new JSONModel();
				oModel.setData([]);
				this.oMessagePopover.setModel(oModel, "messages");
				return this.oMessagePopover;
			}
		},
		handleMessagePopoverPress: function (oEvent) {
			this.getMessagePopover().toggle(oEvent.getSource());
		},
		zeroTimezone: function (oDate) {
			oDate.setHours(oDate.getHours() + (-1 * (oDate.getTimezoneOffset() / 60)));
			return oDate;
		},
		isMainView: function () {
			return !window.location.href.includes("ManagerView") && !window.location.href.includes("EmployeeView");
		},
		updateNotifications: function () {

			let oModelConfig = this.getOwnerComponent().getModel("configurations");
			if (!oModelConfig) {
				return;
			}
			let oConfig = oModelConfig.getData();

			this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({
				totals: 0,
				visible: true,
				notificaonbusy: true
			}), "notification");

			//If does not have any role as manager or approver do not display notification icon
			if (!(oConfig.ManagerRole || oConfig.ApprovL2Role)) {
				this.getOwnerComponent().getModel("notification").setProperty("/notificaonbusy", false);
				this.getOwnerComponent().getModel("notification").setProperty("/visible", false);
				return;
			}

			this._serviceHelper.read("/TMSParametersSet(Cfgkey1='DISABLE_NOTIF',Cfgkey2='')", this.getModel(), true, null, null, null, null,
					null)
				.then((res) => {
					if (res[0].Cfgvalue !== 'X') {
						this._getNotifications();
					} else {
						this.getOwnerComponent().getModel("notification").setProperty("/notificaonbusy", false);
						this.getOwnerComponent().getModel("notification").setProperty("/visible", false);
					}
				})
				.catch((err) => {
					this.getOwnerComponent().getModel("notification").setProperty("/notificaonbusy", false);
					this.getOwnerComponent().getModel("notification").setProperty("/visible", false);
				});

		},
		msToHMS: function (ms) {
			// 1- Convert to seconds:
			var seconds = ms / 1000;
			// 2- Extract hours:
			var hours = parseInt(seconds / 3600); // 3,600 seconds in 1 hour
			seconds = seconds % 3600; // seconds remaining after extracting hours
			// 3- Extract minutes:
			var minutes = parseInt(seconds / 60); // 60 seconds in 1 minute
			// 4- Keep only seconds not extracted to minutes:
			seconds = seconds % 60;
			return hours + ":" + minutes + ":" + seconds;
		},
		_getNotifications: function () {

			let oModelConfig = this.getOwnerComponent().getModel("configurations");
			let oEmployeeData = this.getOwnerComponent().getModel("employeeData");
			if (!oModelConfig || !oEmployeeData) {
				return;
			}

			let oConfig = oModelConfig.getData();
			let oEmployee = oEmployeeData.getData();
			let today = new Date();

			let fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			let minDate = fromDate;
			let toDate = new Date();

			let aCount = [];

			let oData = {
				"NotificationSet": [{
					"title": oConfig.ManagerTile && oConfig.ManagerTile.length > 0 ? oConfig.ManagerTile : this.getText("manager"),
					"description": "",
					"creationDate": "",
					"showEmptyGroup": true,
					"showCloseButton": true,
					"visible": false,
					"priority": "High",
					"entity": "timeCorrection",
					"role": "MANAGER"
				}, {
					"title": oConfig.ManagerTile && oConfig.ManagerTile.length > 0 ? oConfig.ManagerTile : this.getText("approver_l2"),
					"description": "",
					"creationDate": "",
					"showEmptyGroup": true,
					"showCloseButton": true,
					"visible": false,
					"priority": "High",
					"entity": "PreOTShiftApproval",
					"role": "MANAGER"
				}, {
					"title": oConfig.ApprovL2Tile && oConfig.ApprovL2Tile.length > 0 ? oConfig.ApprovL2Tile : this.getText("approver_l2"),
					"description": "",
					"creationDate": "",
					"showEmptyGroup": true,
					"showCloseButton": true,
					"visible": false,
					"priority": "High",
					"entity": "OTApproval",
					"role": "APPROV_L2"
				}, {
					"title": oConfig.ApprovL2Tile && oConfig.ApprovL2Tile.length > 0 ? oConfig.ApprovL2Tile : this.getText("approver_l2"),
					"description": "",
					"creationDate": "",
					"showEmptyGroup": true,
					"showCloseButton": true,
					"visible": false,
					"priority": "High",
					"entity": "OTApproval",
					"role": "APPROV_L2"
				}, {
					"title": oConfig.MdLevelTile && oConfig.MdLevelTile.length > 0 ? oConfig.MdLevelTile : this.getText("md_level"),
					"description": "",
					"creationDate": "",
					"showEmptyGroup": true,
					"showCloseButton": true,
					"visible": false,
					"priority": "High",
					"entity": "timeCorrection",
					"role": Constants.MD_LEVEL
				}, {
					"title": oConfig.MdLevelTile && oConfig.MdLevelTile.length > 0 ? oConfig.MdLevelTile : this.getText("md_level"),
					"description": "",
					"creationDate": "",
					"showEmptyGroup": true,
					"showCloseButton": true,
					"visible": false,
					"priority": "High",
					"entity": "OTApproval",
					"role": Constants.MD_LEVEL
				}]
			};

			if (oConfig.ManagerRole) {
				aCount.push(this._Service.getInstance(this).getTimeCorrectionCountByStatus(oEmployee.Employee, "PENDING", Constants.MANAGER,
					fromDate, toDate));
				aCount.push(this._Service.getInstance(this).getPreOTApprovalCountByStatus(oEmployee.Employee, "ACKNLDGE", Constants.APPROV_L2,
					fromDate,
					toDate));
			} else {
				aCount.push("NO");
				aCount.push("NO");
			}

			if (oConfig.ApprovL2Role) {
				aCount.push(this._Service.getInstance(this).getTimeCorrectionCountByStatus(oEmployee.Employee, "PENDING", Constants.APPROV_L2,
					fromDate,
					toDate));
				aCount.push(this._Service.getInstance(this).getOTApprovalCountByStatus(oEmployee.Employee, "ACKNLDGE", Constants.APPROV_L2,
					fromDate,
					toDate));
			} else {
				aCount.push("NO");
				aCount.push("NO");
			}

			if (oConfig.MdLevelRole) {
				aCount.push(this._Service.getInstance(this).getTimeCorrectionCountByStatus(oEmployee.Employee, "PENDING", Constants.MD_LEVEL,
					fromDate,
					toDate));
				aCount.push(this._Service.getInstance(this).getOTApprovalCountByStatus(oEmployee.Employee, "ACKNLDGE", Constants.MD_LEVEL,
					fromDate,
					toDate));
			} else {
				aCount.push("NO");
				aCount.push("NO");
			}

			Promise.all(aCount).then((values) => {
				oData.totals = values.reduce((n, item) => {
					return n + (!isNaN(item) ? parseInt(item) : 0);
				}, 0);

				oData.visible = this.isMainView();
				oData.busy = false;
				//Manager
				oData.NotificationSet[0].visible = oConfig.ManagerRole && !isNaN(values[0]) && parseInt(values[0]) > 0;
				oData.NotificationSet[1].visible = oConfig.ManagerRole && !isNaN(values[1]) && parseInt(values[1]) > 0;
				//Approver level 2
				oData.NotificationSet[2].visible = oConfig.ApprovL2Role && !isNaN(values[2]) && parseInt(values[2]) > 0;
				oData.NotificationSet[3].visible = oConfig.ApprovL2Role && !isNaN(values[3]) && parseInt(values[3]) > 0;
				//Approver level 3
				oData.NotificationSet[4].visible = oConfig.MdLevelRole && !isNaN(values[1]) && parseInt(values[1]) > 0;
				oData.NotificationSet[5].visible = oConfig.MdLevelRole && !isNaN(values[2]) && parseInt(values[2]) > 0;

				//Manager
				oData.NotificationSet[0].description = this.getText("pending_time_correction", [values[0]]);
				oData.NotificationSet[1].description = this.getText("pending_pre_time_correction", [values[1]]);
				//Approver level 2
				oData.NotificationSet[2].description = this.getText("pending_time_correction", [values[2]]);
				oData.NotificationSet[3].description = this.getText("ack_overtime", [values[3]]);
				//Approver level 3 
				oData.NotificationSet[4].description = this.getText("pending_time_correction", [values[4]]);
				oData.NotificationSet[5].description = this.getText("ack_overtime", [values[5]]);

				this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel(oData), "notification");

			});
		},
		_checkChangesToSave: function (oTable, sModel) {
			let hasChangedItems = this.getView().getModel(sModel).getData().results.find((item) => {
				return item.hasChanged() === true
			});
			if (oTable.getSelectedContexts().length === 0 && !hasChangedItems) {
				this.showToast("msg_no_changes_submit", false);
				return false;
			} else {
				return true;
			}
		},		
		onInputEmployee: function (oEvt) {
			let oControl = oEvt.getSource();
			if (oEvt.mParameters.value.length !== 8 || isNaN(oEvt.mParameters.value)) {
				return
			}
			let aFilters = [];
			aFilters.push(new sap.ui.model.Filter({
				path: "SearchStr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: oEvt.mParameters.value
			}));

			aFilters.push(new sap.ui.model.Filter({
				path: "NoCoveringOfficer",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: true
			}));

			oControl.setBusy(true);
			this.getOwnerComponent().getModel().read("/EmployeeDataSet", {
				filters: aFilters,
				urlParameters: {
					"$select": "Employee,Fullname"
				},
				success: (oData, oResponse) => {
					oControl.setBusy(false);
					if (oData.results.length > 0) {
						let oToken = new sap.m.Token({
							key: oData.results[0].Employee,
							text: `${oData.results[0].Fullname} (${oData.results[0].Employee})`
						});
						oControl.addToken(oToken);
						oControl.setValue("");
						oControl.fireTokenUpdate(oEvt);
					}
				},
				error: (err) => {
					oControl.setBusy(false);
				}
			});

		},
		_clock: function () {

			let today = new Date();
			let h = today.getHours();
			let m = today.getMinutes();
			let s = today.getSeconds();
			m = this.checkTime(m);
			s = this.checkTime(s);

			if (!this.clock) {
				this.clock = {
					time: h + ":" + m + ":" + s,
					date: today.toDateString()
				};
			} else {
				this.clock.time = h + ":" + m + ":" + s;
				this.clock.date = today.toDateString();
			}

			if (!this.getOwnerComponent().getModel("clock")) {
				this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel(this.clock, true), "clock");
			}
			let t = setTimeout(this._clock.bind(this), 1000);

		},
		checkTime: function (i) {
			if (i < 10) {
				i = "0" + i
			}; // add zero in front of numbers < 10
			return i;
		},
		addMessage: function (sType, sTitle, sSubtitle, sDescription) {
			/*Types: Success Error Warning Information*/
			let msg = {
				type: sType,
				title: sTitle,
				description: sDescription,
				subtitle: sSubtitle
			};
			this.getMessagePopover().getModel("messages").getData().push(msg);
			this.getMessagePopover().getModel("messages").refresh();
		},
		clearMessages: function () {
			this.getMessagePopover().getModel("messages").setData([]);
			this.getMessagePopover().getModel("messages").refresh();
		},
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},

		fileDownload: function (oData) {
			var content = oData.results[0];
			var bin = atob(content.Filedata);
			var ab = this.s2ab(bin); // from example above
			var blob = new Blob([ab], {
				type: `${content.Mimetype}`
			});
			var link = document.createElement('a');
			link.href = window.URL.createObjectURL(blob);
			link.download = `${content.Filename}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},

		getText: function (text, params) {
			return Localization.getText(text, params);
		},

		formatTime: function (time, isEmpty) {
			if (!time) {
				return "";
			}
			if (isEmpty !== undefined && !isEmpty) {
				return "--:--";
			}
			var timeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: "HH:mm"
			});
			var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
			var timeStr = timeFormat.format(new Date(time.ms + TZOffsetMs));
			return timeStr;
		},
		formatZeroEmpty: function (sText, isFilled) {
			//let floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance({ minIntegerDigits: 0, maxIntegerDigits: 3, minFractionDigits: 2, maxFractionDigits: 2 });
			//let intFormatter = sap.ui.core.format.NumberFormat.getIntegerInstance();
			let ret = isFilled ? parseInt(sText, 10).toString() : "";
			return ret !== ".00" ? ret : "";
		},
		formatInt: function (sText) {
			//let floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance({ minIntegerDigits: 0, maxIntegerDigits: 3, minFractionDigits: 2, maxFractionDigits: 2 });
			//let intFormatter = sap.ui.core.format.NumberFormat.getIntegerInstance();
			let ret = sText && sText.length > 0 ? parseInt(sText, 10).toString() : "";
			return ret !== ".00" ? ret : "";
		},
		createUUID: function () {
			var dt = new Date().getTime();
			var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = (dt + Math.random() * 16) % 16 | 0;
				dt = Math.floor(dt / 16);
				return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			});
			return uuid;
		},
		successMessage: function (sMsg) {
			this.showToast(sMsg && sMsg.length > 0 ? this.getText(sMsg) : this.getText("msg_success_operation"), false);
			this.setBusy(false);
		},
		reportErrorMsg: function (oError, sMsg) {
			this.setBusy(false);
			if (!oError) {
				sap.m.MessageBox.error(sMsg && sMsg.length > 0 ? this.getText(sMsg) : oError.message);
				return;
			}
			switch (parseInt(oError.statusCode)) {
			case 400:
				var finalMsg = "";
				try {
					finalMsg = JSON.parse(oError.responseText).error.innererror.errordetails[0].message;
					sap.m.MessageBox.error(finalMsg);
				} catch (ex) {

				}
				if (finalMsg == "") {
					sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
				}
				break;
			case 504:
				sap.m.MessageBox.error(this.getText("timeout_error")); //Connection timed out
				break;
			case 503:
				sap.m.MessageBox.error(this.getText("service_unavailable")); //SService Unavailable, try to refresh the browser
				break;
			default:
				sap.m.MessageBox.error(sMsg && sMsg.length > 0 ? this.getText(sMsg) : oError.message);
				break;
			}

		},

		createFilterOrMultipleValues: function (path, arr, bAnd) {
			var arrFlt = [];

			for (let item of arr) {
				arrFlt.push(new sap.ui.model.Filter({
					path: path,
					operator: sap.ui.model.FilterOperator.EQ,
					value1: item,
					and: bAnd
				}));
			}

			return new sap.ui.model.Filter(arrFlt, false);
		},
		formatInteger: function (oEvt) {
			return oEvt.getSource().setValue(parseInt(oEvt.getParameter("value") ? oEvt.getParameter("value") : 0));
		},

		s2ab: function (s) {
			var buf = new ArrayBuffer(s.length);
			var view = new Uint8Array(buf);
			for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
			return buf;
		},

		isValidDate: function (pYear, pMonth, pDay, oControl) {

			let date = new Date();
			date.setFullYear(pYear, pMonth - 1, pDay);
			// month - 1 since the month index is 0-based (0 = January)
			if ((date.getFullYear() == pYear) && (date.getMonth() == pMonth - 1) && (date.getDay() == pDay - 1)) {
				oControl.getSource().setValueState(sap.ui.core.ValueState.None);
				oControl.getSource().setValueStateText("");
				return true;
			} else {
				oControl.getSource().setValueState(sap.ui.core.ValueState.Error);
				oControl.getSource().setValueStateText(this.getResourceBundle().getText("MSG_INVALID_DATE"));
				return false;
			}
		},
		dateOperation: function (dDate, sSign, nValue) {
			return eval(`new Date(${dDate}.getFullYear(), ${dDate}.getMonth(), ${dDate}.getDate() ${sSign} ${nValue})`);
		},
		setFieldState: function (pStatus, pMsg, pControl) {
			pControl.setValueState(pStatus);
			if (pMsg) {
				pControl.setValueStateText(this.getResourceBundle().getText(pMsg));
			} else {
				pControl.setValueStateText("");
			}
		},
		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function () {
			return this.getView().getModel() || this.getOwnerComponent().getModel();
		},
		setViewModelProperty: function (pModel, pProperty, pValue, oView) {
			let oModel = oView.getModel(pModel);
			if (oModel) {
				oModel.setProperty(pProperty, pValue);
			}
		},
		addMessagetoValuePropertie: function (pControl, pMessage, pMessageType) {
			sap.ui.getCore().getMessageManager().addMessages(
				new Message({
					message: pMessage,
					type: pMessageType,
					target: pControl.getBindingInfo("value").binding.sPath,
					processor: pControl.getBinding("value").getModel()
				}));
		},
		removeAllMessages: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},
		showToast: function (pMsg, pCloseOnBrowserNavigation) {
			MessageToast.show(this.getResourceBundle().getText(pMsg), {
				closeOnBrowserNavigation: pCloseOnBrowserNavigation
			});
		},

		closeDialog: function () {
			if (this.draggableDialog) {
				this.draggableDialog.destroy();
				this.draggableDialog = null; // make it falsy so that it can be created next time
			}
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		_getDialogComponentById: function (pDialog, pId) {
			return pDialog.getContent().find((ctrl) => {
				return ctrl.sId === pId
			});
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		validateFieldComparing: function (pInsertedValue, pExpectedValue, pExceptioMsg, oControl, pExceptionClean) {
			if (pInsertedValue.length > 0) {
				if (pInsertedValue !== pExpectedValue) {
					oControl.setValueState(sap.ui.core.ValueState.Error);
					oControl.setValueStateText(this.getResourceBundle().getText(pExceptioMsg));
					if (pExceptionClean) {
						oControl.setValue("");
					}
					return false;
				} else {
					oControl.setValueState(sap.ui.core.ValueState.Success);
					oControl.setValueStateText("");
					return true;
				}

			} else {
				oControl.setValueState(sap.ui.core.ValueState.Error);
				oControl.setValueStateText(this.getResourceBundle().getText("required"));
				return false;
			}
		},
		validateMandatory: function (oControl) {
			if (oControl.getValue().length > 0) {
				oControl.setValueState(sap.ui.core.ValueState.None);
				oControl.setValueStateText("");
				return true;
			} else {
				oControl.setValueState(sap.ui.core.ValueState.Error);
				oControl.setValueStateText(this.getResourceBundle().getText("required"));
				return false;
			}
		},
		setControlState: function (oControl, pState, pMsg) {
			oControl.setValueState(pState);
			if (pMsg) {
				oControl.setValueStateText(this.getResourceBundle().getText(pMsg));
			} else {
				oControl.setValueStateText("");
			}

		},
		setBusy: function (pBool) {
			if (pBool) {
				sap.ui.core.BusyIndicator.show(0);
			} else {
				sap.ui.core.BusyIndicator.hide();
			}
			return;
		},
		changeControlForCheckbox: function (oEvt, sModel) {

			let oData = oEvt.getSource().getBindingContext(`${sModel}`).getProperty(oEvt.getSource().getBindingContext(`${sModel}`).getPath());
			let sAttribute = oEvt.getSource().getBindingInfo("selected").binding.sPath;

			sAttribute = sAttribute && sAttribute.length > 0 ? sAttribute : oEvt.getSource().getBindingInfo("value").parts[0].path;

			let hasChanged = sAttribute && sAttribute.length > 0 ? oEvt.getSource().getSelected() !== oData[`Old${sAttribute}`] : false;

			hasChanged ? oEvt.getSource().addStyleClass("sapMCbWarn") : oEvt.getSource().removeStyleClass("sapMCbWarn");
			oEvt.getSource().setTooltip(hasChanged ? this.getText("modified") : "");

		},
		_resetStatus: function (oTable, sModel) {
			for (let item of oTable.getItems()) {
				let sPath = item.getBindingContext(sModel).sPath;
				item.getBindingContext(sModel).getModel(sModel).setProperty(sPath + "/StatusCode", "");
				item.getBindingContext(sModel).getModel(sModel).setProperty(sPath + "/StatusText", "");
			}
		},
		validateDateInterval: function (oBegDate, oEndDate) {

			if (!oBegDate || !oEndDate) {
				this.showToast("msg_interval_must_be_filled", false);
				return false;
			}

			if (oBegDate > oEndDate) {
				this.showToast("msg_beg_date_must_be_bigger", false);
				return false;
			}
			return true;

		},
		_unsuccessfulReturn: function (err, pMessage) {

			this.setBusy(false);
			switch (err.statusCode) {
			case 400:
				let erroPbj = JSON.parse(err.responseText)
				let objError = JSON.parse(err.responseText);
				MessageToast.show(this.getResourceBundle().getText(pMessage) + ": " +
					err
					.statusCode +
					erroPbj ? erroPbj.error.message.value : "", {
						closeOnBrowserNavigation: false
					});
				break;
			default:
				MessageToast.show(this.getResourceBundle().getText(pMessage) + ": " +
					err
					.statusCode, {
						closeOnBrowserNavigation: false
					});
				break;
			}
		},
		/**
		 * Event handler  for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("MainView", {}, true);
		},
		initSearchHelpEmployee: function () {

			this.oColEmployeeSearchModel = new sap.ui.model.json.JSONModel({
				"cols": [{
						"label": this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("persNumber"),
						"template": "EmployeeList>Employee"
					}, {
						"label": this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("fullName"),
						"template": "EmployeeList>Fullname"
					}
					/*				, {
										"label": this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("shiftgroup"),
										"template": "Shiftgroup"
									}, {
										"label": this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("orgunitid"),
										"template": "Orgunitid"
									}, {
										"label": this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("orgunittext"),
										"template": "Orgunittext"
									}, {
										"label": this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("costcenter"),
										"template": "Costcenter"
									}*/
				]
			});

		},
		initValueHelpEmployee: function () {
			//if (!this._oValueHelpDialogEmployeeSearch) {
			this._oValueHelpDialogEmployeeSearch = sap.ui.xmlfragment("com.infineon.ztmsapp.fragments.EmployeeSearch", this);
			this.getView().addDependent(this._oValueHelpDialogEmployeeSearch);
			//}
		},
		onValueEmployeeSearchHelp: function (evt, changeDesc, modelName) {

			this._currentEmployeeControl = evt.getSource();
			this.currentModelName = modelName;
			let isMulti = this._currentEmployeeControl.getMetadata().getName() === "sap.m.MultiInput";

			this.initSearchHelpEmployee();
			this.initValueHelpEmployee();

			//			this._oValueHelpDialogEmployeeSearch = sap.ui.xmlfragment("com.infineon.ztmsapp.fragments.EmployeeSearch", this);
			//			this.getView().addDependent(this._oValueHelpDialogEmployeeSearch);
			//Depending of the kind of control the dialog will allow or not multiple selection
			this._oValueHelpDialogEmployeeSearch.setSupportMultiselect(isMulti);

			this.setBusy(true);
			this._oValueHelpDialogEmployeeSearch.setBusy(true);
			this._oValueHelpDialogEmployeeSearch.getTableAsync().then(function (oTable) {
					//Set the columns model
					oTable.setModel(this.oColEmployeeSearchModel, "columns");
					if (oTable.bindRows) {
						//oTable.bindAggregation("rows", "/");
						oTable.bindAggregation("rows", {
							//path: "/EmployeeDataSet",
							path: "EmployeeList>/",
							parameters: {
								select: "Employee,Fullname",
								operationMode: "Client"
							}
						});
					}
					if (oTable.bindItems) {
						//For testing purpose
						//oTable.bindAggregation("items", "/", function () {
						oTable.bindAggregation("items", {
							//path: "/EmployeeDataSet",
							path: "EmployeeList>/",
							parameters: {
								select: "Employee,Fullname",
								operationMode: "Client"
							}
						}, function () {
							return new ColumnListItem({
								cells: aCols.map(function (column) {
									return new Label({
										text: "{" + column.template + "}"
									});
								})
							});
						});
					}
					this._oValueHelpDialogEmployeeSearch.update();
					this.setBusy(false);
					this._oValueHelpDialogEmployeeSearch.setBusy(false);
					//this.setBusy(false);
				}.bind(this))
				.catch((err) => {
					this.setBusy(false);
					this._oValueHelpDialogEmployeeSearch.setBusy(false);
					//this.showToast("ERROR", false);
				});

			if (isMulti) {
				this._oValueHelpDialogEmployeeSearch.setTokens(this._currentEmployeeControl.getTokens());
			}

			this._oValueHelpDialogEmployeeSearch.open();

		},
		onValueHelpEmployeeSearchCancelPress: function (oEvt) {
			oEvt.oSource.close();
		},

		onValueHelpEmployeeSearchAfterClose: function (oEvt) {
			oEvt.oSource.destroy();
		},
		onValueHelpEmployeeSearchOkPress: function (oEvent) {
			let aTokens = oEvent.getParameter("tokens");
			let isMulti = this._currentEmployeeControl.getMetadata().getName() === "sap.m.MultiInput";
			if (isMulti) {
				//Keep the array of keys in the current model
				if (this[this.currentModelName]) {
					this[this.currentModelName].selectedKeys = [];
					for (let oTokenItem of aTokens) {
						this[this.currentModelName].selectedKeys.push(oTokenItem.getKey());
					}
				}
				this._currentEmployeeControl.setTokens(aTokens);
			} else {
				this._currentEmployeeControl.setValue(aTokens[0] ? aTokens[0].getKey() : "");
				this._currentEmployeeControl.fireLiveChange();

				this._currentEmployeeControl.setDescription(aTokens[0] ? aTokens[0].getCustomData()[0].getValue().Fullname : "");
			}

			oEvent.oSource.close();
		},
		onSuggestEmployeeSelect: function (oEvt) {
			/*			let oEmployee = oEvt.getParameters().selectedRow.getBindingContext().getProperty(oEvt.getParameters().selectedRow
							.getBindingContext().sPath);
						oEvt.oSource.setDescription(oEmployee.Fullname);*/
		},
		onFilterSearchEmployee: function (oEvent) {
			var sSearchQuery = "";
			if (oEvent.getSource().getMetadata().getName() === "sap.m.Input") {
				sSearchQuery = oEvent.getSource().getValue();
			} else {
				sSearchQuery = oEvent.getParameter("selectionSet")[0].getValue();
			}

			if (sSearchQuery.length < 2) {
				this.showToast("msg_minlenght_search_employ", false);
				return;
			}

			let aSelectionSet = oEvent.getParameter("selectionSet");
			/*			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
							if (oControl.getValue()) {
								aResult.push(new sap.ui.model.Filter({
									path: oControl.getName(),
									operator: sap.ui.model.FilterOperator.Contains,
									value1: oControl.getValue()
								}));
							}

							return aResult;
						}, []);*/
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter({
				path: "SearchStr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sSearchQuery
			}));
			this.setBusy(true);
			this.getView().getModel().read("/EmployeeDataSet", {
				filters: aFilters,
				urlParameters: {
					"$select": "Employee,Fullname"
				},
				success: (oData, oResponse) => {
					this.setBusy(false);
					this.getView().setModel(new sap.ui.model.json.JSONModel(oData.results), "EmployeeList");
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}
					//this._filterTable(aFilters);
				},
				error: (err) => {
					this.setBusy(false);
					this.reportErrorMsg(err, "msg_error_employee_data_service");
				}
			});

		},

		_filterTable: function (oFilter) {
			var oValueHelpDialog = this._oValueHelpDialogEmployeeSearch;

			//parameters: {
			//	select: "Employee,Fullname",
			//	operationMode: "Client"
			//}
			debugger;
			oValueHelpDialog.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
			});
		},
		onExportXLS: function (oJsonData, aCols, sTitle, sFileName) {

			if (!oJsonData || oJsonData.length == 0) {
				this.showToast("no_data_to_export", false);
				return;
			}
			let oSettings = {
				workbook: {
					columns: aCols,
					hierarchyLevel: 'Level',
					context: {
						title: sTitle
					}
				},
				dataSource: oJsonData,
				fileName: sFileName,
				worker: false // We need to disable worker because we are using a MockServer as OData Service
			};

			let oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},
		_resetTableState: function (oTable, sModel, sReferenceProperty) {
			for (let item of oTable.getAggregation("items")) {
				let oBindindContext = sModel ? item.getBindingContext(sModel) : item.getBindingContext();
				let oModel = sModel ? item.getBindingContext(sModel).getModel(sModel) : item.getBindingContext().getModel();
				let sPath = oBindindContext.sPath;
				let oEntity = oModel.getProperty(sPath);
				//let hasNotChanged = oEntity.hasChanged ? !oEntity.hasChanged() : true;
				//if (oEntity[sReferenceProperty] !== 'E' && hasNotChanged) {
				if (oEntity[sReferenceProperty] !== 'E') {
					for (let aggregationCell of item.mAggregations.cells) {
						aggregationCell.setValueState ? aggregationCell.setValueState(sap.ui.core.ValueState.None) : null;
						aggregationCell.setValueStateText ? aggregationCell.setValueStateText("") : null;
						//Check box in public holiday it is not responding to setting value state None, so the style class will be removed
						aggregationCell.removeStyleClass ? aggregationCell.removeStyleClass("sapMCbWarn") : null;
						for (let subItem of aggregationCell.mAggregations.items ? aggregationCell.mAggregations.items : []) {
							subItem.setValueState ? subItem.setValueState(sap.ui.core.ValueState.None) : null;
							subItem.setValueStateText ? subItem.setValueStateText("") : null;
						}

					}
				}
			}
		},
		logoff: function () {

			sap.m.MessageBox.confirm(
				this.getText("msg_want_logout"), {
					onClose: (sAction) => {
						if ("OK" === sAction) {
							this._logout();
						}
					}
				}
			);

		},
		_logout: function () {
			console.log('logout');
			$.ajax({
				type: "GET",
				url: "/sap/public/bc/icf/logoff", //Clear SSO cookies: SAP Provided service to do that
			}).done((data) => { //Now clear the authentication header stored in the browser
				if (!document.execCommand("ClearAuthenticationCache")) {
					//"ClearAuthenticationCache" will work only for IE. Below code for other browsers
					$.ajax({
						type: "GET",
						url: "/sap/opu/odata/sap/ZHR_TMS_CORE_SRV/", //any URL to a Gateway service
						username: 'dummy', //dummy credentials: when request fails, will clear the authentication header
						password: 'dummy',
						statusCode: {
							401: () => {
								//This empty handler function will prevent authentication pop-up in chrome/firefox
								this.onNavBack();
							}
						},
						error: function () {
							//alert('reached error of wrong username password')
						}
					});
				}
			})

		}

	});

});