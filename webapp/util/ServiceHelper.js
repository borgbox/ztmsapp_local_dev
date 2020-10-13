sap.ui.define(["sap/ui/base/Object"],
	function (Obj) {
		"use strict";
		return {

			/*Example
			this.ServiceHelper.read(this.baseUrl,this.oModel,true,"Field","Expand1Set,Expand2Set",null,null,null)
			.then((res)=>{
			})
			.catch((err)=>{
			})
			*/
			read: function (sPath, oModel, bAsync, sSelect, sExpand, sorters, filter, top, skip, inlinecount) {

				bAsync = bAsync ? bAsync : true;

				return new Promise((resolve, reject) => {
					let config = {
						async: bAsync,
						success: (oData, oResponse) => {
							resolve([oData, oResponse]);
						},
						error: (error) => {
							reject(error);
						}
					};

					if (sorters) {
						config.sorters = sorters;
					}

					if (sSelect) {
						if (config.urlParameters) {
							config.urlParameters.$select = sSelect;
						} else {
							config.urlParameters = {
								$select: sSelect
							};
						}
					}

					if (sExpand) {
						if (config.urlParameters) {
							config.urlParameters.$expand = sExpand;
						} else {
							config.urlParameters = {
								$expand: sExpand
							};
						}
					}

					if (top) {
						if (config.urlParameters) {
							config.urlParameters.$top = top;
						} else {
							config.urlParameters = {
								$top: top
							};
						}
					}

					if (skip) {
						if (config.urlParameters) {
							config.urlParameters.$skip = skip;
						} else {
							config.urlParameters = {
								$skip: skip
							};
						}
					}

					if (inlinecount) {
						if (config.urlParameters) {
							config.urlParameters.$inlinecount = inlinecount;
						} else {
							config.urlParameters = {
								$inlinecount: inlinecount
							};
						}
					}

					if (filter) {
						config.filters = [filter];
					}

					oModel.read(sPath, config);
				});

			},
			update: function (sPath, oEntry, oModel) {

				return new Promise((resolve, reject) => {
					oModel.update(sPath, oEntry, {
						success: (res) => {
							resolve(res);
						},
						error: (err) => {
							reject(err);
						}
					});
				});

			},
			createEntry: function (sPath, oEntry, oModel) {
				oModel.createEntry(sPath, {
					properties: oEntry,
					success: (oData, oResponse) => {
						resolve([oData, oResponse])
					},
					error: (err) => {
						reject(err);
					}
				});
			},
			remove: function (sPath, oModel) {
				return new Promise((resolve, reject) => {
					oModel.remove(sPath, {
						success: (res) => {
							resolve(res);
						},
						error: (err) => {
							reject(err);
						}
					});
				});
			},
			/*
			In oListUpdate a attribute sPath is expected to be passed to the update function
			e.g. sPath: EntitySet(guid'0050568f-06d9-1eea-86fe-83f55872ab50') 
			*/
			batchUpdate: function (oListUpdate, oModel) {

				return new Promise((resolve, reject) => {

					let returnList = [];

					//Create UUID for the deferred group
					let sUUID = this.createUUID();
					oModel.setDeferredGroups([sUUID]);

					let mParameter = {
						urlParameters: null,
						groupId: sUUID,
						success: function (res) {
							for (let itemBatch of res.__batchResponses) {
								if (itemBatch.__changeResponses) {
									for (let itemBatchChangeResp of itemBatch.__changeResponses) {
										returnList.push(itemBatchChangeResp.data);
									}
								} else if (itemBatch.message) {
									reject({
										statusCode: parseInt(itemBatch.response.statusCode),
										responseText: itemBatch.message
									});
								}
							}
							resolve([res, returnList]);
						},
						error: function (oError) {
							reject(oError);
						}
					};

					for (var i = 0; i < oListUpdate.length; i++) {
						let submitData = Object.assign({}, oListUpdate[i]);
						delete submitData.sPath;
						let singleentry = {
							changeSetId: "changeset " + i,
							groupId: sUUID,
							urlParameters: null,
							success: (data) => {},
							error: (oError) => {}
						};
						oModel.update(oListUpdate[i].sPath, submitData, singleentry);
					}
					oModel.submitChanges(mParameter);
				});
			},
			batchCreation: function (sPath, oListCreation, oModel) {

				return new Promise((resolve, reject) => {

					let returnList = [];

					//Create UUID for the deferred group
					let sUUID = this.createUUID();
					oModel.setDeferredGroups([sUUID]);

					let mParameter = {
						urlParameters: null,
						groupId: sUUID,
						success: function (res) {
							for (let itemBatch of res.__batchResponses) {
								if (itemBatch.__changeResponses) {
									for (let itemBatchChangeResp of itemBatch.__changeResponses) {
										returnList.push(itemBatchChangeResp.data);
									}
								}
							}
							resolve([res, returnList]);
						},
						error: function (oError) {
							reject(oError);
						}
					};

					for (var i = 0; i < oListCreation.length; i++) {

						let singleentry = {
							properties: oListCreation[i],
							changeSetId: "changeset " + i,
							groupId: sUUID,
							urlParameters: null,
							success: (data) => {},
							error: (oError) => {}
						};
						oModel.createEntry(sPath, singleentry);
					}
					oModel.submitChanges(mParameter);

				});

			},
			asynchGetJSON: function (oThis, sPath) {
				return new Promise((resolve, reject) => {
					$.ajax({
						url: sPath,
						type: "GET",
						dataType: "json",
						context: oThis,
						success: (res) => {
							resolve(res);
						},
						error: (err) => {
							reject(err);
						},
					})
				});

			},
			asynchPostJSON: function (oThis, sPath, oData) {

				return new Promise((resolve, reject) => {
					$.ajax({
						url: sPath,
						type: "POST",
						dataType: "json",
						contentType: "application/json; charset=utf-8",
						data: JSON.stringify(oData),
						context: oThis,
						success: (res) => {
							resolve(res);
						},
						error: (err) => {
							reject(err);
						},
					})
				});

			},
			asynchDelete: function (oThis, sPath) {

				return new Promise((resolve, reject) => {
					$.ajax({
						url: sPath,
						type: "DELETE",
						context: oThis,
						success: (res) => {
							resolve(res);
						},
						error: (err) => {
							reject(err);
						},
					})
				});

			},
			promiseAll: function (oListPromises) {
				return Promise.all(oListPromises);
			},
			getODataModelV2: function (sUrl, sName) {
				let oModel = sName ? sap.ui.model.odata.v2.ODataModel(sUrl, Sname) : sap.ui.model.odata.v2.ODataModel(sUrl);
			},
			getODataModelV1: function (sUrl, sName) {
				let oModel = sName ? sap.ui.model.odata.ODataModel(sUrl, Sname) : sap.ui.model.odata.ODataModel(sUrl);
			},
			getComponentModel: function (oController) {
				return oController.getOwnerComponent().getModel();
			},
			getModel: function (oController) {
				return oController.getView().getModel();
			},
			submitChangesPromise: function (oModel) {
				return new Promise((resolve, reject) => {
					oModel.submitChanges({
						success: (oData, response) => {
							resolve([oData, response]);
						},
						error: (err) => {
							reject(err);
						}
					});
				});
			},
			createUUID: function () {
				let dt = new Date().getTime();
				let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
					let r = (dt + Math.random() * 16) % 16 | 0;
					dt = Math.floor(dt / 16);
					return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
				});
				return uuid;
			},
			createFilterOrMultipleValues: function (path, arr, bAnd) {
				let arrFlt = [];
				for (let item of arr) {
					arrFlt.push(new sap.ui.model.Filter({
						path: path,
						operator: sap.ui.model.FilterOperator.EQ,
						value1: item,
						and: bAnd
					}));
				}

				return new sap.ui.model.Filter(arrFlt, false);
			},
			startSessionTimerBaseOnRequest: function (sURLSegment, oContext, iDuration) {

				let oThis = this;
				let oldXHROpen = window.XMLHttpRequest.prototype.open;

				if (iDuration <= 0) {
					oContext.setModel(new sap.ui.model.json.JSONModel({
						timer: "",
					}, true), "clockSession");
					return;
				}

				window.XMLHttpRequest.prototype.open = function (method, url, async, user, password) {

					this.addEventListener('load', function () {
						if (url.includes(sURLSegment)) {
							oThis.startTimer(iDuration, oContext); //5 minutes
							console.log("Service call: " + url)
						}
					});
					return oldXHROpen.apply(this, arguments);
				}

			},
			startTimer: function (duration, oContext) {
				let timer = duration,
					minutes, seconds;

				if (this.clockSession) {
					clearInterval(this.clockSession);
				}

				this.clockSession = setInterval(function () {

					minutes = parseInt(timer / 60, 10);
					seconds = parseInt(timer % 60, 10);

					minutes = minutes < 10 ? "0" + minutes : minutes;
					seconds = seconds < 10 ? "0" + seconds : seconds;

					if (!this.clockSession) {
						this.clockSession = {
							timer: minutes + ":" + seconds,
						};
					} else {
						this.clockSession.timer = minutes + ":" + seconds;
					}

					if (!oContext.getModel("clockSession")) {
						oContext.setModel(new sap.ui.model.json.JSONModel(this.clockSession, true), "clockSession");
					}

					if (--timer < 0) {
						timer = 0; //duration;
					}
				}, 1000);
			}

		};
	});