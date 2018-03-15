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
        if (!dbtrain) {
            var data = convertObj2Data(train);
            database.ref(`trains`).child(train.name).set(data);
            displayTrain(train.name, data);
        }
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

function displayTrain(train, values){
        var traindisplay = $.extend({'name': train}, values);
        displayRow(traindisplay);
}

function getAllTrains() {
    database.ref(`trains`).once("value", function(snapshot){
        $.each(snapshot.val(), function(key, value){
            displayTrain(key, value);
        });
    });
}

$(document).ready(function(){
    setupParentNode();
    getAllTrains();
    var statusUpdate = setInterval(function() {
        // your code goes here...
    }, 60 * 1000);
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