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
    trainobj.startime = moment(trainobj.startime, 'HH:mm A').format('X');
    trainobj.name = utils.varescape(trainobj.name);
    addTrain(trainobj);
    displayTrains();
}

function calcMinutes(train){

    var difference = moment().diff(moment.unix(train.startime), 'minutes'); //NOTE: positive if in past, negative if in future
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
            case 'name':
                $tr.append($('<td>').text(utils.formatdisplay(value)));
                break;
            default: $tr.append($('<td>').text(value));
        }
    });
    $('#trains').append($tr);
}

function displayTrains(){
    database.ref().on('child_added', function (snapshot, prevChildKey) {
        if(snapshot.val() !== null){
            var train = $.extend({'name': Object.keys(snapshot.val())[0]}, snapshot.val()[Object.keys(snapshot.val())[0]]);
            if(train.destination)
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
        formatUserData(formdata);
        $('form')[0].reset();
    });
});