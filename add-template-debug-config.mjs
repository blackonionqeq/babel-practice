#!/usr/bin/env node
import launch from './.vscode/launch.json' assert { type: 'json' }
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const templateName = process.argv[2]

if (templateName) {
	const __dirname = path.dirname( url.fileURLToPath(import.meta.url) )
	// const launch = JSON.parse(
	// 	fs.readFileSync(
	// 		path.join(__dirname, '.vscode', 'launch.json')
	// 	)
	// )
	// console.log(launch)
	launch.configurations.push({	
		"type":"node",
		"request": "launch",
		"name": templateName,
		"console": "integratedTerminal",
		"program": "${workspaceFolder}" + `/${templateName}/index.mjs`
	})
	fs.writeFileSync(
		path.join(__dirname, '.vscode', 'launch.json'),
		JSON.stringify(launch, null, 4),
	)
	console.log('debug config update success!')
}