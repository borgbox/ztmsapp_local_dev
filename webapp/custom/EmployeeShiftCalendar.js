sap.ui.define(
	[
		"sap/ui/unified/Calendar",
		"sap/ui/unified/calendar/MonthRenderer",
		'sap/ui/unified/calendar/CalendarUtils',
		'sap/ui/unified/calendar/CalendarDate',
		'sap/ui/unified/CalendarLegend',
		'sap/ui/unified/CalendarLegendRenderer',
		'sap/ui/core/library',
		'sap/ui/unified/library',
		"com/infineon/ztmsapp/util/formatter",
		"sap/f/Avatar",
		"com/infineon/ztmsapp/js/Constants",
		"com/infineon/ztmsapp/custom/IconPopoverTooltip"
	],
	function (Calendar, MonthRenderer, CalendarUtils, CalendarDate, CalendarLegend, CalendarLegendRenderer, coreLibrary, library, Formatter,
		Avatar, Constants, IconPopoverTooltip) {
		return Calendar.extend("com.infineon.ztmsapp.custom.EmployeeShiftCalendar", {
			metadata: {
				properties: {
					/**
					 * Defines the items contained within this control.
					 */
					items: {
						type: "any",
						multiple: true,
						singularName: "item",
						bindable: "bindable",
						selector: "#{id} .sapMListItems",
						dnd: true
					},
					value: {
						type: "string"
					},
				},
				aggregations: {},
				events: {
					cancelPreOTShift: {
						parameters: {
							evt: {
								type: "any"
							}
						}
					},
					withdrawPreOTShift: {
						parameters: {
							evt: {
								type: "any"
							}
						}
					}
				}

			},
			init: function () {
				// execute standard control method
				sap.ui.unified.Calendar.prototype.init.apply(this, arguments);
			},
			onCancelPreOTShift: function (oEvt) {
				this.fireEvent("cancelPreOTShift", {
					evt: oEvt
				});
				event.preventDefault();
			},
			onWithdrawPreOTShift: function (oEvt) {
				this.fireEvent("withdrawPreOTShift", {
					evt: oEvt
				});
				event.preventDefault();
			},
			renderer: function (oRm, oControl) {
				var oldRenderDay = sap.ui.unified.calendar.MonthRenderer.renderDay;
				var shifts = oControl.getItems();
				let oThisControl = oControl;
				// shortcut for sap.ui.unified.CalendarDayType
				var CalendarDayType = library.CalendarDayType;

				// shortcut for sap.ui.core.CalendarType
				var CalendarType = coreLibrary.CalendarType;
				MonthRenderer.renderDay = function (oRm, oMonth, oDay, oHelper, bOtherMonth, bWeekNum, iNumber, sWidth, bDayName) {
					let oBundle = oMonth.getModel("i18n").getResourceBundle();
					CalendarUtils._checkCalendarDate(oDay);
					var oSecondaryDay = new CalendarDate(oDay, oHelper.sSecondaryCalendarType),
						mAccProps = {
							role: "gridcell",
							selected: false,
							label: "",
							describedby: ""
						},
						bBeforeFirstYear = oDay._bBeforeFirstYear,
						sAriaType = "";

					var sYyyymmdd = oMonth._oFormatYyyymmdd.format(oDay.toUTCJSDate(), true);
					var iWeekDay = oDay.getDay();
					var iSelected = oMonth._checkDateSelected(oDay);
					var aDayTypes = oMonth._getDateTypes(oDay);
					var bEnabled = oMonth._checkDateEnabled(oDay);
					var i = 0;

					// Days before 0001.01.01 should be disabled.
					if (bBeforeFirstYear) {
						bEnabled = false;
					}

					var iWeekNumber = 0;
					if (bWeekNum) {
						iWeekNumber = CalendarUtils.calculateWeekNumber(oDay.toUTCJSDate(), oHelper.iYear, oHelper.sLocale, oHelper.oLocaleData);
						mAccProps["describedby"] = oHelper.sId + "-CW" + " " + oHelper.sId + "-WNum-" + iWeekNumber;
					}

					if (!bDayName) {
						var sWHId = "";
						if (iNumber < 0) {
							sWHId = oHelper.sId + "-WH" + iWeekDay;
						} else {
							sWHId = oHelper.sId + "-WH" + iNumber;
						}
						mAccProps["describedby"] = mAccProps["describedby"] + " " + sWHId;
					}

					oRm.write("<div");
					oRm.writeAttribute("id", oHelper.sId + "-" + sYyyymmdd);
					oRm.addClass("sapUiCalItem");
					oRm.addClass("stack-top");
					oRm.addClass("sapUiCalWDay" + iWeekDay);
					if (sWidth) {
						oRm.addStyle("width", sWidth);
					}
					if (iWeekDay == oHelper.iFirstDayOfWeek) {
						oRm.addClass("sapUiCalFirstWDay");
					}
					if (bOtherMonth && oHelper.iMonth != oDay.getMonth()) {
						oRm.addClass("sapUiCalItemOtherMonth");
						mAccProps["disabled"] = true;
					}
					if (oDay.isSame(oHelper.oToday)) {
						oRm.addClass("sapUiCalItemNow");
						mAccProps["label"] = oHelper.sToday + " ";
					}

					if (iSelected > 0) {
						oRm.addClass("sapUiCalItemSel"); // day selected
						mAccProps["selected"] = true;
					} else {
						mAccProps["selected"] = false;
					}
					if (iSelected == 2) {
						oRm.addClass("sapUiCalItemSelStart"); // interval start
						mAccProps["describedby"] = mAccProps["describedby"] + " " + oHelper.sId + "-Start";
					} else if (iSelected == 3) {
						oRm.addClass("sapUiCalItemSelEnd"); // interval end
						mAccProps["describedby"] = mAccProps["describedby"] + " " + oHelper.sId + "-End";
					} else if (iSelected == 4) {
						oRm.addClass("sapUiCalItemSelBetween"); // interval between
					} else if (iSelected == 5) {
						oRm.addClass("sapUiCalItemSelStart"); // interval start
						oRm.addClass("sapUiCalItemSelEnd"); // interval end
						mAccProps["describedby"] = mAccProps["describedby"] + " " + oHelper.sId + "-Start";
						mAccProps["describedby"] = mAccProps["describedby"] + " " + oHelper.sId + "-End";
					}

					aDayTypes.forEach(function (oDayType) {
						if (oDayType.type != CalendarDayType.None) {
							if (oDayType.type === CalendarDayType.NonWorking) {
								oRm.addClass("sapUiCalItemWeekEnd");
								return;
							}
							oRm.addClass("sapUiCalItem" + oDayType.type);
							sAriaType = oDayType.type;
							if (oDayType.tooltip) {
								oRm.writeAttributeEscaped('title', oDayType.tooltip);
							}
						}
					});

					//oMonth.getDate() is a public date object, so it is always considered local timezones.
					if (oMonth.getParent() && oMonth.getParent().getMetadata().getName() === "sap.ui.unified.CalendarOneMonthInterval" && oDay.getMonth() !==
						oMonth.getStartDate().getMonth()) {
						oRm.addClass("sapUiCalItemOtherMonth");
					}

					if (!bEnabled) {
						oRm.addClass("sapUiCalItemDsbl"); // day disabled
						mAccProps["disabled"] = true;
					}

					if (oHelper.aNonWorkingDays) {
						for (i = 0; i < oHelper.aNonWorkingDays.length; i++) {
							if (iWeekDay == oHelper.aNonWorkingDays[i]) {
								oRm.addClass("sapUiCalItemWeekEnd");
								break;
							}
						}
					} else if ((iWeekDay >= oHelper.iWeekendStart && iWeekDay <= oHelper.iWeekendEnd) ||
						(oHelper.iWeekendEnd < oHelper.iWeekendStart && (iWeekDay >= oHelper.iWeekendStart || iWeekDay <= oHelper.iWeekendEnd))) {
						oRm.addClass("sapUiCalItemWeekEnd");
					}

					oRm.writeAttribute("tabindex", "-1");
					oRm.writeAttribute("data-sap-day", sYyyymmdd);
					if (bDayName) {
						mAccProps["label"] = mAccProps["label"] + oHelper.aWeekDaysWide[iWeekDay] + " ";
					}
					mAccProps["label"] = mAccProps["label"] + oHelper.oFormatLong.format(oDay.toUTCJSDate(), true);

					if (sAriaType !== "") {
						CalendarLegendRenderer.addCalendarTypeAccInfo(mAccProps, sAriaType, oHelper.oLegend);
					}

					if (oHelper.sSecondaryCalendarType) {
						mAccProps["label"] = mAccProps["label"] + " " + oMonth._oFormatSecondaryLong.format(oSecondaryDay.toUTCJSDate(), true);
					}

					oRm.writeAccessibilityState(null, mAccProps);
					oRm.writeClasses();
					oRm.writeStyles();
					oRm.write(">"); // div element

					var aRows = shifts;
					var shift = "";
					var chgshft = false;
					var oldshift = "";
					let otHours = "";
					let othoursFilled = false;
					if (aRows) {
						for (var z = 0; z < aRows.length; z++) {
							var oRow = aRows[z];
							if (oDay.isSame(CalendarDate.fromLocalJSDate(oRow.Date))) {
								shift = oRow.Shift;
								oldshift = oRow.ShiftOld;
								chgshft = oRow.ChangeShift;
								otHours = oRow.OtHours;
								othoursFilled = oRow.OthoursFilled;
								break;
							} else {
								shift = "";
							}
						}
					}
					oRm.write("<div");
					oRm.addClass("sapUiCalItemText");
					oRm.writeClasses();
					oRm.addStyle("line-height", "10px");
					if (chgshft) {
						oRm.addStyle("height", "44px");
					} else {
						oRm.addStyle("height", "42px");
						oRm.addStyle("position", "relative");
						oRm.addStyle("top", "-0.25em");
					}

					oRm.writeStyles();
					oRm.write(">"); // div element

					let isCancelPossible = parseInt(oRow.OtHoursReq) > 0 && oRow.Preotstatus === Constants.SENT;
					let isWithdrawPossible = parseInt(oRow.OtHoursReq) > 0 && (oRow.Preotstatus !== Constants.REJWITHDR &&
						oRow.Preotstatus !== Constants.SENT &&
						oRow.Preotstatus !== Constants.CANCELED &&
						oRow.Preotstatus !== Constants.REJECTED);
					
					if (oRow.Violation && oRow.Violation.length > 0) {
						let violationIcon = new IconPopoverTooltip({
							src: "sap-icon://error",
							tooltip: " ",
							textPopover: oRow.Violation,
							color: "#BB0000",
							size: "1.15em"
						});
						if (othoursFilled || parseInt(oRow.OtHoursReq) > 0) {
							violationIcon.addStyleClass("violation-icon-employee_with_ot");
						} else {
							violationIcon.addStyleClass("violation-icon-employee");
						}
						if (chgshft) {
							violationIcon.addStyleClass("violation-icon-employee-with-change");
						} else {
							violationIcon.addStyleClass("violation-icon-employee-without-change")
						}
						oRm.renderControl(violationIcon);
					}

					//FAFN OT Icon Begin
					if (othoursFilled || parseInt(oRow.OtHoursReq) > 0) {
						oRm.write("<div");
						oRm.addStyle("float", "left");
						if (chgshft) {
							oRm.addStyle("margin-top", "-0.1em");
						} else {
							oRm.addStyle("margin-top", "0.2em");
						}

						oRm.addStyle("margin-left", "0.30em");
						oRm.addStyle("font-size", "0.7em");
						oRm.addStyle("z-index", "0");
						oRm.addStyle("position", "absolute");
						oRm.writeStyles();
						oRm.write(">");

						let otIcon = new sap.ui.core.Icon({
							src: "sap-icon://pending",
							tooltip: " ",
							color: "#3F5161",
							size: "1.5em"
						});

						let flexBox = new sap.m.FlexBox({
							width: "8em",
							//height: isCancelPossible ? "4.5em" : "2m",
							alignItems: "Center",
							alignContent: "SpaceAround",
							direction: "Column",
							justifyContent: "Center",
							fitContainer: true
						});
						flexBox.addStyleClass("sapUiTinyMarginTopBottom");

						let sHourOT = othoursFilled ? oRow.OtHours : oRow.OtHoursReq;
						let textOTHour = new sap.m.Text({
							//text: `${Formatter.formatZeroEmpty(otHours,true)} ${oMonth.getModel("i18n").getResourceBundle().getText("hours")}`
							text: `${oBundle.getText("overtime")} ${Formatter.formatZeroEmpty(sHourOT,true)} ${oMonth.getModel("i18n").getResourceBundle().getText("hours")}`
						});

						textOTHour.addStyleClass("fontGreen");
						flexBox.addItem(textOTHour);
						if (oRow.ShiftReq.length > 0) {
							let textShift = new sap.m.Text({
								text: `${oBundle.getText("shift")} ${oRow.ShiftReq}`
							});
							textShift.addStyleClass("fontGreen");
							flexBox.addItem(textShift);
						}

						if (isCancelPossible) {

							let btnCancelPreOTShift = new sap.m.Button({
								text: oMonth.getModel("i18n").getResourceBundle().getText("cancel_request"),
								press: [oThisControl.onCancelPreOTShift, oThisControl]
							});
							btnCancelPreOTShift.controlContext = oRow;
							btnCancelPreOTShift.addStyleClass("sapMBtnInnerCustom");
							btnCancelPreOTShift.addStyleClass("sapUiTinyMarginTop");
							flexBox.addItem(btnCancelPreOTShift);
						}

						if (isWithdrawPossible) {

							let btnWithDrawPreOTShift = new sap.m.Button({
								text: oMonth.getModel("i18n").getResourceBundle().getText("withdraw_request"),
								press: [oThisControl.onWithdrawPreOTShift, oThisControl]
							});
							btnWithDrawPreOTShift.controlContext = oRow;
							btnWithDrawPreOTShift.addStyleClass("sapMBtnInnerCustom");
							btnWithDrawPreOTShift.addStyleClass("sapUiTinyMarginTop");
							flexBox.addItem(btnWithDrawPreOTShift);
						}

						let oPopover = new sap.m.Popover({
							showHeader: false,
							content: [flexBox]
						});
						otIcon.onmouseover = () => {
							oPopover.openBy(otIcon)
						};

						otIcon.onmouseout = isCancelPossible || isWithdrawPossible ? null : () => {
							oPopover.close()
						};
						oRm.renderControl(otIcon);

						oRm.write("</div>");
					}
					//FAFN OT Icon End

					// Date text for days before 0001.01.01 should not be visible.
					if (!bBeforeFirstYear) {

						oRm.write("<span");
						oRm.addStyle("display", "block");
						oRm.addStyle("height", "7px");
						oRm.addStyle("margin-top", "7px");
						oRm.addStyle("font-size", "0.6rem");
						oRm.addStyle("text-align", "right");
						oRm.addStyle("margin-right", "0.4rem");
						oRm.writeStyles();
						oRm.write(">"); // span
						oRm.write(oDay.getDate());
						oRm.write("</span>");

						oRm.write("<span");
						oRm.addStyle("height", "7px");
						if (chgshft) {
							oRm.addStyle("color", "red");
						}
						oRm.writeStyles();
						oRm.write(">"); // span
						oRm.write(shift);
						if (chgshft && oldshift) {
							oRm.write("<strike");
							oRm.addStyle("display", "block");
							oRm.addStyle("color", "black");
							oRm.addStyle("margin-top", "2px");
							oRm.writeStyles();
							oRm.write(">"); // span
							oRm.write("(" + oldshift + ")");
							oRm.write("</strike>");
						}
						oRm.write("</span>");
					}
					oRm.write("</div>");

					if (bWeekNum && iWeekDay == oHelper.iFirstDayOfWeek) {
						// add week number - inside first day of the week to allow better position and make it easier for ItemNavigation
						oRm.write("<span");
						oRm.writeAttribute("id", oHelper.sId + "-WNum-" + iWeekNumber);
						oRm.addClass("sapUiCalWeekNum");
						oRm.writeClasses();
						oRm.writeAccessibilityState(null, {
							role: "rowheader",
							desribedby: oHelper.sId + "-CW"
						});
						oRm.write(">"); // span
						oRm.write(iWeekNumber);
						oRm.write("</span>");
					}

					if (bDayName) {
						oRm.write("<span");
						oRm.addClass("sapUiCalDayName");
						oRm.writeClasses();
						oRm.write(">"); // span
						oRm.write(oHelper.aWeekDays[iWeekDay]);
						oRm.write("</span>");
					}

					if (oHelper.sSecondaryCalendarType) {
						oRm.write("<span");
						oRm.addClass("sapUiCalItemSecText");
						oRm.writeClasses();
						oRm.write(">"); // span
						oRm.write(oSecondaryDay.getDate());
						oRm.write("</span>");
					}

					oRm.write("</div>");

				};

				sap.ui.unified.Calendar.getMetadata().getRenderer().render(oRm, oControl);
				sap.ui.unified.calendar.MonthRenderer.renderDay = oldRenderDay;

				let oHeader = oControl.getAggregation('header');
				oHeader.mProperties.textButton1 = oHeader._getTextButton3();
				oHeader._setTextButton4(oControl.mAggregations.month[1].mProperties.date.getFullYear());
				oHeader._setAriaLabelButton4(oControl.mAggregations.month[1].mProperties.date.getFullYear());

				oHeader.mEventRegistry["pressButton1"] = null;
				oHeader.mEventRegistry["pressButton2"] = null;
				oHeader.mEventRegistry["pressButton3"] = null;
				oHeader.mEventRegistry["pressButton4"] = null;

				window.addEventListener("keydown", function (event) {
					if (event.key && event.key === "Escape") {
						//event.preventDefault();
						oHeader.mProperties.textButton1 = oHeader.mProperties.textButton1.split("–")[0].trim();
						oHeader.setTextButton1(oHeader.mProperties.textButton1);
					}
				}, false);

			}

		});
	}
);