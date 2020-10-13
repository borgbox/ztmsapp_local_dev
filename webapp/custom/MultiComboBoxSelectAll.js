sap.m.MultiComboBox.extend('com.infineon.ztmsapp.custom.MultiComboBoxSelectAll', {
	ALLCUSTOMSELECT: "ALLCUSTOMSELECT",
	metadata: {
		properties: {}
	},
	init: function () {
		sap.m.MultiComboBox.prototype.init.apply(this, arguments);
	},
	onBeforeRendering: function () {
		sap.m.MultiComboBox.prototype.onBeforeRendering.apply(this, arguments);
	},
	renderer: function (oRm, oControl) {
		sap.m.MultiComboBoxRenderer.render.apply(this, arguments);
	},
	onAfterRendering: function () {
		sap.m.MultiComboBox.prototype.onAfterRendering.apply(this, arguments);
	},
	onItemsLoaded: function () {
		sap.m.MultiComboBox.prototype.onItemsLoaded.apply(this, arguments);
	},
	removeSelectAllToken: function () {
		//The select all token should not appear
		if (!this._oTokenizer.mAggregations.tokens) {
			return;
		}
		let selAllTokenIndex = this._oTokenizer.mAggregations.tokens.findIndex((item) => {
			return item.getKey() === this.ALLCUSTOMSELECT
		});
		selAllTokenIndex >= 0 ? this._oTokenizer.mAggregations.tokens.splice(selAllTokenIndex, 1) : null;
	},
	changeSelection: function () {
		this.removeSelectAllToken();

		//If the changed item is the select all
		if (arguments[0].mParameters.changedItem.getKey() === this.ALLCUSTOMSELECT) {
			this.setSelectedItems(arguments[0].mParameters.selected ? this.getItems() : []);
		} else { //Checks if all items are selected or not

			itemsNotSelectAll = this.getItems().reduce((n, item) => {
				return n + (item.getKey() !== this.ALLCUSTOMSELECT ? 1 : 0);
			}, 0);

			selectedNotSelectAll = this.getSelectedItems().reduce((n, item) => {
				return n + (item.getKey() !== this.ALLCUSTOMSELECT ? 1 : 0);
			}, 0);

			if (itemsNotSelectAll === selectedNotSelectAll) {
				this.addSelectedItem(this.getItemByKey(this.ALLCUSTOMSELECT));
			} else {
				this.removeSelectedItem(this.getItemByKey(this.ALLCUSTOMSELECT));
			}
		}
		sap.m.MultiComboBox.prototype.onChange.apply(this, arguments);

		this.removeSelectAllToken();
	},
	onAfterRenderingList: function () {
		if (!this.getItemByKey(this.ALLCUSTOMSELECT)) {
			let sText = "";
			sText = this.getParent().getModel("i18n").getResourceBundle().getText("select_all");
			sText = sText.length > 0 && sText !== "select_all" ? sText : "Select All";

			let list = this.getItems()
			this.removeAllItems();

			list.unshift(new sap.ui.core.Item({
				key: this.ALLCUSTOMSELECT,
				text: sText
			}));
			for (let item of list) {
				this.addItem(item);
			}
		}

		this.removeSelectAllToken();

		this.attachSelectionChange(this.changeSelection.bind(this));

		sap.m.MultiComboBox.prototype.onAfterRenderingList.apply(this, arguments);
	}
});