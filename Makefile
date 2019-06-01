
SOURCES = $(wildcard *.js) $(wildcard plugins/*.js)
EXTRA_SOURCES = tests/inject.js
DIST = dist
DISTS = $(patsubst %,$(DIST)/%,$(SOURCES))

.PHONY: all lint twitch-api babel dist echo-srcs echo-dists

all: twitch-api lint dist

twitch-api:
	cd twitch-api && git pull

lint:
	npx eslint $(SOURCES) $(EXTRA_SOURCES)

babel: dist

dist: $(DISTS) dist/polyfill.js

dist/%.js: %.js
	test -d dist || mkdir dist
	npx babel --presets babel-preset-env $< -d dist/

dist/plugins/%.js: plugins/%.js
	test -d test/plugins || mkdir -p dist/plugins
	npx babel --presets babel-preset-env $< -d dist/plugins/

dist/polyfill.js: 
	test -f node_modules/babel-polyfill/dist/polyfill.js && cp node_modules/babel-polyfill/dist/polyfill.js dist/polyfill.js

echo-srcs:
	echo $(SOURCES)

echo-dists:
	echo $(DISTS)

# vim: sw=4 ts=4 sts=4 noet
