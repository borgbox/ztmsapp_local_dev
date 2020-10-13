sap.ui.define(
	["sap/ui/unified/CalendarAppointment", 'sap/ui/core/date/UniversalDate', 'sap/ui/unified/CalendarAppointment',
		'sap/ui/unified/CalendarLegendRenderer',
		'sap/ui/Device', 'sap/ui/unified/library', 'sap/ui/core/InvisibleText', "sap/base/Log"
	],
	function (Control, UniversalDate, CalendarAppointment, CalendarLegendRenderer, Device, library, InvisibleText, Log) {

		return Control.extend("com.infineon.ztmsapp.custom.CalendarAppointment", {
			metadata: {
				properties: {
					shift: {
						type: "string"
					},
					shiftEditable: {
						type: "sap.ui.model.type.Boolean"
					},
					dateKind: {
						type: "string"
					}
				},
				aggregations: {
					_shift: {
						type: "sap.m.Select",
						multiple: false
					},
					_linkOT: {
						type: "sap.m.Link",
						multiple: false
					}
				},
				events: {
					setOverTime: {
						parameters: {
							myLink: {
								type: "any"
							}
						}
					}
				}
			},
			init: function () {
				this.initialState = true;
				this.setAggregation("_shift", new sap.m.Select({
					valueState: "{teamShift>valueState}",
					valueStateText: "{teamShift>valueStateText}",
					selectedKey: "{teamShift>shift}",
					tooltip: "{teamShift>valueStateText}",
					items: {
						path: "teamShift>shiftSet",
						template: new sap.ui.core.Item({
							key: `{teamShift>shift}`,
							text: `{teamShift>shift}`
						}),
						templateShareable: false
					}
				}));

				this.setAggregation("_linkOT", new sap.m.Link({
					text: "{i18n>set_overtime}",
					press: [this.onSetOvertime, this],
					visible: "{teamShift>CanCreateOt}",
				}));

				this.overRideRenderer();
			},
			overRideRenderer: function () {

				//let renderkp = sap.ui.unified.CalendarRowRenderer.renderAppointment;
				if (!sap.ui.unified.CalendarRowRenderer.renderAppointment.isCutomized) {
					sap.ui.unified.CalendarRowRenderer.renderAppointment = function (oRm, oRow, oAppointmentInfo, aTypes, bRelativePos) {

						var sTooltip = oAppointmentInfo.appointment.getTooltip_AsString();
						var sDateKind = oAppointmentInfo.appointment.getDateKind();
						var sTitle = oAppointmentInfo.appointment.getTitle();
						var sText = oAppointmentInfo.appointment.getText();
						var sId = oAppointmentInfo.appointment.getId();
						var mAccProps = {
							labelledby: {
								value: InvisibleText.getStaticId("sap.ui.unified", "APPOINTMENT") + " " + sId + "-Descr",
								append: true
							},
							selected: null
						};
						var aAriaLabels = oRow.getAriaLabelledBy();
						if (aAriaLabels.length > 0) {
							mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + aAriaLabels.join(" ");
						}
						if (sTitle) {
							mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + sId + "-Title";
						}
						if (sText) {
							mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + sId + "-Text";
						}
						oRm.write("<div");
						oRm.writeElementData(oAppointmentInfo.appointment);
						oRm.addClass("sapUiCalendarApp");
						if (oAppointmentInfo.appointment.getTentative()) {
							oRm.addClass("sapUiCalendarAppTent");
							mAccProps["labelledby"].value = mAccProps["labelledby"].value + " " + InvisibleText.getStaticId("sap.ui.unified",
								"APPOINTMENT_TENTATIVE");
						}
						if (!sText) {
							oRm.addClass("sapUiCalendarAppTitleOnly");
						}
						console.log(oAppointmentInfo.begin + " - " + oAppointmentInfo.end + "-> " + (oAppointmentInfo.begin + oAppointmentInfo.end));
						if (!bRelativePos) {
							// write position
							if (oRow._bRTL) {
								oRm.addStyle("right", oAppointmentInfo.begin + "%");
								oRm.addStyle("left", oAppointmentInfo.end + "%");
							} else {
								oRm.addStyle("left", oAppointmentInfo.begin + "%");
								oRm.addStyle("right", oAppointmentInfo.end + "%");
							}
						}

						oRm.addStyle("height", "100%");
						if (sTooltip) {
							oRm.writeAttributeEscaped("title", sTooltip);
						}
						oRm.writeAccessibilityState(oAppointmentInfo.appointment, mAccProps);
						//FAFN - My custom CSS
						oRm.addStyle("width", "7%");
						oRm.addStyle("border-style", "none");
						oRm.addStyle("margin-bottom", "0.00rem");

						oRm.writeClasses();
						oRm.writeStyles();
						oRm.write(">"); // div element

						let oShift = oAppointmentInfo.appointment.getAggregation("_shift");
						switch (sDateKind) {
						case "ORD":
							oShift.addStyleClass("offRestDay"); // "#ABE2AB";
							break;
						case "WD":
							oShift.addStyleClass("workingDay"); // "#EFF4F9";
							break;
						case "CH":
							oShift.addStyleClass("changeDay"); // "#C14646";
							break;
						case "PH":
							oShift.addStyleClass("publicHolidayDay"); // "#FF8888";
							break;
						case "HL":
							oShift.addStyleClass("halfLeaveDay"); // "#AB218E";
							break;
						case "LV":
							oShift.addStyleClass("leaveDay"); // "#E78C07";
							break;
						case "PL":
							oShift.addStyleClass("preLeaveDay"); // "#BFBFBF";
							break;
						}
						let oLinkOT = oAppointmentInfo.appointment.getAggregation("_linkOT");

						oLinkOT.addStyleClass("customLinkStyle");
						oRm.renderControl(oShift);
						oRm.renderControl(oLinkOT);
						this.renderResizeHandle(oRm, oRow, oAppointmentInfo.appointment);
						oRm.write("</div>");
					};

				}

				sap.ui.unified.CalendarRowRenderer.renderAppointment.isCutomized = true;
				//sap.ui.unified.CalendarRowRenderer.renderAppointment = renderkp;
			},
			onSetOvertime: function (oEvt) {
				this.fireEvent("setOverTime", {
					myLink: oEvt.oSource
				});
			},
			setShiftEditable: function (bShiftEditable) {
				this.setProperty("shiftEditable", bShiftEditable, true);
				this.getAggregation("_shift").setEnabled(bShiftEditable);
			},
			setShift: function (sShift) {
				this.setProperty("shift", sShift, true);
				debugger;
				if (this.initialState) {
					this.initialState = false;
					return;
				}

				let oShift = this.getAggregation("_shift");
				let oBindingContext = oShift.getBindingContext("teamShift");
				let sPath = oBindingContext.sPath;
				let isChanged = oBindingContext.getProperty(sPath).checkIsChanged();
				//Set the shift as selected key of the Select aggregation
				//oShift.setSelectedKey(sShift);

				if (!isChanged) {
					oShift.setValueState(sap.ui.core.ValueState.None);
					oShift.setValueStateText("");
					return;
				}

				if (isChanged && (oShift.getValueState() === sap.ui.core.ValueState.None || oShift.getValueState() ===
						sap.ui.core.ValueState.Warning || sap.ui.core.ValueState.Success)) {
					oShift.setValueState(sap.ui.core.ValueState.Warning);
					oShift.setValueStateText(oShift.getParent().getModel("i18n").getResourceBundle().getText(
						"modified"));
				}

				//Can change?
				let sPatchAppointment = sPath.substring(0, sPath.length - 2);
				let lstAppointments = oBindingContext.getProperty(sPatchAppointment);
				let nConscShftchg = oBindingContext.getProperty(sPath).ConscShftchg;
				let sOriginalShift = oBindingContext.getProperty(sPath).originalShift;

				if (!oBindingContext.getProperty(oBindingContext.sPath).CanChangeShift) {
					oShift.setValueState(sap.ui.core.ValueState.None);
					oShift.setValueStateText("");
					oShift.setSelectedKey(sOriginalShift);
					oBindingContext.getProperty(oBindingContext.sPath).shift = sOriginalShift;

					sap.m.MessageToast.show(oShift.getParent().getModel("i18n").getResourceBundle().getText(
						"can_not_change_shift"), {
						closeOnBrowserNavigation: false
					});
				}

				let contChange = 0;
				for (let item of lstAppointments) {
					item.checkIsChanged() || item.ChangeShift ? contChange++ : contChange = 0;
					if ((nConscShftchg + 1) === contChange) {
						oShift.setValueState(sap.ui.core.ValueState.None);
						oShift.setValueStateText("");
/*						oShift.setSelectedKey(sOriginalShift);
						sap.m.MessageToast.show(oShift.getParent().getModel("i18n").getResourceBundle().getText(
							"consecutive_change_limit_reached"), {
							closeOnBrowserNavigation: false
						});*/

						oShift.setValueState(sap.ui.core.ValueState.Error);
						oShift.setValueStateText(oShift.getParent().getModel("i18n").getResourceBundle().getText(
							"consecutive_change_limit_reached"));

					}
				}

			},
			setDateKind: function (sDateKind) {
				this.setProperty("dateKind", sDateKind, true);
			},
			getShift: function () {
				return this.shift;
			}
		});
	}
);