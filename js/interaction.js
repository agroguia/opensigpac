
function interaction(obj, callback) {
  var url = "http://opensigpac.cartodb.net/fega/ServiciosVisorSigpac/query/recinfo/{provincia}/{municipio}/{aggr}/{zona}/{poligono}/{parcela}/{recinto}.gzip";

  for (var k in obj) {
    url = url.replace('{' + k + '}', obj[k]);
  }

   var uso = ["provincia", "municipio", "agregado", "zona", "poligono", "parcela", "recinto", "superficie", "pendiente", "coef_regadio", "admisibilidad_pastos", "incidencias", "uso"];

  $.ajax({
    url: url,
    type: "GET",
    processData: false,
    success: function(data){
      data = Base64Binary.decodeArrayBuffer(data);
      var geojson = IO.BinaryGeometrySerializer.Read(data)[0];
      var res = {};
      _.each(uso, function(item, index) { 
        if(item != null) {
          res[item] = geojson["Attributes"][index]
        } 
      });
      callback(res);
    }
  });
}

function createInfowindow(map) {
  var mapView = new cdb.geo.LeafletMapView({
      map_object: map,
      map: new cdb.geo.Map()
  });

  var infowindowModel = new cdb.geo.ui.InfowindowModel({
    template: cdb.vis.INFOWINDOW_TEMPLATE.light
  });
 
  var infowindow = new cdb.geo.ui.Infowindow({
    model: infowindowModel,
    mapView: mapView
  });

  mapView.addInfowindow(infowindow);

  return infowindowModel;
}

function openInfowindow(infowindow, pos, data) {
  console.log(data);
  infowindow.set("latlng", [pos.lat, pos.lng]);
  var fields = []
  for (var k in data) {
    if (k !== 'provincia' && k !== 'municipio') {
      fields.push({
        title: k,
        alternative_name: null,
        value: data[k],
        index: null,
      })
    }
  }
  infowindow.set({
    content:  {
      fields: fields
    },
    data: {},
    visibility: true
  });

}
