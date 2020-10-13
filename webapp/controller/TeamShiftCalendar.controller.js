sap.ui.define([
	"com/infineon/ztmsapp/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageToast',
	'sap/m/MessageBox',
	"com/infineon/ztmsapp/js/localization",
	'sap/ui/unified/calendar/CalendarDate',
	"com/infineon/ztmsapp/util/formatter",
	"com/infineon/ztmsapp/service/Service",
	"sap/m/Dialog",
	"sap/m/ButtonType",
	"sap/m/Button",
	"sap/m/Text",
	"sap/m/Popover",
	"sap/ui/core/Fragment",
	"com/infineon/ztmsapp/util/utils",
	"com/infineon/ztmsapp/util/ServiceHelper",
	"com/infineon/ztmsapp/js/Constants",
	"com/infineon/ztmsapp/js/features",
], function (Controller, History, JSONModel, MessageToast, MessageBox, Localization, CalendarDate, formatter, Service, Dialog, ButtonType,
	Button, Text, Popover, Fragment, utils, ServiceHelper, Constants, Features) {
	"use strict";

	return Controller.extend("com.infineon.ztmsapp.controller.TeamShiftCalendar", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.infineon.ztmsapp.view.TeamShiftCalendar
		 */
		_teamShiftFromdate: null,
		_teamShiftTodate: null,
		_mcbEmployee: null,
		_Service: Service,
		_planningCal: null,
		_dtBegin: null,
		utils: utils,
		_tblTeamShift: null,
		_legendTeamShift: null,
		formatter: formatter,
		serviceHelper: ServiceHelper,
		_mipEmployee: null,
		_idCbOrgUnit: null,
		onInit: function () {

			let oModelTeamShift = new JSONModel({}, true);
			oModelTeamShift.setSizeLimit(1000);
			this.getView().setModel(oModelTeamShift, "teamShift");

			this._mipEmployee = this.getView().byId("mipEmployee");
			this._idCbOrgUnit = this.getView().byId("idOrgUn");

			let oStateModel = new sap.ui.model.json.JSONModel();
			oStateModel.setData({
				legendShown: false,
				visible: false
			});
			this.getView().setModel(oStateModel, "stateModel");

			this.setBusy(false);
			this.initValueHelpEmployee();
			this._initFilter();
			this._initPopupOT();

			this._teamShiftFromdate = this.getView().byId("teamShiftFromdate");
			this._teamShiftTodate = this.getView().byId("teamShiftTodate");
			this._mcbEmployee = this.getView().byId("mcbEmployee");
			this._dtBegin = this.getView().byId("dtBegin");
			this._tblTeamShift = this.getView().byId("tblTeamShift");
			this._planningCal = this.getView().byId("PC1");
			this._legendTeamShift = this.getView().byId("legendTeamShift");

			this.initMassUpdateModel();
			this.initPopover();
			this.initLegend();

		},
		onOpenEmployeeRange: function (oEvt) {
			this.getUploadEmployeesPopup(this.getView(), oEvt.getSource(), this._mipEmployee);
		},
		reset: function () {
			this._initFilter();
			this._mipEmployee.removeAllTokens();
		},
		initLegend: function () {

			/*			this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
							text: "{i18n>non_working_day}",
							color: "#d9d9d9",
							tooltip: "{i18n>non_working_day}"
						}));
						this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
							text: "{i18n>working_day}",
							color: "#ffffff",
							tooltip: "{i18n>working_day}"
						}));*/
			//if (Features.hasReadRight(Features.CONST_FEATURE_SHOWVIOLATION)) {
			this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
				text: this.getText("empview_legend_potviolation"),
				type: sap.ui.unified.CalendarDayType.Type08,
				//color: "#1A9898",
				tooltip: "{i18n>empview_legend_potviolation}"
			}));
			//}
			this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "{i18n>change}",
				color: "#1A9898",
				tooltip: "{i18n>change}"
			}));
			this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "{i18n>public_holiday}",
				color: "#FF8888",
				tooltip: "{i18n>public_holiday}"
			}));
			this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "{i18n>off_rest_day}",
				color: "#ABE2AB",
				tooltip: "{i18n>off_rest_day}"
			}));
			this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "{i18n>half_leave}",
				color: "#AB218E",
				tooltip: "{i18n>half_leave}"
			}));
			this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "{i18n>leave}",
				color: "#E78C07",
				tooltip: "{i18n>leave}"
			}));
			this._legendTeamShift.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "{i18n>pending_leave_request}",
				color: "#9EC7D8",
				tooltip: "{i18n>pending_leave_request}"
			}));

		},
		initMassUpdateModel: function () {

			this.teamShiftViewData = {
				date: this.filterIntervalData.fromdateL1,
				todate: this.filterIntervalData.fromdateL1,
				maxToDate: this.getFirstDisableDate(),
				shift: ""
			};

			this.getView().setModel(new JSONModel(this.teamShiftViewData, true), "teamShiftView");
		},
		showViolation: function (oEvt, sViolation) {
			let flBViolation = new sap.m.FlexBox({
				width: "100%",
				height: "2em",
				alignItems: "Center",
				justifyContent: "Center",
				fitContainer: true
			});

			//flexBox.addStyleClass("greenLabel");
			let textViolation = new sap.m.Text({
				text: sViolation
			});
			textViolation.addStyleClass("fontGreen");
			flBViolation.addItem(textViolation);

			let oPopover = new sap.m.Popover({
				showHeader: false,
				content: [flBViolation]
			});

			oPopover.openBy(oEvt.getSource());

		},
		getFirstDisableDate: function () {
			let firstDisabledDate = null;

			for (let itemRow of this._tblTeamShift.getSelectedItems()) {
				let employeeLine = itemRow.getBindingContext("teamShift").getModel("teamShift").getProperty(itemRow.getBindingContext("teamShift")
					.sPath);

				for (let itemAttribute in employeeLine) {

					if (employeeLine[itemAttribute].start && !employeeLine[itemAttribute].CanChangeShift) {
						firstDisabledDate = new Date(employeeLine[itemAttribute].start.getFullYear(), employeeLine[itemAttribute].start.getMonth(),
							employeeLine[itemAttribute].start.getDate() - 1);
						break;
					}
				}
				if (firstDisabledDate) {
					break;
				}
			}

			return firstDisabledDate ? firstDisabledDate : new Date(this.filterIntervalData.todate.getFullYear(), this.filterIntervalData.todate
				.getMonth(),
				this.filterIntervalData.todate.getDate() - 1);

		},
		cleanFilter: function () {
			this._mcbEmployee.clearSelection();
			this.selectEmployee();
		},
		handleIntervalSelect: function (oEvt) {},
		confirmIfChanged: function (sRole, pDirection) {
			if (this.hasModelChanged()) {

				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.confirm(
					this.getText("msg_lost_changes"), {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: (sAction) => {
							if (sAction === MessageBox.Action.OK) {
								this._onSearchTeamShift(sRole, pDirection);
							}
						}
					}
				);
				return false;
			} else {
				return true;
			}
		},
		hasModelChanged: function () {
			if (!this.getView().getModel("teamShift").getData().length) {
				return false;
			}
			let hasChanged = false;

			for (let itemRow of this.getView().getModel("teamShift").getData()) {
				Object.values(itemRow).forEach(item => {
					if (item.checkIsChanged && item.checkIsChanged() || item.checkIsOTChanged && item.checkIsOTChanged()) {
						return hasChanged = true;
					}
				});
			}
			return hasChanged;
		},
		onUpdateTokeEmployee: function (oEvent, sModelName) {
			//let aAddedTokens = oEvent.getParameter("addedTokens");
			let aRemovedTokens = oEvent.getParameter("removedTokens");

			let oTokens = oEvent.getSource().getTokens();

			this.filterIntervalData.selectedKeys = [];
			for (let oTokenItem of oTokens) {
				this.filterIntervalData.selectedKeys.push(oTokenItem.getKey());
			}
			for (let oTokenItem of aRemovedTokens) {
				let indexTask = this.filterIntervalData.selectedKeys.findIndex((item) => item === oTokenItem.getKey());
				this.filterIntervalData.selectedKeys.splice(indexTask, 1);
			}
		},
		onInputEmployee: function (oEvt) {
			let oControl = oEvt.getSource();
			if (oEvt.mParameters.value.length !== 8 || isNaN(oEvt.mParameters.value)) {
				return
			}
			let aFilters = [];
			let employeeId = oEvt.mParameters.value;
			aFilters.push(new sap.ui.model.Filter({
				path: "SearchStr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: employeeId
			}));

			aFilters.push(new sap.ui.model.Filter({
				path: "NoCoveringOfficer",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: true
			}));

			oControl.setBusy(true);
			this.getView().getModel().read("/EmployeeDataSet", {
				filters: aFilters,
				urlParameters: {
					"$select": "Employee,Fullname"
				},
				success: (oData, oResponse) => {
					oControl.setBusy(false);
					if (oData.results.length > 0) {

						let employee = oData.results.find((item) => {
							return item.Employee === employeeId
						});

						let oToken = new sap.m.Token({
							key: employee.Employee,
							text: `${employee.Fullname} (${employee.Employee})`
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
		onSearchTeamShift: function (sRole, pDirection) {
			//If its 'navigation' filters wil not be reseted
			pDirection ? null : this.cleanFilter();
			//Validate if there are changes before do another search.
			//If there are any changes a confirmation will appear
			if (this.confirmIfChanged(sRole, pDirection)) {
				this._onSearchTeamShift(sRole, pDirection);
			}

		},
		_onSearchTeamShift: async function (sRole, pDirection) {
			//Clear employee filter

			if (!this.validateDateIntervalTeamShift()) {
				return;
			}

			let oData = this.getView().getModel("teamfilterval").getData();
			if (pDirection && pDirection === "NEXT") {
				oData.fromdate = new Date(oData.fromdate.getFullYear(), oData.fromdate.getMonth(), oData.fromdate.getDate() + 6);
				oData.todate = new Date(oData.todate.getFullYear(), oData.todate.getMonth(), oData.todate.getDate() + 6);
			} else if (pDirection && pDirection === "PREV") {
				oData.fromdate = new Date(oData.fromdate.getFullYear(), oData.fromdate.getMonth(), oData.fromdate.getDate() - 6);
				oData.todate = new Date(oData.todate.getFullYear(), oData.todate.getMonth(), oData.todate.getDate() - 6);
			} else {
				oData.todate = new Date(oData.fromdate.getFullYear(), oData.fromdate.getMonth(), oData.fromdate.getDate() + 13);
			}
			oData.fromdateL1 = new Date(oData.fromdate.getFullYear(), oData.fromdate.getMonth(), oData.fromdate.getDate() - 1);
			oData.todateL1 = new Date(oData.todate.getFullYear(), oData.todate.getMonth(), oData.todate.getDate() - 1);

			this.getView().getModel("teamfilterval").refresh();
			this._planningCal ? this._planningCal.setVisible(false) : this._tblTeamShift.setVisible(false);
			this._legendTeamShift.setVisible(this._tblTeamShift.getVisible());

			let selectedKeys = this._mipEmployee.getTokens().map((item) => {
				return item.mProperties.key
			});
			//Filter employee
			let filtersEmployees = null;
			if (selectedKeys && selectedKeys.length > 0) {
				filtersEmployees = this.createFilterOrMultipleValues("Pernr", selectedKeys, false);
			}
			//Filter orgunit mandatory for role REQUESTOR
			let filtersOrgUnit = null;
			//if (this.getView().getModel("currentRole").getData().currentRole === Constants.REQUESTOR) {

			if (oData.orgunit.length === 0) {
				this.setFieldState(sap.ui.core.ValueState.Error, "required", this._idCbOrgUnit);
				this.showToast("required_org_unit", false);
				return;
			} else {
				let aOrgUnit = oData.orgunit.map((item) => item);
				filtersOrgUnit = this.createFilterOrMultipleValues("Orgunitid", aOrgUnit, false);
				this.setFieldState(sap.ui.core.ValueState.None, "", this._idCbOrgUnit);
			}
			//}
			this.setBusy(true);
			this._Service.getInstance(this).getTeamShiftCalendar(sRole, null, oData.fromdateL1, oData.todateL1, filtersEmployees,
					filtersOrgUnit)
				.then((res) => {
					if (res) {
						this._planningCal ? this._planningCal.setVisible(true) : this._tblTeamShift.setVisible(true);
						this._legendTeamShift.setVisible(this._tblTeamShift.getVisible());
						this.getView().getModel("teamShift").setData(res);
						this.getView().getModel("teamShift").setSizeLimit(res.length < 100 ? 100 : res.length);
						this.getView().getModel("stateModel").setProperty("/visible", true);
						this.getView().getModel("teamShiftView").setProperty("/date", oData.fromdateL1);
					} else {
						this.showToast("msg_no_results", false);
					}
					this.setBusy(false);
				})
				.catch((err) => {
					this.reportErrorMsg(err, "msg_error_get_team_shift");
				});
		},
		selectEmployee: function (oEvt) {
			var aFilters = [];
			if (oEvt) {
				for (let item of oEvt.getSource().getSelectedItems()) {

					aFilters.push(new sap.ui.model.Filter({
						//path: "pernr",
						path: "data/pernr",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: item.getKey()
					}));

				}
			}
			this._tblTeamShift.getBinding("items").filter(aFilters, "Application");
		},
		onMassShiftUpdate: function (oEvt) {

			this.initMassUpdateModel();

			//Verify same personal area and shift group
			if (this._tblTeamShift.getSelectedItems().length === 0) {
				this.showToast("select_at_least_one_employee", false);
				return;
			}
			//Employee reference to make the validations
			let refEmployee = this._tblTeamShift.getSelectedItems()[0].getBindingContext("teamShift").getModel("teamShift").getProperty(this._tblTeamShift
				.getSelectedItems()[0].getBindingContext("teamShift").sPath);

			for (let itemRow of this._tblTeamShift.getSelectedItems()) {
				let compareEmployee = itemRow.getBindingContext("teamShift").getModel("teamShift").getProperty(itemRow.getBindingContext(
					"teamShift").sPath);
				if (refEmployee.data.Shiftgroup !== compareEmployee.data.Shiftgroup || refEmployee.data.PersonnelArea !== compareEmployee.data.PersonnelArea) {
					this.showToast("msg_error_different_shifgrp_persarea", false);
					return;
				}
			}
			//Use as reference the list of shifts of any day of any appointment, cause the shift group and personal area are the same
			let refDate = this.getView().getModel("teamShiftView").getData().date;
			this._refEmployee = refEmployee;
			this.onSelectDateShift(refDate, null);

			//INTERVAL TEST
			if (!this.dialog) {
				this.dialog = sap.ui.xmlfragment("idPopupMassUpdate", "com.infineon.ztmsapp.fragments.MassUpdateTeamShiftInterval", this);
				//this.dialog = sap.ui.xmlfragment("idPopupMassUpdate", "com.infineon.ztmsapp.fragments.MassUpdateTeamShift", this);
				this.getView().addDependent(this.dialog);
			}
			this.dialog.open();
		},
		onSelectDateShift: function (oDate, oEvt) {

			let oDataView = this.getView().getModel("teamShiftView").getData();

			let aAllShiftSet = [];
			//INTERVAL TEST
			if (true) {

				let refEmployee = this._tblTeamShift.getSelectedItems()[0].getBindingContext("teamShift").getModel("teamShift").getProperty(this._tblTeamShift
					.getSelectedItems()[0].getBindingContext("teamShift").sPath);

				for (let itemRow of this._tblTeamShift.getSelectedItems()) {

					let employeeLine = itemRow.getBindingContext("teamShift").getModel("teamShift").getProperty(itemRow.getBindingContext("teamShift")
						.sPath);

					for (let itemAttribute in employeeLine) {

						if (employeeLine[itemAttribute].start) {

							let dateRecord = new Date(employeeLine[itemAttribute].start.getFullYear(), employeeLine[itemAttribute].start.getMonth(),
								employeeLine[itemAttribute].start.getDate());
							let dateFrom = new Date(this.teamShiftViewData.date.getFullYear(), this.teamShiftViewData.date.getMonth(), this.teamShiftViewData
								.date.getDate());
							let dateTo = new Date(this.teamShiftViewData.todate.getFullYear(), this.teamShiftViewData.todate.getMonth(), this.teamShiftViewData
								.todate.getDate());
							if (dateRecord >= dateFrom && dateRecord <= dateTo) {
								aAllShiftSet.push(employeeLine[itemAttribute].shiftSet.map((item) => {
									return item.shift
								}));
							}
						}
					}
				}

				let aIntersection = _.intersection.apply(_, aAllShiftSet).map((item) => {
					return {
						shift: item
					};
				});

				let aShiftSet = JSON.parse(JSON.stringify(aIntersection));
				aShiftSet.unshift({
					shift: ""
				});
				this.getView().setModel(new JSONModel(aShiftSet), "teamShiftOptions");
				this.getView().getModel("teamShiftOptions").refresh();

				if (!this.validateDateInterval(oDataView.date, oDataView.todate)) {
					return;
				}

				return;

			}
			//Use as reference the list of shifts of any day of any appointment, cause the shift group and personal area are the same
			let refDate = oDate;
			//this.getView().setModel(new JSONModel(refEmployee._1.shiftSet), "teamShiftOptions");
			if (refDate) {
				Object.values(this._refEmployee).forEach(item => {
					if (item.start && item.start.toDateString() === refDate.toDateString()) {

						let aShiftSet = JSON.parse(JSON.stringify(item.shiftSet));
						aShiftSet.unshift({
							shift: ""
						});
						this.getView().setModel(new JSONModel(aShiftSet), "teamShiftOptions");
						this.getView().getModel("teamShiftOptions").refresh();
						return;
					}
				});
			}
			//Validate input
			this.checkDateShift(oEvt);

		},
		onMassUpdate: function (oEvt) {
			this.onMassShiftUpdate(oEvt);
		},
		handleHeaderPress: function (oEvt) {},
		_initPopupOT: function () {
			if (!this._oPopoverOT) {
				Fragment.load({
					name: "com.infineon.ztmsapp.fragments.OvertimePopup",
					controller: this
				}).then((pPopover) => {
					this._oPopoverOT = pPopover;
					this._oPopoverOT.setPlacement(sap.m.PlacementType.Horizontal);
					this.getView().addDependent(this._oPopoverOT);
				});
			}
		},
		resetOtHour: function (oEvt) {
			let oModel = oEvt.getSource().getBindingContext("teamShift").getModel("teamShift");
			let sPath = oEvt.getSource().getBindingContext("teamShift").sPath;
			oModel.setProperty(sPath + "/OtHours", "0");

			let oDataOT = this._oPopoverOT.currentLink.getBindingContext("teamShift").getProperty(sPath);

			oModel.setProperty(`${sPath}/OtHours`, "0");
			oModel.setProperty(`${sPath}/StatusReqOt`, oDataOT.checkIsOTChanged() ? "M" : "");
			oModel.setProperty(`${sPath}/MessageOt`, oDataOT.checkIsOTChanged() ? this.getText("modified") : "");
			oModel.setProperty(`${sPath}/OthoursFilled`, oDataOT.OtHours.length > 0 && oDataOT.OtHours !== oDataOT.OtHoursOriginal || parseInt(
				oDataOT.OtHours) > 0);
			oModel.refresh();

			this._oPopoverOT.close();
			delete this._currentItemPath;
			this._oPopoverOT.close();
		},
		onSetOverTime: function (oEvt, sPathAttribute) {
			let oLink = oEvt.getSource();
			this._initPopupOT();
			this._currentItemPath = sPathAttribute;
			let oData = this.getView().getModel("teamShift").getProperty(`${oLink.getBindingContext("teamShift").sPath}/${sPathAttribute}`);
			this._oPopoverOT.currentOTHour = oData.OtHours;
			this._oPopoverOT.bindElement({
				path: `${oLink.getBindingContext("teamShift").sPath}/${sPathAttribute}`,
				model: "teamShift"
			});
			if (this._oPopoverOT.isOpen()) {
				this._oPopoverOT.close();
			} else {
				this._oPopoverOT.openBy(oLink);
				this._oPopoverOT.currentLink = oLink;
			}

		},
		selectCallBack: function (oEvt) {

			let sPath = oEvt.getSource().getBindingContext("teamShift").sPath;
			let sShift = oEvt.getSource().getBindingContext("teamShift").getProperty(sPath).shift;
			let oDataPath = sPath.split("/")[1];
			let sPersonalArea = this.getView().getModel("teamShift").getProperty(`/${oDataPath}`).data.Personnelarea;
			this.sCurrentPath = sPath;
			this._oPopoverOT.setBusy(true);
			this.serviceHelper.read(`/OTHourRangeSet(PersArea='${sPersonalArea}',Dws='${sShift}',IsCallBack=${oEvt.getSource().getSelected()})`,
					this
					.getView().getModel(), true, null, null,
					null, null, null)
				.then((res) => {
					let aOTHour = res[0].Range.split(",").map((item) => {
						return {
							key: item
						}
					});
					this.getView().getModel("teamShift").setProperty(`${this.sCurrentPath}/OtHoursRg`, aOTHour);
					this._oPopoverOT.openBy(this._oPopoverOT.currentLink);
					this._oPopoverOT.setBusy(false);
				})
				.catch((err) => {
					this._oPopoverOT.setBusy(false);
				});

		},
		handleSaveOt: function (oEvt) {

			let sPath = `${this._oPopoverOT.currentLink.getBindingContext(
				"teamShift").sPath}/${this._currentItemPath}`;

			let oModel = this.getView().getModel("teamShift");

			let oDataOT = this._oPopoverOT.currentLink.getBindingContext("teamShift").getProperty(sPath);

			oModel.setProperty(`${sPath}/StatusReqOt`, oDataOT.checkIsOTChanged() ? "M" : "");
			oModel.setProperty(`${sPath}/MessageOt`, oDataOT.checkIsOTChanged() ? this.getText("modified") : "");
			oModel.setProperty(`${sPath}/OtHours`, oDataOT.OtHours);
			oModel.setProperty(`${sPath}/OthoursFilled`, oDataOT.OtHours.length > 0 && oDataOT.OtHours !== oDataOT.OtHoursOriginal || parseInt(
				oDataOT.OtHours) > 0);

			this._oPopoverOT.close();
			delete this._currentItemPath;
		},
		handleCancel: function (oEvt) {

			let oModel = this.getView().getModel("teamShift");
			let sPath = `${this._oPopoverOT.currentLink.getBindingContext(
				"teamShift").sPath}/${this._currentItemPath}`

			let oDataOT = this._oPopoverOT.currentLink.getBindingContext("teamShift").getProperty(sPath);
			//oDataOT.OtHours = oDataOT.OtHoursOriginal;
			oModel.setProperty(`${sPath}/OtHours`, this._oPopoverOT.currentOTHour);
			oModel.setProperty(`${sPath}/StatusReqOt`, oDataOT.checkIsOTChanged() ? "M" : "");
			oModel.setProperty(`${sPath}/MessageOt`, oDataOT.checkIsOTChanged() ? this.getText("modified") : "");
			oModel.setProperty(`${sPath}/OthoursFilled`, oDataOT.OtHours.length > 0 && oDataOT.OtHours !== oDataOT.OtHoursOriginal || parseInt(
				oDataOT.OtHours) > 0);

			this._oPopoverOT.close();
			delete this._currentItemPath;
		},
		checkSelectedShift: function (oEvt) {
			if (oEvt.getSource().getSelectedKey().length === 0) {
				oEvt.getSource().setValueState(sap.ui.core.ValueState.Error);
				oEvt.getSource().setValueStateText(this.getText("required"));
			} else {
				oEvt.getSource().setValueState(sap.ui.core.ValueState.None);
				oEvt.getSource().setValueStateText("");
			}
		},
		updateSelectedRows: function (oEvt) {

			let oDataView = this.getView().getModel("teamShiftView").getData();

			if (!this.validateDateInterval(oDataView.date, oDataView.todate)) {
				return;
			}

			let oSelectShift = Fragment.byId("idPopupMassUpdate", "selShift");
			let oDateShift = Fragment.byId("idPopupMassUpdate", "dtShift");
			let oDateToShift = Fragment.byId("idPopupMassUpdate", "dtToShift");

			if (oDataView.todate && oDataView.date && oDataView.shift && oDataView.shift.length > 0) {
				for (let itemRow of this._tblTeamShift.getSelectedItems()) {

					let sRowPath = itemRow.getBindingContext("teamShift").sPath;
					let oModel = itemRow.getBindingContext("teamShift").getModel("teamShift");
					let contChange = 0;

					let oItemData = oModel.getProperty(sRowPath);

					for (let itemProperty in oItemData) {
						let item = oItemData[itemProperty];

						//INTERVAL TEST
						if (!item.start) {
							continue;
						}
						let dateRecord = new Date(item.start.getFullYear(), item.start.getMonth(),
							item.start.getDate());
						let dateFrom = new Date(this.teamShiftViewData.date.getFullYear(), this.teamShiftViewData.date.getMonth(), this.teamShiftViewData
							.date.getDate());
						let dateTo = new Date(this.teamShiftViewData.todate.getFullYear(), this.teamShiftViewData.todate.getMonth(), this.teamShiftViewData
							.todate.getDate());
						if (dateRecord >= dateFrom && dateRecord <= dateTo) {

							//if (item.start && item.start.toDateString() === oDataView.date.toDateString()) {

							if (!item.CanChangeShift) {
								sap.m.MessageToast.show(this.getText("can_not_change_shift"), {
									closeOnBrowserNavigation: false
								});
								return;
							} else {

								oModel.setProperty(`${sRowPath}/${itemProperty}/shift`, oDataView.shift);
								//item.shift = oDataView.shift;
								if (item.checkIsChanged && item.checkIsChanged()) {
									item.valueState = sap.ui.core.ValueState.Warning;
									item.valueStateText = this.getText("modified");
								} else {
									item.valueState = sap.ui.core.ValueState.None;
									item.valueStateText = "";
								}
							}

						}

						//Validate consecutive dates
						//item.checkIsChanged && item.checkIsChanged() || item.ChangeShift ? contChange++ : contChange = 0;
						/*						if ((item.ConscShftchg + 1) === contChange) {
													item.valueState = sap.ui.core.ValueState.Error;
													item.valueStateText = this.getText("consecutive_change_limit_reached");
													//If consecutive date reached then the row update stops
													break;
												} //End validate consecutive*/

					}

				}
				this.getView().getModel("teamShift").refresh();
				this.dialog.close();

			} else {
				if (oSelectShift.getSelectedKey().length === 0) {
					oSelectShift.setValueState(sap.ui.core.ValueState.Error);
					oSelectShift.setValueStateText(this.getText("required"));
				} else {
					oSelectShift.setValueState(sap.ui.core.ValueState.None);
					oSelectShift.setValueStateText("");
				}
				if (oDataView.date) {
					oDateShift.setValueState(sap.ui.core.ValueState.None);
					oDateShift.setValueStateText("");
					oDateToShift.setValueState(sap.ui.core.ValueState.None);
					oDateToShift.setValueStateText("");

				} else {
					oDateShift.setValueState(sap.ui.core.ValueState.Error);
					oDateShift.setValueStateText(this.getText("required"));
					oDateToShift.setValueState(sap.ui.core.ValueState.Error);
					oDateToShift.setValueStateText(this.getText("required"));
				}

				this.showToast("msg_fill_fields_to_mass_update", false);
			}
			return;
		},
		checkDateShift: function (oDt) {
			if (!oDt) return;
			if (oDt.getSource().getDateValue()) {
				oDt.getSource().setValueState(sap.ui.core.ValueState.None);
				oDt.getSource().setValueStateText("");
			} else {
				oDt.getSource().setValueState(sap.ui.core.ValueState.Error);
				oDt.getSource().setValueStateText(this.getText("required"));
			}
		},
		closeMassUpdateDialog: function () {
			/*let oSelectShift = this.dialog.getContent()[0].getContent()[0].mAggregations.items.find((ctrl) => {
				return ctrl.sId.includes("selShift");
			});*/

			let oSelectShift = Fragment.byId("idPopupMassUpdate", "selShift");

			oSelectShift.setValueState(sap.ui.core.ValueState.None);
			oSelectShift.setValueStateText("");

			delete this._refEmployee;
			this.dialog.close();
		},
		_checkChangesToSave: function () {
			let hasChangedItems = false;

			for (let itemRow of this.getView().getModel("teamShift").getData()) {
				for (let itemAtt in itemRow) {
					if ((itemRow[itemAtt].checkIsChanged && itemRow[itemAtt].checkIsChanged()) || (itemRow[itemAtt].checkIsOTChanged && itemRow[
							itemAtt].checkIsOTChanged())) {
						hasChangedItems = true;
						break;
					}
				}
			}

			if (!hasChangedItems) {
				this.showToast("msg_no_changes_submit", false);
				return false;
			} else {
				return true;
			}

		},
		onSave: function () {

			if (!this._checkChangesToSave()) {
				return;
			}

			let dialog = new Dialog({
				title: this.getText("confirm"),
				type: 'Message',
				content: new Text({
					text: this.getText("msg_confirm_shift_change")
				}),
				beginButton: new Button({
					type: ButtonType.Emphasized,
					text: this.getText("yes"),
					press: () => {
						this.changeShifts();
						dialog.close();
					}
				}),
				endButton: new Button({
					text: this.getText("no"),
					press: () => {
						dialog.close();
					}
				}),
				afterClose: () => {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		changeShifts: function () {
			let listChange = [];

			this.role = this.getView().getModel("currentRole").getData().currentRole;

			for (let itemRow of this.getView().getModel("teamShift").getData()) {
				for (let itemAtt in itemRow) {
					if ((itemRow[itemAtt].checkIsChanged && itemRow[itemAtt].checkIsChanged()) || (itemRow[itemAtt].checkIsOTChanged && itemRow[
							itemAtt].checkIsOTChanged())) {

						let itemChange = {
							//Employee: itemPeople.pernr,
							Pernr: itemRow.data.pernr,
							Date: utils.zeroTimezone(itemRow[itemAtt].start),
							//Role: itemRow[itemAtt].employeeRole,
							Role: this.role,
							Shift: itemRow[itemAtt].shift,
							Othours: itemRow[itemAtt].OtHours.length > 0 ? parseInt(itemRow[itemAtt].OtHours).toString() : "0",
							Remarks: "",
							Status: "",
							OthoursFilled: itemRow[itemAtt].OthoursFilled,
							ShiftHaschgd: itemRow[itemAtt].checkIsChanged(),
							OthoursHaschgd: itemRow[itemAtt].checkIsOTChanged(),
							Id: itemRow[itemAtt].Id,
							IsCallback: itemRow[itemAtt].IsCallback
						};

						if (itemRow[itemAtt].checkIsOTChanged()) {
							itemChange.Status = itemRow[itemAtt].OthoursFilled ? "APPROVED" : "REJECTED";
						}

						listChange.push(itemChange);
					}
				}
			}

			if (listChange.length === 0) {
				this.showToast("msg_no_changes_submit");
				return;
			}
			this.setBusy(true);

			this._Service.getInstance(this).batchShiftChange(listChange)
				.then((ret) => {
					for (let retItem of ret) {

						for (let itemRow of this.getView().getModel("teamShift").getData()) {
							for (let itemAtt in itemRow) {
								if (retItem.Id === itemRow[itemAtt].Id) {
									switch (retItem.StatusReq) {
									case "E":
										itemRow[itemAtt].valueState = sap.ui.core.ValueState.Error;
										break;
									case "S":
										itemRow[itemAtt].ChangeShift = retItem.ChangeShift;
										itemRow[itemAtt].valueState = sap.ui.core.ValueState.Success;
										itemRow[itemAtt].dateKind = this._Service.getInstance(this).getDataKind(retItem);
										itemRow[itemAtt].dateKindColor = formatter.getDateKindStyle(itemRow[itemAtt].dateKind);
										break;
									default:
										itemRow[itemAtt].valueState = sap.ui.core.ValueState.None;
										break;
									};

									itemRow[itemAtt].PotentialViolation = retItem.PotentialViolation;
									itemRow[itemAtt].Violation = retItem.Violation ? retItem.Violation : "";
									itemRow[itemAtt].valueStateText = retItem.Message;
									itemRow[itemAtt].StatusReqOt = retItem.StatusReqOt;
									itemRow[itemAtt].MessageOt = retItem.MessageOt;

									if (retItem.StatusReq === "S") {
										itemRow[itemAtt].originalShift = itemRow[itemAtt].shift;
									}
									if (retItem.StatusReqOt === "S") {
										itemRow[itemAtt].OtHoursOriginal = itemRow[itemAtt].OtHours;
									}
								}
							}
						}
					}
					this.showToast("msg_changes_made_check_state", false);
					this.getView().getModel("teamShift").refresh();

					this.setBusy(false);
				})
				.catch((err) => {
					this.reportErrorMsg(err, "msg_error_changing_shifts");
				});

		},
		updateEndDate: function () {
			let oData = this.getView().getModel("teamfilterval").getData();
			oData.todate = new Date(oData.fromdate.getFullYear(), oData.fromdate.getMonth(), oData.fromdate.getDate() + 14);
			this.getView().getModel("teamfilterval").refresh();
		},
		validateDateIntervalTeamShift: function () {
			let oData = this.getView().getModel("teamfilterval").getData();
			if (!oData.fromdate || !oData.todate) {
				this.showToast("msg_interval_must_be_filled", false);
				return false;
			}
			if (oData.fromdate > oData.todate) {
				this.showToast("msg_beg_date_must_be_bigger", false);
				return false;
			}
			return true;
		},
		_initFilter: function () {
			let today = new Date();
			this.filterIntervalData = {
				fromdate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
				todate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13),
				fromdateL1: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
				todateL1: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 12),
				employeeid: [],
				orgunit: []
			};
			this.setFieldState(sap.ui.core.ValueState.None, "", this._idCbOrgUnit);
			this.filterval = new JSONModel(this.filterIntervalData, true);
			this.getView().setModel(this.filterval, "teamfilterval");
		},
		handleCancelButton: function () {
			this._oLegendPopover.close();
		},
		initPopover: function () {
			this._oLegendPopover = Fragment.load({
				id: "myPopoverFrag",
				name: "com.infineon.ztmsapp.fragments.TeamShiftCalendarLegend",
				controller: this
			}).then((oDialog) => {
				this._oLegendPopover = oDialog;
				this.getView().addDependent(this._oLegendPopover);
			});
		},
		onLegendShow: function (oEvt) {
			let oSource = oEvt.getSource();

			if (!this._oLegendPopover) {
				this._oLegendPopover = Fragment.load({
					id: "myPopoverFrag",
					name: "com.infineon.ztmsapp.fragments.TeamShiftCalendarLegend",
					controller: this
				}).then((oDialog) => {
					this._oLegendPopover = oDialog;
					this.getView().addDependent(this._oLegendPopover);
					this._oLegendPopover.openBy(oSource);
				});
			} else {
				if (this._oLegendPopover.isOpen()) {
					this._oLegendPopover.close();
				} else {
					this._oLegendPopover.openBy(oSource);
				}
			}
		},
		onChangeShift: function (oEvt, sEntity) {

			let oShift = oEvt.getSource();
			let oBindingContext = oShift.getBindingContext("teamShift");
			let sPath = oBindingContext.sPath;
			let isChanged = oBindingContext.getProperty(sPath)[sEntity].checkIsChanged();

			if (!isChanged) {
				oShift.setValueState(sap.ui.core.ValueState.None);
				oShift.setValueStateText("");
				return;
			}

			if (isChanged && (oShift.getValueState() === sap.ui.core.ValueState.None || oShift.getValueState() ===
					sap.ui.core.ValueState.Warning || sap.ui.core.ValueState.Success)) {
				oShift.setValueState(sap.ui.core.ValueState.Warning);
				oShift.setValueStateText(oShift.getParent().getModel("i18n").getResourceBundle().getText(
					"modified"));
			}

			let contChange = 0;
			let nConscShftchg = oBindingContext.getProperty(sPath)[sEntity].ConscShftchg;
			let sOriginalShift = oBindingContext.getProperty(sPath)[sEntity].originalShift;

			//Avoid change using mass update
			if (!oBindingContext.getProperty(sPath)[sEntity].CanChangeShift) {
				oShift.setValueState(sap.ui.core.ValueState.None);
				oShift.setValueStateText("");
				oShift.setSelectedKey(sOriginalShift);
				oBindingContext.getProperty(oBindingContext.sPath).shift = sOriginalShift;

				sap.m.MessageToast.show(oShift.getParent().getModel("i18n").getResourceBundle().getText(
					"can_not_change_shift"), {
					closeOnBrowserNavigation: false
				});
			}

			//Consecutive days rules
			/*			Object.values(oBindingContext.getProperty(sPath)).forEach(item => {
							item.checkIsChanged && item.checkIsChanged() || item.ChangeShift ? contChange++ : contChange = 0;
							if ((nConscShftchg + 1) === contChange) {
								oShift.setValueState(sap.ui.core.ValueState.None);
								oShift.setValueStateText("");*/
			/*oShift.setSelectedKey(sOriginalShift);
								sap.m.MessageToast.show(oShift.getParent().getModel("i18n").getResourceBundle().getText(
									"consecutive_change_limit_reached"), {
									closeOnBrowserNavigation: false
								});*/
			/*					oShift.setValueState(sap.ui.core.ValueState.Error);
								oShift.setValueStateText(oShift.getParent().getModel("i18n").getResourceBundle().getText(
									"consecutive_change_limit_reached"));
							}
						});*/
		},
		onUpdateFinish: function (oEvt) {

			/*			let dFromDate = new Date(this.filterIntervalData.fromdate.getFullYear(), this.filterIntervalData.fromdate.getMonth(), this.filterIntervalData
							.fromdate.getDate() - 1);

						let dToDate = new Date(dFromDate.getFullYear(), dFromDate.getMonth(), dFromDate.getDate() + 13);*/

			let dateInterval = this.utils.getDateInterval(this.filterIntervalData.fromdateL1, this.filterIntervalData.todateL1);
			dateInterval.unshift({
				labelEmployee: this.getText("label_employee"),
			});

			this.getView().setModel(new JSONModel(dateInterval, true), "dateIntervalTable");

			oEvt.getSource().bindAggregation("columns", "dateIntervalTable>/", new sap.m.Column({
				hAlign: "Center",
				demandPopin: "{= ${dateIntervalTable>index} < 6 }", //"false",
				minScreenWidth: "{= ${dateIntervalTable>index} > 6 ? '110em' : '' }", //"Desktop",
				//visible: "{dateIntervalTable>visible}",
				width: "{= ${dateIntervalTable>dayOfWeek} ? '6em' : '17em' }",
				styleClass: "{= ${dateIntervalTable>isWeekend} ? 'customCalendarHeaderWeekend' : 'customCalendarHeader' } ",
				header: new sap.m.VBox({

					items: [
						new sap.m.Label({
							text: "{dateIntervalTable>dayOfWeek} {dateIntervalTable>labelEmployee}"
						}),
						new sap.m.Label({
							text: "{dateIntervalTable>dayOfMonth}"
						})
					]
				})
			}));

		},
		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.infineon.ztmsapp.view.TeamShiftCalendar
		 */
		onBeforeRendering: function () {},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.infineon.ztmsapp.view.TeamShiftCalendar
		 */
		onAfterRendering: function () {},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.infineon.ztmsapp.view.TeamShiftCalendar
		 */
		onExit: function () {
			if (this._oLegendPopover) {
				this._oLegendPopover.destroy();
			}
		}

	});

});