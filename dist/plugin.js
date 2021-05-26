"use strict";

/**
 * This is main plugin loading function
 * Feel free to write your own compiler
 */
W.loadPlugin(
/* Mounting options */
{
  "name": "windy-plugin-strateole-lmd",
  "version": "0.5.0",
  "author": "LMD",
  "repository": {
    "type": "git",
    "url": "https://github.com/matthewjoy-prog/windy-plugins"
  },
  "description": "Windy plugin for strateole2",
  "displayName": "My super plugin",
  "hook": "menu",
  "dependencies": ["https://cdnjs.cloudflare.com/ajax/libs/leaflet-omnivore/0.3.4/leaflet-omnivore.min.js"],
  "className": "plugin-lhpane plugin-mobile-fullscreen",
  "exclusive": "lhpane"
},
/* HTML */
'<div class="mobile-header"> <div class="mh-closing-x iconfont clickable" data-do="rqstClose,windy-plugin-test">}</div> This is the title for mobile devices. </div> <div class="plugin-content"> <img src="https://www7.obs-mip.fr/wp-content-aeris/uploads/sites/51/2019/10/cropped-Logo-Strateole-2logo_Strateole2_75x75px_web.png" alt="logo"> <h2>Plugin Strateole 2</h2> <div id="bouton"> <ul> <li class="clickable-size" data-ref="wms1">wms1</li> <li class="clickable-size" data-ref="wms2">wms2</li> <li class="clickable-size" data-ref="geo">geo</li> </ul> </div> <div id="date"> <input id="date" name="date" value="" type="date"> <input id="time" name="time" value="" type="time"> </div> <div class="multiselect"> <div class="selectBox" data-ref="checkboxes"> <select> <option>Select an option</option> </select> <div class="overSelect"></div> </div> <div id="checkboxes"> <label> <input type="checkbox" id="1" class="sat" data-ref="sat1">Trajectoire 1 (json)</label> <label> <input type="checkbox" id="2" class="sat" data-ref="sat2">Trajectoire 2 (kml)</label> <label> <input type="checkbox" id="3" class="sat" data-ref="sat3">Baleine et requin (kml)</label> </div> </div> <button data-ref="clear">Clear Map</button> </div>',
/* CSS */
'.onwindy-plugin-strateole-lmd .left-border{left:400px}.onwindy-plugin-strateole-lmd #search{display:none}#windy-plugin-strateole-lmd{width:400px;height:100%}#windy-plugin-strateole-lmd .plugin-content{padding:20px 15px 15px 15px;font-size:14px;line-height:1.6}#windy-plugin-strateole-lmd .multiselect{width:200px}#windy-plugin-strateole-lmd .selectBox{position:relative}#windy-plugin-strateole-lmd .selectBox select{width:100%;font-weight:bold}#windy-plugin-strateole-lmd .overSelect{position:absolute;left:0;right:0;top:0;bottom:0}#windy-plugin-strateole-lmd #checkboxes{display:none;border:1px #dadada solid}#windy-plugin-strateole-lmd #checkboxes label{display:block}#windy-plugin-strateole-lmd #checkboxes label:hover{background-color:#1e90ff}',
/* Constructor */
function () {
  var store = W.require('store');

  var bcast = W.require('broadcast');

  var map = W.require('map');

  console.log('I am mounted to the page');

  this.refs.checkboxes.onclick = function () {
    return showCheckboxes();
  };

  var expanded = false;

  function showCheckboxes() {
    var checkboxes = document.getElementById("checkboxes");

    if (!expanded) {
      checkboxes.style.display = "block";
      expanded = true;
    } else {
      checkboxes.style.display = "none";
      expanded = false;
    }
  }

  map.createPane('test');
  map.getPane('test').style.zIndex = 400;
  map.getPane('test').style.pointerEvents = 'none';
  var wms = null;
  var wms1 = {
    Topography: L.tileLayer.wms('http://ows.mundialis.de/services/service?', {
      layers: 'TOPO-WMS',
      transparency: 'true',
      format: 'image/png',
      opacity: 0.5,
      pane: 'test'
    })
  };
  var wms2 = {
    Topography: L.tileLayer.wms('https://ahocevar.com/geoserver/wms?', {
      layers: 'topp:states',
      transparency: 'true',
      format: 'image/png',
      opacity: 0.5,
      pane: 'test'
    })
  };

  this.refs.wms1.onclick = function () {
    return loadWms(wms1.Topography);
  };

  this.refs.wms2.onclick = function () {
    return loadWms(wms2.Topography);
  };

  var loadWms = function loadWms(url) {
    removeWms();
    wms = url.addTo(map);
  };

  var removeWms = function removeWms() {
    if (wms) {
      map.removeLayer(wms);
      wms = null;
    }
  };

  var geoJSON = null;

  this.refs.geo.onclick = function () {
    return loadGeoJson('http://localhost/stage/projet/v1/map.geojson');
  };

  var loadGeoJson = function loadGeoJson(url) {
    removeGeoJson();
    fetch(url).then(function (response) {
      return response.json();
    }).then(function (result) {
      geoJSON = L.geoJson(result).addTo(map);
      var bounds = geoJSON.getBounds();
      map.fitBounds(bounds);
    });
  };

  var removeGeoJson = function removeGeoJson() {
    if (geoJSON) {
      map.removeLayer(geoJSON);
      geoJSON = null;
    }
  };

  var layerJson = L.layerGroup().addTo(map);
  var layer1 = L.layerGroup().addTo(layerJson);

  this.refs.sat1.onclick = function () {
    return loadJson('https://observations.ipsl.fr/aeris/s2dac/qlooks//S2DAC//TRAJ//SATELLITE//J0//aqua-20200323.json', "1", layer1, 'red');
  };

  function loadJson(url, id, layer, color) {
    if (document.getElementById(id).checked) {
      var p = [];
      var p2 = [];
      fetch(url).then(function (response) {
        return response.json();
      }).then(function (result) {
        var lon0 = result[0][6];
        var lat0 = result[0][7];
        p2.push([lat0, lon0]);

        for (var i = 1; i < result.length; i++) {
          var lon = result[i][6];
          var lat = result[i][7];

          if (Math.abs(lon0 - lon) > 180) {
            p.push(p2);
            p2 = [[lat, lon]];
          } else {
            p2.push([lat, lon]);
          }

          L.circle([lat, lon], {
            weight: 4,
            opacity: 1,
            fillOpacity: 0.3,
            fillColor: color,
            color: color
          }).bindPopup(lat + " " + lon).addTo(layer);
          lon0 = lon;
        }

        p.push(p2);
        var style = {
          color: 'red',
          weight: 1,
          opacity: 0.8,
          smoothFactor: 1
        };
        p.forEach(function (points) {
          var polyline = L.polyline(points, style).addTo(layer);
        });
      });
    } else {
      layer.clearLayers();
    }
  }

  ;

  var removeJson = function removeJson() {
    layerJson.eachLayer(function (layer) {
      layer.clearLayers();
    });
    Array.from(document.getElementsByClassName("sat")).forEach(function (element, index, array) {
      element.checked = false;
    });
  };

  var layerKml = L.layerGroup().addTo(map);
  var layer1Kml = L.layerGroup().addTo(layerKml);
  var layer2Kml = L.layerGroup().addTo(layerKml);

  this.refs.sat2.onclick = function () {
    return loadKml('https://observations.ipsl.fr/aeris/s2dac/tmp/ST2_C0_03_TTL3.kml', '2', layer1Kml, 'blue');
  };

  this.refs.sat3.onclick = function () {
    return loadKml('https://observations.ipsl.fr/aeris/s2dac/tmp/whale_shark2.kml', '3', layer2Kml, 'black');
  };

  function loadKml(url, id, layer, color) {
    if (document.getElementById(id).checked) {
      var kml = omnivore.kml(url).on('ready', function () {
        map.fitBounds(kml.getBounds());
        kml.setStyle({
          color: color
        });
      }).addTo(layer);
    } else {
      layer.clearLayers();
    }
  }

  function removeKml() {
    layerKml.eachLayer(function (layer) {
      layer.clearLayers();
    });
    Array.from(document.getElementsByClassName("sat")).forEach(function (element, index, array) {
      element.checked = false;
    });
  }

  function setDate() {
    var date = document.getElementsByName('date')[0].value;
    var hour = document.getElementsByName('time')[0].value;
    var dateSplit = date.split('-');
    var hourSplit = hour.split(':');
    console.log(hourSplit);
    var timestamp = new Date(dateSplit[0], dateSplit[1] - 1, dateSplit[2], hourSplit[0], hourSplit[1]).getTime() + 1;
    console.log(timestamp);
    store.set('timestamp', timestamp);
  }

  function initDate() {
    var dateInit = new Date();
    var currentDate = dateInit.toISOString().substring(0, 10);
    document.getElementsByName('date')[0].value = currentDate;

    document.getElementById('date').onchange = function () {
      console.log('la');
      setDate();
    };

    var currentTime = dateInit.toISOString().substring(11, 16);
    document.getElementById('time').value = currentTime;

    document.getElementsByName('time')[0].onchange = function () {
      console.log("ici");
      setDate();
    };
  }

  initDate();

  this.refs.clear.onclick = function () {
    return clear();
  };

  function clear() {
    removeWms();
    removeJson();
    removeGeoJson();
    removeKml();
  }

  this.onclose = function () {
    console.log('I am being closed');
    clear();
  };
});