sap.ui.core.Icon.extend('com.infineon.ztmsapp.custom.IconNumIndicator', {
	metadata: {
		properties: {
			value: {
				type: "int",
				defaultValue: 0
			}
		}
	},

	init: function () {
		this.addStyleClass('iconnumindicator-icon');
		this.addStyleClass('fontWhite');
	},

	renderer: function (oRm, oControl) {
		oControl.setSize('1em');
		sap.ui.core.IconRenderer.render.apply(this, arguments);
	},

	onAfterRendering: function () {
		var val = this.getValue();
		if (val !== 0) {
			var num = $('<a class="notification-icon--fixed"></a>');
			num.attr('title', val);
			num.html(`<small class="notification-badge">${val}</small>`);
			this.$().append(num);
		}
	}
});