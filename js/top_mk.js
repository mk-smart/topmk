

var conf = {
  type: "https://data.beta.mksmart.org/entity/ward/", 
  properties: [
      {name: "Population (K)", comp: function(data){
	  return Math.floor(
	      parseInt(data["global:usualResidents"][0]["global:all_usual_residents"][0])/100)/10.0;
      }},
      {name: "Area (km2)", comp: function(data){ 	  
	  return Math.floor(parseInt(data["global:usualResidents"][0]["global:area_(hectares)"][0])/10)/10;
      }},
      {name: "Health", comp: function(data){ 
	  console.log(data["global:health"]);
//	  var res = 0;;
//	  for (var x in data["global:health"]){
//	      var o = data["global:health"][x];
//	      if (o["global:yearly"]){
//		  if (o["global:yearly"][0]["global:2007_-_2011"]) res = Math.round(parseFloat(o["global:yearly"][0]["global:2007_-_2011"][0]));
//	      }
//	  }
//	  return res;
//	  return Math.floor(parseFloat(data["global:health"][0]["global:yearly"][0]["global:2007_-_2001"][0]));
          return Math.floor(
	      ((parseInt(data["global:health"][0]["global:very_good_health"][0])+
	       parseInt(data["global:health"][0]["global:good_health"][0]))
		  /
		  parseInt(data["global:usualResidents"][0]["global:all_usual_residents"][0]))*100);
      }},
      {name: "Qualification", comp: function(data){ 
	  return Math.floor(((
	      parseInt(data["global:qualifications"][0]["global:highest_level_of_qualification:_level_1_qualifications"][0])+
	      parseInt(data["global:qualifications"][0]["global:highest_level_of_qualification:_level_2_qualifications"][0])+
	      parseInt(data["global:qualifications"][0]["global:highest_level_of_qualification:_level_3_qualifications"][0])+
	      parseInt(data["global:qualifications"][0]["global:highest_level_of_qualification:_level_4_qualifications_and_above"][0])+
	      parseInt(data["global:qualifications"][0]["global:highest_level_of_qualification:_apprenticeship"][0])+
	      parseInt(data["global:qualifications"][0]["global:highest_level_of_qualification:_other_qualifications"][0]))/
			    parseInt(data["global:usualResidents"][0]["global:all_usual_residents"][0]))*100
	  );}},
      {name: "Ethnic mix", comp: function(data){ 
	  return 100-Math.floor(
	      parseInt(data["global:ethnicGroup"][0]["global:white"][0])*100/
		  parseInt(data["global:usualResidents"][0]["global:all_usual_residents"][0]))
	  ;
      }}
      ]
}

overalldeck = new TMKCards(conf);
goAhead();

function goAhead(){
    if (!overalldeck.ready){
	setTimeout(goAhead, 100);
	console.log("not yet");
	return;
    }

    leftdeck    = new TMKCards(conf, "#leftcard");
    rightdeck   = new TMKCards(conf, "#rightcard");   
    
    overalldeck.distribute(leftdeck, rightdeck);
    
    leftdeck.updateScore(false);
    rightdeck.updateScore(true);

    startNewTurn();
}

var compHasHand = false;
var propertyPicked = "";

function startNewTurn(){    
    if (leftdeck.size()==0){
	youHaveWon();
	return;
    } else if (rightdeck.size()==0){
	youHaveLost();
	return;
    }
    leftdeck.cover();
    rightdeck.cover();    
    leftdeck.getProperties(false);
    rightdeck.flip();    
    if (compHasHand){
	compTurn();
    } 
    // else do nothing because you wait 
    // for the property to be picked
}
    
function compTurn(){
    if (!rightdeck.propertiesObtained || !leftdeck.propertiesObtained) {
	console.log("wait a bit");
	setTimeout(compTurn, 200);
	return;
    }
    var prop = leftdeck.pick();
    propertyPicked = prop;
    console.log("picked "+prop);
    setTimeout(function(){
	leftdeck.highlightProperty(prop);
	rightdeck.highlightProperty(prop);
    }, 1500);
    leftdeck.flip();
    setTimeout(function(){
	checkTurnResults(true);}, 100);
}


function propertyClicked(property){
    if (!compHasHand){
	compHasHand=false;
	rightdeck.highlightProperty(property);
	leftdeck.flip();
	propertyPicked = property;
	checkTurnResults(false);	
    }
}

function checkTurnResults(chh){
    var rightv = rightdeck.query(propertyPicked);
    var leftv  = leftdeck.query(propertyPicked);
    // risk of re-clicking here... 
    if (leftv>rightv){
	compHasHand=true;	
	leftdeck.topToBottom();
	setTimeout(function(){
	    rightdeck.giveAway(leftdeck);
	    leftdeck.updateScore(true);
	    rightdeck.updateScore(false);
	    setTimeout(startNewTurn, 1000);
	}, 4000);
    } else{
	compHasHand=false;
	rightdeck.topToBottom();
	setTimeout(function(){
	    leftdeck.giveAway(rightdeck);
	    leftdeck.updateScore(false);
	    rightdeck.updateScore(true);
	    setTimeout(startNewTurn, 2000);
	}, 4000);
    }
}

function youHaveWon(){
    alert("You have won!! Reload the page to play again");
}

function youHaveLost(){
    alert("You have Lost :((( Reload the page to play again");
}
