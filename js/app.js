




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


}
