/**
 * Versione che fa coesistere sia mappaimmobili (componente del vecchio
 * Immobiliare) che realestate_map (componente del nuovo RealEstateManager)
 */
function Mappa(id, domain, gmapkey, component, index, lang) {
    this.id = id;
    this.domain = domain;
    this.gmapkey = gmapkey;
    this.component = component;
    this.index = index;
    this.lang = lang;
    this.marker = [];
    this.coordinateGenerali = {};
    this.arrayCoordinate = [];
}

Mappa.prototype.init = function (callback) {
    var _this = this;
    //console.log('init reached');

    // be sure that google.maps exists (it's missing for embedded maps)
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined' && typeof _this.geocoder === 'undefined') {
        _this.geocoder = new google.maps['Geocoder']();
    }
    //console.log('_this.geocoder', _this.geocoder);

    if (_this.component == 'realestate_map') {

        var data = {
            'is_pro': is_pro,
            'domain': domain,
            'arrayCoordinate': listaimmobili,
            'zoom': 16
        };

        _this.mappaimmobiliStart("setData", data);
    }
    // mappaimmobili uses postMessage
    else if (_this.component == 'mappaimmobili') {

        // request the component to send the initialization data
        var data = {};
        if (_this.index !== null) {
            data['index'] = _this.index;
        }
        _this.sendPostMessage('sendData', data);

        // receive data from component
        _this.handlePostMessage = function (e) {
            //console.log('e.origin', e.origin);

            // verify not ony that message is an object, but also that component ids match
            if (
                typeof e.data == 'object' &&
                typeof e.data['id'] !== 'undefined' &&
                e.data['id'] == _this.id &&
                e.origin.includes(_this.domain)
            ) {
                var action = e.data['map_action'];
                var data = e.data['data'];

                _this.mappaimmobiliStart(action, data);
            }
        };

        var eventMethod = (window.addEventListener) ? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = (eventMethod === "attachEvent") ? "onmessage" : "message";
        eventer(messageEvent, _this.handlePostMessage);
    }
    // other components do not use postMessage
    else {
        if (callback) {
            callback();
        }
    }
};



/** component: map */
Mappa.prototype.mapStart = function (action, data) {
    var _this = this;
    //console.log('mapStart reached');

    _this.mapSetData(data, function () {

        switch (action) {
            case 'setData':
                _this.mapLoad();
                break;
            case 'setEmbed':
                _this.mapLoadEmbed();
                break;
            case 'setStatic':
                _this.mapLoadStatic();
                break;
        }

    });
};

Mappa.prototype.mapSetData = function (data, callback) {
    var _this = this;
    //console.log('mapSetData reached');

    _this.is_pro = data['is_pro'];
    _this.domain = data['domain'];
    _this.animazione = data['animazione'];
    _this.coordinateGenerali = data['coordinateGenerali'];
    _this.arrayCoordinate = data['arrayCoordinate'];
    _this.width = parseInt(data['width']);
    _this.height = parseInt(data['height']);

    //console.log('_this.coordinateGenerali', _this.coordinateGenerali);
    //console.log('_this.arrayCoordinate', _this.arrayCoordinate);
    //console.log('_this.animazione', _this.animazione);

    if (callback) {
        callback();
    }
};

Mappa.prototype.mapLoad = function () {
    var _this = this;
    //console.log('mapLoad reached');

    var lat = _this.coordinateGenerali['lt'];
    var lng = _this.coordinateGenerali['ln'];
    var zoom = _this.coordinateGenerali['p'];
    var mapType = _this.coordinateGenerali['t'];

    if (!$.isNumeric(zoom)) {
        zoom = 5;
    }

    var mapTypeId;
    switch (mapType) {
        case 's':
            mapTypeId = google.maps['MapTypeId']['SATELLITE'];
            break;
        case 'h':
            mapTypeId = google.maps['MapTypeId']['HYBRID'];
            break;
        case 'p':
            //mapTypeId = google.maps['MapTypeId']['PHYSICAL'];
            mapTypeId = google.maps['MapTypeId']['TERRAIN'];
            break;
        default:
            mapTypeId = google.maps['MapTypeId']['ROADMAP'];
    }

    var latlng = new google.maps['LatLng'](lat, lng);

    var myOptions = {
        'zoom': parseInt(zoom),
        'center': latlng,
        'mapTypeId': mapTypeId,
        'draggable': true,
        'streetViewControl': false
    };

    _this.map = new google.maps['Map'](document.getElementById('map'), myOptions);

    // the markers
    var mlt;
    var mln;

    $.each(_this.arrayCoordinate, function (i, k) {
        //marker
        mlt = k["mlt"];
        mln = k["mln"];

        var mlatlng = new google.maps['LatLng'](mlt, mln);
        _this.marker[i] = _this.mapGetNewMarker(mlatlng);
    });
};

Mappa.prototype.mapGetNewMarker = function (mlatlng) {
    var _this = this;
    //console.log('mapGetNewMarker reached');

    var opzioni = {
        'position': mlatlng,
        'map': _this.map,
        'draggable': false
    };

    if (_this.animazione == 'bounce') {
        opzioni['animation'] = google.maps['Animation']['BOUNCE'];
    }

    var marker = new google.maps['Marker'](opzioni);
    return marker;
};

Mappa.prototype.mapLoadEmbed = function () {
    var _this = this;
    //console.log('mapLoadEmbed reached');

    var lat = _this.coordinateGenerali['lt'];
    var lng = _this.coordinateGenerali['ln'];
    var zoom = _this.coordinateGenerali['p'];
    var mapType = _this.coordinateGenerali['t'] || null;

    //console.log('_this.gmapkey', _this.gmapkey);
    //var url = 'https://www.google.com/maps/embed/v1/place?key=' + _this.gmapkey;
    var url = 'https://www.google.com/maps/embed/v1/view?key=' + _this.gmapkey; // start with "view", we'll change to "place" if we have a "q" parameter

    // add language
    url += "&language=" + _this.lang;

    // add the zoom
    if (!$.isNumeric(zoom)) {
        zoom = 5;
    }
    url += "&zoom=" + zoom;

    // add the map type
    var mapTypeId;
    switch (mapType) {
        case 's':
        case 'h':
            mapTypeId = 'satellite';
            break;
        default:
            mapTypeId = 'roadmap';
    }
    url += "&maptype=" + mapTypeId;

    // always add center
    url += "&center=" + lat + "," + lng;

    // the location to show, if any
    if (_this.arrayCoordinate[0]) {
        var place = _this.arrayCoordinate[0];

        if (place){
            url += (place["name"]) // if we have a place name/address...
                ? "&q=" + encodeURIComponent(place["name"]) // ...use it
                : "&q=" + place["mlt"] + "," + place["mln"]; // ...otherwise use coordinates

            /**
             * if we have "q" (query location) parameter, change "view" to "place"
             * * view > generic map
             * * place > specific place
             */
            url = url.replace("/view", "/place");
        }
    }

    //console.log('embed url', url);

    // finish!
    $('#iframe').attr('src', url);
};

Mappa.prototype.mapLoadStatic = function () {
    var _this = this;
    //console.log('mapLoadStatic reached');

    var lat = _this.coordinateGenerali['lt'];
    var lng = _this.coordinateGenerali['ln'];
    var zoom = _this.coordinateGenerali['p'];

    var url = 'https://maps.googleapis.com/maps/api/staticmap?scale=2&format=jpg&key=' + _this.gmapkey;
    url += "&language=" + _this.lang;
    url += '&size=' + _this.width + 'x' + _this.height;
    url += '&center=' + lat + ',' + lng;
    url += '&zoom=' + zoom;
    url += '&markers=';

    var count = 0;
    $.each(_this.arrayCoordinate, function (i, k) {
        if (count < 15) { //non si possono richiedere più di 15 marker
            url += k["mlt"] + ',' + k["mln"] + '|';
            count++;
        }
    });

    url = url.substring(0, url.length - 1);

    $('#static').css({
        'width': _this.width + 'px',
        'height': _this.height + 'px',
        'background-image': 'url("' + url + '")',
        'background-size': 'cover',
        'background-repeat': 'no-repeat',
        'background-position': 'center'
    });

};
/** /component: map */


/** component: mappaimmobili */
Mappa.prototype.mappaimmobiliStart = function (action, data) {
    var _this = this;
    //console.log('mappaimmobiliStart reached');

    switch (action) {
        case 'setData':
            _this.mappaimmobiliSetData(data, function () {
                _this.mappaimmobiliLoad();
            });
            break;
        case 'setBuilding':
            _this.mappaimmobiliSetBuilding(data);
            break;
        case 'loadPopupMap':
            _this.mappaimmobiliLoadPopupMap(data);
            break;
    }
};

Mappa.prototype.mappaimmobiliSetData = function (data, callback) {
    var _this = this;
    //console.log('mappaimmobiliSetData reached');
    //console.log('mappaimmobiliSetData data', data);

    _this.presetPin = $($('#mappaimmobili-template-pin').html());
    _this.is_pro = data['is_pro'];
    _this.domain = data['domain'];
    _this.arrayCoordinate = data['arrayCoordinate'];
    _this.zoom = data['zoom'];

    //console.log('_this.arrayCoordinate', _this.arrayCoordinate);
    //console.log('_this.zoom', _this.zoom);

    if (callback) {
        callback();
    }
};

Mappa.prototype.mappaimmobiliLoad = function () {
    var _this = this;
    //console.log('mappaimmobiliLoad reached');

    _this.bounds = new google.maps['LatLngBounds']();
    _this.infowindow = new google.maps['InfoWindow']();

    // the markers
    if (_this.arrayCoordinate.length > 0) {
        var doGeocode = 0; // put a limit on geocoding to trigger

        $.each(_this.arrayCoordinate, function (i, building) {

            // invalid coordinates, try to gecode
            if (!building['lat'] || !building['lng'] /* || !building['mlt'] || !building['mln'] */) {
                /* if (doGeocode < 10) {
                    doGeocode++;

                    _this.geocoder.geocode({
                        'address': building['address']
                    }, function (results, status) {
                        if (status == google.maps['GeocoderStatus']['OK']) {
                            var l = results[0]['geometry']['location'];
                            building['lat'] = building['mlt'] = l['lat']();
                            building['lng'] = building['mln'] = l['lng']();
                            _this.marker[i] = _this.mappaimmobiliGetNewMarker(building, i);
                        }
                    });
                } */
            }
            // valid coordinates, make marker
            else {
                if (parseFloat(building['lat']) != 0 && parseFloat(building['lng']) != 0) {
                    _this.marker[i] = _this.mappaimmobiliGetNewMarker(building, i);
                }
            }

        });

        if (_this.map) {
            _this.map['fitBounds'](_this.bounds);
            if (parseInt(_this.map['getZoom']()) > parseInt(_this.zoom)) {
                _this.map['setZoom'](parseInt(_this.zoom));
            }
        }

    }

    _this.mappaimmobiliFixMapSize();
};

Mappa.prototype.mappaimmobiliGetNewMarker = function (building, index) {
    var _this = this;
    var lat = building['lat'];
    var lng = building['lng'];

    // build the map from the first valid coordinates
    if (!_this.map) {
        var latlng = new google.maps['LatLng'](lat, lng);
        var myOptions = {
            'zoom': parseInt(_this.zoom),
            'center': latlng,
            'mapTypeId': google.maps['MapTypeId']['ROADMAP'],
            'draggable': true,
            'fullscreenControl': false
        };
        _this.map = new google.maps['Map'](document.getElementById('map'), myOptions);
    }

    var marker = new google.maps['Marker']({
        'position': new google.maps['LatLng'](lat, lng),
        'map': _this.map,
        'draggable': false
    });

    /** the infowindow */
    if (_this.is_pro) {
        marker.addListener('click', function () {
            var data = {
                'index': index
            };

            if (_this.component == 'realestate_map') {
                data['building'] = building;
                _this.realestatemapSetBuilding(data);
            }
            else {
                // request the clicked building
                _this.sendPostMessage('getBuilding', data);
            }

        });
    }

    _this.bounds['extend'](marker['position']);
    return marker;
};

Mappa.prototype.mappaimmobiliFixMapSize = function () {
    var _this = this;
    try {
        var center = _this.map['getCenter']();
        google.maps['event']['trigger'](_this.map, 'resize');
        _this.map['setCenter'](center);
    }
    catch (e) {
    }
};

Mappa.prototype.mappaimmobiliSetBuilding = function (data) {
    //console.log('mappaimmobiliSetBuilding reached');

    var _this = this;
    var building = data['building'];
    var index = data['index'];
    var contentString = _this.presetPin.clone();

    // the image
    if (!building['_image']) {
        contentString.find('.image').remove();
    } else {
        contentString.find('.image').attr('src', building['_image']);
    }

    // the type
    contentString.find('.tipologia').text(building['_type']);

    // the contract
    contentString.find('.contratto').text(building['_contract']);

    // the price
    if (!building['_price']) {
        contentString.find('.prezzo').remove();
    }
    else {
        contentString.find('.prezzo').text(building['_price']);
    }

    // the area
    contentString.find('.superficie').text(building['_area']);

    // send back building to component to open a popup
    contentString.on('click', function () {
        _this.sendPostMessage('showPopup', {
            'index': index
        });
    });

    var infowindow = new google.maps['InfoWindow']({
        'content': contentString[0],
        'maxWidth': 230
    });

    if (_this.lastInfo) {
        _this.lastInfo['close']();
    }
    _this.lastInfo = infowindow;
    infowindow['open'](_this.map, _this.marker[index]);
    _this.bounds['extend'](_this.marker[index]['position']);
};

Mappa.prototype.mappaimmobiliLoadPopupMap = function (data) {
    var _this = this;
    //console.log('data on mappaimmobiliLoadPopupMap', data);

    var obj = data['building'];
    //console.log('mappaimmobiliLoadPopupMap reached', obj);

    if (!obj['lat'] || !obj['lng']) {
        _this.geocoder.geocode({
            'address': obj['_address']
        }, function (results, status) {
            if (status == 'OK') {
                /* _this.mapPopup['setCenter'](results[0].geometry.location);
                var center = _this.mapPopup.getCenter(); */
                var l = results[0]['geometry']['location'];
                obj['lat'] = obj['mlt'] = l['lat']();
                obj['lng'] = obj['mln'] = l['lng']();

                buildPopupMap(obj);
                //_this.loadMappaC(obj);
            }
        });
    }
    else {
        buildPopupMap(obj);
    }

    function buildPopupMap(obj) {
        // since we use an embedMap, build _this.coordinateGenerali and _this.arrayCoordinate
        _this.coordinateGenerali = {
            'lt': obj['lat'],
            'ln': obj['lng'],
            'mlt': obj['mlt'],
            'mln': obj['mln'],
            'p': 16
        };

        _this.arrayCoordinate.push(_this.coordinateGenerali);

        _this.mapLoadEmbed();
    }

    function buildPopupMap_OLD(obj) {
        var latlng = new google.maps['LatLng'](obj['lat'], obj['lng']);
        var myOptions = {
            'zoom': 16,
            'center': latlng,
            'mapTypeId': google.maps['MapTypeId']['ROADMAP'],
            'draggable': true,
            'streetViewControl': false
        };

        _this.mapPopup = new google.maps['Map'](document.getElementById('map'), myOptions);
        _this.markerPopup = new google.maps['Marker']({
            'position': new google.maps['LatLng'](obj['mlt'], obj['mln']),
            'map': _this.mapPopup,
            'draggable': false
        });

        try {
            var center = _this.mapPopup['getCenter']();
            google.maps['event']['trigger'](_this.mapPopup, 'resize');
            _this.mapPopup['setCenter'](center);
        }
        catch (e) {
        }
    }


};
/** /component: mappaimmobili */

/** component: realestate_map */
Mappa.prototype.realestatemapSetBuilding = function (data) {
    //console.log('realestatemapSetBuilding reached');

    var _this = this;
    var building = data['building'];
    var index = data['index'];
    var contentString = _this.presetPin.clone();

    //console.log(data);

    // the image
    if (!building['img_source']) {
        contentString.find('.image').remove();
    } else {
        contentString.find('.image').attr('src', _this.getUrlImage(building['img_source']));
    }

    // the type
    contentString.find('.tipologia').text(building['_type']);

    // the contract
    //contentString.find('.contratto').text(building['agreement_id']==1?"Vendita":"Affitto");
    contentString.find('.contratto').text(building['agreement_name']);

    // the price
    if (!building['price']) {
        contentString.find('.prezzo').remove();
    }
    else {
        contentString.find('.prezzo').text(building['price']);
    }

    // the area
    contentString.find('.superficie').text(building['surface']);

    // send back building to component to open a popup
    contentString.on('click', function () {
        var suffix = null;
        if (building['title']) {
            suffix = $.trim(building['title']);
        }
        else if (building['address']) {
            suffix = $.trim(building['address']);
        }

        if (suffix) {
            suffix = suffix + '-' + building['city_name'];
        }
        else {
            suffix = building['city_name'];
        }

        _this.sendPostMessage('goToDetail', {
            'id': building["id"],
            'suffix': _this.slugify(suffix)
        });
    });

    var infowindow = new google.maps['InfoWindow']({
        'content': contentString[0],
        'maxWidth': 230
    });

    if (_this.lastInfo) {
        _this.lastInfo['close']();
    }
    _this.lastInfo = infowindow;
    infowindow['open'](_this.map, _this.marker[index]);
    _this.bounds['extend'](_this.marker[index]['position']);
};
/** /component: realestate_map */

/** HELPERS */
Mappa.prototype.sendPostMessage = function (action, data) {
    var _this = this;

    if (parent && document.referrer) {
        parent.postMessage({
            'id': _this.id,
            'map_action': action,
            'data': data || {}
        }, document.referrer);
    }
};

Mappa.prototype.getUrlImage = function (source) {
    return "https://globaluserfiles.com/media/" + source;
};

Mappa.prototype.slugify = function (name) {
    // https://bit.ly/2q98Bad
    var a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
    var b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnooooooooprrsssssttuuuuuuuuuwxyyzzz------';
    var p = new RegExp(a.split('').join('|'), 'g');

    name = name.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-') // Replace & with '-'
        .replace(/[^\w\-.()]+/g, '') // Remove all non-word characters, except -.()
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text

    return name;
};