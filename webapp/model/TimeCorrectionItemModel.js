sap.ui.define(["com/infineon/ztmsapp/util/formatter"], function (formatter) {
	return {
		hasChanged: function () {
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
		},
		initChangeControl: function () {
			this.OldAdjShift = this.AdjShift;
			this.OldRemarks = this.Remarks;
			this.OldStatus = this.Status;
			this.OldAction = "";
			this.OldComments = this.Comments;

			this.OldAdjClockin = this.AdjClockin ? this.AdjClockin : {
				ms: 0,
				__edmType: "Edm.Time"
			};
			this.OldAdjClockout = this.AdjClockout ? this.AdjClockout : {
				ms: 0,
				__edmType: "Edm.Time"
			};
		},
		hasChangedExceptAction: function () {
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
	};

});