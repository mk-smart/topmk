
TMKCards = function(config, element){
    this.element = element;
    this.config = config;
    this.cards  = new Array();
    this.bottom = 1;
    this.top    = 0;
    this.sums  = new Array();
    this.counts = new Array();
    var self = this;
    if (element==undefined){
	this.ready = false;
	$.ajax({
	    url: this.config.type
	}).done(function( data ) {
	    for(var uri in data.instances){
		if (self.getName(data.instances[uri])!=""){
		    console.log(data.instances[uri]+" "+self.getName(data.instances[uri]));
		    self.addCard(data.instances[uri]);
		}
	    }
	   self.ready = true;
	});
    }
}

/* distribute half and half of the deck
 * to the two others, overwriting what they 
 * have and assuming their on config will be
 * consistant */
TMKCards.prototype.distribute = function(deck1, deck2){
    this.shuffle();
    var d1 = false;
    for(var i = 0; i < this.size(); i++){
	if (d1) deck1.addCard(this.cards[i+this.bottom]);
	else deck2.addCard(this.cards[i+this.bottom]);
	d1=!d1;
    }
}

/* display the back cover of a card */
TMKCards.prototype.cover = function(){
    this.propertiesObtained=false;
    $(this.element).html("").addClass("cardback");
    $(this.element).css("transition", "0s").css("transform", "none");
    
}

/* Display card instead of the back cover */
TMKCards.prototype.flip = function(){
    for(var i =0; i < this.size(); i++){
	console.log((i+this.bottom)+" "+this.cards[i+this.bottom]);
    }
    $(this.element).css("transform", "none");
    $(this.element).
	css("transition", "0.6s").
	css("transform-style", "preserve-3d").
	css("animation-direction", "normal").
	css("transform", "rotateY(90deg)");
    var self = this;
    setTimeout(function(){ 
	$(self.element).removeClass("cardback");
	var shtml = '&nbsp;<h2>'+self.getName(self.cards[self.top])+'</h2>'+
	    '<div class="image" id="'+self.element.replace("card", "image").substring(1)+'">&nbsp;</div>'+
	    '<div class="properties" id="'+self.element.replace("card", "prop").substring(1)+'">&nbsp;</div>';
	$(self.element).html(shtml);
	var mk = {
	    lat: 52.0381633, 
	    lng: -0.7751966
	};
	self.map = new google.maps.Map(document.getElementById(self.element.replace("card", "image").substring(1)), {
	    center: mk,
	    zoom: 15,
	    zoomControl: false,
	    mapTypeControl: false,
	    scaleControl: false,
	    streetViewControl: false,
	    rotateControl: false,
	    fullscreenControl: false
	});
	var geocoder = new google.maps.Geocoder();
	var address = self.getName(self.cards[self.top])+", Milton Keynes";
	console.log("searching "+address);
	geocoder.geocode({'address': address}, function(results, status) {
	    if (status === google.maps.GeocoderStatus.OK) {
		self.map.setCenter(results[0].geometry.location);
	    } else {
		alert('Geocode was not successful for the following reason: ' + status);
	    }});
	self.getProperties(true);
	$(self.element).
	    css("transition", "1s").
	    css("transform-style", "preserve-3d").
	    css("transform", "rotateY(0deg)");},
	       600);
}

/* update the display of the number of cards */
TMKCards.prototype.updateScore = function(me){
    $(this.element.replace("card", "score")).html(this.size());
    if(me)
	$(this.element.replace("card", "score")).css("color", "#ff6138");
    else 
	$(this.element.replace("card", "score")).css("color", "#444");
}

/* return the value of the property for 
 * the top card */
TMKCards.prototype.query = function(property){
    if (this.propertiesObtained){
	return this.topprops[property];
    }
    return 0;
}

TMKCards.prototype.getProperties = function(display){
    if (this.propertiesObtained && display){
	this.displayProperties();
	return;
    }
    if(typeof(Storage) !== "undefined" && localStorage.getItem("tmk"+this.cards[this.top]) && false) {
	this.topprops=JSON.parse(localStorage.getItem("tmk"+this.cards[this.top]));
	console.log("from storage "+this.cards[this.top]);
	this.propertiesObtained=true;
	for (var ind in this.config.properties){
	    if (this.sums[this.config.properties[ind].name] == undefined)
		this.sums[this.config.properties[ind].name] = 0;
	    if (this.counts[this.config.properties[ind].name] == undefined)
		this.counts[this.config.properties[ind].name] = 0;
	    this.sums[this.config.properties[ind].name] += this.topprops[this.config.properties[ind].name];
	    this.counts[this.config.properties[ind].name]++;
	}
	if (display){
	    this.displayProperties();
	}
	return; 
    } 
    var self = this;
    $.ajax({
	url: "serv/prox.php?uri="+escape(self.cards[self.top])
    }).done(function( data ) {
	eval("var jdata="+data+";");
	self.topprops = {};
	for (var ind in self.config.properties){
	    self.topprops[self.config.properties[ind].name] = 
		self.config.properties[ind].comp(jdata);		
	    if (self.sums[self.config.properties[ind].name] == undefined)
		self.sums[self.config.properties[ind].name] = 0;
	    if (self.counts[self.config.properties[ind].name] == undefined)
		self.counts[self.config.properties[ind].name] = 0;
	    self.sums[self.config.properties[ind].name] += self.topprops[self.config.properties[ind].name];
	    self.counts[self.config.properties[ind].name]++;
	}
	if(typeof(Storage) !== "undefined"){
	    localStorage.setItem("tmk"+self.cards[self.top], JSON.stringify(self.topprops));
	}
	self.propertiesObtained=true;
	if (display){
	    self.displayProperties();
	}
    });	
}

TMKCards.prototype.highlightProperty = function(name){
    $(this.element.replace("card", "prop")+name.
      replace(/ /g, '_').replace(/\(/, '').replace(/\)/, '')).
	stop(true).
	css("transition", "0.2s").
	css('transform', 'scale(1.5,1.5)');
    var self=this;
    setTimeout(function(){
	$(self.element.replace("card", "prop")+name.
	  replace(/ /g, '_').replace(/\(/, '').replace(/\)/, '')).
	    stop(true).
	    css("transition", "0.2s").
	    css('transform', 'scale(1,1)');	
	}, 400);
}

TMKCards.prototype.pick = function(){
    if (!this.propertiesObtained){ return false; }
    var avg = new Array();
    for (var name in this.sums){
	avg[name]=this.sums[name]/this.counts[name];
    }
    var diffs = new Array();
    var ndiffs = new Array();
    for (var name in avg){
	diffs[name] = this.topprops[name]-avg[name];
	ndiffs.push(this.topprops[name]-avg[name]);
    }
    ndiffs.sort();
    console.log(ndiffs);
    console.log(diffs);
    console.log(avg);
    console.log(this.sums);
    console.log(this.counts);
    var rand = Math.floor(Math.random()*32);
    console.log("rand: "+rand);
    if (rand<16){
	for (var name in diffs){
	    if (diffs[name] == ndiffs[4]) return name;
	}
    }
    if (rand >=16 && rand<24){
	for (var name in diffs){
	    if (diffs[name] == ndiffs[3]) return name;
	}
    }
    if (rand >=24 && rand<28){
	for (var name in diffs){
	    if (diffs[name] == ndiffs[2]) return name;
	}
    }
    if (rand >=28 && rand<30){
	for (var name in diffs){
	    if (diffs[name] == ndiffs[1]) return name;
	}
    }
    if (rand >=30 && rand<31){
	for (var name in diffs){
	    if (diffs[name] == ndiffs[0]) return name;
	}
    }
    return "test";
}


TMKCards.prototype.displayProperties = function(){
    shtml='<ul class="proplist">';
    for(var name in this.topprops){
	shtml+='<li class="proplistitem" id="'+
	    this.element.replace("card", "prop").substring(1)+name.
	    replace(/ /g, '_').replace(/\(/, '').replace(/\)/, '')+
	    '" onclick="propertyClicked(\''+name+'\')"><span class="proplabel">'+name+
	    '</span> <span class="propvalue">'+this.topprops[name]+'</span></li>';
    }
    shtml+='</ul>';
    $(this.element.replace("card", "prop")).html(shtml);
}

/* transfer the top card to the 
 * other (wining) deck */
TMKCards.prototype.giveAway = function(odeck){
    var odecky = $(odeck.element).offset().left;
    var tdecky = $(this.element).offset().left;    
    $(this.element).
	css("transition", "1s").
	css("transform", 'translate('+(odecky-tdecky)+'px, 0px)');
    odeck.addCard(this.cards[this.top]);
    this.top--;
    this.propertiesObtained=false;
}

TMKCards.prototype.topToBottom = function(){
    this.addCard(this.cards[this.top]);
    this.top--;
}

/* add a card at the bottom of the deck */
TMKCards.prototype.addCard = function(uri){
    this.cards[this.bottom-1] = uri;
    this.bottom--;
}

/* returns the number of cards in the deck */
TMKCards.prototype.size = function(){
    // console.log(this.top+" "+this.bottom);
    return (this.top-this.bottom)+1;
}

/* shuffle the cards */
TMKCards.prototype.shuffle = function(){
    for (var i = 0; i<this.size(); i++){
	var j = Math.floor(Math.random() * this.size()) + this.bottom;
	var ii = i + this.bottom;
	var tmp = this.cards[ii];
	this.cards[ii] = this.cards[j];
	this.cards[j] = tmp;
    }
}

/* return the name from a uri */
TMKCards.prototype.getName = function(uri){
    return uri.substring(uri.lastIndexOf('/')+1).replace(/_/g, " ").toUpperCase();
}




