Types = {}
Types.Geometry = {
  DoublePoint: function() {
    return {
      type: 'point',
      X: 0, Y: 0
    }
  }
}

Types.Geometry.DoubleLine = function() { 
  return {
    type: 'linestring',
    coordinates: [],
    Add: function(p) {
      this.coordinates.push([p.X, p.Y]);
    }
  };
}

Types.Geometry.DoublePolygon = function() { 
  return {
    type: 'polygon',
    coordinates: [],
    Add: function(p) {
      this.coordinates.push(p.coordinates);
    }
  };
}
Types.Geometry.GeometryEntity = function(geo) { 
  return {
    type: 'Feature',
    geometry: geo
  }
}


var IO = {};
(function (IO) {
    var SerializationReader = (function () {
        function SerializationReader(bytes) {
            this.pos = 0;
            this.f1 = Math.pow(2, 8 * 1);
            this.f2 = Math.pow(2, 8 * 2);
            this.f3 = Math.pow(2, 8 * 3);
            this.f4 = Math.pow(2, 8 * 4);
            this.f5 = Math.pow(2, 8 * 5);
            this.f6 = Math.pow(2, 8 * 6);
            this.p52 = Math.pow(2, 52);
            this.arrByte = new Uint8Array(bytes);
        }
        SerializationReader.prototype.ReadCoors = function () {
            var coors = [];
            for (var i = 0; i < 2; i++) {
                var t = this.arrByte[this.pos++];
                if (this.pos + 8 <= this.arrByte.length) {
                    var b7 = this.arrByte[this.pos++];
                    var b6 = this.arrByte[this.pos++];
                    var b5 = this.arrByte[this.pos++];
                    var b4 = this.arrByte[this.pos++];
                    var b3 = this.arrByte[this.pos++];
                    var b2 = this.arrByte[this.pos++];
                    var b1 = this.arrByte[this.pos++];
                    var b0 = this.arrByte[this.pos++];

                    var sign = (b0 & 1 << 7) >> 7;

                    var exponent = (((b0 & 127) << 4) | (b1 & (15 << 4)) >> 4);

                    if (exponent === 0)
                        return 0;
                    if (exponent === 0x7ff) {
                        if (sign === 0)
                            return Number.POSITIVE_INFINITY;
                        else
                            return Number.NEGATIVE_INFINITY;
                    }

                    var mul = Math.pow(2, exponent - 1023 - 52);
                    var mantissa = (b7 & 0xff) + (b6 & 0xff) * this.f1 + (b5 & 0xff) * this.f2 + (b4 & 0xff) * this.f3 + (b3 & 0xff) * this.f4 + (b2 & 0xff) * this.f5 + ((b1 & 0xff) & 15) * this.f6 + this.p52;

                    coors.push(Math.pow(-1, sign) * mantissa * mul);
                }
            }

            return coors;
        };
        SerializationReader.prototype.ReadNCoors = function () {
            var coors = new Array();

            // Lee nº de puntos
            this.pos++; //var t = this.arrByte[this.pos++]; // 8
            var n0 = this.arrByte[this.pos++];
            var n1 = this.arrByte[this.pos++];
            var n2 = this.arrByte[this.pos++];
            var n3 = this.arrByte[this.pos++];

            var v;
            var n = ((n3 & 0xff) << 24) | ((n2 & 0xff) << 16) | ((n1 & 0xff) << 8) | (n0 & 0xff);
            for (var k = 0; k < 2 * n; k++) {
                this.pos++; //var t = this.arrByte[this.pos++]; // tipo: 13
                if (this.pos + 8 <= this.arrByte.length) {
                    var b7 = this.arrByte[this.pos++];
                    var b6 = this.arrByte[this.pos++];
                    var b5 = this.arrByte[this.pos++];
                    var b4 = this.arrByte[this.pos++];
                    var b3 = this.arrByte[this.pos++];
                    var b2 = this.arrByte[this.pos++];
                    var b1 = this.arrByte[this.pos++];
                    var b0 = this.arrByte[this.pos++];

                    var sign = (b0 & 1 << 7) >> 7;

                    var exponent = (((b0 & 127) << 4) | (b1 & (15 << 4)) >> 4);

                    if (exponent === 0)
                        v = 0;
                    else if (exponent === 0x7ff) {
                        if (sign === 0)
                            v = Number.POSITIVE_INFINITY;
                        else
                            v = Number.NEGATIVE_INFINITY;
                    } else {
                        var mul = Math.pow(2, exponent - 1023 - 52);
                        var mantissa = (b7 & 0xff) + (b6 & 0xff) * this.f1 + (b5 & 0xff) * this.f2 + (b4 & 0xff) * this.f3 + (b3 & 0xff) * this.f4 + (b2 & 0xff) * this.f5 + ((b1 & 0xff) & 15) * this.f6 + this.p52;

                        v = Math.pow(-1, sign) * mantissa * mul;
                    }
                    coors.push(v);
                }
            }

            return coors;
        };
        SerializationReader.prototype.ReadObject = function () {
            var t = this.ReadObjType();

            switch (t) {
                case 1 /* boolType */:
                    return this.ReadBoolean();
                case 2 /* byteType */:
                    return this.ReadByte();

                case 7 /* int16Type */:
                    return this.ReadInt16();
                case 8 /* int32Type */:
                    return this.ReadInt32();
                case 9 /* int64Type */:
                    return this.ReadInt64();

                case 11 /* stringType */:
                    return this.ReadString();
                case 12 /* singleType */:
                    return this.ReadSingle();
                case 13 /* doubleType */:
                    return this.ReadDouble();
                case 14 /* dateTimeType */:
                    return this.ReadDateTime();

                case 15 /* otherType */:
                    return null;
                default:
                  return null;
                    //throw ("Tipo no soportado: " + t);
            }
        };

        SerializationReader.prototype.ReadBoolean = function () {
            return this.ReadByte() != 0;
        };

        SerializationReader.prototype.ReadByte = function () {
            if (this.pos < this.arrByte.byteLength) {
                var b = this.arrByte[this.pos++];
                return b;
            }
            return 0;
        };

        SerializationReader.prototype.ReadInt16 = function () {
            if (this.pos + 2 <= this.arrByte.length) {
                var b0 = this.ReadByte();
                var b1 = this.ReadByte();

                return ((b1 & 0xff) << 8) | (b0 & 0xff);
            }
            return 0;
        };

        SerializationReader.prototype.ReadInt32 = function () {
            if (this.pos + 4 <= this.arrByte.length) {
                var b0 = this.ReadByte();
                var b1 = this.ReadByte();
                var b2 = this.ReadByte();
                var b3 = this.ReadByte();

                return ((b3 & 0xff) << 24) | ((b2 & 0xff) << 16) | ((b1 & 0xff) << 8) | (b0 & 0xff);
            }
            return 0;
        };

        SerializationReader.prototype.ReadInt64 = function () {
            if (this.pos + 8 <= this.arrByte.length) {
                var b0 = this.ReadByte();
                var b1 = this.ReadByte();
                var b2 = this.ReadByte();
                var b3 = this.ReadByte();
                var b4 = this.ReadByte();
                var b5 = this.ReadByte();
                var b6 = this.ReadByte();
                var b7 = this.ReadByte();

                return ((b7 & 0xff) << 56) | ((b6 & 0xff) << 48) | ((b5 & 0xff) << 40) | ((b4 & 0xff) << 32) | ((b3 & 0xff) << 24) | ((b2 & 0xff) << 16) | ((b1 & 0xff) << 8) | (b0 & 0xff);
            }
            return 0;
        };

        SerializationReader.prototype.ReadSingle = function () {
            var b3 = this.ReadByte();
            var b2 = this.ReadByte();
            var b1 = this.ReadByte();
            var b0 = this.ReadByte();

            var bytes = b0 << 24 | b1 << 16 | b2 << 8 | b3;
            var sign = (bytes & 0x80000000) ? -1 : 1;
            var exponent = ((bytes >> 23) & 0xFF) - 127;
            var significand = (bytes & ~(-1 << 23));

            if (exponent == 128)
                return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY);

            if (exponent == -127) {
                if (significand == 0)
                    return sign * 0.0;
                exponent = -126;
                significand /= (1 << 22);
            } else
                significand = (significand | (1 << 23)) / (1 << 23);

            return sign * significand * Math.pow(2, exponent);
        };

        SerializationReader.prototype.ReadDouble = function () {
            if (this.pos + 8 <= this.arrByte.length) {
                var b7 = this.ReadByte();
                var b6 = this.ReadByte();
                var b5 = this.ReadByte();
                var b4 = this.ReadByte();
                var b3 = this.ReadByte();
                var b2 = this.ReadByte();
                var b1 = this.ReadByte();
                var b0 = this.ReadByte();

                var sign = (b0 & 1 << 7) >> 7;

                var exponent = (((b0 & 127) << 4) | (b1 & (15 << 4)) >> 4);

                if (exponent === 0)
                    return 0;
                if (exponent === 0x7ff) {
                    if (sign === 0)
                        return Number.POSITIVE_INFINITY;
                    else
                        return Number.NEGATIVE_INFINITY;
                }

                var mul = Math.pow(2, exponent - 1023 - 52);
                var mantissa = (b7 & 0xff) + (b6 & 0xff) * this.f1 + (b5 & 0xff) * this.f2 + (b4 & 0xff) * this.f3 + (b3 & 0xff) * this.f4 + (b2 & 0xff) * this.f5 + ((b1 & 0xff) & 15) * this.f6 + this.p52;

                return Math.pow(-1, sign) * mantissa * mul;
            }
            return 0x0;
        };

        SerializationReader.prototype.ReadString = function () {
            if (this.arrByte === null) {
                return "";
            }
            var capacity = this.Read7BitEncodedInt();
            if (capacity < 0) {
                //	        throw new IOException(string.Format(CultureInfo.CurrentCulture, Environment.GetResourceString("IO.IO_InvalidStringLen_Len"), new object[] { capacity }));
                return "";
            }
            if (capacity === 0) {
                return "";
            }

            var s = "";

            try  {
                for (var i = this.pos; i < this.pos + capacity; i++) {
                    s += String.fromCharCode(this.arrByte[i]);
                }
                this.pos += capacity;
            } catch (e) {
                //Area.Comun.BusDeMensajes.dispara(Area.Comun.TipoDeEvento.Error, '@' + e);
            }

            //return s;
            return SerializationReader.Utf8Decode(s);
        };

        SerializationReader.Utf8Decode = function (utftext) {
            var utf8String = "";
            var i = 0;
            var c = 0;
            var c1 = 0;
            var c2 = 0;
            var c3 = 0;

            while (i < utftext.length) {
                c = utftext.charCodeAt(i);

                if (c < 128) {
                    utf8String += String.fromCharCode(c);
                    i++;
                } else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    utf8String += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                } else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    utf8String += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }

            return utf8String;
        };

        SerializationReader.prototype.Read7BitEncodedInt = function () {
            var num3;
            var num = 0;
            var num2 = 0;
            do {
                if (num2 === 0x23) {
                    //	            throw new Exception("Format_Bad7BitInt32");
                    return -1;
                }
                num3 = this.ReadByte();
                num |= (num3 & 0x7f) << num2;
                num2 += 7;
            } while((num3 & 0x80) != 0);
            return num;
        };

        SerializationReader.prototype.ReadDateTime = function () {
            var longDate = this.ReadInt64();
            var date = new Date(longDate);
            return date;
        };

        //	private int ReadUnsignedByteToInt()
        //	{
        //		return (int)ReadByte() & 0xFF;
        //	}
        //	private Object ReadInt32()
        //	{
        //		if (pos + 4 < arrByte.length)
        //		{
        //			byte b0 = arrByte[pos++];
        //			byte b1 = arrByte[pos++];
        //			byte b2 = arrByte[pos++];
        //			byte b3 = arrByte[pos++];
        //			return (b3 << 24) | (b2 << 16) | (b1 << 8) | b0;
        //		}
        //		return null;
        //	}
        SerializationReader.prototype.ReadObjType = function () {
            var typeByte = this.ReadByte();
            console.log(typeByte);
            switch (typeByte) {
                case 0:
                    return 0 /* nullType */;
                case 1:
                    return 1 /* boolType */;
                case 2:
                    return 2 /* byteType */;
                case 3:
                    return 3 /* uint16Type */;
                case 4:
                    return 4 /* uint32Type */;
                case 5:
                    return 5 /* uint64Type */;
                case 6:
                    return 6 /* sbyteType */;
                case 7:
                    return 7 /* int16Type */;
                case 8:
                    return 8 /* int32Type */;
                case 9:
                    return 9 /* int64Type */;
                case 10:
                    return 10 /* charType */;
                case 11:
                    return 11 /* stringType */;
                case 12:
                    return 12 /* singleType */;
                case 13:
                    return 13 /* doubleType */;
                case 14:
                    return 14 /* dateTimeType */;
                default:
                    return 15 /* otherType */;
            }
        };
        return SerializationReader;
    })();
    IO.SerializationReader = SerializationReader;
})(IO || (IO = {}));
(function (IO) {
    var BinaryGeometrySerializer = (function () {
        function BinaryGeometrySerializer() {
        }
        BinaryGeometrySerializer.Read = function (buf) {
            var list = new Array();
            var reader = new IO.SerializationReader(buf);

            var v = reader.ReadObject();
            console.log("reader " + v);
            if (v === 0) {
                var n = reader.ReadObject();
                console.log("reading objects " + n);
                for (var i = 0; i < n; i++) {
                    list.push(BinaryGeometrySerializer.ReadEntity(reader));
                }
            } else {
                //				throw new Exception("BinaryGeometrySerializer no soporta version " + v);
            }

            return list;
        };

        //static ReadFeatures(buf: ArrayBuffer, attributeNames: Array<string>): OpenLayers.Feature[] {
        BinaryGeometrySerializer.ReadFeatures = function (buf, attributeNames) {
            var list = new Array();
            var reader = new IO.SerializationReader(buf);

            var v = reader.ReadObject();
            if (v === 0) {
                var n = reader.ReadObject();
                for (var i = 0; i < n; i++) {
                    list.push(BinaryGeometrySerializer.ReadFeatureVector(reader, attributeNames));
                }
            } else {
                //				throw new Exception("BinaryGeometrySerializer no soporta version " + v);
            }

            return list;
        };

        //#region Lectura Geometry
        BinaryGeometrySerializer.ReadEntity = function (reader) {
            var entity = BinaryGeometrySerializer.ReadEntityData(reader);

            //BinaryGeometrySerializer.ReadEntityAttributes(reader, entity);
            entity.Attributes = BinaryGeometrySerializer.ReadEntityAttributes(reader);
            return entity;
        };

        BinaryGeometrySerializer.ReadEntityData = function (reader) {
            var geometryType = reader.ReadObject();
            var id = reader.ReadObject();
            var srid = 0;
            if (geometryType != 0 /* None */)
                srid = reader.ReadObject();
            var shape = null;
            switch (geometryType) {
                case 0 /* None */:
                    break;
                case 1 /* Point */:
                    shape = new Types.Geometry.DoublePoint(srid);
                    BinaryGeometrySerializer.ReadDoublePoint(reader, shape);
                    break;
                case 2 /* Line */:
                    shape = new Types.Geometry.DoubleLine(srid);
                    BinaryGeometrySerializer.ReadDoubleLine(reader, shape);
                    break;
                case 3 /* Polygon */:
                    shape = new Types.Geometry.DoublePolygon(srid);
                    BinaryGeometrySerializer.ReadDoublePolygon(reader, shape);
                    break;
                case 4 /* MultiPoint */:
                    shape = new Types.Geometry.DoubleMultiPoint(srid);
                    BinaryGeometrySerializer.ReadDoubleMultiPoint(reader, shape);
                    break;
                case 5 /* MultiLine */:
                    shape = new Types.Geometry.DoubleMultiLine(srid);
                    BinaryGeometrySerializer.ReadDoubleMultiLine(reader, shape);
                    break;
                case 6 /* MultiPolygon */:
                    shape = new Types.Geometry.DoubleMultiPolygon(srid);
                    BinaryGeometrySerializer.ReadDoubleMultiPolygon(reader, shape);
                    break;
            }

            var entity = new Types.Geometry.GeometryEntity(shape);
            entity.ID = id;

            return entity;
        };

        //private static ReadEntityAttributes(reader: SerializationReader, entity: Types.Geometry.IGeometryEntity): void {
        BinaryGeometrySerializer.ReadEntityAttributes = function (reader) {
            var n = reader.ReadObject();
            var attributes = new Array();

            for (var i = 0; i < n; i++) {
                //entity.Attributes[i] = reader.ReadObject();
                attributes[i] = reader.ReadObject();
            }

            return attributes;
        };

        BinaryGeometrySerializer.ReadDoublePoint = function (reader, point) {
            point.X = reader.ReadObject();
            point.Y = reader.ReadObject();
        };

        BinaryGeometrySerializer.ReadDoubleLine = function (reader, line) {
            var srid = 0;

            //if (line instanceof IGeometryShape)
            //    srid = ((IGeometryShape) line).GetSRID();
            srid = line.Srid;
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var point = new Types.Geometry.DoublePoint(srid);
                BinaryGeometrySerializer.ReadDoublePoint(reader, point);
                line.Add(point);
            }
        };

        BinaryGeometrySerializer.ReadDoublePolygon = function (reader, polygon) {
            var srid = 0;

            //if (polygon instanceof IGeometryShape)
            //    srid = ((IGeometryShape) polygon).GetSRID();
            srid = polygon.Srid;
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var line = new Types.Geometry.DoubleLine(srid);
                BinaryGeometrySerializer.ReadDoubleLine(reader, line);
                polygon.Add(line);
            }
        };

        BinaryGeometrySerializer.ReadDoubleMultiPoint = function (reader, multiPoint) {
            var srid = 0;

            //if (line instanceof IGeometryShape)
            //    srid = ((IGeometryShape) line).GetSRID();
            srid = multiPoint.Srid;
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var point = new Types.Geometry.DoublePoint(srid);
                BinaryGeometrySerializer.ReadDoublePoint(reader, point);
                multiPoint.Add(point);
            }
        };

        BinaryGeometrySerializer.ReadDoubleMultiLine = function (reader, lines) {
            var srid = 0;

            //if (polygon instanceof IGeometryShape)
            //    srid = ((IGeometryShape) polygon).GetSRID();
            srid = lines.Srid;
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var line = new Types.Geometry.DoubleLine(srid);
                BinaryGeometrySerializer.ReadDoubleLine(reader, line);
                lines.Add(line);
            }
        };
        BinaryGeometrySerializer.ReadDoubleMultiPolygon = function (reader, multiPolygon) {
            var srid = 0;

            //if (multiPolygon instanceof IGeometryShape)
            //    srid = ((IGeometryShape) multiPolygon).GetSRID();
            srid = multiPolygon.Srid;
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var polygon = new Types.Geometry.DoublePolygon(srid);
                BinaryGeometrySerializer.ReadDoublePolygon(reader, polygon);
                multiPolygon.Add(polygon);
            }
        };

        //#endregion
        //#region Lectura OpenLayers Geometry
        BinaryGeometrySerializer.ReadFeatureVector = function (reader, attributeNames) {
            //enum GeometryType { None, Point, Line, Polygon, MultiPoint, MultiLine, MultiPolygon };
            var geometryType = reader.ReadObject();
            var id = "" + reader.ReadObject();
            var srid = 0;

            //if (geometryType != Types.Geometry.GeometryType.None)
            if (geometryType != 0)
                srid = reader.ReadObject();
            var geometry = null;
            switch (geometryType) {
                case 0:
                    break;
                case 1:
                    geometry = BinaryGeometrySerializer.ReadPoint(reader);
                    break;
                case 2:
                    geometry = BinaryGeometrySerializer.ReadLineString(reader);
                    break;
                case 3:
                    geometry = BinaryGeometrySerializer.ReadPolygon(reader);
                    break;
                case 4:
                    geometry = BinaryGeometrySerializer.ReadMultiPoint(reader);
                    break;
                case 5:
                    geometry = BinaryGeometrySerializer.ReadMultiLineString(reader);
                    break;
                case 6:
                    geometry = BinaryGeometrySerializer.ReadMultiPolygon(reader);
                    break;
            }

            var attributes = BinaryGeometrySerializer.ReadOpenLayersAttributes(reader, attributeNames);

            var vector = new OpenLayers.Feature.Vector(geometry, attributes);

            //var vector = new OpenLayers.Feature.Vector('multiPolygom', attributes);
            vector.id = id;

            return vector;
        };

        BinaryGeometrySerializer.ReadOpenLayersAttributes = function (reader, names) {
            var values = BinaryGeometrySerializer.ReadEntityAttributes(reader);

            var attributes = {};
            for (var i = 0; i < names.length; i++) {
                var value = null;

                if (i < values.length)
                    value = values[i];
                attributes[names[i]] = value;
            }

            return attributes;
        };

        BinaryGeometrySerializer.ReadPoint = function (reader) {
            var c = reader.ReadCoors();
            return new OpenLayers.Geometry.Point(c[0], c[1]);
        };

        BinaryGeometrySerializer.ReadPoints = function (reader) {
            var points = new Array();
            var c = reader.ReadNCoors();
            var j = 0;
            for (var i = 0; i < c.length; i += 2) {
                var x = c[j++];
                var y = c[j++];
                points.push(new OpenLayers.Geometry.Point(x, y));
            }

            return points;
        };

        BinaryGeometrySerializer.ReadRing = function (reader) {
            var points = BinaryGeometrySerializer.ReadPoints(reader);

            return new OpenLayers.Geometry.LinearRing(points);
        };
        BinaryGeometrySerializer.ReadLineString = function (reader) {
            var points = BinaryGeometrySerializer.ReadPoints(reader);
            var line = new OpenLayers.Geometry.LineString(points);

            return line;
        };

        BinaryGeometrySerializer.ReadPolygon = function (reader) {
            var olRings = new Array();
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var olRing = BinaryGeometrySerializer.ReadRing(reader);
                if (olRing != null)
                    olRings.push(olRing);
            }

            return new OpenLayers.Geometry.Polygon(olRings);
        };

        BinaryGeometrySerializer.ReadMultiPoint = function (reader) {
            var points = new Array();
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var point = BinaryGeometrySerializer.ReadPoint(reader);
                if (point != null)
                    points.push(point);
            }

            return new OpenLayers.Geometry.MultiPoint(points);
        };

        BinaryGeometrySerializer.ReadMultiLineString = function (reader) {
            var olLines = new Array();
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var olLine = BinaryGeometrySerializer.ReadLineString(reader);
                if (olLine != null)
                    olLines.push(olLine);
            }

            return new OpenLayers.Geometry.MultiLineString(olLines);
        };

        BinaryGeometrySerializer.ReadMultiPolygon = function (reader) {
            var olPolygons = new Array();
            var n = reader.ReadObject();
            for (var i = 0; i < n; i++) {
                var olPolygon = BinaryGeometrySerializer.ReadPolygon(reader);
                if (olPolygon != null)
                    olPolygons.push(olPolygon);
            }

            return new OpenLayers.Geometry.MultiPolygon(olPolygons);
        };
        return BinaryGeometrySerializer;
    })();
    IO.BinaryGeometrySerializer = BinaryGeometrySerializer;
})(IO || (IO = {}));



// example usage in node
var fs = require('fs');
var s = IO.BinaryGeometrySerializer
console.dir(process.argv[2]);
var file = fs.readFileSync(process.argv[2]).toString()
var d = new Buffer(file, 'base64');
console.log(d);
/*var d = Types.Base64Binary.decodeArrayBuffer(new Buffer(file))
console.log(d);
*/
var r = s.Read(d);
console.log(r[0].geometry.coordinates);
