sap.ui.define([
	"com/infineon/ztmsapp/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageBox',
	"com/infineon/ztmsapp/util/ServiceHelper",
], function (Controller, JSONModel, MessageBox, ServiceHelper) {
	"use strict";

	return Controller.extend("com.infineon.ztmsapp.controller.Support", {
		_parameterSetTable: null,

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.infineon.ztmsapp.view.Support
		 */
		_mipEmployee: null,
		_ServiceHelper: ServiceHelper,
		_PreOTTable: null,
		_mcbReqType: null,
		_mcbSeverity: null,
		_mcbSubobject: null,
		onInit: function () {
			this._PreOTTable = this.getView().byId("idPreOTTable");
			this._mipEmployee = this.getView().byId("mipEmployee");
			this._mcbSeverity = this.getView().byId("mcbSeverity");
			this._mcbReqType = this.getView().byId("mcbReqType");
			this._mcbSubobject = this.getView().byId("mcbSubobject");
			this.getOwnerComponent().getRouter().getRoute("SupportView").attachMatched(this._onRouteMatched, this);
			this.oModel = this.getView().getModel() || this.getOwnerComponent().getModel();
			this._parameterSetTable = this.byId("idParametersTable");
			this.oReadOnlyParametersTemplate = this._parameterSetTable.getBindingInfo("items").template;
			this.oReadOnlyPreOTTemplate = this._PreOTTable.getBindingInfo("items").template;
			this._initEditableTemplates();
		},
		_initEditableTemplates: function () {

			this.oEditableParametersTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Input({
						value: "{Cfgkey1}",
						type: "Text",
						placeholder: ""
					}),
					new sap.m.Input({
						value: "{Cfgkey2}",
						type: "Text",
						placeholder: ""
					}), new sap.m.Input({
						value: "{Cfgvalue}",
						type: "Text",
						placeholder: ""
					}), new sap.m.Input({
						value: "{Cfgcomment}",
						type: "Text",
						placeholder: ""
					}),
					new sap.m.Input({
						value: "{BusinessApp}",
						type: "Text",
						placeholder: ""
					}),
					new sap.m.Input({
						value: "{BusinessRule}",
						type: "Text",
						placeholder: ""
					}),

					new sap.m.Button({
						icon: "sap-icon://delete",
						press: (oEvent) => {
							var curEvent = oEvent;
							var table = curEvent.getSource().getParent().getTable();
							var sPath = curEvent.getSource().getBindingContext().sPath;

							MessageBox.confirm(
								this.getText("mgrview_delete"), {
									onClose: (sAction) => {
										if ("OK" === sAction) {
											this.setBusy(true);
											this.getView().getModel().remove(sPath, {
												success: () => {
													this.successMessage("mgrview_delete_ok");
												},
												error: (err) => {
													this.reportErrorMsg(err, "supportview_error_removing_parameter");
												}
											});
										}
									}
								}
							);
						}
					}),
					new sap.ui.core.Icon({
						visible: "{= ${StatusCode} !== '' }",
						color: "{= ${StatusCode} === 'S' ? '#2B7D2B' : '#BB0000' }",
						tooltip: "{= ${StatusText}}",
						src: "{= ${StatusCode} === 'S' ? 'sap-icon://complete' : 'sap-icon://status-error' }"
					})
				]
			});

			let hboxClockIn = new sap.m.HBox();
			let hboxClockOut = new sap.m.HBox();
			/*			let deleteClockIn = new sap.m.Button({
							visible: "{preOT>AdjClockinFilled}",
							icon: "sap-icon://delete",
							press: [this.cancelClockInOutAdjustHour, this]
						});
						let deleteClockOut = new sap.m.Button({
							visible: "{preOT>AdjClockoutFilled}",
							icon: "sap-icon://delete",
							press: [this.cancelClockInOutAdjustHour, this]
						});
						deleteClockIn.addStyleClass("sapMBtnInnerCustom");
						deleteClockIn.addStyleClass("sapUiTinyMarginBegin");

						deleteClockOut.addStyleClass("sapMBtnInnerCustom");
						deleteClockOut.addStyleClass("sapUiTinyMarginBegin");*/

			hboxClockIn.addItem(new sap.m.TimePicker({
					change: [this.checkChange, this],
					validationSuccess: [this.checkChange, this],
					value: "{ path: 'preOT>AdjClockin', type: 'sap.ui.model.odata.type.Time', formatOptions: {pattern: 'HH:mm'} }",
					displayFormat: "HH:mm",
					placeholder: "{i18n>enter_clock_in}"
				}))
				//hboxClockIn.addItem(deleteClockIn);
			hboxClockOut.addItem(new sap.m.TimePicker({
					change: [this.checkChange, this],
					validationSuccess: [this.checkChange, this],
					value: "{ path: 'preOT>AdjClockout', type: 'sap.ui.model.odata.type.Time', formatOptions: {pattern: 'HH:mm'} }",
					displayFormat: "HH:mm",
					placeholder: "{i18n>enter_clock_out}"
				}))
				//hboxClockOut.addItem(deleteClockOut);

			this.oEditablePreOTTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{ path: 'preOT>Reqdate', type: 'sap.ui.model.type.DateTime', formatOptions: { pattern: 'dd.MM.yyyy' } }"
					}),
					new sap.m.Text({
						text: "{preOT>Person}"
					}),
					new sap.m.Text({
						text: "{preOT>EmployeeDataSet/Fullname}"
					}),
					new sap.m.Text({
						text: "{preOT>ReqType}"
					}),
					new sap.m.Text({
						text: {
							path: 'preOT>OtHours',
							formatter: this.formatInt
						}
					}),
					new sap.m.Input({
						value: {
							parts: [{
								path: 'preOT>OtHoursAdj'
							}, {
								path: 'preOT>OtHoursAdjFilled'
							}],
							formatter: this.formatZeroEmpty
						},
						placeholder: "",
						liveChange: [this.checkChange, this]
					}),
					new sap.m.Text({
						text: {
							path: 'preOT>ActHours',
							formatter: this.formatInt
						}
					}),
					new sap.m.Text({
						text: {
							path: 'preOT>ActHoursWBuf',
							formatter: this.formatInt
						}
					}),
					new sap.m.Text({
						text: {
							path: 'preOT>TotalHours',
							formatter: this.formatInt
						}
					}),
					new sap.m.Text({
						text: "{preOT>EntitledOt}"
					}),
					new sap.m.Text({
						text: "{preOT>ShiftGroup}"
					}),
					new sap.m.Text({
						text: "{preOT>Shift}"
					}),
					new sap.m.Input({
						value: "{preOT>AdjShift}",
						liveChange: [this.checkChange, this]
					}),
					new sap.m.Input({
						value: "{preOT>Curstatus}",
						liveChange: [this.checkChange, this]
					}),
					new sap.m.Input({
						value: "{preOT>Remarks}",
						placeholder: "",
						liveChange: [this.checkChange, this]
					}),
					new sap.m.Text({
						text: {
							parts: [{
								path: 'preOT>ActClockin'
							}, {
								path: 'preOT>ActClockinFilled'
							}],
							formatter: this.formatTime
						}
					}),
					new sap.m.Text({
						text: {
							parts: [{
								path: 'preOT>ActClockout'
							}, {
								path: 'preOT>ActClockoutFilled'
							}],
							formatter: this.formatTime
						}
					}),
					hboxClockIn,
					hboxClockOut,
					new sap.m.Input({
						value: "{preOT>ProcStatus}",
						liveChange: [this.checkChange, this]
					}),
					new sap.m.Button({
						icon: "sap-icon://delete",
						press: (oEvent) => {
							let sPath = oEvent.getSource().getBindingContext("preOT").sPath

							MessageBox.confirm(
								this.getText("mgrview_delete"), {
									onClose: (sAction) => {
										if ("OK" === sAction) {
											this.onDeletePreOT(sPath);
										}
									}
								}
							);
						}
					})

				]
			});

		},
		_onRouteMatched: function () {
			this.setBusy(false);
			this._initPreOTFilter();
			this._initLogFilter();
		},
		_initPreOTFilter: function () {
			let dToday = new Date();
			let oData = {
				fromdate: new Date(dToday.getFullYear(), dToday.getMonth(), 1),
				todate: new Date(dToday.getFullYear(), dToday.getMonth() + 1, 0),
				employeeKeys: []
			}
			this._mcbReqType.removeAllSelectedItems();
			this._mipEmployee.removeAllTokens();
			this.getView().setModel(new JSONModel(oData, true), "filterPreOT");

		},
		_initLogFilter: function () {
			let oData = {
				fromdate: new Date(),
				todate: new Date(),
				employeeKeys: []
			}
			this._mcbSeverity.removeAllSelectedItems();
			this._mcbSubobject.removeAllSelectedItems();
			this.getView().setModel(new JSONModel(oData, true), "filterLog");

		},
		onAdd: function () {
			this.getView().setModel(new JSONModel({
				Cfgkey1: '',
				Cfgkey2: '',
				Cfgvalue: '',
				Cfgcomment: '',
				BusinessApp: '',
				BusinessRule: '',
				StatusCode: '',
				StatusText: ''
			}), "newparameter");
			if (!this.draggableDialog) {
				this.draggableDialog = sap.ui.xmlfragment("com.infineon.ztmsapp.fragments.parameterNew", this);
				//To get access to the global model
				this.getView().addDependent(this.draggableDialog);
			}
			this.draggableDialog.open();
		},
		saveDialog: function () {
			let newmodel = this.getView().getModel("newparameter");
			let newdatamodel = newmodel.getData();
			let oModel = this.getView().getModel();
			oModel.createEntry("/TMSParametersSet", {
				properties: {
					Cfgkey1: newdatamodel.Cfgkey1,
					Cfgkey2: newdatamodel.Cfgkey2,
					Cfgvalue: newdatamodel.Cfgvalue,
					Cfgcomment: newdatamodel.Cfgcomment,
					BusinessApp: newdatamodel.BusinessApp,
					BusinessRule: newdatamodel.BusinessRule,
					StatusCode: newdatamodel.StatusCode,
					StatusText: newdatamodel.StatusText
				},
				groupId: "saveNewParameter",
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
					this.reportErrorMsg(oError, "supportview_error_create_parameter");
				}
			});
		},
		refreshParametersTable: function () {
			if (!this.byId("editButton").getVisible()) {
				if (this.oModel.hasPendingChanges()) {
					MessageBox.confirm(
						this.getText("msg_lost_changes"), {
							onClose: (sAction) => {
								if ("OK" === sAction) {
									this.oModel.resetChanges();
									this.parametersTableEditMode();
								}
							}
						}
					);
				} else {
					this.parametersTableEditMode();
				}
			} else {
				this.parametersDisplayMode();
			}
		},
		onEdit: function () {
			this.oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			this.parametersTableEditMode();
		},
		onEditPreOTTable: function () {
			this.preOTTableEditMode();
		},
		preOTTableEditMode: function () {
			this.rebindTablePreOT(this.oEditablePreOTTemplate, "Edit");
			this.byId("btnEditPreOT").setVisible(false);
			this.byId("bntSavePreOT").setVisible(true);
			this.byId("btnCancelPreOT").setVisible(true);
		},
		preOTDisplayMode: function () {
			this.rebindTablePreOT(this.oReadOnlyPreOTTemplate, "Navigation");
			this.byId("bntSavePreOT").setVisible(false);
			this.byId("btnCancelPreOT").setVisible(false);
			this.byId("btnEditPreOT").setVisible(true);
		},
		onCancelPreOT: function () {
			this.preOTDisplayMode();
			this.onSearch();
			this.rebindTablePreOT(this.oReadOnlyPreOTTemplate, "Navigation");
		},
		onSave: function () {
			this.setBusy(true);
			for (let item of Object.entries(this.oModel.getPendingChanges())) {
				if (item[1].Begda) {
					this.zeroTimezone(item[1].Begda);
				}
				if (item[1].Endda) {
					this.zeroTimezone(item[1].Endda);
				}
			}
			//Keep changes to revert in case of error
			let oChanges = JSON.parse(JSON.stringify(this.oModel.mChangedEntities));

			if (this.oModel.hasPendingChanges()) {
				this.oModel.submitChanges({
					success: (oData, response) => {
						this._processBatchResponseParameters(oData, oChanges);
					},
					error: (oError) => {
						this.reportErrorMsg(oError, "msg_saving_covering_officer_changes");
					}
				});
			} else {
				this.successMessage("msg_no_changes_submit");
			}
		},
		_processBatchResponseParameters: function (oData, oChanges) {
			let items = this._parameterSetTable.getItems();
			let listItemsSuccess = [];

			if (oData.__batchResponses) {
				for (let itemBatch of oData.__batchResponses) {
					if (itemBatch.__changeResponses) {
						for (let itemResponse of itemBatch.__changeResponses) {
							var header = itemResponse.headers["sap-message"];
							var severity = "success";
							var resp = "";
							if (header) {
								resp = JSON.parse(header);
								severity = resp.severity;
							}
							switch (severity) {
							case "error":
								let itemError = items.find((item) => {
									let oItem = item.getBindingContext().getModel().getProperty(item.getBindingContext().sPath);
									return oItem.Cfgkey1 + oItem.Cfgkey2.toUpperCase() === resp.target.toUpperCase();
								});
								let oModel = itemError.getBindingContext().getModel();
								let sPath = itemError.getBindingContext().sPath;
								let sId = oModel.getProperty(sPath + "/Cfgkey1") + oModel.getProperty(sPath + "/Cfgkey2");
								let oOrignalChange = oChanges[
									`TMSParametersSet(Cfgkey1='${oModel.getProperty(sPath + "/Cfgkey1")}',Cfgkey2='${oModel.getProperty(sPath + "/Cfgkey2")}')`];

								oModel.setProperty(sPath + "/StatusCode", "E");
								oModel.setProperty(sPath + "/StatusText", resp.message);
								if (oOrignalChange.Cfgkey1) {
									oModel.setProperty(sPath + "/Cfgkey1", oOrignalChange.Cfgkey1);
								}
								if (oOrignalChange.Cfgkey2) {
									oModel.setProperty(sPath + "/Cfgkey2", oOrignalChange.Cfgkey2);
								}
								if (oOrignalChange.Cfgvalue) {
									oModel.setProperty(sPath + "/Cfgvalue", oOrignalChange.Cfgvalue);
								}
								if (oOrignalChange.Cfgcomment) {
									oModel.setProperty(sPath + "/Cfgcomment", oOrignalChange.Cfgcomment);
								}
								if (oOrignalChange.BusinessApp) {
									oModel.setProperty(sPath + "/BusinessApp", oOrignalChange.BusinessApp);
								}
								if (oOrignalChange.BusinessRule) {
									oModel.setProperty(sPath + "/BusinessRule", oOrignalChange.BusinessRule);
								}
								break;
							default:
								let itemSuccess = items.find((item) => {
									let oItem = item.getBindingContext().getModel().getProperty(item.getBindingContext().sPath);
									return oItem.Cfgkey1 + oItem.Cfgkey2.toUpperCase() === resp.target.toUpperCase();
								});
								//If makes part of the list of changes 
								let sCurrentStatus = itemSuccess.getBindingContext().getModel().getProperty(itemSuccess.getBindingContext().sPath +
									"/StatusCode")
								if (oChanges[itemSuccess.getBindingContext().sPath.substring(1)] || (sCurrentStatus && sCurrentStatus.length > 0)) {
									itemSuccess.getBindingContext().getModel().setProperty(itemSuccess.getBindingContext().sPath + "/StatusCode", "S");
									itemSuccess.getBindingContext().getModel().setProperty(itemSuccess.getBindingContext().sPath + "/StatusText", this.getText(
										"mgrview_save_ok"));
								}
								this.onUpdateFinishedParameterSet(null, [itemSuccess.getBindingContext().getModel().getProperty(itemSuccess.getBindingContext()
									.sPath)]);

								//Remove item form pending changes
								let oDataSuccess = itemSuccess.getBindingContext().getModel().getProperty(itemSuccess.getBindingContext().sPath);
								listItemsSuccess.push(oDataSuccess);
								break;
							}
						}
					} else if (itemBatch.message) {
						sap.m.MessageBox.error(itemBatch.message);
					}
				}
				this._resetTableState(this._parameterSetTable, "", "StatusCode");
				this.setBusy(false);
				this.showToast("msg_changes_made_check_state", false);

			}
			for (let suc of listItemsSuccess) {
				delete this.oModel.mChangedEntities[`TMSParametersSet(Cfgkey1='${suc.Cfgkey1}',Cfgkey2='${suc.Cfgkey2}')`];
			}
		},
		onSearchLog: function (oEvt) {

			let aFilters = [];
			let filterData = this.getView().getModel("filterLog").getData();
			aFilters.push(new sap.ui.model.Filter({
				path: "IFromDate",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: new Date(Date.UTC(filterData.fromdate.getFullYear(), filterData.fromdate.getMonth(), filterData.fromdate.getDate()))
			}));

			aFilters.push(new sap.ui.model.Filter({
				path: "IToDate",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: new Date(Date.UTC(filterData.todate.getFullYear(), filterData.todate.getMonth(), filterData.todate.getDate()))
			}));

			if (this._mcbSeverity.getSelectedItems().length > 0) {
				let sSeverity = this._mcbSeverity.getSelectedItems().map((item) => {
					return item.mProperties.key;
				}).toString();

				aFilters.push(new sap.ui.model.Filter({
					path: "ISeverity",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sSeverity
				}));
			}

			if (this._mcbSubobject.getSelectedItems().length > 0) {
				let sSubobject = this._mcbSubobject.getSelectedItems().map((item) => {
					return item.mProperties.key;
				}).toString();

				aFilters.push(new sap.ui.model.Filter({
					path: "ISubobject",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sSubobject
				}));
			}

			this.setBusy(true);
			this._ServiceHelper.read("/TmslogsSet", this.oModel, true, null, null, null, aFilters, null)
				.then((res) => {

					for (let item of res[0].results) {
						switch (item.Msgty) {
						case "E":
							item.Msgty = "Error";
							item.Msgtytxt = this.getText("error");
							break;
						case "W":
							item.Msgty = "Warning";
							item.Msgtytxt = this.getText("warning");
							break;
						case "S":
							item.Msgty = "Success";
							item.Msgtytxt = this.getText("success");
							break;

						}
					}

					for (let item of res[0].results) {
						item.Aldate = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: "dd/MM/yyyy"
						}).format(item.Aldate);
						item.Altime = this.msToHMS(item.Altime.ms); //sap.ui.core.format.DateFormat.getTimeInstance({pattern: "KK:mm:ss a"}).format(new Date(item.Altime.ms));
					}
					let logModel = new JSONModel(res[0], true);
					logModel.setSizeLimit(res[0].results.length);

					this.getView().setModel(logModel, "tmsLogs");

					if (res[0].results.length === 0) {
						this.showToast("no_records_found", false);
					}
					this.setBusy(false);
				})
				.catch((err) => {
					this.reportErrorMsg(err, "msg_error_tms_service");
					this.setBusy(false);
				});

		},
		onSearch: function (oEvt) {
			let aFilters = [];
			let filterData = this.getView().getModel("filterPreOT").getData();
			let oDateFilter = new sap.ui.model.Filter({
				path: "Reqdate",
				operator: sap.ui.model.FilterOperator.BT,
				value1: new Date(Date.UTC(filterData.fromdate.getFullYear(), filterData.fromdate.getMonth(), filterData.fromdate.getDate())),
				value2: new Date(Date.UTC(filterData.todate.getFullYear(), filterData.todate.getMonth(), filterData.todate.getDate()))
			});

			if (this._mcbReqType.getSelectedItems().length > 0) {
				let aReqTypes = this._mcbReqType.getSelectedItems().map((item) => {
					return item.mProperties.key;
				});
				aFilters.push(this.createFilterOrMultipleValues("ReqType", aReqTypes, false));
			}

			aFilters.push(oDateFilter);
			let aEmployees = this._mipEmployee.getTokens().map((item) => {
				return item.mProperties.key
			});
			if (aEmployees && aEmployees.length > 0) {
				aFilters.push(this.createFilterOrMultipleValues("Person", aEmployees, false));
			}
			this._PreOTTable.setBusy(true);
			this.setBusy(true);
			this._ServiceHelper.read("/PreOTSet", this.oModel, true, null, "EmployeeDataSet", null, aFilters, null)
				.then((res) => {
					this.preOTData = res[0];
					this.configChange(this.preOTData.results);

					let preOTModel = new JSONModel(this.preOTData, true);
					preOTModel.setSizeLimit(res[0].results.length);

					this.getView().setModel(preOTModel, "preOT");
					if (res[0].results.length === 0) {
						this.showToast("no_records_found", false);
					}
					this._PreOTTable.setBusy(false);
					this.setBusy(false);
					this._PreOTTable.setVisible(true);
				})
				.catch((err) => {
					this.reportErrorMsg(err, "msg_error_preot_service");
					this._PreOTTable.setBusy(false);
					this.setBusy(false);
				});

		},
		onUpdateFinishedParameterSet: function (oEvt, oItems) {
			let items = oItems ? oItems : oEvt.getSource().getItems();

			for (let item of items) {

				let oParameters = oItems ? item : item.getBindingContext().getProperty(item.getBindingContext().sPath);

				oParameters[`OldCfgkey1`] = oParameters.Cfgkey1;
				oParameters[`isChangedCfgKey1`] = false;

				oParameters[`OldCfgkey2`] = oParameters.Cfgkey2;
				oParameters[`isChangedCfgKey2`] = false;

				oParameters[`OldCfgvalue`] = oParameters.Cfgvalue;
				oParameters[`isChangedCfgvalue`] = false;

				oParameters[`OldCfgcomment`] = oParameters.Cfgcomment;
				oParameters[`isChangedCfgcomment`] = false;

				oParameters[`OldBusinessApp`] = oParameters.OldBusinessApp;
				oParameters[`isChangedBusinessApp`] = false;

				oParameters[`OldBusinessRule`] = oParameters.BusinessRule;
				oParameters[`isChangedBusinessRule`] = false;
			}
		},
		_resetTableState: function (oTable, sModel, sReferenceProperty) {
			for (let item of oTable.getAggregation("items")) {
				let oBindindContext = sModel ? item.getBindingContext(sModel) : item.getBindingContext();
				let oModel = sModel ? item.getBindingContext(sModel).getModel(sModel) : item.getBindingContext().getModel();
				let sPath = oBindindContext.sPath;
				let oEntity = oModel.getProperty(sPath);
				//if (oModel.getProperty(sPath + `/${sReferenceProperty}`) !== 'E') {
				let hasNotChanged = oEntity.hasChanged ? !oEntity.hasChanged() : true;
				if (oEntity[sReferenceProperty] !== 'E' && hasNotChanged) {
					for (let aggregationCell of item.mAggregations.cells) {
						aggregationCell.setValueState ? aggregationCell.setValueState(sap.ui.core.ValueState.None) : null;
						aggregationCell.setValueStateText ? aggregationCell.setValueStateText("") : null;

						for (let subItem of aggregationCell.mAggregations.items ? aggregationCell.mAggregations.items : []) {
							subItem.setValueState ? subItem.setValueState(sap.ui.core.ValueState.None) : null;
							subItem.setValueStateText ? subItem.setValueStateText("") : null;
						}

					}
				}
			}
		},
		rebindTable: function (oTemplate, sKeyboardMode) {
			this._parameterSetTable.bindItems({
				path: "/TMSParametersSet",
				template: oTemplate,
				key: "Id"
			}).setKeyboardMode(sKeyboardMode);
			this._attachParametersCount();
		},
		rebindTablePreOT: function (oTemplate, sKeyboardMode) {
			this._PreOTTable.bindItems({
				path: "/results",
				template: oTemplate,
				key: "Id",
				model: "preOT"
			}).setKeyboardMode(sKeyboardMode);
			this._attachParametersCount();
		},
		_attachParametersCount: function () {
			let oBinding = this._parameterSetTable.getBinding("items");
			oBinding.attachChange((sReason) => {
				this.getView().setModel(new JSONModel({
					length: oBinding.getLength(),
				}), "parametersCount");
			});
		},
		onNavBackToMain: function (oEvt) {
			this._mipEmployee.removeAllTokens();
			this._mcbReqType.removeAllSelectedItems();
			this.onNavBack();
		},
		reset: function () {
			this._initPreOTFilter();
		},
		resetLogFilter: function () {
			this._initLogFilter();
		},
		getPreOTPathKey: function (sPath) {
			let oData = this.getView().getModel("preOT").getProperty(sPath);
			return `/PreOTSet(Reqdate=datetime'${encodeURIComponent(oData.Reqdate.toJSON().substr(0,19))}',Person='${oData.Person}',ReqType='${oData.ReqType}')`;
		},
		onOpenEmployeeRange: function (oEvt) {
			this.getUploadEmployeesPopup(this.getView(), oEvt.getSource(), this._mipEmployee);
		},
		onDeletePreOT: function (sPath) {
			this.setBusy(true);

			let sFullPath = this.getPreOTPathKey(sPath);

			this._ServiceHelper.remove(
					sFullPath, this.getOwnerComponent()
					.getModel())
				.then((res) => {
					this.showToast("mgrview_delete_ok");
					this.onSearch();
					this.setBusy(false);
				})
				.catch((err) => {
					this.reportErrorMsg(err, "msg_error_preot_service");
					this.setBusy(false);
				});

		},
		onEditPreOT: function () {

		},
		configChange: function (oList) {
			for (let item of oList) {
				item.hasChanged = false;
				item.AdjClockout.ms = item.AdjClockoutFilled ? item.AdjClockout.ms : "";
				item.AdjClockin.ms = item.AdjClockinFilled ? item.AdjClockin.ms : "";

			}
		},
		checkChange: function (oEvt) {

			let oContext = oEvt.getSource().getBindingContext("preOT");
			let oData = oContext.getProperty(oContext.getPath());
			let sAttribute = oEvt.getSource().getBindingInfo("value").binding.sPath;

			oContext.getModel("preOT").setProperty(`${oContext.sPath}/hasChanged`, true);

			switch (sAttribute) {
			case "AdjClockin":
				oContext.getModel("preOT").setProperty(`${oContext.sPath}/AdjClockinFilled`, oEvt.getSource().getValue().length > 0);
				console.log(`AdjClockinFilled: ${oEvt.getSource().getValue().length > 0}`);
				break;
			case "AdjClockout":
				oContext.getModel("preOT").setProperty(`${oContext.sPath}/AdjClockoutFilled`, oEvt.getSource().getValue().length > 0);
				console.log(`AdjClockoutFilled: ${oEvt.getSource().getValue().length > 0}`);
				break;
			}

			if (oEvt.getSource().getBindingInfo("value").parts && oEvt.getSource().getBindingInfo("value").parts.filter((item) => {
					return item.path === "OtHoursAdj"
				}).length > 0) {

				oContext.getModel("preOT").setProperty(`${oContext.sPath}/OtHoursAdj`, oEvt.getSource().getValue());
				oContext.getModel("preOT").setProperty(`${oContext.sPath}/OtHoursAdjFilled`, oEvt.getSource().getValue().length > 0);
				console.log(`OtHoursAdjFilled: ${oEvt.getSource().getValue().length > 0}`);
			}

		},
		getPreOTPathKeyFromObject: function (oObj) {
			return `/PreOTSet(Reqdate=datetime'${encodeURIComponent(oObj.Reqdate.toJSON().substr(0,19))}',Person='${oObj.Person}',ReqType='${oObj.ReqType}')`;
		},
		onSavePreOT: function (oEvt) {
			debugger;
			let itemsChanged = [];
			let aListChanges = [];

			itemsChanged = this.preOTData.results.filter((item) => {
				return item.hasChanged === true
			});

			//Set the keys for the update service
			for (let item of itemsChanged) {
				aListChanges.push({
					"sPath": this.getPreOTPathKeyFromObject(item),
					"ReqType": item.ReqType,
					"OtHoursAdj": item.OtHoursAdjFilled ? item.OtHoursAdj : "0",
					"OtHoursAdjFilled": item.OtHoursAdjFilled,
					"AdjShift": item.AdjShift,
					"Curstatus": item.Curstatus,
					"Remarks": item.Remarks,
					"AdjClockin": item.AdjClockinFilled ? item.AdjClockin : {
						ms: 0,
						__edmType: "Edm.Time"
					},
					"AdjClockinFilled": item.AdjClockinFilled,
					"AdjClockout": item.AdjClockoutFilled ? item.AdjClockout : {
						ms: 0,
						__edmType: "Edm.Time"
					},
					"AdjClockoutFilled": item.AdjClockoutFilled
				});
			}

			if (aListChanges.length === 0) {
				this.showToast("msg_no_changes_submit", false);
				return;
			}

			MessageBox.confirm(
				this.getText("mgrview_save_confirmation"), {
					onClose: (sAction) => {
						if ("OK" === sAction) {
							this._savePreOT(aListChanges);
						}
					}
				});

		},
		_savePreOT: function (aListChanges) {

			this.setBusy(true);
			this._ServiceHelper.batchUpdate(aListChanges, this._ServiceHelper.getComponentModel(this))
				.then((res) => {
					this.successMessage("mgrview_changes_ok");
					this.setBusy(false);
					this.onSearch();
					this.onCancelPreOT();
				})
				.catch((err) => {
					this.reportErrorMsg(err, "mgrview_preot_error_save");
					this.setBusy(false);
				});

		},
		parametersTableEditMode: function () {
			this.rebindTable(this.oEditableParametersTemplate, "Edit");
			this.byId("editButton").setVisible(false);
			this.byId("saveButton").setVisible(true);
			this.byId("cancelButton").setVisible(true);
			/*this.byId("status").setVisible(true);*/
		},
		parametersDisplayMode: function () {
			this.rebindTable(this.oReadOnlyParametersTemplate, "Navigation");
			this.byId("saveButton").setVisible(false);
			this.byId("cancelButton").setVisible(false);
			this.byId("editButton").setVisible(true);
			/*this.byId("status").setVisible(false);*/
		},
		onCancel: function () {
			this.parametersDisplayMode();
			this.oModel.resetChanges();
			this.rebindTable(this.oReadOnlyParametersTemplate, "Navigation");
		},

	});

});