var opensigpac = function() {

  var map = new L.Map('map', {
    zoomControl: false,
    center: [43, -3],
    zoom: 5
  });

  var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
  });

  layer.addTo(map);

  cartodb.createLayer(map, 'http://documentation.cartodb.com/api/v2/viz/2b13c956-e7c1-11e2-806b-5404a6a683d5/viz.json')
    .addTo(map)
    .on('done', function(layer) {
      console.log("huracan");
    })
    .on('error', function(err) {
      alert("some error occurred: " + err);
    });

}
