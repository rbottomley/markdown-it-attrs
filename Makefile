PATH        := ./node_modules/.bin:${PATH}

NPM_PACKAGE := $(shell node -e 'process.stdout.write(require("./package.json").name.replace(/^.*?\//, ""))')
NPM_VERSION := $(shell node -e 'process.stdout.write(require("./package.json").version)')

TMP_PATH    := /tmp/${NPM_PACKAGE}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut -b -6) master)
GITHUB_PROJ := https://github.com//GerHobbelt/${NPM_PACKAGE}


build: browserify test coverage todo 

lint:
	eslint .

lintfix:
	eslint --fix .

test: 
	nyc mocha

coverage: test

report-coverage: coverage
	-rm -rf .nyc_output
	nyc report --reporter=text-lcov | coveralls

browserify:
	-rm -rf ./dist
	mkdir dist
	# Browserify
	browserify ./index.js --no-browser-field --standalone markdown-it-attrs -o markdown-it-attrs.browser.js
	( printf "/*! ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} @license MIT */\n\n" ; \
		 cat markdown-it-attrs.browser.js \
	) > dist/${NPM_PACKAGE}.js
	rm -f markdown-it-attrs.browser.js

minify: browserify
	# Minify
	uglifyjs dist/${NPM_PACKAGE}.js -b beautify=false,ascii_only=true -c -m \
		--preamble "/*! ${NPM_PACKAGE} ${NPM_VERSION} ${GITHUB_PROJ} @license MIT */" \
		> dist/${NPM_PACKAGE}.min.js

todo:
	@echo ""
	@echo "TODO list"
	@echo "---------"
	@echo ""
	grep 'TODO' -n -r ./lib 2>/dev/null || test true

clean:
	-rm -rf ./coverage/
	-rm -rf ./dist/

superclean: clean
	-rm -rf ./node_modules/
	-rm -f ./package-lock.json

prep: superclean
	-ncu -a --packageFile=package.json
	-npm install


.PHONY: clean lint test todo coverage report-coverage build browserify minify superclean prep
.SILENT: help lint test todo
