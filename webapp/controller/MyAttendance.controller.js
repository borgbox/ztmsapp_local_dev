sap.ui.define([
	"com/infineon/ztmsapp/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("com.infineon.ztmsapp.controller.MyAttendance", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.infineon.ztmsapp.view.MyAttendance
		 */
		_idMyAttendance: null,
		onInit: function () {
			this.setBusy(false);
			this._idMyAttendance = this.getView().byId("idMyAttendance");
			this.initAttendance();
		},

		initAttendance: function () {
			var today = new Date();
			var fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
			var toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
			var filterval = new JSONModel({
				fromdate: fromDate,
				todate: toDate
			});
			this._idMyAttendance.setVisible(false);
			this.getView().setModel(filterval, "filterval");
		},
		resetMyAttendanceFilter: function () {
			this.initAttendance();
		},
		validateDates: function () {
			let oData = this.getView().getModel("filterval").getData();

			//if (this.role === "MANAGER" || this.role === "EMPLOYEE") {
			let diff = (oData.todate - oData.fromdate) / (1000 * 60 * 60 * 24);
			if (diff > 0 && diff > 30) {
				oData.todate = new Date(oData.fromdate.getFullYear(), oData.fromdate.getMonth(), oData.fromdate.getDate() + 30);
				this.showToast("msg_diff_not_bigger_30days", false);
			}
			//}

			return this.validateDateInterval(oData.fromdate, oData.todate);
		},
		searchMyAttendace: function (oEvt, sPernr, sRole) {

			if (!this.validateDates()) {
				return;
			}

			var myAttTable = this.getView().byId("idMyAttendance");
			var readurl = "/MyAttendanceSet";
			var la_filters = []; // Don't normally do this but just for the example.
			var ld_begdate = this.getView().byId("fromdate").getDateValue();
			var startDateUTC = new Date(Date.UTC(ld_begdate.getFullYear(), ld_begdate.getMonth(), ld_begdate.getDate()));
			var ld_enddate = this.getView().byId("todate").getDateValue();
			var endDateUTC = new Date(Date.UTC(ld_enddate.getFullYear(), ld_enddate.getMonth(), ld_enddate.getDate()));

			la_filters.push(new sap.ui.model.Filter({
				path: "Employee",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sPernr
			}));
			la_filters.push(new sap.ui.model.Filter({
				path: "Role",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sRole
			}));
			la_filters.push(new sap.ui.model.Filter({
				path: "Day",
				operator: sap.ui.model.FilterOperator.BT,
				value1: startDateUTC,
				value2: endDateUTC
			}));
			this.setBusy(true);
			this.getModel().read(readurl, {
				filters: la_filters,
				success: (oData, oResponse) => {
					this.setBusy(false);
					myAttTable.setVisible(true);
					var myAttendance = new JSONModel(oData);
					this.setMyAttendanceTotals(oData.results);
					this.getView().setModel(myAttendance, "myAttendance");
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}
				},
				error: (err) => {
					this.setBusy(false);
					this.reportErrorMsg(err, "msg_error_my_attendance_service"); //Error in MyAttendance service
				}
			});

		},
		setMyAttendanceTotals: function (aList) {
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

			this.myAttendanceTotals = {
				approved: nApproved,
				pending: nPending
			};

			this.getView().setModel(new JSONModel(this.myAttendanceTotals, true), "myAttendanceTotals");

		},
		showMyAttendanceTotals: function (oEvt) {

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
				text: this.myAttendanceTotals.pending,
				textAlign: sap.ui.core.TextAlign.End
			});

			let textApprovedValue = new sap.m.Text({
				text: this.myAttendanceTotals.approved,
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
		onExportPDFMyAttendance: function (sPernr, sRole) {
			this.onExportMyAttendance("PDF", sPernr, sRole);
		},
		onExportMyAttendance: function (format, sPernr, sRole) {
			var ld_begdate = this.getView().byId("fromdate").getDateValue();
			var startDateUTC = new Date(Date.UTC(ld_begdate.getFullYear(), ld_begdate.getMonth(), ld_begdate.getDate()));
			var ld_enddate = this.getView().byId("todate").getDateValue();
			var endDateUTC = new Date(Date.UTC(ld_enddate.getFullYear(), ld_enddate.getMonth(), ld_enddate.getDate()));
			let aFilters = [];
			aFilters.push(new sap.ui.model.Filter({
				path: "Filetype",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: format
			}));
			aFilters.push(new sap.ui.model.Filter({
				path: "Processtype",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: 'MYATTENDAN'
			}));
			aFilters.push(new sap.ui.model.Filter({
				path: "Employee",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sPernr
			}));
			aFilters.push(new sap.ui.model.Filter({
				path: "Role",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sRole
			}));
			aFilters.push(new sap.ui.model.Filter({
				path: "Day",
				operator: sap.ui.model.FilterOperator.BT,
				value1: startDateUTC,
				value2: endDateUTC
			}));
			this.setBusy(true);
			this.getView().getModel().read("/FileExportSet", {
				filters: aFilters,
				success: (oData, oResponse) => {
					this.fileDownload(oData);
					this.successMessage("msg_successfully_exported");
				},
				error: (oError) => {
					this.reportErrorMsg(oError, "msg_error_export_service");
				}
			});
		},
		onExportXLSMyAttendance: function (sPernr, sRole) {
			this.onExportMyAttendance("XLS", sPernr, sRole);

			//let oData = this.getView().byId("idMyAttendance").getBinding("items").getModel().getData().results;
			//let aCols = this.createColumnConfig();
			//this.onExportXLS(oData, aCols, "MyAttendance", "MyAttendance");
		},
		createColumnConfig: function () {
			let aCols = [];

			aCols.push({
				label: this.getText("empview_attendance_date"),
				property: 'Day',
				type: 'date',
				format: 'dd/mm/yyyy'
			});
			aCols.push({
				label: this.getText("empview_attendance_supervisor"),
				property: 'Supervisor',
				type: 'string'
			});
			aCols.push({
				label: this.getText("empview_attendance_shift"),
				property: 'Shift',
				type: 'string'
			});
			aCols.push({
				label: this.getText("empview_attendance_clockin"),
				property: 'Clockin',
				type: 'time',
				format: 'HH:mm:ss'
			});
			aCols.push({
				label: this.getText("empview_attendance_clockout"),
				property: 'Clockout',
				type: 'time',
				format: 'HH:mm:ss'
			});
			aCols.push({
				label: this.getText("empview_attendance_planhours"),
				property: 'Planhours',
				type: 'number',
				scale: 2,
				delimiter: true
			});
			aCols.push({
				label: this.getText("empview_attendance_schedulehours"),
				property: 'Schdlhours',
				type: 'number',
				scale: 2,
				delimiter: true
			});
			aCols.push({
				label: this.getText("empview_attendance_actualothours"),
				property: 'Acthours',
				type: 'number',
				scale: 2,
				delimiter: true
			});
			aCols.push({
				label: this.getText("empview_attendance_status"),
				property: 'Status',
				type: 'string'
			});
			aCols.push({
				label: this.getText("empview_attendance_leaveduration"),
				property: 'Leaveduration',
				type: 'number',
				scale: 2,
				delimiter: true
			});
			return aCols;
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.infineon.ztmsapp.view.MyAttendance
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.infineon.ztmsapp.view.MyAttendance
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.infineon.ztmsapp.view.MyAttendance
		 */
		//	onExit: function() {
		//
		//	}

	});

});