sap.ui.define(["com/infineon/ztmsapp/js/Constants", "com/infineon/ztmsapp/js/features", ], function (Constants, Features) {
	"use strict";
	return {
		isFutureDate: function (pDate) {
			if (!pDate)
				return true;
			let oDate = new Date();
			oDate.setHours(pDate.getHours());
			oDate.setSeconds(pDate.getSeconds());
			oDate.setMinutes(pDate.getMinutes());
			oDate.setMilliseconds(pDate.getMilliseconds());
			return pDate >= oDate;
		},
		getOTStatusColor: function (sStatus) {
			switch (sStatus) {
			case 'S': //Success
				return '#2B7D2B'
				break;
			case 'E': //Error
				return '#BB0000'
				break;
			case 'M': //Modified
				return '#FABD64'
				break;
			default:
				return '';
			}
		},
		getCommentColor: function (sOriginal, sNew) {

			if (sOriginal !== sNew) {
				return '#FABD64';
			}
			if (sNew.length === 0) {
				return '#BFBFBF';
			} else {
				return '#478f7c';
			}

		},
		getManagerScreenTitle: function (sRole) {

			switch (sRole) {
			case "HR_ADMIN":
				return this.getText("hr_admin");
				break;
			case "MANAGER":
				return this.getText("manager");
				break;
			case "APPROV_L2":
				return this.getText("approver_l2");
				break;
			case "SUPERVISOR":
				return this.getText("supervisor");
				break;
			case "REQUESTOR":
				return this.getText("requestor");
				break;
			case "MD_LEVEL":
				return this.getText("md_level");
				break;
			default:
			}

		},
		canAccessTeamShift: function (sRole) {
			return sRole === Constants.HR_ADMIN || sRole === Constants.APPROV_L2 || sRole === Constants.MANAGER || sRole === Constants.REQUESTOR;
		},
		canAccessTeamAttendance: function (sRole) {
			return sRole === Constants.HR_ADMIN || sRole === Constants.APPROV_L2 || sRole === Constants.MANAGER || sRole === Constants.SUPERVISOR ||
				sRole === Constants.MD_LEVEL;
		},

		canAccessTimeCorrection: function (sRole) {
			return sRole === Constants.APPROV_L2 || sRole === Constants.MANAGER;
		},
		canAccessCoveringOfficer: function (sRole) {
			return sRole === Constants.HR_ADMIN || sRole === Constants.APPROV_L2 || sRole === Constants.MANAGER;
		},
		canAccessAttendanceApproval: function (sRole) {
			return sRole === Constants.MD_LEVEL || sRole === Constants.APPROV_L2 || sRole === Constants.MANAGER;
		},
		canAccessOTApproval: function (sRole) {
			return sRole === Constants.MD_LEVEL || sRole === Constants.APPROV_L2;
		},
		canAccessPreOTApproval: function (sRole) {
			let hasOTApproval = false;
			hasOTApproval = Features.hasAnyRight(Features.CONST_FEATURE_APPROVE_OT);
			return sRole === Constants.MANAGER || hasOTApproval;
		},
		isRequestor: function (sRole) {
			return sRole === Constants.REQUESTOR;
		},

		getOTStatusIcon: function (sStatus) {
			switch (sStatus) {
			case 'S': //Success
				return 'sap-icon://complete'
				break;
			case 'E': //Error
				return 'sap-icon://status-error'
				break;
			case 'M': //Modified
				return 'sap-icon://edit'
				break;
			default:
				return 'sap-icon://minimize';
			}
		},
		formatZeroEmpty: function (sText, isFilled) {
			//let floatFormatter = sap.ui.core.format.NumberFormat.getFloatInstance({ minIntegerDigits: 0, maxIntegerDigits: 3, minFractionDigits: 2, maxFractionDigits: 2 });
			//let intFormatter = sap.ui.core.format.NumberFormat.getIntegerInstance();
			let ret = isFilled ? parseInt(sText, 10).toString() : "";
			return ret !== ".00" ? ret : "";
		},
		formatOTHour: function (sHours, isFilled) {
			return isFilled ? `${sHours} ${this.getText("hours")}` : this.getText("set_overtime");
			//return sHours.length > 0 && sHours !== "0" && sHours !== "0.00" ? `${sHours} ${this.getText("hours")}` : this.getText("set_overtime");
		},
		getDateKindStyle: function (sDateKind) {
			switch (sDateKind) {
			case "PTV":
				return "potencialViolation"; // "#8b9668";
				break;
			case "ORD":
				return "offRestDay"; // "#ABE2AB";
				break;
			case "WD":
				return "workingDay"; // "#EFF4F9";
				break;
			case "CH":
				return "changeDay"; // "#1A9898";
				break;
			case "PH":
				return "publicHolidayDay"; // "#FF8888";
				break;
			case "HL":
				return "halfLeaveDay"; // "#AB218E";
				break;
			case "LV":
				return "leaveDay"; // "#E78C07";
				break;
			case "PL":
				return "pendingLeaveDay"; // "#9EC7D8";
				break;
			default:
				return "";
				break;
			}
		}
	};
});