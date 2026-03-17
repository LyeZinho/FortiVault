export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.B3G5E2Zu.js",app:"_app/immutable/entry/app.BKQ2XKD7.js",imports:["_app/immutable/entry/start.B3G5E2Zu.js","_app/immutable/chunks/JXv_-rfv.js","_app/immutable/chunks/X-NqlEbo.js","_app/immutable/chunks/DeBTWQSq.js","_app/immutable/chunks/DoBpcULn.js","_app/immutable/entry/app.BKQ2XKD7.js","_app/immutable/chunks/X-NqlEbo.js","_app/immutable/chunks/DeBTWQSq.js","_app/immutable/chunks/DoBpcULn.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/dashboard",
				pattern: /^\/dashboard\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
