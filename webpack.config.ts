// tslint:disable:no-var-requires

const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { InjectNomodulePolyfillsPlugin } = require('@ledge/configs/webpack.util');

class NgAppDocsPlugin extends InjectNomodulePolyfillsPlugin {
	constructor(isDev) {
		super();

		// @ts-ignore
		this.isDev = isDev;
	}

	// tslint:disable-next-line:member-access
	apply(compiler) {
		super.apply(compiler);

		// @ts-ignore
		if (this.isDev === false) {
			compiler.hooks.emit.tap(this.constructor.name, () => {
				const files = fs.readdirSync(docs, { withFileTypes: true }).filter(x => x.isFile());
				files.forEach(x => fs.unlinkSync(path.join(docs, x.name)));
			});
		}

		compiler.hooks.afterEmit.tap(this.constructor.name, () => {
			fs.writeFileSync(path.join(docs, 'CNAME'), 'ng-app.js.org');
		});
	}
}

const docs = path.join(process.cwd(), 'docs');

module.exports = (env = 'development') =>
	require('@ledge/configs/webpack.merge')(env, {
		entry: {
			app: ['app.ts', 'styles.scss'].map(x => path.join(docs, 'src', x)),
			polyfills: path.join(docs, 'src', 'polyfills.ts'),
		},
		output: {
			path: docs,
			publicPath: '/',
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: '!!pug-loader?!docs/src/index.pug',
				title: '@ledge/ng-app docs',
				chunks: ['app'],
			}),
			new NgAppDocsPlugin(env === 'development'),
		],
	});
