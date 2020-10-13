sap.ui.define([], function () {
	return  {
		checkIsChanged : function () {
			return this.originalShift !== this.shift;
		},
		checkIsOTChanged : function () {
			return this.OtHours !== this.OtHoursOriginal;
		}
	};
});