
# Distributed sources to be transpiled
SOURCES = $(wildcard *.js) $(wildcard plugins/*.js) $(wildcard fanfare/*.js)

# Distributed sources not to be transpiled
EXTRA_SOURCES = tests/inject.js

# Transpile destination directory
DIST = ./dist
DISTS = $(patsubst %,$(DIST)/%,$(SOURCES))

.PHONY: all twitch-api lint babel

$(shell test -d $(DIST) || mkdir $(DIST))

all: twitch-api lint babel

twitch-api:
	-cd twitch-api && git pull

lint:
	npx eslint $(SOURCES) $(EXTRA_SOURCES)

babel: $(DIST) $(DISTS)

$(DIST)/%.js: %.js
	test -d $(DIST) || mkdir $(DIST)
	npx babel --presets babel-preset-env $< -d $(DIST)/

$(DIST)/plugins/%.js: plugins/%.js
	test -d $(DIST)/plugins || mkdir -p $(DIST)/plugins
	npx babel --presets babel-preset-env $< -d $(DIST)/plugins/

$(DIST)/fanfare/%.js: fanfare/%.js
	test -d $(DIST)/fanfare || mkdir -p $(DIST)/fanfare
	npx babel --presets babel-preset-env $< -d $(DIST)/fanfare/

$(DIST)/polyfill.js: node_modules/babel-polyfill/dist/polyfill.js
	test -f "$<" && echo cp "$<" "$@"

# vim: sw=4 ts=4 sts=4 noet
