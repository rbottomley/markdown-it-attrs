PATH        := ./node_modules/.bin:${PATH}

NPM_PACKAGE := $(shell support/getGlobalName.js package)
NPM_VERSION := $(shell support/getGlobalName.js version)

GLOBAL_NAME := $(shell support/getGlobalName.js global)
BUNDLE_NAME := $(shell support/getGlobalName.js microbundle)

TMP_PATH    := /tmp/${NPM_PACKAGE}-$(shell date +%s)

REMOTE_NAME ?= origin
REMOTE_REPO ?= $(shell git config --get remote.${REMOTE_NAME}.url)

CURR_HEAD   := $(firstword $(shell git show-ref --hash HEAD | cut -b -6) master)
GITHUB_PROJ := https://github.com//GerHobbelt/${NPM_PACKAGE}


build: lint bundle test coverage todo 

lint:
	eslint .

lintfix:
	eslint --fix .

bundle:
	-rm -rf ./dist
	mkdir dist
	microbundle --no-compress --target node --strict --name ${GLOBAL_NAME}
	mkdir dist/utils
	microbundle --no-compress --target node --strict --name utils          --no-sourcemap --no-pkg-main -f cjs -o dist/utils ./utils.js
	mv dist/utils/markdown-it-attrs.js dist/utils/utils.js
	microbundle --no-compress --target node --strict --name test           --no-sourcemap --no-pkg-main -f cjs -o test test/test.js
	mv test/markdown-it-attrs.js test/test5.js
	npx prepend-header 'dist/*js' support/header.js

test:
	# mocha
	# kludgy way to execute the tests: `make build` compiles the tests to CommonJS in test5.js, then we execute those instead:
	mocha test/test5.js

coverage:
	-rm -rf coverage
	-rm -rf .nyc_output
	cross-env NODE_ENV=test nyc mocha test/test5.js

report-coverage: lint coverage


publish:
	@if test 0 -ne `git status --porcelain | wc -l` ; then \
		echo "Unclean working tree. Commit or stash changes first." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git fetch ; git status | grep '^# Your branch' | wc -l` ; then \
		echo "Local/Remote history differs. Please push/pull changes." >&2 ; \
		exit 128 ; \
		fi
	@if test 0 -ne `git tag -l ${NPM_VERSION} | wc -l` ; then \
		echo "Tag ${NPM_VERSION} exists. Update package.json" >&2 ; \
		exit 128 ; \
		fi
	git tag ${NPM_VERSION} && git push origin ${NPM_VERSION}
	npm run pub

demo:
	node demo/demo.js

debugdemo:
	node demo/debug.js

todo:
	@echo ""
	@echo "TODO list"
	@echo "---------"
	@echo ""
	grep 'TODO' -n -r ./ --exclude-dir=node_modules --exclude-dir=unicode-homographs --exclude-dir=dist --exclude-dir=coverage --exclude=Makefile 2>/dev/null || test true

clean:
	-rm -rf ./coverage/
	-rm -rf ./dist/
	-rm -rf ./.nyc_output/

superclean: clean
	-rm -rf ./node_modules/
	-rm -f ./package-lock.json

prep: superclean
	-ncu -a --packageFile=package.json
	-npm install
	-npm audit fix


.PHONY: demo debugdemo clean superclean prep publish lint lintfix test todo coverage report-coverage doc build gh-doc bundle
.SILENT: help lint test todo
