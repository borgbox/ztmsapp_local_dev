sap.ui.define([
	"com/infineon/ztmsapp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/infineon/ztmsapp/util/ServiceHelper",
], function (BaseController, JSONModel, ServiceHelper) {
	"use strict";

	return BaseController.extend("com.infineon.ztmsapp.controller.PublicHoliday", {

		_tblPublicHoliday: null,
		_filterInterval: null,
		serviceHelper: ServiceHelper,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.infineon.ztmsapp.view.MyAttendance
		 */
		onInit: function () {
			this.setBusy(false);
			this._tblPublicHoliday = this.getView().byId("tblPublicHoliday");
			this.initFilter();
		},
		initFilter: function () {
			let dToday = new Date();

			this._filterInterval = {
				fromdate: new Date(dToday.getFullYear(), dToday.getMonth(), 1),
				todate: new Date(dToday.getFullYear(), dToday.getMonth() + 1, 0)
			};
			this._tblPublicHoliday.setVisible(false);
			this.getView().setModel(new JSONModel(this._filterInterval, true), "filtervalPublicHoliday");
		},
		resetpublicHolidayFilter: function () {
			this.initFilter();
		},
		validateDates: function () {
			return this.validateDateInterval(this._filterInterval.fromdate, this._filterInterval.todate);
		},
		search: function (oEvt, sPernr, sRole) {

			if (!this.validateDates()) {
				return;
			}

			let la_filters = [];
			let startDateUTC = new Date(Date.UTC(this._filterInterval.fromdate.getFullYear(), this._filterInterval.fromdate.getMonth(), this._filterInterval
				.fromdate.getDate()));
			let endDateUTC = new Date(Date.UTC(this._filterInterval.todate.getFullYear(), this._filterInterval.todate.getMonth(), this._filterInterval
				.todate.getDate()));

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
			this.getModel().read("/PublicHolidaySet", {
				filters: la_filters,
				success: (oData, oResponse) => {
					this.setBusy(false);
					this._tblPublicHoliday.setVisible(true);
					oData.results = this.configPublicHolidayChange(oData.results);
					this.getView().setModel(new JSONModel(oData), "publicHoliday");
					if (oData && oData.results.length === 0) {
						this.successMessage("msg_no_results");
					}
				},
				error: (err) => {
					this.setBusy(false);
					this.reportErrorMsg(err, "msg_error_public_holiday_service");
				}
			});

		},
		onPublicHolidaySave: function () {

			if (!this._checkChangesToSave(this._tblPublicHoliday, "publicHoliday")) {
				return;
			}

			sap.m.MessageBox.confirm(
				this.getText("mgrview_save_confirmation"), {
					onClose: (sAction) => {
						if (sAction === "OK") {
							this._savePublicHoliday();
						}
					}
				}
			);
		},
		_savePublicHoliday: function (obj) {
			//Reset status to retrieve the new ones
			this._resetStatus(this._tblPublicHoliday, "publicHoliday");

			let items = [];
			if (!obj) {
				if (!this._tblPublicHoliday) {
					return;
				}
				let contexts = this._tblPublicHoliday.getSelectedContexts();
				items = contexts.map(function (c) {
					return c.getObject();
				});

				if (items.length === 0) {
					items = [];
					for (let itemTime of this.getView().getModel("publicHoliday").getData().results) {
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
				let submitData = Object.assign({}, items[i]);
				delete submitData.OldWorkingDay;
				delete submitData.hasChanged;
				submitData.Role = this.role;
				oListCreation.push(submitData);
			}

			//Signals which is the last record so that the time evaluation will be executed in the backend
			oListCreation[oListCreation.length - 1].Last = true;
			this.setBusy(true);
			this.serviceHelper.batchCreation("/PublicHolidaySet", oListCreation, this.serviceHelper.getComponentModel(this))
				.then((res) => {
					this._processBatchResponse(res[0]);
					this.setBusy(false);
				})
				.catch((err) => {
					this.reportErrorMsg(err);
					this.setBusy(false);
				});

		},
		_processBatchResponse: function (oData) {
			let lstPublicHoliday = this.getView().getModel("publicHoliday").getData().results;
			if (oData.__batchResponses) {
				for (let itemBatch of oData.__batchResponses) {
					if (itemBatch.__changeResponses) {
						for (let itemResponse of itemBatch.__changeResponses) {
							let resp = itemResponse.body;
							switch (itemResponse.data.StatusCode) {
							case "S":
								let itemSuccess = lstPublicHoliday.find((itemPublicHol) => {
									return itemPublicHol.Id === itemResponse.data.Id
								});
								this._configPublicHolidayChangeItem(itemSuccess);
								itemSuccess.StatusCode = itemResponse.data.StatusCode;
								itemSuccess.StatusText = this.getText("msg_success_timecorrection_process");
								break;
							case "E":
								let itemError = lstPublicHoliday.find((itemPublicHol) => {
									return itemPublicHol.Id === itemResponse.data.Id
								});
								itemError.StatusCode = itemResponse.data.StatusCode;
								itemError.StatusText = itemResponse.data.StatusText;
								break;
							default:
								break;
							}

						}
					} else if (itemBatch.message) {
						sap.m.MessageBox.error(itemBatch.message);
					}
				}
				this.getView().getModel("publicHoliday").refresh();
				this._resetTableState(this._tblPublicHoliday, "publicHoliday", "StatusCode");
				this.showToast("msg_changes_made_check_state", false);
			}
		},
		configPublicHolidayChange: function (oList) {
			for (let item of oList) {
				item.Id = this.createUUID(item);
				item = this._configPublicHolidayChangeItem(item);
			}
			return oList;
		},
		_configPublicHolidayChangeItem: function (item) {
			item.OldWorkingDay = item.WorkingDay;
			item.hasChanged = function () {
				return this.WorkingDay !== this.OldWorkingDay;
			}
			return item;
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