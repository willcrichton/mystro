var oldData = {
    // key: value pairs where key is the time in ms
    // 1234: {
    //     pointerTip: ...,
    //     pointerSpeed: ..., 
    //     handLoc: ..., 
    //     ...
    //  }
}


// Always returns a point (coordinate) on the screen (Optional?)
function detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}


// Returns an absolute or relative change in volume.
// Use a threshold speed or absolute difference, and hand direction.
function detectVolumeChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}


// Returns an absolute or relative change in tempo.
function detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir) {

}


// Points to a region in the orchestra.
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
    detectSelect(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectVolumeChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectTempoChange(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
    detectOrchLoc(pointerTip, pointerSpeed, handLoc, palmDir, fingerDir);
}

exports.pushData = pushData;
