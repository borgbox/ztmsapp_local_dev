sap.ui.core.Icon.extend('com.infineon.ztmsapp.custom.IconPopoverTooltip', {
	metadata: {
		properties: {
			textPopover: {
				type: "string",
				defaultValue: ""
			}
		}
	},

	init: function () {},

	renderer: function (oRm, oControl) {
		sap.ui.core.IconRenderer.render.apply(this, arguments);
	},

	onAfterRendering: function () {
		
		let flBViolation = new sap.m.FlexBox({
			//width: "100%",
			//height: "2em",
			alignItems: "Center",
			justifyContent: "Center",
			fitContainer: true
		});

		//flexBox.addStyleClass("greenLabel");
		let textViolation = new sap.m.Text({
			text: this.getTextPopover()
		});
		textViolation.addStyleClass("fontGreen");
		textViolation.addStyleClass("sapUiNoMargin");
		textViolation.addStyleClass("sapUiTinyMarginTop");
		flBViolation.addItem(textViolation);

		let oPopover = new sap.m.Popover({
			showHeader: false,
			content: [flBViolation],
			placement: "Top"
		});

		this.onmouseover = () => {
			oPopover.openBy(this)
		};
		this.onmouseout = () => {
			oPopover.close()
		};

	}
});