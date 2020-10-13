sap.ui.define(["com/infineon/ztmsapp/util/formatter"], function (formatter) {
	return {
		hasChanged: function () {
			return this.AdjOtHours !== this.OldAdjOtHours ||
				this.Status !== this.OldStatus ||
				this.Action !== this.OldAction ||
				this.Comments !== this.OldComments;
		},
		initChangeControl: function () {
			this.OldAdjOtHours = formatter.formatZeroEmpty(this.AdjOtHours, this.AdjOtHoursFilled);
			this.AdjOtHours = formatter.formatZeroEmpty(this.AdjOtHours, this.AdjOtHoursFilled);
			this.OldStatus = this.Status;
			this.OldAction = "";
			this.OldComments = this.Comments;
			this.AdjOtHoursIsValid = true;
		}
	};

});