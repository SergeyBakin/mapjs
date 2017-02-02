(function (require) {
	"use strict";
	require.config({
		baseUrl: "/javascripts/",
		waitSeconds: 30,
		paths: {
			"hbs": "/views",
			"async": "async",
			"lodash": "lodash",
			"bootstrap": "bootstrap3",
			"leaflet": "leaflet"
		},
		shim:{
			"bootstrap": {
				deps:["jquery"]
			}
		}
	});
})(require);
