let expect = require('chai').expect;
let fs = require('fs');
let glob = require('glob');
const Ajv = require('ajv');
let ajv = new Ajv({
	useDefaults: true,
	schemas: [
		require('./data/schema/test.json'),
		require('./data/schema/dev-test.json'),
		require('./data/schema/feature.json'),
		require('./data/schema/dev-feature.json'),
	]});

let buildDir = __dirname+'/build';
let devDir = __dirname+'/data';
let tech = require(buildDir+"/tech.json");
let ATBrowsers = require(devDir+'/ATBrowsers.json');

describe('Development tests', function () {
	let testFiles = glob.sync(devDir+'/tests/**/*.json');

	testFiles.forEach(function(file) {
		if (!file.endsWith('.json')) {
			return;
		}

		// load the test
		let test = require(file);

		describe('test: ' + file, function () {
			it(file + ' should conform to the dev-test schema', function () {
				let valid = ajv.validate('http://accessibilitysupported.com/dev-test.json', test);
				if (!valid) {
					console.log(ajv.errors);
				}
				expect(valid).to.be.equal(true);
			});

			test.assertions.forEach(assertion => {
				it(devDir + '/tech/' + assertion.feature_id + '.json should exist', function () {
					let exists = fs.existsSync(devDir + '/tech/' + assertion.feature_id + '.json');
					expect(exists).to.be.equal(true);
				});
			});

			if (test.commands) {
				let at_keys = Object.getOwnPropertyNames(test.commands);
				at_keys.forEach(function (at_id) {
					let browser_keys = Object.getOwnPropertyNames(test.commands[at_id]);
					browser_keys.forEach(function (browser_key) {

						if (!test.commands[at_id][browser_key]) {
							return;
						}

						test.commands[at_id][browser_key].forEach(function (command, index) {

							it(at_id + '.' + browser_key + '[' + index + '].command should be valid: ' + command.command, function () {
								expect(ATBrowsers.at[at_id].commands[command.command]).to.be.not.undefined;
							})

							it(at_id + '.' + browser_key + ' must have a version object defined: ' + file, function () {
								expect(test.versions[at_id].browsers[browser_key]).to.be.not.undefined;
							})

						})
					});
				});
			}
		});
	});
});

describe('Development tech features', function () {
	for (let techId in tech) {
		describe(techId, function() {
			let featureDir = devDir + '/tech/'+techId;
			if (!fs.existsSync(featureDir)) {
				// Directory doesn't exist, so there are not features yet
				return;
			}
			let files = fs.readdirSync(featureDir);
			files.forEach(function(file) {
				let feature = require(featureDir + '/' + file);

				it(file + ' should conform to the dev-feature schema', function () {
					let valid = ajv.validate('http://accessibilitysupported.com/dev-feature.json', feature);
					if (!valid) {
						console.log(ajv.errors);
					}
					expect(valid).to.be.equal(true);
				});
			});
		});
	}
});

describe('Built tests', function () {
	let testFiles = fs.readdirSync(buildDir+'/tests');

	testFiles.forEach(function (file) {
		if (!file.endsWith('.json')) {
			return;
		}

		it(file + ' should conform to the test schema', function () {
			let test = require(buildDir + '/tests/' + file);
			let valid = ajv.validate('http://accessibilitysupported.com/test.json', test);
			if (!valid) {
				console.log(ajv.errors);
			}
			expect(valid).to.be.equal(true);
		});

	});
});

describe('Built tech features', function () {
	for (let techId in tech) {
		describe(techId, function() {
			let featureDir = buildDir + '/tech/'+techId;
			if (!fs.existsSync(featureDir)) {
				// Directory doesn't exist, so there are not features yet
				return;
			}
			let files = fs.readdirSync(featureDir);
			files.forEach(function(file) {
				it(file + ' should conform to the feature schema', function () {
					let feature = require(featureDir + '/' + file);
					let valid = ajv.validate('http://accessibilitysupported.com/feature.json', feature);
					if (!valid) {
						console.log(ajv.errors);
					}
					expect(valid).to.be.equal(true);
				});
			});
		});
	}
});

describe('spMdToObject()', function() {
	let body = "I got the same results and tested the tab key too.\n" +
		"\n" +
		"| property | value |\r\n" +
		"| --- | --- |\r\n" +
		"| title | html_label_element_explicit_aam |\r\n" +
		"| support | y |\r\n" +
		"| at | vo_macos |\r\n" +
		"| at_version | 10.13.6 |\r\n" +
		"| os_version | 10.13.6 |\r\n" +
		"| browser | chrome |\r\n" +
		"| browser_version | 11.1.2 |\r\n" +
		"| output_1_command | VO + right arrow |\r\n" +
		"| output_1_command_name | next item |\r\n" +
		"| output_1_output | Your name, edit text |\r\n" +
		"| output_1_result | pass |\r\n" +
		"| output_2_command | VO + shift + right/left arrow |\r\n" +
		"| output_2_command_name | previous item |\r\n" +
		"| output_2_output | Your name, edit text |\r\n" +
		"| output_2_result | pass |\r\n" +
		"| output_3_command | tab |\r\n" +
		"| output_3_command_name | next focusable item |\r\n" +
		"| output_3_output | Your name, edit text |\r\n" +
		"| output_3_result | pass |\r\n" +
		"\r\n" +
		"== begin notes ==\r\n" +
		"sample note line 1\r\n" +
		"sample note line 2\r\n" +
		"== end notes ==";

	let spMdToObject = require(__dirname+'/src/sp-md-to-obj.js');

	let result = spMdToObject(body);
	let moment = require('moment');
	let currentDateString = moment().format('YYYY-MM-DD');
	it('should parse correctly', function () {
		let expected = {
			testId: 'html_label_element_explicit_aam',
			at: 'vo_macos',
			browser: 'chrome',
			supportPoint: {
				at_version: '10.13.6',
				browser_version: '11.1.2',
				os_version: '10.13.6',
				date: currentDateString,
				output: [
					{
						command: 'VO + right arrow',
						command_name: 'next item',
						output: 'Your name, edit text',
						result: 'pass',
					},
					{
						command: 'VO + shift + right/left arrow',
						command_name: 'previous item',
						output: 'Your name, edit text',
						result: 'pass',
					},
					{
						command: 'tab',
						command_name: 'next focusable item',
						output: 'Your name, edit text',
						result: 'pass',
					}
				],
				support: 'y',
				notes: 'sample note line 1\nsample note line 2'
			}
		};

		expect(result).to.deep.equal(expected);
	});

});

