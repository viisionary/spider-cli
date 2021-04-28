const { green, blue, red } = require("chalk");
const path = require('path');
const fs = require('fs-extra');
const fsO = require('fs');
const axios = require('axios');
const { exec } = require("shelljs");

function isSafeToCreateProjectIn(root, name) {
	const validFiles = [
		'.DS_Store',
		'.git',
		'.gitattributes',
		'.gitignore',
		'.gitlab-ci.yml',
		'.hg',
		'.hgcheck',
		'.hgignore',
		'.idea',
		'.npmignore',
		'.travis.yml',
		'docs',
		'LICENSE',
		'README.md',
		'mkdocs.yml',
		'Thumbs.db',
	];
	// These files should be allowed to remain on a failed install, but then
	// silently removed during the next create.
	const errorLogFilePatterns = [
		'npm-debug.log',
		'yarn-error.log',
		'yarn-debug.log',
	];
	const isErrorLog = file => {
		return errorLogFilePatterns.some(pattern => file.startsWith(pattern));
	};

	const conflicts = fs
		.readdirSync(root)
		.filter(file => !validFiles.includes(file))
		// IntelliJ IDEA creates module files before CRA is launched
		.filter(file => !/\.iml$/.test(file))
		// Don't treat log files from previous installation as conflicts
		.filter(file => !isErrorLog(file));

	if (conflicts.length > 0) {
		console.log(
			`The directory ${green(name)} contains files that could conflict:`
		);
		console.log();
		for (const file of conflicts) {
			try {
				const stats = fs.lstatSync(path.join(root, file));
				if (stats.isDirectory()) {
					console.log(`  ${blue(`${file}/`)}`);
				} else {
					console.log(`  ${file}`);
				}
			} catch (e) {
				console.log(`  ${file}`);
			}
		}
		console.log();
		console.log(
			'Either try using a new directory name, or remove the files listed above.'
		);

		return false;
	}

	// Remove any log files from a previous installation.
	fs.readdirSync(root).forEach(file => {
		if (isErrorLog(file)) {
			fs.removeSync(path.join(root, file));
		}
	});
	return true;
}

function createApp(name, isAnt) {
	const root = path.resolve(name);
	const appName = path.basename(root);
	fs.ensureDirSync(name);
	if (!isSafeToCreateProjectIn(root, name)) {
		process.exit(1);
	}
	console.log(`Creating a new React app in ${green(root)}.`);
	const project = isAnt ? 'antFrame' : 'spider'
	const repo = `https://api.github.com/repos/vislonery/${project}/releases/latest`
	const req = axios(repo).then(({ data }) => {
		const { id, tarball_url, tag_name } = data
		const codeFileName = `spider-${tag_name}`
		const fileName = `spider-${tag_name.slice(1)}`
		exec(`curl https://codeload.github.com/vislonery/${project}/tar.gz/refs/tags/${tag_name} --output ${codeFileName}.tar.gz`)
		exec(`tar -zxvf ./${codeFileName}.tar.gz`);
		exec(`cp -a ./${fileName}/* ${root}`);
		exec(`rm -rf ./${codeFileName}.tar.gz ./${fileName}`);

		console.log(`\n created successfully, your app in ${root} \n`)
		console.log(`run: cd ${blue(root)}`)
		console.log(`u need ${red('install')} package by yourself, and then u can start the app!😊`)
	})

}

module.exports = { createApp }
