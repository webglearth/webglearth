.PHONY: all
all: swissBUILDINGS3d_10.json swissBUILDINGS3d_10.obj

swissBUILDINGS3d_10.json: swissBUILDINGS3d_10.gml
	./gml2json -p -z swissBUILDINGS3d_10.gml > $@

swissBUILDINGS3d_10.obj: swissBUILDINGS3d_10.gml
	./gml2json -f obj -o swissBUILDINGS3d_10.gml > $@

swissBUILDINGS3d_10.gml: swissbuildings3dlv03.zip
	unzip -p $< '*.gml' > $@

swissbuildings3dlv03.zip:
	curl -o $@ http://www.swisstopo.admin.ch/internet/swisstopo/fr/home/products/landscape/swissBUILDINGS3D/swissBUILDINGS3D.parsys.44245.downloadList.20311.DownloadFile.tmp/swissbuildings3dlv03.zip

.PHONY: clean
clean:
	rm -f swissBUILDINGS3d_10.json
	rm -f swissBUILDINGS3d_10.obj

.PHONY: reallyclean
reallyclean: clean
	rm -f swissBUILDINGS3d_10.gml
	rm -f swissbuildings3dlv03.zip
