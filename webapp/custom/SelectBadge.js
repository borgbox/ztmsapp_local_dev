sap.m.Select.extend('com.infineon.ztmsapp.custom.SelectBadge', {
	metadata: {
		properties: {
			badge: {
				type: "int",
				defaultValue: 0
			}
		}
	},

	init: function () {
		this.addStyleClass('iconnumindicator-icon');
		this.addStyleClass('fontWhite');
		sap.m.Select.prototype.init.apply(this, arguments);
	},
	onBeforeRendering: function () {
		sap.m.Select.prototype.onBeforeRendering.apply(this, arguments);
	},
	//renderer: "sap.m.SelectRenderer",
	renderer: function (oRm, oControl) {
		//oControl.setSize('1em');

		sap.m.SelectRenderer.render.apply(this, arguments);
	},

	onAfterRendering: function () {
		var val = this.getBadge();

		var select = $("__select1-__clone40");
		if (select) {
			//select.html(`<small class="notification-badge">${val}</small>`);
			select.html(`<div>123344444</div>`) ;
		}
		sap.m.Select.prototype.onAfterRendering.apply(this, arguments);

		/*		if (val !== 0) {
					var num = $('<a class="notification-icon--fixed"></a>');
					num.attr('title', val);
					num.html(`<small class="notification-badge">${val}</small>`);
					this.$().append(num);
				}*/
	}
});