sap.ui.define([], function () {

	return {
		getDateInterval: function (startDate, endDate) {
			let nIndex = 0;
			var dates = [],
				currentDate = startDate,
				addDays = function (days) {
					var date = new Date(this.valueOf());
					date.setDate(date.getDate() + days);
					return date;
				};
			while (currentDate <= endDate) {
				nIndex += 1;
				dates.push({
					dayOfMonth: currentDate.getDate(),
					dayOfWeek: currentDate.toDateString().substring(0, 3),
					isWeekend: currentDate.getDay() === 6 || currentDate.getDay() === 0 ? true : false,
					visible: true,
					index: nIndex
				});
				currentDate = addDays.call(currentDate, 1);
			}
			return dates;

		},
		zeroTimezone: function (oDate) {
			oDate.setHours(oDate.getHours() + (-1 * (oDate.getTimezoneOffset() / 60)));
			return oDate;
		}

	};
});