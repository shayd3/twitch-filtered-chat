
SRCS = $(wildcard *.js) $(wildcard plugins/*.js)
DIST = dist
DISTS = $(patsubst %,$(DIST)/%,$(SRCS))

.PHONY: all lint twitch-api babel dist echo-srcs echo-dists

all: twitch-api lint dist

twitch-api:
	cd twitch-api && git pull

lint:
	npx eslint $(SRCS)

babel: dist

dist: $(DISTS)

dist/%.js: %.js
	test -d dist || mkdir dist
	npx babel --presets babel-preset-env $< -d dist/

dist/plugins/%.js: plugins/%.js
	test -d test/plugins || mkdir -p dist/plugins
	npx babel --presets babel-preset-env $< -d dist/plugins/

echo-srcs:
	echo $(SRCS)

echo-dists:
	echo $(DISTS)

# vim: sw=4 ts=4 sts=4 noet
