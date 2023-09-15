
// State
var seqToExecMapping = {
  // "1": {FaderMaster:[{page: 1, exec: 201}]}
};

var GRANDMA3_MODULE_NAME = script.getParent().getParent().name;
var MOVE_EXEC_FADER_COMMAND_NAME = "Move Executor Fader";

function init() {
  log("grandMA3 FEEDBACK script");

  // Test
  // var midiValue = findMappings({ page: 1, exec: 201 });
  // log(midiValue.name);
}

function oscEvent(address, args) {
  log("oscEvent: " + address + " " + args);
  var address_list = address.split(".");

  if (address.indexOf("13.13.1.6") == 1) {
    var seqIndexString = address_list[address_list.length - 1];
    processSequenceFeedback(seqIndexString, args);
  } else if (address == "/ma3/chataigne_companion/seq2exec") {
    log('seq2exec');
    processSequence2Exec(args);
  } else if (address == "/ma3/chataigne_companion/seq2exec/reset") {
    log('seq2exec RESET');
    processSequence2ExecReset();
  }
}


function processSequence2ExecReset() {
  seqToExecMapping = {};
}

function processSequence2Exec(args) {

  var seqIndex = args[0];
  log('processSequence2Exec: seqIndex=' + seqIndex);
  var faderType = "Fader" + args[1];
  var execPage = args[2];
  var execNumber = args[3];
  var faderValue = args[4]; // 0-100

  log('seqIndex: ' + seqIndex + ', faderType: ' + faderType + ', execPage: ' + execPage + ', execNumber: ' + execNumber + ', faderValue: ' + faderValue);
  var seq = seqToExecMapping[seqIndex];
  if (seq == undefined) {
    seq = {};
    seqToExecMapping[seqIndex] = seq;
  }
  var execs = seq[faderType];
  if (execs == undefined) {
    execs = [];
    seq[faderType] = execs;
  }
  // Check if exists
  for (var i = 0; i < execs.length; i++) {
    var exec = execs[i];
    if (exec.page == execPage && exec.exec == execNumber) {
      // seq=>exec is already mapped
      return;
    }
  }

  execs.push({ page: execPage, exec: execNumber });
  log('seqToExecMapping: ' + JSON.stringify(seqToExecMapping));

  // TODO: set fader value
}

function processSequenceFeedback(seqIndexString, args) {
  log('seqIndex: ' + seqIndexString);
  var faderType = args[0];
  var faderNumber = args[1]; // Usually just 1
  var faderValue = args[2];
  var seqName = args[3];
  log(":processSequenceFeedback: seq=" + seqIndexString + ",args0=" + arg0 + ",args1=" + arg1 + ",args2=" + arg2 + ",args3=" + arg3);
  var execData = seqToExecMapping[seqIndexString][faderType][0];
  if (execData == undefined) {
    log('sequence has no exec');
    return;
  }
  var midiValue = findMappings(execData);
  if (midiValue == undefined) {
    log('midiValue is undefined');
    return;
  }
  midiValue.set(faderValue * 127 / 100);
}

function buildExecToMidiMapping() {

}

function findMappings(execData) {
  var page = execData.page;
  var execNumber = execData.exec;

  function visitMapping(output, midiValue) {
    var cmd = output.command;
    if (cmd.page != undefined && cmd.executor != undefined) {
      if (page == cmd.page.get() && execNumber == cmd.executor.get()) {
        return midiValue
      }
    }
  }

  return traverseOutputMappings(visitMapping);
}

/**
 * Traverses all mappings in all states and calls the visitor with OutputMapping
 * object of outputs that are assigned to the "Move Executor Fader" command.
 * @param {function} visitor a callback function (output, midiValue) => any | undefined.
 * 
 * @Return If the visitor's returns a value then the traverseOutputMappings()
 *  function returns the same value and stops traversing. Otherwise, returns undefined
 */
function traverseOutputMappings(visitor) {
  for (var stateIndex = 0; stateIndex < root.states.getItems().length; stateIndex++) {
    var state = root.states.getItems()[stateIndex];
    for (var i = 0; i < state.processors.getItems().length; i++) {
      var p = state.processors.getItems()[i];
      if (p.getJSONData().type != 'Mapping') {
        continue;
      }
      var midiValue = p.inputs.inputValue.inputValue.getTarget();
      var outputItems = p.outputs.getItems();
      for (var j = 0; j < outputItems.length; j++) {
        var output = outputItems[j];
        var outputJsonData = output.getJSONData();

        if (
          outputJsonData.commandModule != GRANDMA3_MODULE_NAME ||
          outputJsonData.commandType != MOVE_EXEC_FADER_COMMAND_NAME) {
          continue;
        }

        var returnValue = visitor(output, midiValue);
        if (returnValue != undefined) {
          return returnValue
        }
      }
    }
  }
}

function log(message) {
  script.log(" FeedBack: " + message);
}
