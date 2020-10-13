# Install dependecies
* Install Node.js
* npm install

# Star proxy service
* In package.json add the line below to proxy the service URL for the local one: 
 "local-proxy": "lcp --proxyUrl http://user:password@host/sap/opu/odata/sap/*SRV/"

* Alter Manifest.xml to http://localhost:8010/proxy in data sources
* Finally run npm run local-proxy

# Start app
* npm run serve or ui5 serve
* Go to http://localhost:8080

# Build
* ui5 build --all 

# Server Upload
* npm run upload

# Clone remote branchs
* https://gist.github.com/fabianmoronzirfas/4023446

# UI5 CLI

##Commands:
  *ui5 add [--development] [--optional] <framework-libraries..>
      Add SAPUI5/OpenUI5 framework libraries to the project
        configuration.

  *ui5 build
      Build project in current directory

  *ui5 init
      Initialize the UI5 Tooling configuration for an application or
        library project.

  *ui5 serve
      Start a web server for the current project

  *ui5 tree
      Outputs the dependency tree of the current project to stdout. It
        takes all relevant parameters of ui5 build into account.

  *ui5 use <framework-info>
      Initialize or update the project's framework configuration.

  *ui5 versions
      Shows the versions of all UI5 Tooling modules