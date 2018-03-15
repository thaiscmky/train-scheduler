var database = firebase.database();
var utils = {
  varescape: function(str){
      return str.replace(/[^\w\s]/gi, '').replace(/\s/g, '_').toLowerCase();
  },
  formatdisplay: function(property){ //uppercases 1st letter of each word and removes underscores
      return property.replace(/_/g, ' ').replace(/(^| )(\w)/g, function(firstLetter) {
          return firstLetter.toUpperCase();
      });
  }
};

function setupParentNode(){
    database.ref().once('value', function(snapshot){
        if(snapshot.val() === null)
        database.ref().set({'trains': 'init' });
    });
}
function addTrain(train){
    database.ref(`trains/${train.name}`).once("value", snapshot => {
        const dbtrain = snapshot.val();
        if (!dbtrain)
            database.ref(`trains`).child(train.name).set(convertObj2Data(train));
    });
}
function convertObj2Data(train){
    return {
        'destination': train.destination,
        'startime': train.startime,
        'frequency': train.frequency
    };
}

function formatUserData(formdata){
    var trainobj = formdata;
    //http://momentjs.com/docs/#/displaying/
    //Non-unix e.g. format 2018-03-15T01:30:00-05:00 DATE|T|TIME-TIMEZONE
    console.log(moment(trainobj.startime, 'HH:mm A').format());
    trainobj.startime = moment(trainobj.startime, 'HH:mm A').format('X'); //add fix for date set in the past later
    trainobj.name = utils.varescape(trainobj.name);
    //addTrain(trainobj);
    calcMinutes(trainobj);
    var nextarrival;
    var minutesaway;
}

function calcMinutes(train){

    var difference = moment().diff(moment.unix(train.startime), 'minutes'); // positive if in past, negative if in future
    var minutesAway = train.frequency - difference % train.frequency;
    var nextArrival = moment().add(minutesAway, "m").format("hh:mm: A");
    console.log(minutesAway, nextArrival);

}

$(document).ready(function(){
    setupParentNode();
    $('#newtrain').submit(function(e) {
        e.preventDefault();
        var formdata = {};
        $.each($(this).serializeArray(), function(i,v){
            if(v.value) formdata[v.name] = isNaN(v.value.trim()) ? v.value : parseInt(v.value);
        });
        console.log(formdata);
        formatUserData(formdata);
    });
});