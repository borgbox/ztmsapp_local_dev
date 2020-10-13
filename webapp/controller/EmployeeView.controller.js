sap.ui.define([
	"com/infineon/ztmsapp/controller/BaseController",
	'sap/ui/unified/DateTypeRange',
	"com/infineon/ztmsapp/js/localization",
	"com/infineon/ztmsapp/js/features",
	"com/infineon/ztmsapp/js/uilog",
	"sap/ui/model/json/JSONModel",
	'sap/ui/core/Fragment',
	'sap/m/Dialog',
	'sap/ui/unified/calendar/CalendarDate',
	"sap/ui/core/routing/History",
	"com/infineon/ztmsapp/util/utils",
	"com/infineon/ztmsapp/js/Constants",
	"com/infineon/ztmsapp/util/formatter",
	"sap/m/MessageBox",
	"com/infineon/ztmsapp/util/ServiceHelper"
], function (Controller, DateTypeRange, Localization, Features, Uilog, JSONModel, Fragment, Dialog, CalendarDate, History, utils,
	Constants, formatter, MessageBox, ServiceHelper) {
	"use strict";

	return Controller.extend("com.infineon.ztmsapp.controller.EmployeeView", {
		pernr: '',
		role: '',
		personnel_area: '',
		oFormatYyyymmdd: null,
		baseUrl: "/EmployeeDataSet(Employee='00000000',Role='EMPLOYEE')",
		basePathToService: "/sap/opu/odata/sap/ZHR_TMS_CORE_SRV",
		_isCorrectFilled: false,
		utils: utils,
		_calendar: null,
		Constants: Constants,
		formatter: formatter,
		_tblOTApprovalEmployee: null,
		_tblPreOTShiftApproval: null,
		_newRequestBtn: null,
		//_otRequestsSection: null,
		_otRequestPreOTShiftSection: null,
		_shiftPlanSection: null,
		fltEmployeeStr: "filterEmployee",
		fltEmployeePreOTStr: "filterEmployeePreOT",
		serviceHelper: ServiceHelper,
		onInit: function () {
			var features_inj = Features;
			this._newRequestBtn = this.getView().byId("newRequest");
			//this._otRequestsSection = this.getView().byId("otRequestsSection");
			this._shiftPlanSection = this.getView().byId("shiftPlanSection");
			this._otRequestPreOTShiftSection = this.getView().byId("otRequestPreOTShiftSection");
			this._initPopupCommentOT();
			this._tblOTApprovalEmployee = this.getView().byId("tblOTApprovalEmployee");
			this._tblPreOTShiftApproval = this.getView().byId("tblPreOTShiftApproval");
			this._initOTLegend();
			this._calendar = this.getView().byId("calendar");
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "dd/MM/yyyy",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			var model = this.getView().getModel() || this.getOwnerComponent().getModel();
			model.read(this.baseUrl, {
				urlParameters: "$expand=FeatureConfigSet,ChangeShiftSet",
				success: (oData, oResponse) => {
					var objPage = this.getView().byId("ObjectPageLayout");
					objPage.bindElement(this.baseUrl);
					var cfgFeatures = new JSONModel(oData.FeatureConfigSet);
					var employeeData = new JSONModel(oData);
					this.getView().setModel(cfgFeatures, "features");
					this.getView().setModel(employeeData, "employeeData");
					this.pernr = this.getView().getModel("employeeData").getData().Employee;
					this.role = this.getView().getModel("employeeData").getData().Role;
					this.personnel_area = this.getView().getModel("employeeData").getData().PersonnelArea;
					features_inj.setView(this.getView());
					this.initFeaturesAdjustment();
					this.loadMyCalendarData(this.pernr);
					this.initCalendarLegend();

				},
				error: (err) => {
					let elem = this.getView().byId("messages");
					Uilog.reportErrorMsg(err, [], elem);
				}
			});
			this.getOwnerComponent().getRouter().getRoute("EmployeeView").attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function () {
			this.setBusy(false);
			this.putOTLegend();
			this._clock();
			//this.initGenericOrgFilter(this.fltEmployeeStr, this._otRequestsSection);
			this.initGenericOrgFilter(this.fltEmployeePreOTStr, this._otRequestPreOTShiftSection);
			this.setNotificationVisible(false);

		},
		refresh: function () {
			this.loadMyCalendarData(this.pernr);
		},
		handleCalendarSelect: function (oEvt) {

			let dDateSelected = oEvt.getSource().getSelectedDates()[0].getStartDate();
			let oItemSelected = this._calendar.getItems().find((item) => {
				return item.Date.getFullYear() === dDateSelected.getFullYear() && item.Date.getMonth() === dDateSelected.getMonth() && item.Date
					.getDate() === dDateSelected.getDate()
			});
			//If is PREOT requested then should be disable
			//let isPreOTRequested = parseInt(oItemSelected.OtHoursReq) > 0;
			//this._newRequestBtn.setEnabled(!isPreOTRequested && oItemSelected.CanCreateOt);
			this._newRequestBtn.setEnabled(oItemSelected.CanCreateOt);
			//this._newRequestBtn.setTooltip(isPreOTRequested ? this.getText("msg_preot_disable") : "");
			this._newRequestBtn.setTooltip(oItemSelected.CanCreateOt ? "" : this.getText("msg_preot_disable") );
		},
		initGenericOrgFilter: function (modelName, oTab) {

			let bExpand = true;
			var today = new Date();

			let fromDate = null;
			let toDate = null;
			let minDate = null;

			fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			minDate = fromDate;
			toDate = new Date();

			let oData = {
				minDate: minDate,
				fromdate: fromDate,
				todate: toDate,
				costcenter: [],
				orgunit: [],
				empgroup: [],
				shiftgroup: [],
				employeeid: [],
				status: [],
				statusFltVisible: true,
				filterexpanded: bExpand,
				filterbusy: false,
				param: modelName,
				display: false
			}

			let filterOrg = new JSONModel(oData);

			switch (modelName) {
			case this.fltEmployeeStr:
				this.getView().byId("otRequestsSection").setModel(filterOrg, "orgFilter");
				break;
			case this.fltEmployeePreOTStr:
				this.getView().byId("otRequestPreOTShiftSection").setModel(filterOrg, "orgFilter");
				break;
			}

			this[modelName] = filterOrg;

		},
		_initOTLegend: function () {

			this.contHbox = new sap.m.HBox();
			let iconPending = new sap.ui.core.Icon({
				src: sap.ui.core.IconPool.getIconURI("pending"),
				size: "1.4em",
				color: "#3F5161",
			}).addStyleClass("fontIcon");
			let txtOt = new sap.m.Text({
				text: this.getText("ot_hour")
			});
			txtOt.addStyleClass("sapUiTinyMarginBegin");
			txtOt.addStyleClass("labelOTHourLegend");
			this.contHbox.addStyleClass("sapUiMediumMarginBegin");
			this.contHbox.addStyleClass("tagClassOTLegend");
			this.contHbox.addItem(iconPending);
			this.contHbox.addItem(txtOt);

		},
		validateMandatorySelects: function () {
			let oOTHourRequestFields = this.getOTRequestFields();
			let oDataNewRequest = this.getView().getModel("newrequest").getData();
			let isOTOk = oOTHourRequestFields.othours.getSelectedKey().length > 0;
			let isReasonOk = oOTHourRequestFields.reasons.getSelectedKey().length;

			isOTOk && oOTHourRequestFields.othours.getSelectedKey() !== oDataNewRequest.OriginalOtHour ? this.setFieldState(sap.ui.core.ValueState
				.None, null, oOTHourRequestFields.othours) : this.setFieldState(sap.ui.core.ValueState
				.Error, "required", oOTHourRequestFields.othours);

			isReasonOk ? this.setFieldState(sap.ui.core.ValueState.None, null, oOTHourRequestFields.reasons) : this.setFieldState(sap.ui.core.ValueState
				.Error, "required", oOTHourRequestFields.reasons);

			return isOTOk && isReasonOk;
		},
		getOThoursOptions: function (sShift, sPersonalArea) {
			this.getOTRequestFields().othours.setBusy(true);
			let sHour = this.getText("hours");

			this.serviceHelper.read(`/OTHourOptionsSet(PersArea='${sPersonalArea}',Dws='${sShift}')`, this.getView().getModel(), true, null,
					null, null, null, null)
				.then((res) => {
					let oData = res[0];

					let aOTHourOptions = res[0].OtHoursRg.split(",");
					let othours = [{
						Key: ``,
						Value: ``
					}];
					for (let itemHour of aOTHourOptions) {
						othours.push({
							Key: itemHour,
							Value: `${itemHour} ${sHour}`
						})
					}
					this.getView().getModel("newrequest").setProperty("/othours", othours);

					this.getOTRequestFields().othours.setBusy(false);
					this.getOTRequestFields().othours.setSelectedKey("")
				})
				.catch((err) => { //Not found
					this.getOTRequestFields().othours.setBusy(false);
					this.getView().getModel("newrequest").setProperty("/othours", []);
					this.getOTRequestFields().othours.setSelectedKey("")
				});

		},
		validateOption: function (oEvt, bValidateRequired, oControl) {

			let oCtrl = oControl ? oControl : oEvt.getSource();

			let sValue = "";
			if (oCtrl.getMetadata()._sClassName === "sap.m.Select" || oCtrl.getMetadata()._sClassName === "sap.m.ComboBox") {
				sValue = oCtrl ? oCtrl.getSelectedKey() : oCtrl.getSelectedKey();
			} else {
				sValue = oCtrl ? oCtrl.getValue() : oCtrl.getValue();
			}

			//If shift is change then OT hour option list needs to be loaded again
			if (oCtrl.getId() === "shifts") {
				this.getOThoursOptions(sValue, this.personnel_area);
			}

			let aList = oCtrl.getBindingInfo("items").binding.oList ? oCtrl.getBindingInfo("items").binding.oList : oCtrl.getBindingInfo(
				"items").binding.aLastContextData.map((item) => JSON.parse(item));

			//Validate required
			if ((!sValue || sValue.length === 0) && bValidateRequired) {
				//OtHours or Shift must be filled
				this.setFieldState(sap.ui.core.ValueState.Error, "required", oCtrl); //(pStatus, pMsg, pControl) */
			} else { //Validate interval
				let itemExist = aList.find((item) => {
					//this.validateMandatorySelects();
					return item.Key === sValue;
				});
				if (itemExist) {
					this.setFieldState(sap.ui.core.ValueState.None, "", oCtrl);
					this.validateMandatorySelects();
					return true;
				} else {
					oCtrl.setSelectedKey("");
					oCtrl.setValue("");
					this.setFieldState(sap.ui.core.ValueState.Error, "invalid_value", oCtrl);
					this.validateMandatorySelects();
					return false;
				}
			}

		},
		_validateEmployeeRequest: function () {
			let oData = this.getView().getModel("newrequest").getData();
			//let isMandatoryOK = (oData.selectedOtHour.length > 0 || oData.selectedShift.length > 0) && oData.selectedReason.length > 0;
			let isMandatoryOK = oData.selectedOtHour.length > 0 && oData.remarks.length > 0 && oData.selectedReason.length > 0;
			let isSelectOthours = true;
			let isSelectShifts = true;
			let isSelectReasons = true;
			let isRemark = true;

			let oOTHourRequestFields = this.getOTRequestFields();

			if (oData.selectedOtHour.length === 0) {
				isSelectOthours = this.validateOption(null, false, oOTHourRequestFields.othours);
			}
			if (oData.selectedShift.length === 0) {
				isSelectShifts = this.validateOption(null, false, oOTHourRequestFields.shifts);
			}
			if (oData.selectedReason.length === 0) {
				isSelectReasons = this.validateOption(null, false, oOTHourRequestFields.reasons);
			}

			isRemark = this.validateMandatory(oOTHourRequestFields.remarks);

			isMandatoryOK = this.validateMandatorySelects();

			if (!isMandatoryOK) {
				let msgMandatory = "";
				if (oData.preotenabled && oData.chgshiftenabled) {
					msgMandatory = "msg_new_ot_save_error_mandatory";
				}
				this.showToast(msgMandatory, false);
			}
			if (!isSelectOthours || !isSelectShifts || !isSelectReasons) {
				this.showToast("msg_field_invalid_option", false);
			}
			return isMandatoryOK && isSelectOthours && isSelectShifts && isSelectReasons && isRemark;

		},
		getOTRequestFields: function () {
			let othours = this.draggableDialog.getContent()[0].getContent().find((ctrl) => {
				return ctrl.sId === "othours"
			});
			let shifts = this.draggableDialog.getContent()[0].getContent().find((ctrl) => {
				return ctrl.sId === "shifts"
			});
			let reasons = this.draggableDialog.getContent()[0].getContent().find((ctrl) => {
				return ctrl.sId === "reasons"
			});
			let remarks = this.draggableDialog.getContent()[0].getContent().find((ctrl) => {
				return ctrl.sId === "remarks"
			});

			return {
				othours: othours,
				shifts: shifts,
				reasons: reasons,
				remarks: remarks
			};
		},
		initFeaturesAdjustment: function () {

			if (Features.hasCreateRight(Features.CONST_FEATURE_REQUESTPRE_OT)) { // || Features.hasCreateRight(Features.CONST_FEATURE_REQUESTSHIFTCG)) {
				this._newRequestBtn.setVisible(true);
				//this._otRequestsSection.setVisible(true);
				this._otRequestPreOTShiftSection.setVisible(true);
			}
		},
		onChangeTab: function (oEvt) {
			this.putOTLegend();
			this._shiftPlanSection.isActive() ? this._newRequestBtn.setVisible(Features.hasCreateRight(Features.CONST_FEATURE_REQUESTPRE_OT)) :
				this._newRequestBtn.setVisible(false);
		},
		onExit: function () {
			this.closeDialog();
		},
		onWithdrawPreOTShift: function (oEvt) {
			let oContext = oEvt.getParameter("evt").oSource.controlContext;
			event.stopPropagation();
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.confirm(
				this.getText("msg_withdraw_preot_shift_request"), {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: (sAction) => {
						if (sAction === MessageBox.Action.OK) {
							this._withdrawPreOTShiftRequest(oContext);
						}
					}
				}
			);

		},
		onCancelPreOTShift: function (oEvt) {
			let oContext = oEvt.getParameter("evt").oSource.controlContext;
			event.stopPropagation();
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.confirm(
				this.getText("msg_cancel_preot_shift_request"), {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: (sAction) => {
						if (sAction === MessageBox.Action.OK) {
							this._cancelPreOTShiftRequest(oContext);
						}
					}
				}
			);
		},
		_withdrawPreOTShiftRequest: function (oContext) {
			this.setBusy(true);
			this.getView().getModel().createEntry(this.baseUrl + "/ChangeShiftSet", {
				properties: {
					Pernr: this.pernr,
					Date: oContext.Date,
					Role: this.role,
					Othours: "0",
					OthoursFilled: false,
					OthoursHaschgd: false,
					ShiftHaschgd: false,
					Shift: "",
					Reason: "",
					Remarks: "",
					Id: "",
					Preotstatus: Constants.PENDWITHDR
				},
				groupId: "cancelPreOTShift",
				success: (oData, sResponse) => {
					switch (oData.StatusReqOt) {
					case "E":
						this.reportErrorMsg(null, oData.MessageOt);
						break;
					case "S":
						this.successMessage(oData.MessageOt ? oData.MessageOt : "mgrview_request_cancel_ok");
					default:
					}
					this.loadMyCalendarData(this.pernr);
					this.setBusy(false);
				},
				error: (oError) => {
					this.reportErrorMsg(oError, "msg_error_cancel_request");
				}
			});
			this.getView().getModel().submitChanges();

		},
		_cancelPreOTShiftRequest: function (oContext) {
			this.setBusy(true);
			this.getView().getModel().createEntry(this.baseUrl + "/ChangeShiftSet", {
				properties: {
					Pernr: this.pernr,
					Date: oContext.Date,
					Role: this.role,
					Othours: "0",
					OthoursFilled: false,
					OthoursHaschgd: false,
					ShiftHaschgd: false,
					Shift: "",
					Reason: "",
					Remarks: "",
					Id: "",
					Preotstatus: Constants.CANCELED
				},
				groupId: "cancelPreOTShift",
				success: (oData, sResponse) => {
					switch (oData.StatusReqOt) {
					case "E":
						this.reportErrorMsg(null, oData.MessageOt);
						break;
					case "S":
						this.successMessage(oData.MessageOt ? oData.MessageOt : "mgrview_request_cancel_ok");
					default:
					}
					this.loadMyCalendarData(this.pernr);
					this.setBusy(false);
				},
				error: (oError) => {
					this.reportErrorMsg(oError, "msg_error_cancel_request");
				}
			});
			this.getView().getModel().submitChanges();

		},
		saveDialog: function (oEvt) {
			event.stopPropagation();
			event.preventDefault();
			this._calendar._getFocusedDate()._oUDate.oDate = this._calendar.getStartDate();
			if (!this._validateEmployeeRequest()) {
				return;
			}
			let oDataNewRequest = this.getView().getModel("newrequest").oData;

			let selDate = this._calendar.getSelectedDates();
			if (!selDate || selDate.length == 0) {
				this.showToast("no_date_selected", false);
				return;
			}
			let startDate = selDate[0].getStartDate();

			let startDateUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
			let selItem = this._calendar.getItems().find((item) => {
				return item.Date.toDateString() === startDateUTC.toDateString()
			});
			this.setBusy(true);
			this.getView().getModel().createEntry(this.baseUrl + "/ChangeShiftSet", {
				properties: {
					Pernr: this.pernr,
					//Date: startDateUTC,
					Date: utils.zeroTimezone(startDate),
					Role: this.role,
					Othours: oDataNewRequest.selectedOtHour,
					OthoursFilled: oDataNewRequest.selectedOtHour.length > 0,
					OthoursHaschgd: oDataNewRequest.selectedOtHour !== selItem.OriginalOtHours,
					ShiftHaschgd: oDataNewRequest.selectedShift !== selItem.OriginalShift,
					Shift: oDataNewRequest.selectedShift,
					Reason: oDataNewRequest.selectedReason,
					Remarks: oDataNewRequest.remarks,
					Id: "",
					Preotstatus: Constants.SENT
				},
				groupId: "saveShift",
				success: (oData, sResponse) => {

					if (oData.StatusReqOt === "E") {
						this.reportErrorMsg(null, oData.MessageOt);
					}
					if (oData.StatusReq === "E") {
						this.reportErrorMsg(null, oData.Message);
					}

					if (oData.StatusReqOt === "S" && oData.StatusReq === "S") {
						this.successMessage(oData.MessageOt ? oData.MessageOt : "mgrview_shift_overtime_change_ok");
					} else {
						if (oData.StatusReqOt === "S") {
							this.successMessage(oData.MessageOt ? oData.MessageOt : "mgrview_overtimechange_ok");
						}
						if (oData.StatusReq === "S") {
							this.successMessage(oData.Message ? oData.Message : "mgrview_shiftchange_ok");
						}
					}
					this.loadMyCalendarData(this.pernr);
					this.setBusy(false);
				},
				error: (oError) => {
					this.reportErrorMsg(oError, "msg_error_load_employee_data");
				}
			});
			this.getView().getModel().submitChanges();
			this.closeDialog();
		},

		onNewRequest: function (oEvent) {
			event.stopPropagation();
			event.preventDefault();
			let sHour = this.getText("hours");
			let selDate = this._calendar.getSelectedDates();
			if (!selDate || selDate.length == 0) {
				this.showToast("empview_warning_nodateselected");
				return;
			}
			let startDate = this._calendar.getSelectedDates()[0].getStartDate();
			let startDateUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
			let selItem;
			$.each(this._calendar.getItems(), function (row, value) {
				if (CalendarDate.fromLocalJSDate(startDateUTC).isSame(CalendarDate.fromLocalJSDate(value.Date))) {
					selItem = value;
				}
			});

			//if(!selItem.CanChangeShift && !selItem.CanCreateOt){
			//If can not not change OT cant change shift netheir
			if (!selItem.CanCreateOt) {
				this.showToast("msg_can_not_request_ot");
				return;
			}

			let shifts = [];
			shifts.push({
				"Key": "",
				"Value": ""
			});

			let othours = [];
			othours.push({
				"Key": "",
				"Value": ""
			});

			if (selItem) {
				$.each(selItem.ShiftsAllowedSet.results, function (row, value) {
					shifts.push({
						"Key": value.Shift,
						"Value": value.Shift
					})
				});
				let othoursrg = selItem.OtHoursRg;
				if (othoursrg) {
					var othoursarr = othoursrg.split(",");
					$.each(othoursarr, function (row, value) {
						othours.push({
							"Key": value,
							"Value": `${value} ${sHour}`
						})
					});
				}
			}
			var formattedDate = this.oFormatYyyymmdd.format(startDateUTC);
			var preotenabled = false;
			if (Features.hasCreateRight(Features.CONST_FEATURE_REQUESTPRE_OT)) {
				preotenabled = true;
			}
			var chgshiftenabled = false;
			if (Features.hasCreateRight(Features.CONST_FEATURE_REQUESTSHIFTCG)) {
				chgshiftenabled = true;
			}
			this.getView().setModel(new JSONModel({
				selected_date: formattedDate,
				preotenabled: preotenabled,
				chgshiftenabled: chgshiftenabled,
				othours: othours,
				shifts: shifts,
				remarks: selItem.Remarks ? selItem.Remarks : "",
				selectedOtHour: this.formatZeroEmpty(selItem.OtHours, selItem.OthoursFilled),
				OriginalOtHour: this.formatZeroEmpty(selItem.OtHours, selItem.OthoursFilled),
				selectedShift: selItem.Shift,
				OriginalShift: selItem.Shift,
				selectedReason: selItem.Reason ? selItem.Reason : "",
				CanChangeShift: selItem.CanChangeShift,
				CanCreateOt: selItem.CanCreateOt
			}), "newrequest");
			if (!this.draggableDialog) {

				this.draggableDialog = sap.ui.xmlfragment("com.infineon.ztmsapp.fragments.employeeNewRequest", this);
				//to get access to the global model
				this.getView().addDependent(this.draggableDialog);
			}
			this.draggableDialog.open();
		},
		search: function (sEntity, oEvt) {
			let oData = oEvt.getSource().getModel("orgFilter").getData();
			if (!this.validateDateInterval(oData.fromdate, oData.todate)) {
				return;
			}

			switch (sEntity) {
			case "filterEmployee":
				this.searchOTApproval(sEntity);
				break;
			case "filterEmployeePreOT":
				this.searchPreOTShiftApproval(sEntity);
				break;
			}

		},
		searchOTApproval: function (modelName) {
			let filterData = this[modelName].getData();
			let la_filters = this.handleOrgFilters(filterData);

			this.setFilterTabBusyExpanded(true, false);
			this._tblOTApprovalEmployee.setBusy(true);
			this.getView().getModel().read("/OTApprovalSet", {
				filters: la_filters,
				success: (oData, oResponse) => {
					this._tblOTApprovalEmployee.setVisible(true);
					this.getView().setModel(new JSONModel(oData), "otApproval");
					for (let item of oData.results) {
						item.Enabled = false;
					}
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}
					this._tblOTApprovalEmployee.setBusy(false);
					this.setFilterTabBusyExpanded(false, false);
				},
				error: (oError) => {
					this.reportErrorMsg(oError);
					this._tblOTApprovalEmployee.setBusy(false);
					this.setFilterTabBusyExpanded(false, false);
				}
			});
		},
		searchPreOTShiftApproval: function (modelName) {
			let filterData = this[modelName].getData();
			let la_filters = this.handleOrgFilters(filterData);
			this._tblPreOTShiftApproval.setBusy(true);
			this.getView().getModel().read("/PreOTShiftApprovalSet", {
				filters: la_filters,
				success: (oData, oResponse) => {
					this._tblPreOTShiftApproval.setVisible(true);
					for (let item of oData.results) {
						item.Enabled = false;
					}
					this.getView().setModel(new JSONModel(oData), "preOTShiftApproval");
					this._tblPreOTShiftApproval.setBusy(false);
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}
				},
				error: (oError) => {
					this._tblPreOTShiftApproval.setBusy(false);
					this.reportErrorMsg(oError);
				}
			});
		},
		onSetCommentOT: function (oEvt, sModel) {

			let oControl = oEvt.getSource();

			this._initPopupCommentOT();

			this._oPopoverCommentOT.bindElement({
				path: `${oControl.getBindingContext(sModel).sPath}` //,
					//model: sModel
			});
			this._oPopoverCommentOT.setModel(this.getView().getModel(sModel));
			if (this._oPopoverCommentOT.isOpen()) {
				this._oPopoverCommentOT.close();
			} else {
				this._oPopoverCommentOT.openBy(oControl);
				this._oPopoverCommentOT.myControl = oControl;
			}

		},
		_initPopupCommentOT: function () {
			if (!this._oPopoverCommentOT) {
				Fragment.load({
					name: "com.infineon.ztmsapp.fragments.CommentPopupOT",
					controller: this
				}).then((pPopover) => {
					this._oPopoverCommentOT = pPopover;
					this._oPopoverCommentOT.setPlacement(sap.m.PlacementType.Horizontal);
					this.getView().addDependent(this._oPopoverCommentOT);
				});
			}
		},
		handleCloseTimeComment: function (oEvt) {
			this._oPopoverComment.close();
		},
		handleCloseOTApprovalComment: function (oEvt) {
			this._oPopoverCommentOT.close();
		},
		reset: function (oEvt, bNoExpand, objEvt) {

			switch (oEvt) {
			case "filterEmployee":
				this.initGenericOrgFilter(oEvt, bNoExpand);
				this._tblPreOTShiftApproval.setVisible(false);
				break;
			case "filterEmployeePreOT":
				this.initGenericOrgFilter(oEvt, bNoExpand);
				this._tblOTApprovalEmployee.setVisible(false);
				break;
			}

		},
		setFilterTabBusyExpanded: function (filterBusy, filterExpanded) {
			this.filterEmployee.setProperty("/filterbusy", filterBusy);
			this.filterEmployee.setProperty("/filterexpanded", filterExpanded);
		},
		handleOrgFilters: function (filterData) {
			let la_filters = []; // Don't normally do this but just for the example.
			let ld_begdate = filterData.fromdate;
			let startDateUTC = new Date(Date.UTC(ld_begdate.getFullYear(), ld_begdate.getMonth(), ld_begdate.getDate()));
			let ld_enddate = filterData.todate;
			let endDateUTC = new Date(Date.UTC(ld_enddate.getFullYear(), ld_enddate.getMonth(), ld_enddate.getDate()));
			let costcenter = filterData.costcenter;
			let orgunit = filterData.orgunit;
			let empgroup = filterData.empgroup;
			let shiftgroup = filterData.shiftgroup;
			let employeeid = filterData.employeeid;
			let status = filterData.status;
			let statusFltVis = filterData.statusFltVisible;
			let lo_PickedDateFilter = new sap.ui.model.Filter({
				path: "Day",
				operator: sap.ui.model.FilterOperator.BT,
				value1: startDateUTC,
				value2: endDateUTC
			});
			let lo_pernrFilter = new sap.ui.model.Filter({
				path: "Employee",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.pernr
			});
			let lo_roleFilter = new sap.ui.model.Filter({
				path: "Role",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.role
			});
			let lo_employeeFilter = new sap.ui.model.Filter({
				path: "Employeefilter",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.pernr
			});
			la_filters.push(lo_pernrFilter);
			la_filters.push(lo_roleFilter);
			la_filters.push(lo_PickedDateFilter);
			la_filters.push(lo_employeeFilter);
			if (orgunit && orgunit.length > 0) {
				la_filters.push(this.createFilterOrMultipleValues("Orgunit", orgunit, false));
			}
			if (costcenter && costcenter.length > 0) {
				la_filters.push(this.createFilterOrMultipleValues("Costcenter", costcenter, false));
			}
			if (empgroup && empgroup.length > 0) {
				la_filters.push(this.createFilterOrMultipleValues("Empgroup", empgroup, false));
			}
			if (shiftgroup && shiftgroup.length > 0) {
				la_filters.push(this.createFilterOrMultipleValues("Shiftgroup", shiftgroup, false));
			}
			if (statusFltVis && status && status.length > 0) {
				la_filters.push(this.createFilterOrMultipleValues("Status", status, false));
			}
			return la_filters;
		},
		initCalendarLegend: function () {
			let oLeg1 = this.getView().byId("legend1");
			let leave = this.getText("empview_legend_leave");
			let halfleave = this.getText("empview_legend_halfleave");
			let publicholiday = this.getText("empview_legend_publicholiday");
			let preotrequested = this.getText("empview_legend_preotrequested");
			let potviolation = this.getText("empview_legend_potviolation");
			let change = this.getText("empview_legend_change");

			oLeg1.setStandardItems(oLeg1.getStandardItems().splice(0, 2));

			//if (Features.hasReadRight(Features.CONST_FEATURE_SHOWVIOLATION)) {
			oLeg1.addItem(new sap.ui.unified.CalendarLegendItem({
				id: "PotentialViolation",
				text: potviolation,
				type: sap.ui.unified.CalendarDayType.Type08
			}));
			//}
			oLeg1.addItem(new sap.ui.unified.CalendarLegendItem({
				id: "Change",
				text: change,
				color: "#1A9898"
			}));
			if (Features.hasReadRight(Features.CONST_FEATURE_REQUESTPRE_OT)) {
				oLeg1.addItem(new sap.ui.unified.CalendarLegendItem({
					id: "PreOTRequested",
					text: preotrequested,
					type: sap.ui.unified.CalendarDayType.Type04
				}));
			}
			oLeg1.addItem(new sap.ui.unified.CalendarLegendItem({
				id: "RestDay",
				text: this.getText("off_rest_day"),
				color: "#ABE2AB",
			}));
			oLeg1.addItem(new sap.ui.unified.CalendarLegendItem({
				id: "PublicHoliday",
				text: publicholiday,
				color: "#FF8888",
			}));
			oLeg1.addItem(new sap.ui.unified.CalendarLegendItem({
				id: "HalfLeave",
				text: halfleave,
				color: "#AB218E"
			}));
			oLeg1.addItem(new sap.ui.unified.CalendarLegendItem({
				id: "Leave",
				text: leave,
				color: "#E78C07"
			}));
			oLeg1.addItem(new sap.ui.unified.CalendarLegendItem({
				id: "PendingLeave",
				text: this.getText("pending_leave_request"),
				color: "#9EC7D8"
			}));
			this.itemOTLegend = new sap.ui.unified.CalendarLegendItem({
				id: "OTLegend",
				type: sap.ui.unified.CalendarDayType.Type11
			});
			oLeg1.addItem(this.itemOTLegend);
		},

		handleStartDateChange: function (oEvt) {
			debugger;
			this._calendar.setBusy(true);
			this.loadMyCalendarData(this.pernr);
		},
		_configChangeItem: function (item) {
			item.OriginalShift = item.Shift;
			item.OriginalOtHours = this.formatZeroEmpty(item.OtHours, item.OthoursFilled);

			item.hasChanged = function () {
				return this.OriginalOtHours !== this.OtHours ||
					this.OriginalShift !== this.Shift;
			}
			item.hasShiftChanged = function () {
				return this.OriginalShift !== this.Shift;
			}
			item.hasOtHoursChanged = function () {
				return this.OriginalOtHours !== this.OtHours;
			}
			return item;
		},
		onAfterRendering: function () {

			//employeeView
			setTimeout(() => {
				if (!this.OTLegendRendered) {
					this.OTLegendRendered = true;
					$("#OTLegend").contents().remove(".sapUiUnifiedLegendSquare");
					if ($("#OTLegend-Text")) {
						jQuery.sap.delayedCall(200, null, () => {
							this.contHbox.placeAt("OTLegend-Text");
						});
					}
				}
			}, 1000);
			this.contResize = 0;
			$(window).resize(() => {
				this.putOTLegend();
			});

		},
		putOTLegend: function () {
			let divOTLegend = $("#OTLegend").contents()[0];
			if (divOTLegend) {
				let countChilds = divOTLegend.childNodes.length;
				for (var i = 0; i < countChilds; i++) {
					divOTLegend.removeChild(divOTLegend.childNodes[i]);
				}
				$("#OTLegend").contents().remove(".tagClassOTLegend");
				$("#OTLegend").contents().remove(".sapUiUnifiedLegendSquare");
				if ($("#OTLegend-Text")) {
					this.contHbox.placeAt("OTLegend-Text");
				}
			}
		},
		onNavBackMain: function () {
			this.OTLegendRendered = false;
			this.onNavBack();
		},
		onExportotApproval: function (format) {
			let filterData = this[this.fltEmployeeStr].getData();
			this.exportGeneric(format, "OTAPPROVAL", filterData);
		},
		onExportXLSotApproval: function () {
			this.onExportotApproval("XLS");
		},
		onExportPDFotApproval: function () {
			this.onExportotApproval("PDF");
		},
		exportGeneric: function (format, processType, filterData) {
			var la_filters = this.handleOrgFilters(filterData);
			var lo_procTypeFilter = new sap.ui.model.Filter({
				path: "Processtype",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: processType
			});
			var lo_fileTypeFilter = new sap.ui.model.Filter({
				path: "Filetype",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: format
			});
			la_filters.push(lo_fileTypeFilter);
			la_filters.push(lo_procTypeFilter);
			this.setBusy(true);

			this.getView().getModel().read("/FileExportSet", {
				filters: la_filters,
				success: (oData, oResponse) => {
					this.fileDownload(oData);
					this.showToast(this.getText("msg_successfully_exported"), false);
					setTimeout(() => this.setBusy(false), 1000);
				},
				error: (oError) => {
					this.reportErrorMsg(oError, "msg_error_export_service");
				}
			});
		},
		handleCancel: function (oEvt) {

		},
		loadMyCalendarData: function (pernr) {
			//this._calendar._getFocusedDate()._oUDate.oDate = this._calendar.getStartDate();
			this._calendar._getFocusedDate()._oUDate.oDate = new Date(this._calendar.getStartDate().getFullYear(), this._calendar.getStartDate()
				.getMonth() + 1, 0);
			//Fill ranges/intervals based on role and employee
			this.initDropDownModel();
			this.loadDropDownModel(pernr, Constants.EMPLOYEE);

			let readurl = "/EmployeeCalendarSet";
			let la_filters = []; // Don't normally do this but just for the example.
			let ld_begdate = this._calendar.getStartDate();
			let adjMonth = (ld_begdate.getMonth() + 1) % 2;
			let startDateUTC = new Date(Date.UTC(ld_begdate.getFullYear(), ld_begdate.getMonth(), ld_begdate.getDate()));

			startDateUTC = new Date(startDateUTC.getFullYear(), startDateUTC.getMonth(), 1);

			let ld_enddate = new Date(startDateUTC.getFullYear(), startDateUTC.getMonth() + 2, 0);
			let endDateUTC = new Date(Date.UTC(ld_enddate.getFullYear(), ld_enddate.getMonth(), ld_enddate.getDate()));

			let lo_PickedDateFilter = new sap.ui.model.Filter({
				path: "Date",
				operator: sap.ui.model.FilterOperator.BT,
				value1: startDateUTC,
				value2: endDateUTC
			});
			let lo_pernrFilter = new sap.ui.model.Filter({
				path: "Pernr",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: pernr //'30000282'
			});
			la_filters.push(lo_pernrFilter);
			la_filters.push(lo_PickedDateFilter);

			let violationsEnabled = Features.hasReadRight(Features.CONST_FEATURE_SHOWVIOLATION);
			this._calendar.setBusy(true);
			//this._calendar.removeAllSpecialDates();
			this.getModel().read(readurl, {
				urlParameters: "$expand=ShiftsAllowedSet",
				filters: la_filters,
				success: (oData, oResponse) => {
					console.debug(oResponse.data.results);
					for (var i = 0; i < oResponse.data.results.length; i++) {

						this._configChangeItem(oResponse.data.results[i]);

						let row = oResponse.data.results[i];
						this._calendar.removeSpecialDate(row.Date);

						if (row.PlannedLeave) {
							this._calendar.addSpecialDate(new DateTypeRange({
								startDate: new Date(row.Date),
								type: sap.ui.unified.CalendarDayType.Type17,
								tooltip: this.getText("pending_leave_request")
							}));
							continue;
						}
						if (row.HalfLeave) {
							this._calendar.addSpecialDate(new DateTypeRange({
								startDate: new Date(row.Date),
								type: sap.ui.unified.CalendarDayType.Type14,
								tooltip: "Half leave"
							}));
							continue;
						}
						if (row.BookedLeave) {
							this._calendar.addSpecialDate(new DateTypeRange({
								startDate: new Date(row.Date),
								type: sap.ui.unified.CalendarDayType.Type15,
								tooltip: "Leave"
							}));
							continue;
						}
						//if (row.PotentialViolation && violationsEnabled) {
						if (row.PotentialViolation) {
							this._calendar.addSpecialDate(new DateTypeRange({
								startDate: new Date(row.Date),
								type: sap.ui.unified.CalendarDayType.Type08,
								tooltip: row.Tooltip && row.Tooltip.length > 0 ? row.Tooltip : this.getText("empview_legend_potviolation")
							}));
							continue;
						}

						if (row.ChangeShift) {
							this._calendar.addSpecialDate(new DateTypeRange({
								startDate: new Date(row.Date),
								type: sap.ui.unified.CalendarDayType.Type18,
								tooltip: "Change Shift"
							}));
							continue;
						}
						if (row.PreOtReq && Features.hasReadRight(Features.CONST_FEATURE_REQUESTPRE_OT)) {
							this._calendar.addSpecialDate(new DateTypeRange({
								startDate: new Date(row.Date),
								type: sap.ui.unified.CalendarDayType.Type04,
								tooltip: "Pre-OT requested"
							}));
							continue;
						}
						if (row.PublicHoliday) {
							this._calendar.addSpecialDate(new DateTypeRange({
								startDate: new Date(row.Date),
								type: sap.ui.unified.CalendarDayType.Type19,
								tooltip: "Public Holiday"
							}));
							continue;
						}
						if (row.RestDay) {
							this._calendar.addSpecialDate(new DateTypeRange({
								startDate: new Date(row.Date),
								type: sap.ui.unified.CalendarDayType.Type20,
								tooltip: this.getText("off_rest_day")
							}));
							continue;
						}
					}
					this._calendar.setItems(oResponse.data.results);
					this._calendar.getVisible() ? null : this._calendar.setVisible(true);
					this._calendar.setBusy(false);

				},
				error: (err) => {
					this.reportErrorMsg(err);
					this._calendar.setBusy(false);
				}
			});

		}
	});
});