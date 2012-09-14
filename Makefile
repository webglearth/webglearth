WE = we

.PHONY: build all lint soyweb

all: serve_app
serve_app: shaders
	java -jar ./plovr.jar serve -p 9810 weapp_debug.json
serve_api: shaders
	java -jar ./plovr.jar serve -p 9811 api_debug.json
shaders:
	python build_shaderbank.py
build: shaders
	java -jar ./plovr.jar build api.json > deploy/api.js
	java -jar ./plovr.jar build weapp.json > deploy/index.js
lint:
	fixjsstyle --strict -r we/ -r weapp/ -r api/ -x we/shaderbank_codes.js
	gjslint --strict -r we/ -r weapp/ -r api/ -x we/shaderbank_codes.js
soyweb:
	java -jar ./plovr.jar soyweb --dir .