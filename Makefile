
# Distributed sources to be transpiled
SOURCES = $(wildcard *.js) $(wildcard plugins/*.js)

# Distributed sources not to be transpiled
EXTRA_SOURCES = tests/inject.js

# Transpile destination directory
DIST = ./dist
DISTS = $(patsubst %,$(DIST)/%,$(SOURCES))

.PHONY: all lint babel

$(shell test -d $(DIST) || mkdir $(DIST))

all: twitch-api lint babel

twitch-api:
	cd twitch-api && git pull

lint:
	npx eslint $(SOURCES) $(EXTRA_SOURCES)

babel: $(DIST)

$(DIST)/%.js: %.js
	test -d $(DIST) || mkdir $(DIST)
	npx babel --presets babel-preset-env $< -d $(DIST)/

$(DIST)/plugins/%.js: plugins/%.js
	test -d test/plugins || mkdir -p $(DIST)/plugins
	npx babel --presets babel-preset-env $< -d $(DIST)/plugins/

$(DIST)/polyfill.js:
	test -f node_modules/babel-polyfill/dist/polyfill.js && cp node_modules/babel-polyfill/dist/polyfill.js $(DIST)/polyfill.js

# vim: sw=4 ts=4 sts=4 noet
