sap.ui.define([
	"com/infineon/ztmsapp/controller/BaseController",
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageToast',
	'sap/m/MessageBox',
	"com/infineon/ztmsapp/js/localization",
	'sap/ui/unified/calendar/CalendarDate',
	"com/infineon/ztmsapp/util/formatter",
	"com/infineon/ztmsapp/util/ServiceHelper",
	"com/infineon/ztmsapp/js/features",
	"sap/ui/core/Fragment",
	"com/infineon/ztmsapp/model/TimeCorrectionItemModel",
	"com/infineon/ztmsapp/model/OTApprovalItemModel",
	"com/infineon/ztmsapp/js/Constants",
], function (Controller, History, JSONModel, MessageToast, MessageBox, Localization, CalendarDate, formatter, ServiceHelper, features,
	Fragment, TimeCorrectionItemModel, OTApprovalItemModel, Constants) {
	"use strict";

	return Controller.extend("com.infineon.ztmsapp.controller.ManagerView", {
		pernr: '',
		role: '',
		baseUrl: "/EmployeeDataSet(Employee='00000000',Role='MANAGER')",
		fltTeamAttendanceStr: "filterTeamAttendance",
		fltTimeCorrectionStr: "filterTimeCorrection",
		fltOTApprovalStr: "filterOTApproval",
		fltPreOTShiftApprovalStr: "filterPreOTShiftApproval",

		iconTabBarTeamAttendance: "iconTabBarTeamAttendance",
		iconTabBarAttendance: "iconTabBarAttendanceApp",
		Constants: Constants,
		timeCorrectionProcessType: "TIMECORREC",
		otApprovalProcessType: "OTAPPROVAL",
		preOTShiftApprovalProcessType: "PREOTSHIFTAPPROVAL",
		teamAttendanceProcessType: "TEAMATTEND",
		formatter: formatter,
		serviceHelper: ServiceHelper,
		_idTimeCorrectionTable: null,
		_idOTApprovalTable: null,
		_idPreOTShiftApprovalTable: null,
		_idCovOffTable: null,
		_tabPublicHolidays: null,
		_mciEmployee: null,
		_mipEmployeeTeamAttendance: null,
		_mipEmployeeTimeCorrection: null,
		_mipEmployeeOTApproval: null,
		_mipEmployeePreOTShiftApproval: null,
		_features: features,
		_idTeamAttendance: null,
		_iptCovOfficerSearch: null,
		_isCovOfficerRefreshEnable: true,
		_oTeamShiftView: null,
		_hasChangeTimeCorrection: false,
		_hasChangeOTApproval: false,
		_hasChangeCoveringOfficer: false,
		_hasChangeTeamShift: false,
		_publicHolidayView: null,
		_TimeCorrectionItemModel: TimeCorrectionItemModel,
		_OTApprovalItemModel: OTApprovalItemModel,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.infineon.ztmsapp.view.ManagerView
		 */
		onInit: function () {
			this.getOwnerComponent().getRouter().getRoute("ManagerView").attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (oEvt) {
			this.initDropDownModel();
			let oParams = oEvt.getParameter("arguments");
			this.routeMatchedMain(oParams);
			this.setNotificationVisible(false);
		},
		routeMatchedMain: function (oParams) {

			window.onbeforeunload = () => {
				if (this._checkChangesInAllModels()) {
					return this._getMessageLostChange();
				} else {
					return;
				}
			};

			this._oTeamShiftView = this.getView().byId("teamShiftView");
			this._publicHolidayView = this.getView().byId("publicHolidayView");
			this._oTeamShiftView.oController._initFilter();

			this.currentEmployeeCovOfficer = null;
			this._initPopupComment();
			this._initPopupCommentOT();
			this._isCovOfficerRefreshEnable = true;
			let currentRoleData = this.getOwnerComponent().getModel("currentRole") && this.getOwnerComponent().getModel("currentRole").getData ?
				this.getOwnerComponent().getModel("currentRole").getData() :
				null;
			if (!currentRoleData || !currentRoleData.currentRole) {
				this.onNavBack();
				return;
			}
			this._currentRole = currentRoleData.currentRole;
			this.baseUrl = `/EmployeeDataSet(Employee='00000000',Role='${this._currentRole}')`;
			this._idTimeCorrectionTable = this.getView().byId("idTimeCorrection");
			this._idTeamAttendance = this.getView().byId("idTeamAttendance");
			this._idOTApprovalTable = this.getView().byId("idOTApproval");
			this._idPreOTShiftApprovalTable = this.getView().byId("idPreOTShiftApproval");
			this._idCovOffTable = Fragment.byId(this.getView().createId("coveringOfficerList"), "idCovOffTable");

			this._mciEmployee = this.getView().byId("mciEmployee");
			this.tabPublicHolidays = this.getView().byId("tabPublicHolidays");

			this._mipEmployeeTeamAttendance = Fragment.byId(this.getView().createId("orgFilterTeamAttendance"), "mipEmployee");
			this._mipEmployeeTimeCorrection = Fragment.byId(this.getView().createId("orgFilterTimeCorrection"), "mipEmployee");
			this._mipEmployeeOTApproval = Fragment.byId(this.getView().createId("orgFilterOTApproval"), "mipEmployee");
			this._mipEmployeePreOTShiftApproval = Fragment.byId(this.getView().createId(
				"orgFilterPreOTShiftApproval"), "mipEmployee");

			this._iptCovOfficerSearch = Fragment.byId(this.getView().createId("coveringOfficerList"), "iptCovOfficerSearch");

			this.initValueHelpEmployee();
			this.oModel = this.getView().getModel() || this.getOwnerComponent().getModel();
			this.initGenericOrgFilter(this.fltTeamAttendanceStr, this.iconTabBarTeamAttendance);
			this.initGenericOrgFilter(this.fltTimeCorrectionStr, this.iconTabBarAttendance);
			this.initGenericOrgFilter(this.fltOTApprovalStr, this.iconTabBarAttendance);
			this.initGenericOrgFilter(this.fltPreOTShiftApprovalStr, this.iconTabBarAttendance);

			this.oModelCoveringOfficer = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZHR_TMS_CORE_SRV/");
			this._setCoveringOfficerModel();

			this.oModel.read(this.baseUrl, {
				urlParameters: "$expand=FeatureConfigSet,CoveringOfficerSet",
				success: (oData, oResponse) => {
					let objPage = this.getView().byId("ObjectPageLayout");
					objPage.bindElement(`/EmployeeDataSet(Employee='00000000',Role='EMPLOYEE')`);
					let cfgFeatures = new JSONModel(oData.FeatureConfigSet);
					let employeeData = new JSONModel(oData);

					this.getView().setModel(cfgFeatures, "features");

					//this.getView().setModel(employeeData, "employeeData");
					this.pernr = oData.Employee;
					this.role = oData.Role;
					this.baseUrl =
						`/EmployeeDataSet(Employee='${this.pernr}',Role='${this._currentRole}')`;

					this.getView().setModel(new JSONModel({
						pernr: this.pernr
					}), "currentCoveringOfficer");
					this._iptCovOfficerSearch.setDescription(oData.Fullname);
					//Fill ranges/intervals based on role and employee
					this.loadDropDownModel(this.pernr, this._currentRole);
					if (!this.oReadOnlyCovOffTemplate) {
						this.oReadOnlyCovOffTemplate = this._idCovOffTable.getBindingInfo("items").template;
					}
					this.coveringOfficerDisplayMode(this.baseUrl);
					this._features.setView(this.getView());
					let oFeatureModel = new JSONModel({
						_read: this._features.hasReadRight(this._features.CONST_FEATURE_PUBLIC_HOLIDAY),
						_create: this._features.hasCreateRight(this._features.CONST_FEATURE_PUBLIC_HOLIDAY),
						_update: this._features.hasUpdateRight(this._features.CONST_FEATURE_PUBLIC_HOLIDAY),
						_delete: this._features.hasDeleteRight(this._features.CONST_FEATURE_PUBLIC_HOLIDAY)
					});
					this.setBusy(false);
					this.getView().setModel(oFeatureModel, "publicHolidayFeatures");
					this.initCovOfficerEditTemplate();

					this.getView().byId("preOTShiftApproval").setVisible(this.formatter.canAccessPreOTApproval(this.role));

					switch (oParams.tab) {
					case "TimeCorrection":
						this.searchTimeCorrection(this.fltTimeCorrectionStr);
						objPage.setSelectedSection(this.getView().byId("attendanceApprovalSection").sId);
						this.getView().byId("iconTabBarAttendanceApp").setSelectedKey("filterTimeCorrectionKey");
						break;
					case "OTApproval":
						this.searchOTApproval(this.fltOTApprovalStr);
						objPage.setSelectedSection(this.getView().byId("attendanceApprovalSection").sId);
						this.getView().byId("iconTabBarAttendanceApp").setSelectedKey("filterOTApprovalKey");
						break;
					case "PreOTShiftApproval":
						this.searchPreOTShiftApproval(this.fltPreOTShiftApprovalStr);
						objPage.setSelectedSection(this.getView().byId("attendanceApprovalSection").sId);
						this.getView().byId("iconTabBarAttendanceApp").setSelectedKey("filterPreOTShiftApprovalKey");
						break;
					}

				},
				error: (err) => {
					this.setBusy(false);
					this.reportErrorMsg(err, "msg_error_load_employee_data");
				}
			});
			this.initVariables();

		},
		initCovOfficerEditTemplate: function () {
			if (!this.oEditableCovOffTemplate) {
				this.oEditableCovOffTemplate = new sap.m.ColumnListItem({
					cells: [
						new sap.m.DatePicker({
							id: "fromdate",
							minDate: "{= ${currentDate>/currentDate} > ${coveringOfficer>Endda} ? ${coveringOfficer>Endda} : ${currentDate>/currentDate} }",
							maxDate: "{coveringOfficer>Endda}",
							value: "{ path: 'coveringOfficer>Begda', type: 'sap.ui.model.type.DateTime', formatOptions: { pattern: 'dd.MM.yyyy' } }",
							placeholder: "{i18n>enter_date}",
							change: this.checkChangeCoveringOfficer.bind(this),
							enabled: {
								path: 'coveringOfficer>OldBegda',
								formatter: formatter.isFutureDate
							}
						}),
						new sap.m.DatePicker({
							id: "todate",
							minDate: "{= ${currentDate>/currentDate} > ${coveringOfficer>Begda} ? ${currentDate>/currentDate} : ${coveringOfficer>Begda} }",
							value: "{ path: 'coveringOfficer>Endda', type: 'sap.ui.model.type.DateTime', formatOptions: { pattern: 'dd.MM.yyyy' } }",
							placeholder: "{i18n>enter_date}",
							change: this.checkChangeCoveringOfficer.bind(this),
							enabled: {
								path: 'coveringOfficer>OldEndda',
								formatter: formatter.isFutureDate
							}
						}), new sap.m.Input({
							value: "{coveringOfficer>CovrngOfc}",
							type: "Text",
							placeholder: "",
							showSuggestion: true,
							showValueHelp: true,
							description: "{coveringOfficer>CovrngOfcName}",
							liveChange: this.checkChangeCoveringOfficer.bind(this),
							change: this.checkChangeCoveringOfficer.bind(this),
							valueHelpRequest: (oEvent) => {
								this.onValueEmployeeSearchHelp(oEvent, false);
							},
							enabled: {
								path: 'coveringOfficer>OldEndda',
								formatter: formatter.isFutureDate
							},
							suggestionItems: {
								path: '/EmployeeDataSet',
								parameters: {
									select: 'Employee,Fullname',
									operationMode: 'Client'
								},
								sorter: {
									path: 'Employee'
								},

								templateShareable: false,
								template: new sap.ui.core.ListItem({
									text: "{Employee}",
									additionalText: "{Fullname} ({Employee})"
								})
							}
						}), new sap.m.Input({
							value: "{coveringOfficer>Reason}",
							liveChange: this.checkChangeCoveringOfficer.bind(this),
							enabled: {
								path: 'coveringOfficer>OldEndda',
								formatter: formatter.isFutureDate
							},
						}),

						new sap.m.Button({
							enabled: {
								path: 'coveringOfficer>OldEndda',
								formatter: formatter.isFutureDate
							},
							icon: "sap-icon://delete",
							press: (oEvent) => {
								var curEvent = oEvent;
								var table = curEvent.getSource().getParent().getTable();
								var sPath = curEvent.getSource().getBindingContext("coveringOfficer").sPath;

								MessageBox.confirm(
									this.getText("mgrview_delete"), {
										onClose: (sAction) => {
											if ("OK" === sAction) {
												this.setBusy(true);
												this.oModelCoveringOfficer.remove(sPath, {
													success: () => {
														this.successMessage("mgrview_delete_ok");
													},
													error: (err) => {
														this.reportErrorMsg(err, "msg_error_removing_cov_officer");
													}
												});
											}
										}
									}
								);
							}
						}),
						new sap.ui.core.Icon({
							visible: "{= ${coveringOfficer>StatusCode} !== '' }",
							color: "{= ${coveringOfficer>StatusCode} === 'S' ? '#2B7D2B' : '#BB0000' }",
							tooltip: "{= ${coveringOfficer>StatusText}}",
							src: "{= ${coveringOfficer>StatusCode} === 'S' ? 'sap-icon://complete' : 'sap-icon://status-error' }"
						})
					]
				});
			}
		},
		initVariables: function () {
			this.getView().setModel(new JSONModel({
				currentDate: new Date()
			}), "currentDate");
		},
		selectionEnablement: function (oEvt, sEntity) {
			let tbl = oEvt.getSource();
			let header = tbl.$().find('thead');
			let selectAllCb = header.find('.sapMCb');
			//selectAllCb.remove();

			tbl.getItems().forEach(function (r) {
				let cb = r.$().find('.sapMCb');
				let oCb = sap.ui.getCore().byId(cb.attr('id'));
				r.setTooltip(r.getBindingContext(sEntity).getProperty(r.getBindingContext(sEntity).sPath).Tooltip);
				oCb.setEnabled(r.getBindingContext(sEntity).getProperty(r.getBindingContext(sEntity).sPath).Enabled);
			});
		},
		onSelect: function (oEvt, sEntity) {
			for (let item of oEvt.getSource().getItems()) {
				let isEnabled = item.getBindingContext(sEntity).getProperty(item.getBindingContext(sEntity).sPath).Enabled;
				if (!isEnabled) {
					item.setSelected(isEnabled);
				}
			}
		},
		checkChangeCoveringOfficer: function (oEvt) {

			let oData = oEvt.getSource().getBindingContext("coveringOfficer").getProperty(oEvt.getSource().getBindingContext(
					"coveringOfficer")
				.sPath);
			let sAttribute = oEvt.getSource().getBindingInfo("value").binding.sPath;
			let hasChanged = false;
			switch (sAttribute) {
			case "Reason":
				hasChanged = oEvt.getSource().getValue() !== oData[`Old${sAttribute}`];
				break;
			case "CovrngOfc":
				let iptCov = oEvt.getSource();
				hasChanged = iptCov.getValue() !== oData[`Old${sAttribute}`];
				if (iptCov.getValue().length === 8) {

					let aFilters = [];
					aFilters.push(new sap.ui.model.Filter({
						path: "SearchStr",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: iptCov.getValue()
					}));

					iptCov.setBusy(true);
					this.getView().getModel().read("/EmployeeDataSet", {
						filters: aFilters,
						urlParameters: {
							"$select": "Employee,Fullname"
						},
						success: (oData, oResponse) => {
							iptCov.setBusy(false);
							if (oData.results.length > 0) {
								iptCov.setDescription(oData.results[0].Fullname);
							} else {
								iptCov.setDescription("");
							}
						},
						error: (err) => {
							iptCov.setBusy(false);
						}
					});
				}
				break;
			case "Begda":
				oData[sAttribute] = new Date(Date.UTC(oData[sAttribute].getFullYear(), oData[sAttribute].getMonth(), oData[sAttribute].getDate()));
				this.zeroTimezone(oData[sAttribute]);
				hasChanged = oData[sAttribute].toString() !== oData[`Old${sAttribute}`].toString();
				break;
			case "Endda":
				oData[sAttribute] = new Date(Date.UTC(oData[sAttribute].getFullYear(), oData[sAttribute].getMonth(), oData[sAttribute].getDate()));
				this.zeroTimezone(oData[sAttribute]);
				hasChanged = oData[sAttribute].toString() !== oData[`Old${sAttribute}`].toString();
				break;
			default:
			}

			oData[`isChanged${sAttribute}`] = hasChanged;

			oEvt.getSource().setValueState(hasChanged ? sap.ui.core.ValueState.Warning : sap.ui.core.ValueState.None);
			oEvt.getSource().setValueStateText(hasChanged ? this.getText("modified") : "");
		},
		initGenericOrgFilter: function (modelName, iconTabParent, bNoExpand) {

			let bExpand = true; // bNoExpand ? false : true;

			var today = new Date();

			let fromDate = null;
			let toDate = null;
			let minDate = null;

			if (modelName === "filterTeamAttendance") {
				fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
				toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
			} else {
				fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
				minDate = fromDate;
				toDate = new Date();
			}
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
				display: true,
			}
			if (modelName !== "filterTeamAttendance" && modelName !== "filterOTApproval" && modelName !== "filterPreOTShiftApproval") {
				oData.status.push("PENDING");
			} else if (modelName === "filterOTApproval" || modelName === "filterPreOTShiftApproval") {
				oData.status.push("ACKNLDGE");
			}
			var filterOrg = new JSONModel(oData);

			let iconTabFilter = this.getView().byId(iconTabParent);
			for (let tab of iconTabFilter.getItems()) {
				if (tab.getKey() === modelName + "Key") {
					tab.setModel(filterOrg, "orgFilter");
				}
			}
			this[modelName] = filterOrg;
		},

		_checkChangesInAllModels: function () {
			this._hasChangeTimeCorrection = false;
			this._hasChangeOTApproval = false;
			this._hasChangePreOTShiftApproval = false;
			this._hasChangeCoveringOfficer = false;
			this._hasChangeTeamShift = false;
			this._hasChangePublicHoliday = false;

			if (this.getView().getModel("timeCorrection") && this.getView().getModel("timeCorrection").getData()) {
				this._hasChangeTimeCorrection = this.getView().getModel("timeCorrection") ? this.getView().getModel("timeCorrection").getData().results
					.find((item) => {
						return item.hasChanged() === true;
					}) !== undefined : false;
			}

			if (this._publicHolidayView.getModel("publicHoliday") && this._publicHolidayView.getModel("publicHoliday").getData()) {
				this._hasChangePublicHoliday = this._publicHolidayView.getModel("publicHoliday") ? this._publicHolidayView.getModel("publicHoliday").getData().results
					.find((item) => {
						return item.hasChanged() === true;
					}) !== undefined : false;
			}

			if (this.getView().getModel("otApproval") && this.getView().getModel("otApproval").getData()) {
				this._hasChangeOTApproval = this.getView().getModel("otApproval") ? this.getView().getModel("otApproval").getData().results.find(
					(
						item) => {
						return item.hasChanged() === true;
					}) !== undefined : false;
			}

			if (this.getView().getModel("preOTShiftApproval") && this.getView().getModel("preOTShiftApproval").getData()) {
				this._hasChangePreOTShiftApproval = this.getView().getModel("preOTShiftApproval") ? this.getView().getModel("preOTShiftApproval").getData()
					.results.find(
						(
							item) => {
							return item.hasChanged() === true;
						}) !== undefined : false;
			}

			if (this.oModelCoveringOfficer) {
				this._hasChangeCoveringOfficer = this.oModelCoveringOfficer.hasPendingChanges();
			}

			if (this._oTeamShiftView.getModel("teamShift") && this._oTeamShiftView.getModel("teamShift").getData() && this._oTeamShiftView.getModel(
					"teamShift").getData().length) {
				for (let itemRow of this._oTeamShiftView.getModel("teamShift").getData()) {
					Object.values(itemRow).forEach(item => {
						if (item.checkIsChanged && item.checkIsChanged()) {
							return this._hasChangeTeamShift = true;
						}
					});
				}
			}

			return this._hasChangeTimeCorrection || this._hasChangeOTApproval || this._hasChangeCoveringOfficer || this._hasChangeTeamShift ||
				this._hasChangePreOTShiftApproval || this._hasChangePublicHoliday;

		},
		search: function (sEntity, oEvt) {
			let hasChanged = false;

			if (!this.validateDates(oEvt)) {
				return;
			}
			if (sEntity === this.fltTeamAttendanceStr) {
				this.searchTeamAttendace(sEntity);
			}
			if (sEntity === this.fltTimeCorrectionStr) {
				hasChanged = this.getView().getModel("timeCorrection") ? this.getView().getModel("timeCorrection").getData().results.find((item) => {
					return item.hasChanged() === true;
				}) !== undefined : false;

				if (hasChanged) {
					MessageBox.confirm(
						this.getText("msg_lost_changes"), {
							onClose: (sAction) => {
								if ("OK" === sAction) {
									this.searchTimeCorrection(sEntity);
								}
							}
						}
					);
				} else {
					this.searchTimeCorrection(sEntity);
				}
				return;
			}
			if (sEntity === this.fltOTApprovalStr) {
				hasChanged = this.getView().getModel("otApproval") ? this.getView().getModel("otApproval").getData().results.find((item) => {
					return item.hasChanged() === true;
				}) !== undefined : false;

				if (hasChanged) {
					MessageBox.confirm(
						this.getText("msg_lost_changes"), {
							onClose: (sAction) => {
								if ("OK" === sAction) {
									this.searchOTApproval(sEntity);
								}
							}
						}
					);
				} else {
					this.searchOTApproval(sEntity);
				}
				return;
			}
			if (sEntity === this.fltPreOTShiftApprovalStr) {
				hasChanged = this.getView().getModel("preOTShiftApproval") ? this.getView().getModel("preOTShiftApproval").getData().results.find(
					(item) => {
						return item.hasChanged() === true;
					}) !== undefined : false;

				if (hasChanged) {
					MessageBox.confirm(
						this.getText("msg_lost_changes"), {
							onClose: (sAction) => {
								if ("OK" === sAction) {
									this.searchPreOTShiftApproval(sEntity);
								}
							}
						}
					);
				} else {
					this.searchPreOTShiftApproval(sEntity);
				}
				return;
			}
		},
		reset: function (oEvt, bNoExpand, objEvt) {

			if (oEvt === this.fltTeamAttendanceStr) {
				this.initGenericOrgFilter(this.fltTeamAttendanceStr, this.iconTabBarTeamAttendance, bNoExpand);
				this._idTeamAttendance.setVisible(false);
				this._mipEmployeeTeamAttendance.removeAllTokens();
				return;
			}
			if (oEvt === this.fltTimeCorrectionStr) {
				this.initGenericOrgFilter(this.fltTimeCorrectionStr, this.iconTabBarAttendance, bNoExpand);
				this._mipEmployeeTimeCorrection.removeAllTokens();
				this._idTimeCorrectionTable.setVisible(false);
				return;
			}
			if (oEvt === this.fltOTApprovalStr) {
				this.initGenericOrgFilter(this.fltOTApprovalStr, this.iconTabBarAttendance, bNoExpand);
				this._mipEmployeeOTApproval.removeAllTokens();
				this._idOTApprovalTable.setVisible(false);
				return;
			}
			if (oEvt === this.fltPreOTShiftApprovalStr) {
				this.initGenericOrgFilter(this.fltPreOTShiftApprovalStr, this.iconTabBarAttendance, bNoExpand);
				this._mipEmployeePreOTShiftApproval.removeAllTokens();
				this._idPreOTShiftApprovalTable.setVisible(false);
				return;
			}
		},
		onOpenEmployeeRange: function (sModel, oEvt) {
			let mipEMployee = null;
			switch (sModel) {
			case this.fltTeamAttendanceStr:
				mipEMployee = this._mipEmployeeTeamAttendance;
				break;
			case this.fltTimeCorrectionStr:
				mipEMployee = this._mipEmployeeTimeCorrection;
				break;
			case this.fltOTApprovalStr:
				mipEMployee = this._mipEmployeeOTApproval;
				break;
			}
			this.getUploadEmployeesPopup(this.getView(), oEvt.getSource(), mipEMployee);
		},
		handleOrgFilters: function (filterData) {
			var la_filters = []; // Don't normally do this but just for the example.
			var ld_begdate = filterData.fromdate;
			var startDateUTC = new Date(Date.UTC(ld_begdate.getFullYear(), ld_begdate.getMonth(), ld_begdate.getDate()));
			var ld_enddate = filterData.todate;
			var endDateUTC = new Date(Date.UTC(ld_enddate.getFullYear(), ld_enddate.getMonth(), ld_enddate.getDate()));
			var costcenter = filterData.costcenter;
			var orgunit = filterData.orgunit;
			var empgroup = filterData.empgroup;
			var shiftgroup = filterData.shiftgroup;
			var employeeid = filterData.employeeid;
			var status = filterData.status;
			var statusFltVis = filterData.statusFltVisible;
			var lo_PickedDateFilter = new sap.ui.model.Filter({
				path: "Day",
				operator: sap.ui.model.FilterOperator.BT,
				value1: startDateUTC,
				value2: endDateUTC
			});
			var lo_pernrFilter = new sap.ui.model.Filter({
				path: "Employee",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.pernr
			});
			var l_role = this.role;
			var lo_roleFilter = new sap.ui.model.Filter({
				path: "Role",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: l_role
			});
			la_filters.push(lo_pernrFilter);
			la_filters.push(lo_roleFilter);
			la_filters.push(lo_PickedDateFilter);
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

			let mipEMployee = null;
			switch (filterData.param) {
			case this.fltTeamAttendanceStr:
				mipEMployee = this._mipEmployeeTeamAttendance;
				break;
			case this.fltTimeCorrectionStr:
				mipEMployee = this._mipEmployeeTimeCorrection;
				break;
			case this.fltOTApprovalStr:
				mipEMployee = this._mipEmployeeOTApproval;
				break;
			case this.fltPreOTShiftApprovalStr:
				mipEMployee = this._mipEmployeePreOTShiftApproval;
				break;
			}

			let selectedKeys = mipEMployee.getTokens().map((item) => {
				return item.mProperties.key
			});
			let filtersEmployees = null;
			if (selectedKeys && selectedKeys.length > 0) {
				la_filters.push(this.createFilterOrMultipleValues("Employeefilter", selectedKeys, false));
			}

			return la_filters;
		},
		onExportTimeCorrection: function (format) {
			var filterData = this[this.fltTimeCorrectionStr].getData();
			this.exportGeneric(format, this.timeCorrectionProcessType, filterData);
		},
		onExportotApproval: function (format) {
			var filterData = this[this.fltOTApprovalStr].getData();
			this.exportGeneric(format, this.otApprovalProcessType, filterData);
		},
		onExportXLSTeamAttendance: function () {
			this.onExportTeamAttendance("XLS");
		},
		onExportPDFTeamAttendance: function () {
			this.onExportTeamAttendance("PDF");
		},
		onExportTeamAttendance: function (format) {
			var filterData = this[this.fltTeamAttendanceStr].getData();
			this.exportGeneric(format, this.teamAttendanceProcessType, filterData);
		},
		onExportXLSTimeCorrection: function () {
			this.onExportTimeCorrection("XLS");
		},
		onExportXLSotApproval: function () {
			this.onExportotApproval("XLS");
		},
		onExportPDFotApproval: function () {
			this.onExportotApproval("PDF");
		},
		onExportPDFTimeCorrection: function () {
			this.onExportTimeCorrection("PDF");
		},
		validateDates: function (oEvt) {
			let oData = oEvt.getSource().getModel("orgFilter").getData();

			if (this._mipEmployeeTeamAttendance.isActive()) { // && this.role === "MANAGER") {
				let diff = (oData.todate - oData.fromdate) / (1000 * 60 * 60 * 24);
				if (diff > 0 && diff > 30) {
					oData.todate = new Date(oData.fromdate.getFullYear(), oData.fromdate.getMonth(), oData.fromdate.getDate() + 30);
					this.showToast("msg_diff_not_bigger_30days", false);
				}
			}

			return this.validateDateInterval(oData.fromdate, oData.todate);
		},
		reprocess: function (oEvt, sEntity) {
			switch (sEntity) {
			case "timeCorrection":
				this._saveTimeConfirmation(oEvt.getSource().getBindingContext(sEntity).getProperty(oEvt.getSource().getBindingContext(sEntity).sPath),
					true);
				break;
			case "otApproval":
				this._OTApprovalSave(oEvt.getSource().getBindingContext(sEntity).getProperty(oEvt.getSource().getBindingContext(sEntity).sPath, ),
					true);
				break;
			}
		},
		cancelClockInOutAdjustHour: function (oEvt) {
			//Set the timer to empty and trigger the change event
			oEvt.getSource().getParent().mAggregations.items[0].setValue("");
			oEvt.getSource().getParent().mAggregations.items[0].fireChange();
		},
		onTimeCorrectionSave: function () {

			if (!this._checkChangesToSave(this._idTimeCorrectionTable, "timeCorrection")) {
				return;
			}

			let msgConf = this._checkSelectionDifferFromChanges(this._idTimeCorrectionTable, "timeCorrection") ? this.getText(
				"mgrview_save_confirmation_with_chg") : this.getText("mgrview_submit_confirmation");

			MessageBox.confirm(
				msgConf, {
					onClose: (sAction) => {
						if (sAction === "OK") {
							this._saveTimeConfirmation();
						}
					}
				}
			);
		},
		_checkSelectionDifferFromChanges: function (oTable, sModel) {

			if (oTable.getSelectedContexts().length === 0) {
				return false;
			}

			for (let item of oTable.getAggregation("items")) {
				let oBindindContext = sModel ? item.getBindingContext(sModel) : item.getBindingContext();
				let oModel = sModel ? item.getBindingContext(sModel).getModel(sModel) : item.getBindingContext().getModel();
				let sPath = oBindindContext.sPath;
				let oEntity = oModel.getProperty(sPath);

				if (!item.isSelected() && oEntity.hasChanged()) {
					return true;
				}
			}
			return false;
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
		_saveTimeConfirmation: function (obj, isReprocess) {
			//Reset status to retrieve the new ones
			this._resetStatus(this._idTimeCorrectionTable, "timeCorrection");

			let items = [];
			if (!obj) {
				if (!this._idTimeCorrectionTable) {
					return;
				}
				let contexts = this._idTimeCorrectionTable.getSelectedContexts();
				items = contexts.map(function (c) {
					return c.getObject();
				});

				if (items.length === 0) {
					items = [];
					for (let itemTime of this.getView().getModel("timeCorrection").getData().results) {
						if (itemTime.hasChanged()) {
							items.push(itemTime);
						}
					}
				}
				//No changes to submit
				if (items.length === 0) {
					this.showToast("msg_no_changes_submit", false);
					return;
				}
			} else {
				items.push(obj);
			}

			let oListCreation = [];
			for (let i = 0; i < items.length; i++) {
				//let submitData = Object.assign({}, items[i]);
				let submitData = Object.create(this._TimeCorrectionItemModel);
				Object.assign(submitData, items[i]);

				submitData.AdjClockinFilled = submitData.AdjClockin && submitData.AdjClockin.ms.toString().length > 0 && !isNaN(submitData.AdjClockin
					.ms) ? true : false;
				submitData.AdjClockoutFilled = submitData.AdjClockout && submitData.AdjClockout.ms.toString().length > 0 && !isNaN(submitData.AdjClockout
						.ms) ? true :
					false;

				submitData.AdjClockout = submitData.AdjClockout ? submitData.AdjClockout : {
					ms: 0,
					__edmType: "Edm.Time"
				}; //submitData.AdjClockout.ms === "" ? 0 : submitData.AdjClockout.ms;
				submitData.AdjClockin = submitData.AdjClockin ? submitData.AdjClockin : {
					ms: 0,
					__edmType: "Edm.Time"
				}; //submitData.AdjClockin.ms === "" ? 0 : submitData.AdjClockin.ms;
				submitData.Role = this.role;
				oListCreation.push(submitData);
			}

			//Validate and removes items with error to allow the submitting of OK items
			if (!isReprocess) {
				this._validateTimeCorrection(oListCreation);
				//No changes to submit
				if (oListCreation.length === 0) {
					return;
				}
			}
			//Remove fields that dont exist in the entity
			for (let i = 0; i < oListCreation.length; i++) {
				delete oListCreation[i].OldAdjShift;
				delete oListCreation[i].OldAdjClockin;
				delete oListCreation[i].OldAdjClockout;
				delete oListCreation[i].OldRemarks;
				delete oListCreation[i].hasChanged;
				delete oListCreation[i].OldStatus;
				delete oListCreation[i].OldAction;
				delete oListCreation[i].OldComments;
				delete oListCreation[i].hasChangedExceptAction;
			}

			//Signals which is the last record so that the time evaluation will be executed in the backend
			oListCreation[oListCreation.length - 1].Last = true;
			this.setBusy(true);
			this.serviceHelper.batchCreation("/TimeCorrectionSet", oListCreation, this.serviceHelper.getComponentModel(this))
				.then((res) => {
					this._processBatchResponse(res[0], isReprocess);
					this.setBusy(false);
				})
				.catch((err) => {
					this.reportErrorMsg(err);
					this.setBusy(false);
				});
		},
		onSetComment: function (oEvt) {

			let oControl = oEvt.getSource();

			this._initPopupComment();

			this._oPopoverComment.bindElement({
				path: `${oControl.getBindingContext("timeCorrection").sPath}`,
				model: "timeCorrection"
			});
			if (this._oPopoverComment.isOpen()) {
				this._oPopoverComment.close();
			} else {
				this._oPopoverComment.openBy(oControl);
				this._oPopoverComment.myControl = oControl;
			}

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
		handleCloseTimeComment: function (oEvt) {
			this._oPopoverComment.close();
		},
		handleCloseOTApprovalComment: function (oEvt) {
			this._oPopoverCommentOT.close();
		},
		_initPopupComment: function () {
			if (!this._oPopoverComment) {
				Fragment.load({
					name: "com.infineon.ztmsapp.fragments.CommentPopup",
					controller: this
				}).then((pPopover) => {
					this._oPopoverComment = pPopover;
					this._oPopoverComment.setPlacement(sap.m.PlacementType.Horizontal);
					this.getView().addDependent(this._oPopoverComment);
				});
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
		_validateOTApproval: function (oListCreation, sModel) {
			/* ClockinFilled
			 * ClockoutFilled */
			let lstOTApproval = this.getView().getModel(sModel).getData().results;

			let isOk = true;
			for (var i = 0; i < oListCreation.length; i++) {

				let itemError = lstOTApproval.find((item) => {
					return item.Id === oListCreation[i].Id
				});

				if (oListCreation[i].Action.length === 0) {
					isOk = false;
					itemError.StatusCode = "E";
					itemError.StatusText = this.getText("msg_set_action_mandatory");
					oListCreation.splice(i, 1);
					i--;
					if (oListCreation.length === 0) {
						break;
					}
					continue;
				}

			}
			this.getView().getModel(sModel).refresh();
			return isOk;

		},
		_validateTimeCorrection: function (oListCreation) {
			/* ClockinFilled
			 * ClockoutFilled */
			let lstTimeCorrection = this.getView().getModel("timeCorrection").getData().results;

			let isOk = true;
			for (var i = 0; i < oListCreation.length; i++) {

				let itemError = lstTimeCorrection.find((itemTime) => {
					return itemTime.Id === oListCreation[i].Id
				});

				if (oListCreation[i].Action.length === 0) {
					isOk = false;
					itemError.StatusCode = "E";
					itemError.StatusText = this.getText("msg_set_action_mandatory");
					oListCreation.splice(i, 1);
					i--;
					if (oListCreation.length === 0) {
						break;
					}
					continue;
				}

				if (!oListCreation[i].hasChangedExceptAction() && oListCreation[i].Action !== "ACKNLDGE" && !oListCreation[i].AdjClockoutFilled &&
					!oListCreation[i].AdjClockintFilled) {
					isOk = false;
					itemError.StatusCode = "E";
					itemError.StatusText = this.getText("msg_changes_must_be_ack");
					oListCreation.splice(i, 1);
					i--;
					if (oListCreation.length === 0) {
						break;
					}
					continue;
				}

				if (oListCreation[i].Action === "ACKNLDGE" || oListCreation[i].Action === "") {

					if (oListCreation[i].Status === "APPROVED") {
						isOk = false;
						itemError.StatusCode = "E";
						itemError.StatusText = this.getText("msg_set_corrected_not_change_ack");
						oListCreation.splice(i, 1);
						i--;
						if (oListCreation.length === 0) {
							break;
						}
						continue;
					}

					if (oListCreation[i].Action === "ACKNLDGE" && itemError.hasChangedExceptAction()) {
						isOk = false;
						itemError.StatusCode = "E";
						itemError.StatusText = this.getText("msg_changes_not_allow_ack");
						oListCreation.splice(i, 1);
						i--;
						if (oListCreation.length === 0) {
							break;
						}
						continue;
					}

					if (!(!oListCreation[i].AdjClockoutFilled &&
							!oListCreation[i].AdjClockinFilled && oListCreation[i].Action === "ACKNLDGE")) {
						isOk = false;
						itemError.StatusCode = "E";
						itemError.StatusText = this.getText("msg_set_acknowledge_empty");
						oListCreation.splice(i, 1);
						i--;
						if (oListCreation.length === 0) {
							break;
						}
						continue;
					}

					if (oListCreation[i].Status === "ACKNLDGE" && oListCreation[i].Action === "ACKNLDGE") {
						isOk = false;
						itemError.StatusCode = "E";
						itemError.StatusText = this.getText("msg_status_action_acknowledge_error");
						oListCreation.splice(i, 1);
						i--;
						if (oListCreation.length === 0) {
							break;
						}
						continue;
					}
				} else {

					let isShiftWork = itemError.ShiftsAllowedSet.results.find((item) => {
						return item.Shift === itemError.AdjShift && item.ShiftType === this.Constants.SHIFT_TYPE_WORK
					}) ? true : false;
					let isAdjShiftFilledChanged = oListCreation[i].AdjShift.length > 0 && oListCreation[i].AdjShift !== oListCreation[i].OldAdjShift;
					if (!(oListCreation[i].ClockoutFilled && oListCreation[i].ClockinFilled) && !((!oListCreation[i].ClockoutFilled && !
								oListCreation[i].ClockinFilled) && (oListCreation[i].AdjClockinFilled &&
								oListCreation[i].AdjClockoutFilled) &&
							oListCreation[i].Action === this.Constants.APPROVED) && isShiftWork && !isAdjShiftFilledChanged) {
						isOk = false;
						itemError.StatusCode = "E";
						itemError.StatusText = this.getText("msg_clockin_clockout_empty");
						oListCreation.splice(i, 1);
						i--;
						if (oListCreation.length === 0) {
							break;
						}
						continue;
					}

					//Error clockin filled and adjusted clockout empty
					if (!(oListCreation[i].ClockoutFilled && oListCreation[i].ClockinFilled) && oListCreation[i].ClockinFilled && !
						oListCreation[i].AdjClockoutFilled) {
						isOk = false;
						itemError.StatusCode = "E";
						itemError.StatusText = this.getText("msg_clockout_empty");
						oListCreation.splice(i, 1);
						i--;
						if (oListCreation.length === 0) {
							break;
						}
						continue;
					}
					//Error clockout filled and adjusted clockin empty
					if (!(oListCreation[i].ClockoutFilled && oListCreation[i].ClockinFilled) && oListCreation[i].ClockoutFilled && !
						oListCreation[i].AdjClockinFilled) {
						isOk = false;
						itemError.StatusCode = "E";
						itemError.StatusText = this.getText("msg_clockin_empty");
						oListCreation.splice(i, 1);
						i--;
						if (oListCreation.length === 0) {
							break;
						}
						continue;
					}
				}

			}
			this.getView().getModel("timeCorrection").refresh();
			return isOk;
		},
		checkChange: function (oEvt, sModel) {

			let oData = oEvt.getSource().getBindingContext(`${sModel}`).getProperty(oEvt.getSource().getBindingContext(`${sModel}`).getPath());
			let sAttribute = oEvt.getSource().getBindingInfo("selectedKey") ? oEvt.getSource().getBindingInfo("selectedKey").binding.sPath :
				oEvt.getSource().getBindingInfo("value").binding.sPath;

			sAttribute = sAttribute && sAttribute.length > 0 ? sAttribute : oEvt.getSource().getBindingInfo("value").parts[0].path;

			let hasChanged = false;

			//Validate limit
			if (sAttribute === "AdjOtHours" && sModel === "otApproval") {

				let sPath = oEvt.getSource().getBindingContext(`${sModel}`).sPath;
				let sValue = oEvt.getParameter("value");
				let oModel = oEvt.getSource().getBindingContext(`${sModel}`).getModel(`${sModel}`);

				let iValue = sValue.length > 0 ? parseInt(sValue) : 0;

				if (iValue > 12) {
					oModel.setProperty(sPath + "/AdjOtHoursIsValid", false);
					oEvt.getSource().setValueStateText(this.getText("msg_exceed_ot_12"));
					oEvt.getSource().setValueState(sap.ui.core.ValueState.Error);
					return;
				} else {
					oEvt.getSource().setValueState(sap.ui.core.ValueState.None);
					oEvt.getSource().setValueStateText("");
					oModel.setProperty(sPath + "/AdjOtHoursIsValid", true);
				}

			}

			switch (sAttribute) {
			case "Action":
				hasChanged = oEvt.getSource().getSelectedKey() !== oData[`Old${sAttribute}`];
				break;
			case "Remarks":
				hasChanged = oEvt.getSource().getValue() !== oData[`Old${sAttribute}`];
				break;
			case "AdjOtHours":
				let zeroEmpty = oEvt.getSource().getValue().length === 0 ? "0.00" : oEvt.getSource().getValue();
				//hasChanged = parseFloat(zeroEmpty) !== parseFloat(oData[`Old${sAttribute}`]);
				hasChanged = oEvt.getSource().getValue() !== oData[`Old${sAttribute}`];

				let sPath = oEvt.getSource().getBindingContext(`${sModel}`).sPath;
				oEvt.getSource().getBindingContext(`${sModel}`).getModel(`${sModel}`).setProperty(sPath + "/AdjOtHours", oEvt.getSource().getValue());

				let sValue = oEvt.getSource().getBindingContext(`${sModel}`).getModel(`${sModel}`).getProperty(sPath + "/AdjOtHours");
				let isFilled = sValue.length > 0 && parseFloat(sValue) > 0;
				console.log("OT filled: " + isFilled);
				oEvt.getSource().getBindingContext(`${sModel}`).getModel(`${sModel}`).setProperty(sPath + "/AdjOtHoursFilled", isFilled);
				break;
			case "AdjShift":
				hasChanged = oData[sAttribute] !== oData[`Old${sAttribute}`];
				break;
			case "AdjClockin":

				if (!oData[sAttribute] || !oData[`Old${sAttribute}`]) {
					//hasChanged = oData[sAttribute] !== oData[`Old${sAttribute}`]
					hasChanged = ((oData[sAttribute] !== oData[`Old${sAttribute}`].ms) && !(!oData[sAttribute] && oData[`Old${sAttribute}`].ms ===
						""))
				} else {
					hasChanged = oData[sAttribute].ms !== oData[`Old${sAttribute}`].ms;
				}
				//oData["AdjClockinFilled"] = oData[sAttribute] && oData[sAttribute].ms ? true : false;
				oData["AdjClockinFilled"] = oData[sAttribute] ? true : false;
				break;
			case "AdjClockout":

				if (!oData[sAttribute] || !oData[`Old${sAttribute}`]) {
					hasChanged = ((oData[sAttribute] !== oData[`Old${sAttribute}`].ms) && !(!oData[sAttribute] && oData[`Old${sAttribute}`].ms ===
						""))
				} else {
					hasChanged = oData[sAttribute].ms !== oData[`Old${sAttribute}`].ms;
				}
				//oData["AdjClockoutFilled"] = oData[sAttribute] && oData[sAttribute].ms ? true : false;
				oData["AdjClockoutFilled"] = oData[sAttribute] ? true : false;
				break;
			default:
			}
			oEvt.getSource().setValueState(hasChanged ? sap.ui.core.ValueState.Warning : sap.ui.core.ValueState.None);
			oEvt.getSource().setValueStateText(hasChanged ? this.getText("modified") : "");
		},
		_processBatchResponse: function (oData, isReprocess) {
			let lstTimeCorrection = this.getView().getModel("timeCorrection").getData().results;
			if (oData.__batchResponses) {
				for (let itemBatch of oData.__batchResponses) {
					if (itemBatch.__changeResponses) {
						for (let itemResponse of itemBatch.__changeResponses) {
							let resp = itemResponse.body;
							switch (itemResponse.data.StatusCode) {
							case "S":
								let indexItem = lstTimeCorrection.findIndex((itemTime) => itemTime.Id === itemResponse.data.Id);
								let itemSuccess = lstTimeCorrection[indexItem];

								itemSuccess.Status = itemResponse.data.Status;
								//this._configTimeCorrectionChangeItem(itemSuccess);
								itemSuccess.Action = "";
								itemSuccess.StatusCode = itemResponse.data.StatusCode;
								itemSuccess.Comments = itemResponse.data.Comments;
								itemSuccess = this._configTimeCorrectionChangeItemProto(itemSuccess);

								//itemSuccess.StatusCode = itemResponse.data.StatusCode;
								itemSuccess.StatusText = this.getText("msg_success_timecorrection_process");
								itemSuccess.StatusDesc = itemResponse.data.StatusDesc;
								itemSuccess.Tooltip = itemResponse.data.Tooltip;
								itemSuccess.Enabled = false; //itemResponse.data.Enabled;
								//itemSuccess.Action = "";
								itemSuccess.ProcStatus = itemResponse.data.ProcStatus;
								//this._resetTableState(this.getView().byId("idTimeCorrection"));
								lstTimeCorrection[indexItem] = itemSuccess;
								break;
							case "E":

								let itemError = lstTimeCorrection.find((itemTime) => {
									return itemTime.Id === itemResponse.data.Id
								});
								itemError.Status = itemResponse.data.Status;
								itemError.StatusDesc = itemResponse.data.StatusDesc;
								itemError.StatusCode = itemResponse.data.StatusCode;
								itemError.StatusText = itemResponse.data.StatusText;
								itemError.Tooltip = itemResponse.data.Tooltip;
								itemError.Enabled = itemResponse.data.Enabled;
								itemError.Action = itemResponse.data.Action;
								itemError.ProcStatus = itemResponse.data.ProcStatus;
								break;
							default:
								break;
							}

						}
					}
				}
				this.getView().getModel("timeCorrection").refresh();
				if (!isReprocess) {
					this._resetTableState(this._idTimeCorrectionTable, "timeCorrection", "StatusCode");
				}
				this.showToast("msg_changes_made_check_state", false);
			}
		},
		_configOTApprovalChangeItemProto: function (item) {
			let itemOT = Object.create(this._OTApprovalItemModel);
			Object.assign(itemOT, item);
			itemOT.initChangeControl();
			item = itemOT;
			return item;
		},
		_configOTApprovalChangeItem: function (item) {

			item.OldAdjOtHours = formatter.formatZeroEmpty(item.AdjOtHours, item.AdjOtHoursFilled);
			item.AdjOtHours = formatter.formatZeroEmpty(item.AdjOtHours, item.AdjOtHoursFilled);
			item.OldStatus = item.Status;
			item.OldAction = "";
			item.OldComments = item.Comments;
			item.AdjOtHoursIsValid = true;
			item.hasChanged = function () {
				return this.AdjOtHours !== this.OldAdjOtHours ||
					this.Status !== this.OldStatus ||
					this.Action !== this.OldAction ||
					this.Comments !== this.OldComments;
			}

			return item;
		},
		_configOTApprovalChange: function (oList) {

			for (var i = 0; i < oList.length; i++) {
				oList[i].Id = this.createUUID();
				oList[i] = this._configOTApprovalChangeItemProto(oList[i]);
			}
			return oList;
		},
		_configTimeCorrectionChangeItemProto: function (item) {
			let itemTime = Object.create(this._TimeCorrectionItemModel);
			Object.assign(itemTime, item);
			itemTime.initChangeControl();
			item = itemTime;
			return item;
		},
		_configTimeCorrectionChangeItem: function (item) {

			item.OldAdjShift = item.AdjShift;
			item.OldRemarks = item.Remarks;
			item.OldStatus = item.Status;
			item.OldAction = "";
			item.OldComments = item.Comments;

			item.OldAdjClockin = item.AdjClockin ? item.AdjClockin : {
				ms: 0,
				__edmType: "Edm.Time"
			};
			item.OldAdjClockout = item.AdjClockout ? item.AdjClockout : {
				ms: 0,
				__edmType: "Edm.Time"
			};

			item.hasChanged = function () {

				let oAdjClockin = this.AdjClockin ? this.AdjClockin : {
					ms: "",
					__edmType: "Edm.Time"
				};
				let oAdjClockout = this.AdjClockout ? this.AdjClockout : {
					ms: "",
					__edmType: "Edm.Time"
				};

				return this.AdjShift !== this.OldAdjShift ||
					oAdjClockin.ms !== this.OldAdjClockin.ms ||
					oAdjClockout.ms !== this.OldAdjClockout.ms ||
					this.Remarks !== this.OldRemarks ||
					this.Status !== this.OldStatus ||
					this.Action !== this.OldAction ||
					this.Comments !== this.OldComments;
			}

			item.hasChangedExceptAction = function () {

				let oAdjClockin = this.AdjClockin ? this.AdjClockin : {
					ms: "",
					__edmType: "Edm.Time"
				};
				let oAdjClockout = this.AdjClockout ? this.AdjClockout : {
					ms: "",
					__edmType: "Edm.Time"
				};

				return this.AdjShift !== this.OldAdjShift ||
					oAdjClockin.ms !== this.OldAdjClockin.ms ||
					oAdjClockout.ms !== this.OldAdjClockout.ms ||
					this.Remarks !== this.OldRemarks ||
					this.Status !== this.OldStatus ||
					this.Comments !== this.OldComments;
			}

			return item;
		},
		onTimeCorretionSetAcknowledge: function () {
			if (!this._idTimeCorrectionTable) {
				return;
			}
			var contexts = this._idTimeCorrectionTable.getSelectedContexts();
			if (contexts) {
				for (var i = 0; i < contexts.length; i++) {
					this._idTimeCorrectionTable.getModel("timeCorrection").setProperty(contexts[i].getPath() + "/Action", "ACKNLDGE");
					let oItem = this._idTimeCorrectionTable.getItems().find((subItem) => {
						return subItem.oBindingContexts.timeCorrection.sPath === contexts[i].getPath()
					});
					for (let oCell of oItem.getCells()) {
						oCell.fireChange ? oCell.fireChange(this._idTimeCorrectionTable.getItems()[i]) : null;
					}
				}
				if (contexts.length === 0) {
					this.showToast("msg_no_records_selected", false);
				}
			}
		},
		onTimeCorrectionSetCorrected: function () {
			if (!this._idTimeCorrectionTable) {
				return;
			}
			var contexts = this._idTimeCorrectionTable.getSelectedContexts();
			if (contexts) {
				for (var i = 0; i < contexts.length; i++) {
					this._idTimeCorrectionTable.getModel("timeCorrection").setProperty(contexts[i].getPath() + "/Action", "APPROVED");
					let oItem = this._idTimeCorrectionTable.getItems().find((subItem) => {
						return subItem.oBindingContexts.timeCorrection.sPath === contexts[i].getPath()
					});
					for (let oCell of oItem.getCells()) {
						oCell.fireChange ? oCell.fireChange(this._idTimeCorrectionTable.getItems()[i]) : null;
					}
				}
			}
		},
		onOTApprovalSave: function (sModel) {
			let oTable = null;
			this.currentOtModel = sModel;
			switch (sModel) {
			case "otApproval":
				oTable = this._idOTApprovalTable;
				break;
			case "preOTShiftApproval":
				oTable = this._idPreOTShiftApprovalTable;
				break;
			default:
			}

			if (!this._checkChangesToSave(oTable, sModel)) {
				return;
			}
			let msgConf = this._checkSelectionDifferFromChanges(oTable, sModel) ? this.getText(
				"msg_confirm_shift_change_with_chg") : this.getText("msg_confirm_shift_change");
			MessageBox.confirm(
				msgConf, {
					onClose: (sAction) => {
						if ("OK" === sAction) {
							this._OTApprovalSave();
						}
					}
				}
			);
		},
		_OTApprovalSave: function (obj, isReprocess) {

			let oTable = null;
			switch (this.currentOtModel) {
			case "otApproval":
				oTable = this._idOTApprovalTable;
				break;
			case "preOTShiftApproval":
				oTable = this._idPreOTShiftApprovalTable;
				break;
			default:
			}

			this._resetStatus(oTable, this.currentOtModel);

			let items = [];
			if (!obj) {
				if (!oTable) {
					return;
				}
				items = oTable.getSelectedContexts().map(function (c) {
					return c.getObject();
				});

				if (items.length === 0) {
					items = [];
					for (let itemTime of this.getView().getModel(this.currentOtModel).getData().results) {
						if (itemTime.hasChanged()) {
							items.push(itemTime);
						}
					}
				}
				//No changes to submit
				if (items.length === 0) {
					this.showToast("msg_no_changes_submit", false);
					return;
				}
			} else {
				items.push(obj);
			}

			if (this.getView().getModel(this.currentOtModel).getData().results.find((item) => {
					return item.AdjOtHoursIsValid === false;
				})) {

				this.reportErrorMsg(null, "msg_there_are_items_exceeding_12");
				return;
			}

			let oListCreation = [];
			for (let i = 0; i < items.length; i++) {

				let submitData = Object.create(this._OTApprovalItemModel);
				Object.assign(submitData, items[i]);

				submitData.AdjOtHours = items[i].AdjOtHours.toString().length === 0 ? "0.00" : items[i].AdjOtHours.toString();
				submitData.Role = this.role;
				submitData.Status = isReprocess ? "REPROCESS" : submitData.Status;
				delete submitData.OldAdjOtHours;
				delete submitData.OldStatus;
				delete submitData.OldAction;
				delete submitData.OldComments;
				delete submitData.AdjOtHoursIsValid;
				delete submitData.PreotstatusDesc;
				delete submitData.Preotstatus;
				delete submitData.OtHoursReq;
				delete submitData.AdjShift;
				delete submitData.IsPreOt;
				oListCreation.push(submitData);
			}

			oListCreation[oListCreation.length - 1].Last = true;

			if (!isReprocess) {
				this._validateOTApproval(oListCreation, this.currentOtModel);
				//No changes to submit
				if (oListCreation.length === 0) {
					return;
				}
			}
			this.setBusy(true);
			this.serviceHelper.batchCreation("/OTApprovalSet", oListCreation, this.serviceHelper.getComponentModel(this))
				.then((res) => {
					this._processBatchResponseOTApproval(res[0], isReprocess);
					this.setBusy(false);
				})
				.catch((err) => {
					this.reportErrorMsg(err);
					this.setBusy(false);
				});

		},
		_processBatchResponseOTApproval: function (oData, isReprocess) {
			let lstOTApproval = this.getView().getModel(this.currentOtModel).getData().results;

			if (oData.__batchResponses) {

				for (let itemBatch of oData.__batchResponses) {
					if (itemBatch.__changeResponses) {
						for (let itemResponse of itemBatch.__changeResponses) {
							let resp = itemResponse.body;
							switch (itemResponse.data.StatusCode) {
							case "S":

								let indexItem = lstOTApproval.findIndex((itemTime) => itemTime.Id === itemResponse.data.Id);
								let itemSuccess = lstOTApproval[indexItem];

								itemSuccess.StatusCode = itemResponse.data.StatusCode;
								itemSuccess.StatusText = this.getText("msg_success_OTApproval_process");
								itemSuccess.Status = itemResponse.data.Status;
								itemSuccess.StatusDesc = itemResponse.data.StatusDesc;
								itemSuccess.Tooltip = itemResponse.data.Tooltip;
								itemSuccess.Enabled = itemResponse.data.Enabled;
								itemSuccess.ProcStatus = itemResponse.data.ProcStatus;
								itemSuccess.Action = ""; //itemResponse.data.Action;
								itemSuccess = this._configOTApprovalChangeItemProto(itemSuccess);
								lstOTApproval[indexItem] = itemSuccess;
								break;
							case "E":
								let itemError = lstOTApproval.find((itemTime) => {
									return itemTime.Id === itemResponse.data.Id
								});
								itemError.Status = itemResponse.data.Status;
								itemError.StatusDesc = itemResponse.data.StatusDesc;
								itemError.StatusCode = itemResponse.data.StatusCode;
								itemError.StatusText = itemResponse.data.StatusText;
								itemError.Tooltip = itemResponse.data.Tooltip;
								itemError.Enabled = itemResponse.data.Enabled;
								itemError.ProcStatus = itemResponse.data.ProcStatus;
								itemError.Action = itemResponse.data.Action;
								break;
							default:
								break;
							}

						}
					} else if (itemBatch.message) {
						sap.m.MessageBox.error(itemBatch.message);
					}

				}
				this.getView().getModel(this.currentOtModel).refresh();
				if (!isReprocess) {
					if (this.currentOtModel === "otApproval") {
						this._resetTableState(this._idOTApprovalTable, this.currentOtModel, "StatusCode");
					} else {
						this._resetTableState(this._idPreOTShiftApprovalTable, this.currentOtModel, "StatusCode");
					}
				}
				this.showToast("msg_changes_made_check_state", false);
			}
		},
		onOTApprovalSetReject: function (oEvt, sModel) {

			let oTable = null;
			switch (sModel) {
			case "otApproval":
				oTable = this._idOTApprovalTable;
				break;
			case "preOTShiftApproval":
				oTable = this._idPreOTShiftApprovalTable;
				break;
			default:
			}

			if (!oTable) {
				return;
			}
			var contexts = oTable.getSelectedContexts();
			if (contexts && contexts.length > 0) {
				for (var i = 0; i < contexts.length; i++) {
					oTable.getModel(sModel).setProperty(contexts[i].getPath() + "/AdjOtHours", "0.00");
					oTable.getModel(sModel).setProperty(contexts[i].getPath() + "/AdjOtHoursFilled", false);
					oTable.getModel(sModel).setProperty(contexts[i].getPath() + "/Action", "REJECTED");
					let oItem = oTable.getItems().find((subItem) => {
						return subItem.getBindingContext(sModel).sPath === contexts[i].getPath()
					});
					for (let oCell of oItem.getCells()) {
						oCell.fireChange ? oCell.fireChange(oTable.getItems()[i]) : null;
					}
				}
			} else {
				this.showToast("no_records_selected", false);
			}
		},
		onOTApprovalSetApprove: function (sModel) {
			let oTable = null;
			switch (sModel) {
			case "otApproval":
				oTable = this._idOTApprovalTable;
				break;
			case "preOTShiftApproval":
				oTable = this._idPreOTShiftApprovalTable;
				break;
			default:
			}

			if (!oTable) {
				return;
			}
			var contexts = oTable.getSelectedContexts();
			if (contexts && contexts.length > 0) {
				for (var i = 0; i < contexts.length; i++) {
					oTable.getModel(sModel).setProperty(contexts[i].getPath() + "/Action", "APPROVED");
					let oItem = oTable.getItems().find((subItem) => {
						return subItem.getBindingContext(sModel).sPath === contexts[i].getPath()
					});
					for (let oCell of oItem.getCells()) {
						oCell.fireChange ? oCell.fireChange(oTable.getItems()[i]) : null;
					}
				}
			} else {
				this.showToast("no_records_selected", false);
			}
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
		onUpdateTokeEmployee: function (oEvent, sModelName) {

			//let aAddedTokens = oEvent.getParameter("addedTokens");
			let aRemovedTokens = oEvent.getParameter("removedTokens");

			let oTokens = oEvent.getSource().getTokens();

			this[sModelName].selectedKeys = [];
			for (let oTokenItem of oTokens) {
				this[sModelName].selectedKeys.push(oTokenItem.getKey());
			}
			for (let oTokenItem of aRemovedTokens) {
				let indexTask = this[sModelName].selectedKeys.findIndex((item) => item === oTokenItem.getKey());
				this[sModelName].selectedKeys.splice(indexTask, 1);
			}
		},
		onInputEmployee: function (oEvt, sModelName) {
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
			this.getView().getModel().read("/EmployeeDataSet", {
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
						oControl.fireTokenUpdate(oEvt, sModelName);
					}
				},
				error: (err) => {
					oControl.setBusy(false);
				}
			});

		},
		onEmployeeCovOfficerSearchHelp: function (oEvt, bBool) {

			let oEvtOriginal = oEvt;
			if (this.oModelCoveringOfficer.hasPendingChanges()) {
				MessageBox.confirm(
					this.getText("msg_lost_changes"), {
						onClose: (sAction) => {
							if ("OK" === sAction) {
								this.onValueEmployeeSearchHelp(oEvtOriginal, bBool);
							}
						}
					}
				);
			} else {
				this.onValueEmployeeSearchHelp(oEvtOriginal, bBool);
			}
		},
		onEmployeeInput: function (oEvt, bChangeCoveringOfficer) {

			//let empVal = oEvt.getParameter('value') ? oEvt.getParameter('value') : oEvt.getSource().getValue();
			let iptEmployee = oEvt.getSource().getMetadata()._sClassName === "sap.m.Input" ? oEvt.getSource() : Fragment.byId(this.getView().createId(
				"coveringOfficerList"), "iptCovOfficerSearch");
			let empVal = iptEmployee.getValue();

			if (empVal.length === 8) {
				let aFilters = [];
				aFilters.push(new sap.ui.model.Filter({
					path: "SearchStr",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: empVal
				}));
				this.setBusy(true);
				this.getView().getModel().read("/EmployeeDataSet", {
					filters: aFilters,
					urlParameters: {
						"$select": "Employee,Fullname"
					},
					success: (oData, oResponse) => {
						this.setBusy(false);
						if (oData.results.length > 0) {
							iptEmployee.setDescription(oData.results[0].Fullname);
							if (bChangeCoveringOfficer) {
								this._setCoveringOfficerModel(oData.results[0].Employee);
							}
						} else {
							iptEmployee.setDescription("");
						}
					},
					error: (err) => {
						this.setBusy(false);
					}
				});
			} else {
				iptEmployee.setDescription("");
			}
		},
		onChangeCoveringOfficer: function (oEvt) {
			let sValue = oEvt.mParameters.value ? oEvt.mParameters.value : oEvt.getSource()._lastValue;
			if (sValue.trim().length !== 8) {
				return;
			}
			if (this.oModelCoveringOfficer.hasPendingChanges()) {
				MessageBox.confirm(
					this.getText("msg_lost_changes"), {
						onClose: (sAction) => {
							if ("OK" === sAction) {
								this.onEmployeeInput(oEvt, true);
								this._setCoveringOfficerModel(sValue);
							} else {
								//ORIGINAL VALUE REVERT 

							}
						}
					}
				);
			} else {
				this.onEmployeeInput(oEvt);
				this._setCoveringOfficerModel(sValue);
			}

		},
		_setCoveringOfficerModel: function (sEmployee) {

			let sPath = this.baseUrl;
			if (sEmployee) {
				sPath = `/EmployeeDataSet(Employee='${sEmployee}',Role='${this._currentRole}')`;
			}
			//this.oModelCoveringOfficer = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/ZHR_TMS_CORE_SRV/");
			this.oModelCoveringOfficer.resetChanges();
			this.oModelCoveringOfficer.refresh(true, true);
			this.getView().setModel(this.oModelCoveringOfficer, "coveringOfficer");
			this.rebindTable(this._idCovOffTable.getBindingInfo("items").template, "Navigation", sPath);
		},
		suggestionSelected: function (oEvent, sModelName) {
			if (oEvent.getSource().getMetadata().getName() === "sap.m.Input") {
				oEvent.getSource().setDescription(oEvent.getParameter("selectedItem").getBindingContext().getProperty("Fullname"));
			}
		},
		searchTimeCorrection: function (modelName) {
			var filterData = this[modelName].getData();
			var la_filters = this.handleOrgFilters(filterData);
			this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, true, false);

			this.serviceHelper.read("/TimeCorrectionSet", this.oModel, true, null, "ShiftsAllowedSet", null, la_filters, null)
				.then((res) => {
					let oData = res[0];
					this._idTimeCorrectionTable.setVisible(true);

					oData.results = this.configTimeCorrectionChange(oData.results);
					for (let res of oData.results) {
						res.AdjClockout.ms = res.AdjClockoutFilled ? res.AdjClockout.ms : "";
						res.AdjClockin.ms = res.AdjClockinFilled ? res.AdjClockin.ms : "";
					}
					let timeCorrection = new JSONModel(oData);

					//timeCorrection.setSizeLimit(oData.results.length);
					timeCorrection.setSizeLimit(oData.results.length < 100 ? 100 : oData.results.length);
					this.getView().setModel(timeCorrection, "timeCorrection");

					this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, false, false);
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}

				})
				.catch((err) => {
					this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, false, true);
					this.reportErrorMsg(err, "msg_error_time_correction_service");
				});

		},
		configTimeCorrectionChange: function (oList) {

			for (var i = 0; i < oList.length; i++) {
				oList[i].Id = this.createUUID();
				oList[i] = this._configTimeCorrectionChangeItemProto(oList[i]);
			}
			return oList;
		},
		setFilterTabBusyExpanded: function (modelName, iconTabBarId, filterBusy, filterExpanded) {
			let iconTabFilter = this.getView().byId(iconTabBarId);
			for (let tab of iconTabFilter.getItems()) {
				if (tab.getKey() === modelName + "Key") {
					tab.getModel("orgFilter").setProperty("/filterbusy", filterBusy);
					tab.getModel("orgFilter").setProperty("/filterexpanded", filterExpanded);
				}
			}
		},
		searchOTApproval: function (modelName) {
			var filterData = this[modelName].getData();
			var la_filters = this.handleOrgFilters(filterData);
			this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, true, false);
			this.getView().getModel().read("/OTApprovalSet", {
				filters: la_filters,
				success: (oData, oResponse) => {
					this._idOTApprovalTable.setVisible(true);
					oData.results = this._configOTApprovalChange(oData.results);
					var otApproval = new JSONModel(oData);
					this.getView().setModel(otApproval, "otApproval");
					this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, false, false);
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}
				},
				error: (oError) => {
					this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, false, true);
					this.reportErrorMsg(oError);
				}
			});
		},
		searchPreOTShiftApproval: function (modelName) {
			let filterData = this[modelName].getData();
			let la_filters = this.handleOrgFilters(filterData);
			this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, true, false);
			this.getView().getModel().read("/PreOTShiftApprovalSet", {
				filters: la_filters,
				success: (oData, oResponse) => {
					this._idPreOTShiftApprovalTable.setVisible(true);
					oData.results = this._configOTApprovalChange(oData.results);
					this.getView().setModel(new JSONModel(oData), "preOTShiftApproval");
					this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, false, false);
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}
				},
				error: (oError) => {
					this.setFilterTabBusyExpanded(modelName, this.iconTabBarAttendance, false, true);
					this.reportErrorMsg(oError);
				}
			});
		},
		searchTeamAttendace: function (modelName) {
			let teamAttTable = this.getView().byId("idTeamAttendance");
			let filterData = this[modelName].getData();
			let la_filters = this.handleOrgFilters(filterData);
			this.setFilterTabBusyExpanded(modelName, this.iconTabBarTeamAttendance, true, false);

			this.getView().getModel().read("/TeamAttendanceSet", {
				filters: la_filters,
				success: (oData, oResponse) => {
					teamAttTable.setVisible(true);
					let teamAttendance = new JSONModel(oData);
					this.getView().setModel(teamAttendance, "teamAttendance");

					this.setTeamAttendanceTotals(oData.results);

					this.setFilterTabBusyExpanded(modelName, this.iconTabBarTeamAttendance, false, false);
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}
				},
				error: (oError) => {
					this.setFilterTabBusyExpanded(modelName, this.iconTabBarTeamAttendance, false, true);
					this.reportErrorMsg(oError, "msg_error_team_attendance_service");
				}
			});
		},
		setTeamAttendanceTotals: function (aList) {
			let nPending = 0;
			let nApproved = 0;

			if (!aList) {
				nPending = 0;
				nApproved = 0;
			} else {
				nPending = aList.reduce((n, item) => {
					return n + ((item.Status.toUpperCase() === "PENDING") ? parseInt(item.Actothours) : 0);
				}, 0);
				nApproved = aList.reduce((z, item) => {
					return z + ((item.Status.toUpperCase() === "APPROVED") ? parseInt(item.Actothours) : 0);
				}, 0);
			}

			this.teamAttendanceTotals = {
				approved: nApproved,
				pending: nPending
			};

			this.getView().setModel(new JSONModel(this.teamAttendanceTotals, true), "teamAttendanceTotals");

		},
		showTeamAttendanceTotals: function (oEvt) {

			let flexBox = new sap.m.FlexBox({
				width: "12em",
				height: "3em",
				alignContent: sap.m.FlexAlignContent.SpaceAround,
				direction: sap.m.FlexDirection.Column,
				alignItems: "Center",
				justifyContent: "Center",
				fitContainer: true
			});

			let textPending = new sap.m.Text({
				text: `${this.getText("pending_hours")}: `,
				textAlign: sap.ui.core.TextAlign.Begin
			});

			let textApproved = new sap.m.Text({
				text: `${this.getText("approved_hours")}: `,
				textAlign: sap.ui.core.TextAlign.Begin
			});

			let textPendingValue = new sap.m.Text({
				text: this.teamAttendanceTotals.pending,
				textAlign: sap.ui.core.TextAlign.End
			});

			let textApprovedValue = new sap.m.Text({
				text: this.teamAttendanceTotals.approved,
				textAlign: sap.ui.core.TextAlign.End
			});

			let hBoxPending = new sap.m.FlexBox({
				width: "100%",
				alignItems: "Start",
				justifyContent: "SpaceBetween"
			});
			let hBoxApproved = new sap.m.FlexBox({
				width: "100%",
				alignItems: "Start",
				justifyContent: "SpaceBetween"
			});

			hBoxApproved.addItem(textApproved);
			hBoxApproved.addItem(textApprovedValue);

			hBoxPending.addItem(textPending);
			hBoxPending.addItem(textPendingValue);

			textPending.addStyleClass("fontGreen");
			textApproved.addStyleClass("fontGreen");
			textPending.addStyleClass("sapUiTinyMargin");
			textApproved.addStyleClass("sapUiTinyMargin");

			textPendingValue.addStyleClass("fontGreen");
			textApprovedValue.addStyleClass("fontGreen");
			textPendingValue.addStyleClass("sapUiTinyMargin");
			textApprovedValue.addStyleClass("sapUiTinyMargin");

			flexBox.addStyleClass("sapUiTinyMargin");

			flexBox.addItem(hBoxApproved);
			flexBox.addItem(hBoxPending);

			let oPopover = new sap.m.Popover({
				showHeader: false,
				contentWidth: "14em",
				horizontalScrolling: false,
				placement: sap.m.PlacementType.Top,
				content: [flexBox]
			});
			oPopover.openBy(oEvt.getSource());
		},
		saveDialog: function () {
			let newmodel = this.getView().getModel("newcovoffrequest");
			let fromdate = this.zeroTimezone(newmodel.getData().fromdate);
			let todate = this.zeroTimezone(newmodel.getData().todate);
			let covoff = newmodel.getData().covoff;
			let reason = newmodel.getData().reason;
			let oModel = this.oModelCoveringOfficer; //this.getView().getModel();
			let sPernr = this.getView().getModel("currentCoveringOfficer").getData().pernr;
			oModel.createEntry(this.baseUrl + "/CoveringOfficerSet", {
				properties: {
					Person: sPernr || this.pernr,
					Begda: fromdate,
					Endda: todate,
					CovrngOfc: covoff,
					Reason: reason
				},
				groupId: "saveNewCovOff",
				success: (oData, oResponse) => {

					switch (oData.StatusCode) {
					case "E":
						this.reportErrorMsg(null, oData.StatusText);
						break;
					case "S":
						this.successMessage("mgrview_save_ok");
						this.closeDialog();
						break;
					default:
						break;
					}
				},
				error: (oError) => {
					this.reportErrorMsg(oError, "msg_error_creating_covering_officer");
				}
			});
		},
		onAdd: function () {
			var today = new Date();
			var fromDate = today;
			var toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
			this.getView().setModel(new JSONModel({
				fromdate: fromDate,
				todate: toDate,
				covoff: '',
				reason: '',
				currentDate: new Date()
			}), "newcovoffrequest");
			if (!this.draggableDialog) {
				this.draggableDialog = sap.ui.xmlfragment("com.infineon.ztmsapp.fragments.managerChangeCovOfficer", this);
				//To get access to the global model
				this.getView().addDependent(this.draggableDialog);
			}
			this.draggableDialog.open();
		},

		rebindTable: function (oTemplate, sKeyboardMode, sPath) {
			if (!oTemplate) {
				return;
			}
			let sPathEmployee = this.baseUrl;
			if (sPath) {
				sPathEmployee = sPath;
				//this._idCovOffTable.setModel(this.oModelCoveringOfficer, "coveringOfficer");
			}
			this.currentEmployeeCovOfficer = sPathEmployee;

			this._idCovOffTable.bindItems({
				path: `coveringOfficer>${sPathEmployee}/CoveringOfficerSet`,
				template: oTemplate,
				key: "Id"
			}).setKeyboardMode(sKeyboardMode);
			this._attachCoveringCount();

			this.oModelCoveringOfficer.read(sPathEmployee, {
				urlParameters: "$expand=FeatureConfigSet,CoveringOfficerSet",
				success: (oData, oResponse) => {
					this._isCovOfficerRefreshEnable = true;
				},

			});
		},
		onUpdateFinishedCoOfficer: function (oEvt, oItems, bNotRefresh) {
			let items = oItems ? oItems : oEvt.getSource().getItems();
			for (let item of items) {

				let oDataCov = oItems ? item : item.getBindingContext("coveringOfficer").getProperty(item.getBindingContext("coveringOfficer").sPath);

				oDataCov[`OldCovrngOfc`] = oDataCov.CovrngOfc;
				oDataCov[`isChangedCovrngOfc`] = false;

				oDataCov[`OldReason`] = oDataCov.Reason;
				oDataCov[`isChangedReason`] = false;

				oDataCov[`OldBegda`] = oDataCov.Begda;
				oDataCov[`isChangedBegda`] = false;

				oDataCov[`OldEndda`] = oDataCov.Endda;
				oDataCov[`isChangedEndda`] = false;

			}
			if (this._isCovOfficerRefreshEnable) {
				this._isCovOfficerRefreshEnable = false;
				this._idCovOffTable.getModel("coveringOfficer").refresh();
			}

		},
		_attachCoveringCount: function () {
			let oBinding = this._idCovOffTable.getBinding("items");
			oBinding.attachChange((sReason) => {
				this.getView().setModel(new JSONModel({
					length: oBinding.getLength(),
				}), "coveringCount");
			});
		},
		getTransformedBaseUrl: function () {
			return this.baseUrl.replace("'00000000'", "'" + this.pernr + "'");
		},
		onEdit: function () {
			let baseURl = this.currentEmployeeCovOfficer ? this.currentEmployeeCovOfficer : this.getTransformedBaseUrl();
			var covOffSetsBcp = this.oModelCoveringOfficer.getProperty(baseURl + "/CoveringOfficerSet");
			var finalArr = [];
			for (var i = 0; i < covOffSetsBcp.length; i++) {
				finalArr.push(this.oModelCoveringOfficer.getProperty("/" + covOffSetsBcp[i]));
			}
			this.covOfficerSetBackup = jQuery.extend(true, [], finalArr);
			this.oModelCoveringOfficer.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.coveringOfficerEditMode(baseURl);
		},
		onSave: function () {
			this.setBusy(true);
			for (let item of Object.entries(this.oModelCoveringOfficer.getPendingChanges())) {
				if (item[1].Begda) {
					this.zeroTimezone(item[1].Begda);
				}
				if (item[1].Endda) {
					this.zeroTimezone(item[1].Endda);
				}
			}
			//Keep changes to revert in case of error
			let oChanges = JSON.parse(JSON.stringify(this.oModelCoveringOfficer.mChangedEntities));

			if (this.oModelCoveringOfficer.hasPendingChanges()) {

				this.oModelCoveringOfficer.submitChanges({
					success: (oData, response) => {
						this._processBatchResponseCoveringOfficer(oData, oChanges);
					},
					error: (oError) => {
						this.reportErrorMsg(oError, "msg_saving_covering_officer_changes");
					}
				});
			} else {
				this.successMessage("msg_no_changes_submit");
			}
		},
		_processBatchResponseCoveringOfficer: function (oData, oChanges) {
			let items = this._idCovOffTable.getItems();
			let listItemsSuccess = [];

			if (oData.__batchResponses) {

				for (let itemBatch of oData.__batchResponses) {
					if (itemBatch.__changeResponses) {
						for (let itemResponse of itemBatch.__changeResponses) {
							let resp = JSON.parse(itemResponse.headers["sap-message"]);
							switch (resp.severity) {
							case "error":
								let itemError = items.find((item) => {
									let oItem = item.getBindingContext("coveringOfficer").getModel("coveringOfficer").getProperty(item.getBindingContext(
										"coveringOfficer").sPath);
									return oItem.Id.replace(/-/g, "").toUpperCase() === resp.target;
								});
								let oModel = itemError.getBindingContext("coveringOfficer").getModel("coveringOfficer");
								let sPath = itemError.getBindingContext("coveringOfficer").sPath;
								let sId = oModel.getProperty(sPath + "/Id");
								let oOrignalChange = oChanges[`CoveringOfficerSet(guid'${sId}')`];

								oModel.setProperty(sPath + "/StatusCode", "E");
								oModel.setProperty(sPath + "/StatusText", resp.message);
								if (oOrignalChange.Begda) {
									oModel.setProperty(sPath + "/Begda", new Date(oOrignalChange.Begda));
								}
								if (oOrignalChange.Endda) {
									oModel.setProperty(sPath + "/Endda", new Date(oOrignalChange.Endda));
								}
								if (oOrignalChange.Reason) {
									oModel.setProperty(sPath + "/Reason", oOrignalChange.Reason);
								}
								if (oOrignalChange.CovrngOfc) {
									oModel.setProperty(sPath + "/CovrngOfc", oOrignalChange.CovrngOfc);
								}
								break;
							default:

								let itemSuccess = items.find((item) => {
									let oItem = item.getBindingContext("coveringOfficer").getModel("coveringOfficer").getProperty(item.getBindingContext(
										"coveringOfficer").sPath);
									return oItem.Id.replace(/-/g, "").toUpperCase() === resp.target;
								});
								//If makes part of the list of changes 
								let itemContext = itemSuccess.getBindingContext("coveringOfficer");
								let itemModel = itemContext.getModel("coveringOfficer");

								let sCurrentStatus = itemModel.getProperty(itemContext.sPath + "/StatusCode");
								if (oChanges[itemContext.sPath.substring(1)] || (sCurrentStatus && sCurrentStatus.length >
										0)) {
									itemModel.setProperty(itemContext.sPath + "/StatusCode", "S");
									itemModel.setProperty(itemContext.sPath + "/StatusText", this.getText("mgrview_save_ok"));
								}
								this._isCovOfficerRefreshEnable = false;
								this.onUpdateFinishedCoOfficer(null, [itemModel.getProperty(itemContext.sPath)], true);
								//Remove item form pending changes
								let oDataSuccess = itemModel.getProperty(itemContext.sPath);
								listItemsSuccess.push(oDataSuccess);
								break;
							}
						}
					} else if (itemBatch.message) {
						sap.m.MessageBox.error(itemBatch.message);
					}
				}
				this.setBusy(false);
				this._resetTableState(this._idCovOffTable, "coveringOfficer", "StatusCode");
				this.showToast("msg_changes_made_check_state", false);

			} else {

				this.setBusy(false);
				this._resetTableState(this._idCovOffTable, "", "StatusCode");
				this.showToast("msg_changes_made_check_state", false);

			}
			for (let suc of listItemsSuccess) {
				delete this.oModelCoveringOfficer.mChangedEntities[`CoveringOfficerSet(guid'${suc.Id}')`];
			}
		},
		refreshCoveringOfficer: function (oEvt) {
			if (!Fragment.byId(this.getView().createId("coveringOfficerList"), "editButton").getVisible()) {
				if (this.oModelCoveringOfficer.hasPendingChanges()) {
					MessageBox.confirm(
						this.getText("msg_lost_changes"), {
							onClose: (sAction) => {
								if ("OK" === sAction) {
									this.oModelCoveringOfficer.resetChanges();
									this.coveringOfficerDisplayMode(this.currentEmployeeCovOfficer);
								}
							}
						}
					);
				} else {
					this.oModelCoveringOfficer.resetChanges();
					this.coveringOfficerDisplayMode(this.currentEmployeeCovOfficer);
				}
			} else {
				this.oModelCoveringOfficer.resetChanges();
				this.coveringOfficerDisplayMode(this.currentEmployeeCovOfficer);
			}
		},
		onNavBackMain: function () {

			if (this._checkChangesInAllModels()) {
				this._confirmLeave();
			} else {
				this.onNavBack();
				this._resetControls();
			}
		},
		_getMessageLostChange: function () {
			//the following tests were carried out to identify an unknown green salt y
			let changedModels = "";
			let isLast = false;

			if (this._hasChangeTimeCorrection) {
				isLast = (!this._hasChangeOTApproval && !this._hasChangeCoveringOfficer && !this._hasChangeTeamShift && !this._hasChangePreOTShiftApproval &&
					!this._hasChangePublicHoliday);
				changedModels = this._concatText(changedModels, this.getText("generic_time_correction"), isLast);
			}
			if (this._hasChangeOTApproval) {
				isLast = (!this._hasChangeCoveringOfficer && !this._hasChangeTeamShift && !this._hasChangePreOTShiftApproval && !this._hasChangePublicHoliday);
				changedModels = this._concatText(changedModels, this.getText("generic_overtime_approval"), isLast);
			}
			if (this._hasChangePreOTShiftApproval) {
				isLast = (!this._hasChangeCoveringOfficer && !this._hasChangeTeamShift && !this._hasChangePublicHoliday);
				changedModels = this._concatText(changedModels, this.getText("generic_pre_overtime_shift_approval"), isLast);
			}
			if (this._hasChangePublicHoliday) {
				isLast = (!this._hasChangeCoveringOfficer && !this._hasChangeTeamShift);
				changedModels = this._concatText(changedModels, this.getText("public_holiday"), isLast);
			}
			if (this._hasChangeCoveringOfficer) {
				isLast = (!this._hasChangeTeamShift);
				changedModels = this._concatText(changedModels, this.getText("mgrview_covoff"), isLast);
			}
			if (this._hasChangeTeamShift) {
				isLast = true;
				changedModels = this._concatText(changedModels, this.getText("generic_team_shift"), isLast);
			}

			return `${this.getText("msg_lost_changes_made")} ${changedModels}. ${this.getText("msg_wish_to_continue")}`;

		},
		_concatText: function (sMsg, sNew, isLast) {
			let sResult = "";
			if (sMsg.length > 0 && !isLast) {
				sResult = `${sMsg}, ${sNew}`;
			} else if (sMsg.length > 0 && isLast) {
				sResult = `${sMsg} and ${sNew}`;
			} else {
				sResult = sNew;
			}
			return sResult;
		},
		_confirmLeave: function () {
			MessageBox.confirm(
				this._getMessageLostChange(), {
					onClose: (sAction) => {
						if ("OK" === sAction) {
							this.onNavBack();
							this._resetAllModels();
							this._resetControls();
						}
					}
				}
			);
		},
		_resetControls: function () {
			this._idTeamAttendance.setVisible(false);
			this._idTimeCorrectionTable.setVisible(false);
			this._idOTApprovalTable.setVisible(false);
			this._idPreOTShiftApprovalTable.setVisible(false);
			this._publicHolidayView.byId("tblPublicHoliday").setVisible(false);

			this._oTeamShiftView.byId("mipEmployee").removeAllTokens();

			this._oTeamShiftView.byId("tblTeamShift").setVisible(false);
			this._oTeamShiftView.byId("legendTeamShift").setVisible(false);
		},
		_resetAllModels: function () {

			if (this.getView().getModel("timeCorrection") && this.getView().getModel("timeCorrection").getData()) {
				this.getView().getModel("timeCorrection").getData().results.splice(0, this.getView().getModel("timeCorrection").getData().results
					.length);
				this.getView().getModel("timeCorrection").refresh();
			}

			if (this.getView().getModel("otApproval") && this.getView().getModel("otApproval").getData()) {
				this.getView().getModel("otApproval").getData().results.splice(0, this.getView().getModel("otApproval").getData().results.length);
				this.getView().getModel("otApproval").refresh();
			}

			if (this.getView().getModel("publicHoliday") && this.getView().getModel("publicHoliday").getData()) {
				this.getView().getModel("publicHoliday").getData().results.splice(0, this.getView().getModel("publicHoliday").getData().results.length);
				this.getView().getModel("publicHoliday").refresh();
			}

			if (this.getView().getModel("preOTShiftApproval") && this.getView().getModel("preOTShiftApproval").getData()) {
				this.getView().getModel("preOTShiftApproval").getData().results.splice(0, this.getView().getModel("preOTShiftApproval").getData().results
					.length);
				this.getView().getModel("preOTShiftApproval").refresh();
			}

			if (this.oModelCoveringOfficer) {
				this.oModelCoveringOfficer.resetChanges();
				this.oModelCoveringOfficer.refresh(true, true);
			}

			if (this._oTeamShiftView.getModel("teamShift") && this._oTeamShiftView.getModel("teamShift").getData() && this._oTeamShiftView.getModel(
					"teamShift").getData().length) {
				this._oTeamShiftView.getModel("teamShift").getData().splice(0, this._oTeamShiftView.getModel("teamShift").getData().length);
				this._oTeamShiftView.getModel("teamShift").refresh();
			}

		},
		coveringOfficerEditMode: function (sBaseUrl) {
			this.oModelCoveringOfficer.resetChanges();
			let coveringOfficerListId = this.getView().createId("coveringOfficerList");

			this.rebindTable(this.oEditableCovOffTemplate, "Edit", sBaseUrl);
			Fragment.byId(coveringOfficerListId, "editButton").setVisible(false);
			Fragment.byId(coveringOfficerListId, "saveButton").setVisible(true);
			Fragment.byId(coveringOfficerListId, "cancelButton").setVisible(true);
			Fragment.byId(coveringOfficerListId, "actions").setVisible(true);
			Fragment.byId(coveringOfficerListId, "status").setVisible(true);
		},
		coveringOfficerDisplayMode: function (sBaseUrl) {
			this.oModelCoveringOfficer.resetChanges();
			let coveringOfficerListId = this.getView().createId("coveringOfficerList");

			this.rebindTable(this.oReadOnlyCovOffTemplate, "Navigation", sBaseUrl);
			Fragment.byId(coveringOfficerListId, "saveButton").setVisible(false);
			Fragment.byId(coveringOfficerListId, "cancelButton").setVisible(false);
			Fragment.byId(coveringOfficerListId, "editButton").setVisible(true);
			Fragment.byId(coveringOfficerListId, "actions").setVisible(false);
			Fragment.byId(coveringOfficerListId, "status").setVisible(false);

		},
		onCancel: function () {

			if (this.oModelCoveringOfficer.hasPendingChanges()) {
				MessageBox.confirm(
					this.getText("msg_lost_changes"), {
						onClose: (sAction) => {
							if ("OK" === sAction) {
								this.coveringOfficerDisplayMode(this.currentEmployeeCovOfficer);
								this.oModelCoveringOfficer.resetChanges();
							}
						}
					}
				);
			} else {
				this.coveringOfficerDisplayMode(this.currentEmployeeCovOfficer);
				this.oModelCoveringOfficer.resetChanges();
			}

		},

	});

});