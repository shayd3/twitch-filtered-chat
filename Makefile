
SRCS = $(wildcard *.js) $(wildcard plugins/*.js)
DIST = dist
DISTS = $(patsubst %,$(DIST)/%,$(SRCS))

.PHONY: all lint twitch-api echo-srcs echo-dists

all: twitch-api dist lint

twitch-api:
	cd twitch-api && git pull

lint:
	npx eslint --env browser --env es6 $(SRCS)

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
