/*global QUnit*/

sap.ui.define([
	"com/infineon/ztmsapp/controller/EmployeeView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("EmployeeView Controller");

	QUnit.test("I should test the EmployeeView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});