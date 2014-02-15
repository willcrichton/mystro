var oldData = {
    // key: value pairs where key is the time in ms
    // 1234: {
    //     pointerTip: ...,
    //     pointerSpeed: ..., 
    //     handLoc: ..., 
    //     ...
    //  }
}

function detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}

function detectVolumeChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}

function detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}

function detectOrchLoc(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}

// Called when the leapmotion gets new data.
// pointerTip : array 0..2
// pointerSpeed : int
// handLoc : array 0..2
// palmDir : array 0..2 (normalized)
// fingerDir : array 0..2 (normalized)
// For each input, no data if null
function pushData(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {
    time = (new Date()).getTime();
    oldData[time] = {
         pointerTip: pointerTip,
         pointerSpeed: pointerSpeed, 
         handLoc: handLoc, 
         palmDir: palmDir,
         fingerDir: fingerDir
    }

    detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectVolumeChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectOrchLoc(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
}

exports.pushData = pushData;
