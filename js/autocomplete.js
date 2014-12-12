var selected_address;
var config = {
    gadm_table: 'gadm2_spain',
    cartodb_user: 'test',
    sql_api: 'http://agroguia.cartodb.com'
}

function autocomplete_addr(addr, done) {
    var search_query = "select st_x(the_geom) as lng, st_y(the_geom) as lat, name_4 as poblacion, name_2 as provincia from " + config.gadm_table + " where name_4 ilike ";
    
    var sql = cartodb.SQL({ user: config.cartodb_user, completeDomain: config.sql_api });
    
    addr.autocomplete({
      source: function( request, response ) {
        var s = search_query + "lower('" + request.term + "%')";
        sql.execute(s).done(function(data) {
           response(_.map(data.rows, function(r) {
              return {
                label: r.poblacion + " (" + r.provincia + ")",
                value: r.poblacion,
                meta:  {
                  poblacion: r.poblacion,
                  provincia: r.provincia,
                  lat: r.lat,
                  lng: r.lng
                }
              };
            }));
        });
      },
      minLength: 2,
      select: function( event, ui ) {
        selected_address = ui.item.meta;
        done();
      },
      position: {
        offset: "96 5"
      }
    })
};