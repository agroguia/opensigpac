var opensigpac = function() {

  var SATELLITE = 'http://sigpac.magrama.es/sdg/raster/ORTOFOTOS@3857/{z}.{x}.{y}.img'

  var map = new L.Map('map', {
    zoomControl: true,
    center: [41.652947, -4.728388],
    zoom: 12
  });

  function drawStart() {
    plots.disableInteraction();
  }
  function drawStop() {
    plots.enableInteraction();
  }

  enableMobile(map);
  areaControls(map, drawStart, drawStop);


  var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  });

  var satellite = L.tileLayer(SATELLITE, {
    attribution: 'MAPA',
    tms: true
  });

  var plots = new PlotsLayer(map, satellite, 'http://opensigpac.cartodb.net/vectorsdg/vector/RECINTO@3857/{z}.{x}.{y}.gzip');

  layer.addTo(map);

  plots.interaction(function(a) {
    interaction(a, function(data) {
      openInfowindow(infowindow, a.latLng, data);
    })
  });

    
  map.on('zoomend', function() {
    if (map.getZoom() >= 15) {
      satellite.addTo(map);
      map.removeLayer(layer);
    } else {
      layer.addTo(map);
      map.removeLayer(satellite);
      plots.removeAll();
    }
  });

  var infowindow = createInfowindow(map);


    
  // Autocomplete stuff. We need the map to center the view after a search
  autocomplete(map);
    
};



