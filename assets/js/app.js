var database = firebase.database();
var trains = null;

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
    trainobj.startime = moment(trainobj.startime, 'HH:mm A').format('X'); //add fix for date set in the past later
    trainobj.name = utils.varescape(trainobj.name);
    //addTrain(trainobj);
}

function calcMinutes(train){

    var difference = moment().diff(moment.unix(train.startime), 'minutes'); // positive if in past, negative if in future
    var offset = train.frequency - difference % train.frequency;
    var arrives = moment().add(offset, "m").format("hh:mm A");
    train['nextarrival'] = arrives;
    train['minutesaway'] = offset;
    return train;

}

function displayRow(train)
{
    train = calcMinutes(train);
    delete train.startime;
    var $tr = $('<tr>').attr('id',train.name);
    $.each(train, function(prop, value){
        switch(prop){
            default: $tr.append($('<td>').text(value));
        }
    });
    $('#trains').append($tr);
}

function displayTrains(){
    database.ref().on('child_added', function (snapshot, prevChildKey) {
        if(snapshot.val() !== null){
            var train = $.extend({'name': Object.keys(snapshot.val())[0]}, snapshot.val()[Object.keys(snapshot.val())[0]]);
            displayRow(train);
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

$(document).ready(function(){
    setupParentNode();
    displayTrains();
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