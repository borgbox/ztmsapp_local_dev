sap.ui.define([
	"com/infineon/ztmsapp/js/uilog"
], function (UiLog) {
	return {
		features_employee: [],
		features_manager: [],
		personnel_area: '',
		current_role: '',
		current_view: '',

		CONST_FEATURE_REQUESTPRE_OT: 'R_PREOT',
		CONST_FEATURE_REQUESTSHIFTCG: 'R_SHFTC',
		CONST_FEATURE_SHOWVIOLATION: 'S_VIOLATION',
		CONST_FEATURE_PUBLIC_HOLIDAY: 'R_PBLCH',
		CONST_FEATURE_APPROVE_OT: 'A_PREOT',

		setView: function (view) {
			this.current_view = view;
			var empDataModel = view.getModel("employeeData");
			var featuresModel = view.getModel("features");
			this.current_role = empDataModel.getData().Role;
			this.personnel_area = empDataModel.getData().PersonnelArea;
			if (this.current_role == "EMPLOYEE") {
				this.features_employee = featuresModel.getData().results;
			} else {
				this.features_manager = featuresModel.getData().results;
			}
		},

		hasNoRight: function (featureId) {
			var val = this.getFeature(featureId).Value;
			if (val) {
				if (val.length == 4 && val != '0000') {
					return false;
				}
			}
			return true;
		},

		hasAnyRight: function (featureId) {
			return !this.hasNoRight(featureId);
		},

		hasCreateRight: function (featureId) {
			var val = this.getFeature(featureId).Value;
			if (val) {
				if (val.length == 4 && val[0] == 1) {
					return true;
				}
			}
			return false;
		},

		hasReadRight: function (featureId) {
			var val = this.getFeature(featureId).Value;
			if (val) {
				if (val.length == 4 && val[1] == 1) {
					return true;
				}
			}
			return false;
		},

		hasUpdateRight: function (featureId) {
			var val = this.getFeature(featureId).Value;
			if (val) {
				if (val.length == 4 && val[2] == 1) {
					return true;
				}
			}
			return false;
		},

		hasDeleteRight: function (featureId) {
			var val = this.getFeature(featureId).Value;
			if (val) {
				if (val.length == 4 && val[3] == 1) {
					return true;
				}
			}
			return false;
		},

		getFeature: function (featureId) {
			let aFeatures = this.current_role === "EMPLOYEE" ? this.features_employee : this.features_manager;

			for (var i = 0; i < aFeatures.length; i++) {
				var rec = aFeatures[i];
				if (rec.FeatureId == featureId && rec.PersArea == this.personnel_area) {
					return rec;
				}
			}
			return {
				Value: ''
			};
		}

	}
});