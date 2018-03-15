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
    var trainame = utils.varescape(train.name);
    database.ref(`trains/${trainame}`).once("value", snapshot => {
        const dbtrain = snapshot.val();
        if (!dbtrain)
            database.ref(`trains`).child(trainame).set(convertObj2Data(train));
    });
}
function convertObj2Data(train){
    return {
        'destination': train.destination,
        'startime': train.startime,
        'frequency': train.frequency
    };
}

$(document).ready(function(){

    var trainobj = {
        name: 'Dummy Test',
        destination: '77077',
        startime: '03:00',
        frequency: '3'
    };
    setupParentNode();
    //addTrain(trainobj);

});