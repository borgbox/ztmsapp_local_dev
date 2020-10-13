sap.ui.define([
	"sap/ui/base/Object",
	"com/infineon/ztmsapp/util/utils",
	"com/infineon/ztmsapp/util/formatter",
	"com/infineon/ztmsapp/controller/BaseController",
	"com/infineon/ztmsapp/model/TeamShiftItemModel",
], function (ObjectBase, utils, formatter, BaseController, TeamShiftItemModel) {
	"use strict";
	var instance;
	var utils = utils;
	var formatter = formatter;
	var services = ObjectBase.extend("com.infineon.ztmsapp.controller.service.TMService", {
		constructor: function (pController) {
			this.oController = pController;
		},
		batchShiftChange: function (aChangeList) {

			return new Promise((resolve, reject) => {
				let returnList = [];
				let inputListSize = aChangeList.length;

				let oModel = this.oController.getModel ? this.oController.getModel() : this.oController.getView().getModel();
				let sUUID = this.createUUID();

				oModel.setDeferredGroups([sUUID]);
				let mParameter = {
					urlParameters: null,
					groupId: sUUID,
					success: function (innerdata) {
						for (let itemBatch of innerdata.__batchResponses) {
							if (itemBatch.__changeResponses) {
								for (let itemBatchChangeResp of itemBatch.__changeResponses) {
									returnList.push(itemBatchChangeResp.data);
								}
							}
						}

						for (let itemBatch of innerdata.__batchResponses) {
							if (itemBatch.message) {
								reject({
									message: itemBatch.message
								});
								return;
							}
						}

						resolve(returnList);
					},
					error: function (oError) {
						console.log(oError);
						reject(oError);
					}
				};

				for (var i = 0; i < aChangeList.length; i++) {

					let singleentry = {
						properties: aChangeList[i],
						changeSetId: "changeset " + i,
						groupId: sUUID,
						urlParameters: null,
						success: (data) => {},
						error: (oError) => {}
					};
					oModel.createEntry("/ChangeShiftSet", singleentry);
				}
				oModel.submitChanges(mParameter);
			});

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
		getTeamShiftCalendar: function (sRole, sUname, oDateBeg, oDateEnd, filtersEmployees, filtersOrgUnit) {
			let oModel = this.oController.getModel ? this.oController.getModel() : this.oController.getView().getModel();

			let startDateUTC = utils.zeroTimezone(new Date(Date.UTC(oDateBeg.getFullYear(), oDateBeg.getMonth(), oDateBeg.getDate())));
			let endDateUTC = utils.zeroTimezone(new Date(Date.UTC(oDateEnd.getFullYear(), oDateEnd.getMonth(), oDateEnd.getDate())));

			let filters = [];

			if (filtersEmployees) {
				filters.push(filtersEmployees);
			}

			if (filtersOrgUnit) {
				filters.push(filtersOrgUnit);
			}

			filters.push(new sap.ui.model.Filter({
				path: "Role",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sRole
			}));
			if (sUname && sUname.length > 0) {
				filters.push(new sap.ui.model.Filter({
					path: "Uname",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sUname
				}));
			}

			filters.push(new sap.ui.model.Filter({
				path: "Date",
				operator: sap.ui.model.FilterOperator.BT,
				value1: startDateUTC,
				value2: endDateUTC
			}));

			let sorterDate = new sap.ui.model.Sorter("Date", null, null);

			return new Promise((resolve, reject) => {
				oModel.read("/TeamCalendarSet", {
					filters: filters,
					sorters: [sorterDate],
					urlParameters: "$expand=ShiftsAllowedSet",
					success: (res) => {
						if (res.results.length > 0) {
							resolve(this._processAppointmentsPlain(res.results));
							//resolve(this._processAppointments(res.results));
						} else {

							resolve(null);
						}
					},
					error: (err) => {
						reject(err);
					}
				});
			});

		},
		_processAppointmentsPlain: function (oTeamShiftSet) {

			//Create a set of personal numbers
			let setPernr = new Set();
			for (let itemShiftSet of oTeamShiftSet) {
				setPernr.add(itemShiftSet.Pernr);
			}

			let employeeShifts = [];
			
			for (let sItemPernr of setPernr.keys()) {
				//The employee and the days 
				let arrayByPernr = oTeamShiftSet.filter(function (itemTeamShift) {
					return itemTeamShift.Pernr === sItemPernr;
				});

				//for (let oEmployeeData of arrayByPernr) {
				let employeeRow = {};
				let lblCoveringOfficer = this.oController.getText("acting_as");
				employeeRow.data = {
					name: `${arrayByPernr[0].Fullname} (${arrayByPernr[0].Pernr}) - ${arrayByPernr[0].Shiftgroup}`,
					pernr: arrayByPernr[0].Pernr,
					CoverOffiName: arrayByPernr[0].CoverOffiName && arrayByPernr[0].CoverOffiName.length > 0 ?
						`${lblCoveringOfficer} ${arrayByPernr[0].CoverOffiName}` : "", //CoverOffiName
					employeeRole: arrayByPernr[0].Role,
					Personnelarea: arrayByPernr[0].Personnelarea,
					CoveringOfficer: arrayByPernr[0].CoveringOfficer,
					Shiftgroup: arrayByPernr[0].Shiftgroup
				};

				for (let i = 0; i < arrayByPernr.length; i++) {

					//employeeRow[`_${i}`] = new TeamShiftItemModel();
					employeeRow[`_${i}`] = Object.create(TeamShiftItemModel);
					employeeRow[`_${i}`].start = new Date(arrayByPernr[i].Date.getFullYear(), arrayByPernr[i].Date.getMonth(), arrayByPernr[i].Date.getDate(),
						0, 0);
					employeeRow[`_${i}`].shift = arrayByPernr[i].Shift;
					employeeRow[`_${i}`].originalShift = arrayByPernr[i].Shift;
					employeeRow[`_${i}`].ChangeShift = arrayByPernr[i].ChangeShift;
					employeeRow[`_${i}`].CanChangeShift = arrayByPernr[i].CanChangeShift;
					employeeRow[`_${i}`].OthoursFilled = arrayByPernr[i].OthoursFilled;
					employeeRow[`_${i}`].IsCallback = arrayByPernr[i].IsCallBack;
					//OtHoursReq
					employeeRow[`_${i}`].OtHoursReq = parseInt(arrayByPernr[i].OtHoursReq).toString();
					employeeRow[`_${i}`].OtHoursApproved =  arrayByPernr[i].OtHours === arrayByPernr[i].OtHoursReq;
					employeeRow[`_${i}`].OthoursFilled = arrayByPernr[i].OtHoursReq.length > 0 && arrayByPernr[i].OtHoursReq !== "0.00";
					employeeRow[`_${i}`].OtHours = employeeRow[`_${i}`].OtHoursReq;//arrayByPernr[i].OthoursFilled ? parseInt(arrayByPernr[i].OtHours).toString() : "";
					employeeRow[`_${i}`].OtHoursOriginal = employeeRow[`_${i}`].OtHours;//arrayByPernr[i].OthoursFilled ? parseInt(arrayByPernr[i].OtHours).toString() : "";
					employeeRow[`_${i}`].ConscShftchg = parseInt(arrayByPernr[i].ConscShftchg);
					employeeRow[`_${i}`].OtHoursRg = arrayByPernr[i].OtHoursRg ? arrayByPernr[i].OtHoursRg.split(",").map((item) => {
						return {
							key: item
						}
					}) : [];
					employeeRow[`_${i}`].OtHoursRgCallBack = []; 
					employeeRow[`_${i}`].OtHoursRgOriginal = employeeRow[`_${i}`].OtHoursRg;
					employeeRow[`_${i}`].Id = this.createUUID();
					employeeRow[`_${i}`].Violation = arrayByPernr[i].Violation ? arrayByPernr[i].Violation : "";
					employeeRow[`_${i}`].PotentialViolation = arrayByPernr[i].PotentialViolation;
					employeeRow[`_${i}`].valueState = sap.ui.core.ValueState.None;
					employeeRow[`_${i}`].valueStateText = arrayByPernr[i].Tooltip ? arrayByPernr[i].Tooltip : "";
					employeeRow[`_${i}`].StatusReqOt = "";
					employeeRow[`_${i}`].MessageOt = "";
					employeeRow[`_${i}`].CanCreateOt = arrayByPernr[i].CanCreateOt;
					employeeRow[`_${i}`].dateKind = this.getDataKind(arrayByPernr[i]);
					employeeRow[`_${i}`].shiftEditable = arrayByPernr[i].CanChange;
					employeeRow[`_${i}`].shiftSet = [];

					/*					employeeRow[`_${i}`] = {

											start: new Date(arrayByPernr[i].Date.getFullYear(), arrayByPernr[i].Date.getMonth(), arrayByPernr[i].Date.getDate(), 0, 0),
											shift: arrayByPernr[i].Shift,
											originalShift: arrayByPernr[i].Shift,
											ChangeShift: arrayByPernr[i].ChangeShift,
											CanChangeShift: arrayByPernr[i].CanChangeShift,
											OthoursFilled: arrayByPernr[i].OthoursFilled,
											OtHours: arrayByPernr[i].OthoursFilled ? parseInt(arrayByPernr[i].OtHours).toString() : "",
											OtHoursOriginal: arrayByPernr[i].OthoursFilled ? parseInt(arrayByPernr[i].OtHours).toString() : "",
											checkIsOTChanged: function () {
												return this.OtHours !== this.OtHoursOriginal;
											},
											ConscShftchg: parseInt(arrayByPernr[i].ConscShftchg),
											OtHoursRg: arrayByPernr[i].OtHoursRg ? arrayByPernr[i].OtHoursRg.split(",").map((item) => {
												return {
													key: item
												}
											}) : [],
											Id: this.createUUID(),
											Violation: arrayByPernr[i].Violation,
											PotentialViolation: arrayByPernr[i].PotentialViolation,
											valueState: sap.ui.core.ValueState.None,
											valueStateText: arrayByPernr[i].Tooltip ? arrayByPernr[i].Tooltip : "",
											StatusReqOt: "",
											MessageOt: "",
											CanCreateOt: arrayByPernr[i].CanCreateOt,
											checkIsChanged: function () {
												return this.originalShift !== this.shift;
											},
											dateKind: this.getDataKind(arrayByPernr[i]),
											shiftEditable: arrayByPernr[i].CanChange,
											shiftSet: []
										};*/
					employeeRow[`_${i}`].dateKindColor = formatter.getDateKindStyle(employeeRow[`_${i}`].dateKind);
					for (let shiftOption of arrayByPernr[i].ShiftsAllowedSet.results) {
						employeeRow[`_${i}`].shiftSet.push({
							shift: shiftOption.Shift
						});
					}

				}

				employeeShifts.push(employeeRow);
				//}
			}

			return employeeShifts;

		},
		_processAppointments: function (oTeamShiftSet) {

			//Create a set of personal numbers
			let setPernr = new Set();
			for (let itemShiftSet of oTeamShiftSet) {
				setPernr.add(itemShiftSet.Pernr);
			}

			let oAppointments = {
				startDate: oTeamShiftSet[0].Date,
				people: []
			};

			for (let sItemPernr of setPernr.keys()) {
				//The employee and the days 
				let arrayByPernr = oTeamShiftSet.filter(function (itemTeamShift) {
					return itemTeamShift.Pernr === sItemPernr;
				});

				//Set the employee header data
				let oEmployee = {
					name: `${arrayByPernr[0].Fullname} (${arrayByPernr[0].Pernr}) - ${arrayByPernr[0].Shiftgroup}`,
					pernr: arrayByPernr[0].Pernr,
					CoverOffiName: arrayByPernr[0].CoverOffiName && arrayByPernr[0].CoverOffiName.length > 0 ?
						`Acting as ${arrayByPernr[0].CoverOffiName}` : "", //CoverOffiName
					employeeRole: arrayByPernr[0].Role,
					Personnelarea: arrayByPernr[0].Personnelarea,
					CoveringOfficer: arrayByPernr[0].CoveringOfficer,
					Shiftgroup: arrayByPernr[0].Shiftgroup,
					appointments: []
				};

				for (let oEmployeeData of arrayByPernr) {
					let oAppoint = {
						start: new Date(oEmployeeData.Date.getFullYear(), oEmployeeData.Date.getMonth(), oEmployeeData.Date.getDate(), 0, 0),
						end: new Date(oEmployeeData.Date.getFullYear(), oEmployeeData.Date.getMonth(), oEmployeeData.Date.getDate(), 24, 0),
						shift: oEmployeeData.Shift,
						originalShift: oEmployeeData.Shift,
						ChangeShift: oEmployeeData.ChangeShift,
						CanChangeShift: oEmployeeData.CanChangeShift,
						OtHours: oEmployeeData.OtHours,
						OtHoursOriginal: oEmployeeData.OtHours,
						checkIsOTChanged: function () {
							return this.OtHours !== this.OtHoursOriginal;
						},
						ConscShftchg: parseInt(oEmployeeData.ConscShftchg),
						OtHoursRg: oEmployeeData.OtHoursRg ? oEmployeeData.OtHoursRg.split(",").map((item) => {
							return {
								key: item
							}
						}) : [],
						Id: this.createUUID(),
						valueState: sap.ui.core.ValueState.None,
						valueStateText: "",
						CanCreateOt: oEmployeeData.CanCreateOt,
						checkIsChanged: function () {
							return this.originalShift !== this.shift;
						},
						dateKind: this.getDataKind(oEmployeeData),
						shiftEditable: oEmployeeData.CanChange,
						shiftSet: []
					};

					for (let shiftOption of oEmployeeData.ShiftsAllowedSet.results) {
						oAppoint.shiftSet.push({
							shift: shiftOption.Shift
						});
					}
					oEmployee.appointments.push(oAppoint);
				}
				oAppointments.people.push(oEmployee);
			};
			return oAppointments;

		},
		getTimeCorrectionCountByStatus: function (sEmployee, sStatus, sRole, dBeg, dEnd) {
			return this.getCountTimeCorrectionOrOTApproval("TimeCorrectionSet", sEmployee, sStatus, sRole, dBeg, dEnd);
		},
		getOTApprovalCountByStatus: function (sEmployee, sStatus, sRole, dBeg, dEnd) {
			return this.getCountTimeCorrectionOrOTApproval("OTApprovalSet", sEmployee, sStatus, sRole, dBeg, dEnd);
		},
		getPreOTApprovalCountByStatus: function (sEmployee, sStatus, sRole, dBeg, dEnd) {
			return this.getCountTimeCorrectionOrOTApproval("PreOTShiftApprovalSet", sEmployee, sStatus, sRole, dBeg, dEnd);
		},		
		getCountTimeCorrectionOrOTApproval: function (sEntity, sEmployee, sStatus, sRole, dBeg, dEnd) {

			let oModel = this.oController.getModel ? this.oController.getModel() : this.oController.getView().getModel();
			let aFilters = [];

			let startDateUTC = new Date(Date.UTC(dBeg.getFullYear(), dBeg.getMonth(), dBeg.getDate()));
			let endDateUTC = new Date(Date.UTC(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate()));

			aFilters.push(new sap.ui.model.Filter({
				path: "Employee",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sEmployee
			}));

			aFilters.push(new sap.ui.model.Filter({
				path: "Day",
				operator: sap.ui.model.FilterOperator.BT,
				value1: startDateUTC,
				value2: endDateUTC
			}));

			aFilters.push(new sap.ui.model.Filter({
				path: "Role",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sRole
			}));

			aFilters.push(new sap.ui.model.Filter({
				path: "Status",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: sStatus
			}));

			return new Promise((resolve, reject) => {
				oModel.read(`/${sEntity}/$count`, {
					filters: aFilters,
					success: (oData, oResponse) => {
						resolve(oData);
					},
					error: (err) => {
						reject(err);
					}
				});

			});

		},
		getEmployeeList: function (aUserFilterList) {
			let oModel = this.oController.getModel ? this.oController.getModel() : this.oController.getView().getModel();
			let aFilters = [];

			aFilters.push(aUserFilterList);

			aFilters.push(new sap.ui.model.Filter({
				path: "NoCoveringOfficer",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: true
			}));

			return new Promise((resolve, reject) => {

				oModel.read("/EmployeeDataSet", {
					filters: aFilters,
					urlParameters: {
						"$select": "Employee,Fullname"
					},
					success: (oData, oResponse) => {
						resolve(oData);
					},
					error: (err) => {
						reject(err);
					}
				});

			});

		},
		getDataKind: function (oEmployee) {
			
			if (oEmployee.PotentialViolation) {
				return "PTV";
			}
			if (oEmployee.PlannedLeave) {
				return "PL";
			}
			if (oEmployee.HalfLeave) {
				return "HL";
			}
			if (oEmployee.BookedLeave) {
				return "LV";
			}
			if (oEmployee.Changeshift || oEmployee.ChangeShift) {
				return "CH";
			}
			if (oEmployee.PublicHoliday) {
				return "PH";
			}
			if (oEmployee.RestDay) {
				return "ORD";
			}
			/*case "WD":
			case "":
			case "":
			case "":
			case "":
			case "":
			case "":*/
		}

	});
	return {
		getInstance: function (pController) {
			if (!instance) {
				instance = new services(pController);
			}
			return instance;
		}
	};
});