var config = {
    gadm_table: 'municipios_2014_cropti',
    cartodb_user: 'jorgearevalo',
    sql_api: 'http://jorgearevalo.cartodb.com'
}

var municipios = [];
var poligonos = [];
var parcelas = [];

var selected_address;
var selected_pol;
var municipios = [];
var municipios_names = {}
var provincias_ids = {}
var provincias_names = {}

// this is called from data/municipios.js
function opensigpac_municipio(data) {
 _.map(data.rows, function(r) {   
    municipios.push({
      label: r.poblacion + " (" + r.provincia + ")",
      value: r.poblacion,
      meta:  {
        poblacion: r.poblacion,
        provincia: r.provincia,
        lat: r.lat,
        lng: r.lng,
        id: r.id,
        provincia_id: r.provincia_id
      }
    });
    //if doesnt exist yet
    if (!(r.provincia_id in provincias_ids)) {
      provincias_ids[r.provincia_id] = {}
      provincias_ids[r.provincia_id]['name'] = [r.provincia]
      provincias_ids[r.provincia_id]['municipios'] = {}
    }
    provincias_ids[r.provincia_id]['municipios'][r.id] = r.poblacion
    municipios_names[r.poblacion] = r.id;
    provincias_names[r.provincia] = r.provincia_id;
  });
}

var usos_sigpac = {}
function opensigpac_usos() {
  $.ajax({
    url: "http://opensigpac.cartodb.net/usos_sigpac.json",
    type: "GET",
    processData: false,
    success: function(data){
      usos_sigpac = data;
    }
  });
}


function autocomplete(map) {
    
    // Get all municipalities
    var search_query = "select lon as lng, lat as lat, name as poblacion, provincia as provincia, id, provincia_id from " + config.gadm_table

    var sql = cartodb.SQL({ user: config.cartodb_user, completeDomain: config.sql_api });    

    //sql.execute(search_query).done(function(data) {


    $("#localidad").autocomplete({
      source: municipios,
      minLength: 2,
      select: function( event, ui ) {
          selected_address = ui.item.meta;
          var latlng = L.latLng(selected_address.lat, selected_address.lng);
          map.panTo(latlng);
          map.setZoom(16);
          $('.Search-advanced').show();
          console.log(selected_address);

          // TODO: Not always 0,0!!
          var url = "http://opensigpac.cartodb.net/vectorsdg/query/poligonos/" + selected_address.provincia_id + "/" + selected_address.id + "/0/0.gzip"
          
          console.log("URL TO GET POLYGONS: " + url);

          $.ajax({
              url: url, // 'test/15.15949.20555',
              type: "GET",
              //dataType: "binary",
              processData: false,
              success: function(data){
                  data = Base64Binary.decodeArrayBuffer(data);
                  
                  var stuff = IO.BinaryGeometrySerializer.Read(data);
              
                  
                  for(var i = 0;i < stuff.length; i++) {
                      console.log("POLYGON " + i + ":" + JSON.stringify(stuff[i]));
                      
                      poligonos.push({
                          label: stuff[i].Attributes[0],
                          value: stuff[i].Attributes[0]
                      })
                  }
                  
                  $("#poligono").autocomplete({
                      source: poligonos,
                      minLength: 1,
                      select: function( event, ui ) {
                          selected_pol = ui.item.value
                          console.log("SELECTED POL: " + selected_pol)
                      },
                      position: {
                          offset: "96 5"
                      }
                  })
              }
          });
      },
      position: {
          offset: "96 5"
      }
    });
}

