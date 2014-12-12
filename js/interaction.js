function parse_check_recinto_capa(url, query_type, layers_hash) {
  // query_type: lic/nitratos/zepa
  // url: http://opensigpac.cartodb.net/fega/ServiciosVisorSigpac/query.aspx?layer=recinto&id=19,52,0,0,1,1141,1
  return $.ajax({
      async: false,
      url: url + '&query=' + query_type,
      type: 'GET',
      success: function(res) {
        var text = $(res).find("span#lblConsulta").text();
        if (text.indexOf("El Recinto no solapa con la capa") != -1) {
          //var value = null;
          var value = "N/A";
        }
        else {
          if (query_type == "zepa") {
            var value = $($($(res).find("span#lblConsulta").next().find("tr")[1]).find("td")[1]).text();
          }
          else if (query_type == "lic") {
            var value = $($($(res).find("span#lblConsulta").next().find("tr")[1]).find("td")[0]).text();
          }
          else if (query_type == "nitratos"){
            var value = $($($(res).find("span#lblConsulta").next().find("tr")[1]).find("td")[0]).text();
          }
        }
        layers_hash[query_type]  = value;
        console.log(value);
        return value;
      }
  });
}


function interaction(obj, callback) {
  var url = "http://opensigpac.cartodb.net/fega/ServiciosVisorSigpac/query/recinfo/{provincia}/{municipio}/{aggr}/{zona}/{poligono}/{parcela}/{recinto}.gzip";

  for (var k in obj) {
    url = url.replace('{' + k + '}', obj[k]);
  }
  debugger;

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
      
      var url = 'http://opensigpac.cartodb.net/fega/ServiciosVisorSigpac/query.aspx?layer=recinto&id=19,52,0,0,1,1141,1';
      // I will burn in hell for this. But javascript will burn with me
      $.when(
        parse_check_recinto_capa(url, 'lic', res),
        parse_check_recinto_capa(url, 'zepa', res),
        parse_check_recinto_capa(url, 'nitratos', res)
      ).done(function(a, b, c) {
        console.log(':D');
        debugger;
        callback(res);
      });
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
    if (k !== 'provincia' && k !== 'municipio' &&
     k !== 'agregado' && k !== 'zona') {
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
