var C = {BASE_TEMPO: 108};

function clamp(x, a, b) {
    return Math.max(Math.min(x, b), a);
}



var dataProcessing = (function() {
    var oldData = [
        // key: value pairs where key is the time in ms
        // 1234: {
        //     pointerTip: ...,
        //     pointerSpeed: ..., 
        //     handLoc: ..., 
        //     ...
        //  }
    ]

    var lastAverageV = [0,0,0];
    var currentlyTouched = 0;
    var lastBeatTime = 0;
    var lastBeatLoc = [0, 0, 0]; //Chance of error is small
    var lastBeatDist = 1;
    var relevantFinger = null;
    var BASE_TEMPO = C.BASE_TEMPO;
    var tempo = BASE_TEMPO;

    detectSelectCallback = function() { }
    detectVolumeChangeCallback = function() { }
    detectTempoChangeCallback = function() { }
    detectOrchLocCallback = function() { }
    onBeatCallback = function() { }
    onStartCallback = function() { }


    ////////////////////////// Vector Functions  ///////////////////////////
    function magnitude3(vec) {
        return Leap.vec3.len(vec);
    }

    
    function averageVector3(vecs){
        if(vecs.length === 0)
            return [0, 0, 0];
        sum = $V([0,0,0]);
        for (var i = vecs.length - 1; i >= 0; i--) {
            sum = sum.add($V(vecs[i]));
        };
        return sum.multiply(1.0/vecs.length).elements;
    }

    var frontMostPointable = function(pointables){
        var zs = pointables.map(function(x){return x.stabilizedTipPosition[2]});
        var index = _.indexOf(zs, _.min(zs));
        return pointables[index];

    }

    var leftMostHand = function(hands){
        var zs = hands.map(function(x){return x.palmPosition[0]});
        var index = _.indexOf(zs, _.min(zs));
        return hands[index];

    }


    // Use OLD DATA to caluate an average acceleration over the previous
    // n iterations.
    function historicalAcceleration(n){
        TIMEOUT = 1000;
        if(oldData.length >= n){
            var lastn1 = oldData.slice(-n);
            var lastn = oldData.slice(-n).filter(function(y) {
                return y.pointerSpeed != null && (((new Date().getTime()) - y.time) < 1000)
            }).map(function(x) {
                return x.pointerSpeed;
            });

            var accels = [];
            for (var i = lastn.length - 1; i >= 1; i--) {
                accels.push($V(lastn[i]).subtract($V(lastn[i-1])).elements);
            };
            return averageVector3(accels);
        }
        else{
            return 0;            
        }
        return 0;
    }

    function relativeAcceleration(pointerSpeed, n){
        if(oldData.length >= n) {
            var lastn = oldData.slice(-n).filter(function(y){return y.pointerSpeed != null && (((new Date().getTime()) - y.time) < 1000)}).map(function(x){return x.pointerSpeed});
            var avgOldSpeed = averageVector3(lastn);
            return $V(pointerSpeed).subtract($V(avgOldSpeed)).elements;
        } else {
            return 0;
        }
    }

    // Calls back true if an instrumental group is selected.
    // Calls back false othe group is deselected otherwise.
    function detectSelect(hands, frame) {
        if(frame.pointables.length > 0)
        {
            var prerelevant = frame.pointable(relevantFinger).valid;
            if(relevantFinger == null || frame.pointable(relevantFinger).valid == false){
                var hands = frame.hands.filter(function(elem){return ((elem.tools.length == 0) && (elem.pointables.length > 0))});
                if(hands.length > 0){
                    hand  = leftMostHand(hands);
                    pointer = frontMostPointable(hand.pointables);
                    relevantFinger = pointer.id;
                }
            }
            if(frame.pointable(relevantFinger).valid != false){
                var distance = frame.pointable(relevantFinger).stabilizedTipPosition;   
                if(distance[2] < -50 && !currentlyTouched) {detectSelectCallback(true); currentlyTouched = true;}
                if(distance[2] > 0 && currentlyTouched) {detectSelectCallback(false); currentlyTouched = false;}
            }
        }
    }

    var MIN_PALM_HEIGHT = 100;
    var MAX_PALM_HEIGHT = 500;
    function normedVol(absoluteVolDelta) {
        return absoluteVolDelta/(MAX_PALM_HEIGHT - MIN_PALM_HEIGHT);
    }

    // Gets the last non-null pair of palmVelocity and handLoc to interpolate 
    // in detectVolumeChange. This could be two functions, one for handLoc and
    // one for palmVelocity, but I think it's rare that we can get one but not
    // the other. To be clear, this get's a pair previous in time: the last 
    // element of oldData is actually the current data, so ignore that one.
    // Also checks that the data is 'recent enough'.
    function lastVolData(time) {
        var IGNORE_IF_OLDER_THAN_MILLIS = 100;
        if(oldData.length > 1) {
            for(var i = oldData.length-2; i >= 0; i--) {
                var elt = oldData[i];
                if(elt.handLoc !== null && elt.palmVelocity != null &&
                   elt.handLoc[1] <= MAX_PALM_HEIGHT && elt.handLoc[1] >= MIN_PALM_HEIGHT) {
                    if(time - elt.time > IGNORE_IF_OLDER_THAN_MILLIS) {
                        return null;
                    } else {
                        return elt;
                    }
                }
            }
        }
        return null;
    }

    // Returns change in volume, from -1.0 to 1.0.
    function detectVolumeChange(handLoc, palmVelocity, time) {
        if(palmVelocity === undefined) {
            throw new Error('palmVelocity is undefined!');
        }  
        if(handLoc === undefined) {
            throw new Error('handLoc is undefined!');
        }

        /*
          if(handLoc[1] < MIN_PALM_HEIGHT || handLoc[1] > MAX_PALM_HEIGHT) {
          // Out of range. Ignore.
          return;
          }
        */

        if(palmVelocity === null || handLoc === null) {
            /*var prevGoodData = lastVolData(time);
              if(prevGoodData === null) {
              //console.log('No recent left hand. (null)');
              return;
              }

              var prevTime = (_.last(oldData, 2))[0];
              if(prevTime === undefined || prevTime === null) {
              throw new Error('sadface. need to sleep on this.');
              }
              if(prevTime.time > time) {
              throw new Error('I really hope this never happens. Did it?');
              }

              // Linearly interpolate to guess new volume.
              console.log('Time: ' + prevTime.time);
              console.log('Velocity: ' + prevGoodData.palmVelocity);
              var result = (time - prevTime.time)*prevGoodData.palmVelocity;

              if(_.isNaN(result)) console.log('Found result = NaN');
              var tmp = normedVol(result);
              if(_.isNaN(tmp)) console.log('Found normedVol = NaN');
              detectVolumeChangeCallback(normedVol(result));
            */
        } else {
            if(handLoc[1] < MIN_PALM_HEIGHT || handLoc[1] > MAX_PALM_HEIGHT) {
                // Out of range. Ignore.
                return;
            }

            var moveDirection = palmVelocity[1];
            var thisHeight = handLoc[1];
            var lastHeightElt = lastVolData(time);
            if(lastHeightElt === null) {
                //console.log('No recent left hand. (no lastHeightElt)');
                return;
            }
            var lastHeight = lastHeightElt.handLoc[1];
            var result = null;
            if((moveDirection > 0 && thisHeight > lastHeight) ||
               (moveDirection < 0 && thisHeight < lastHeight)) {
                result = thisHeight - lastHeight;
            }

            if(result !== null) {
                //if(_.isNaN(result)) console.log('Found result = NaN');
                //var tmp = normedVol(result);
                //if(_.isNaN(tmp)) console.log('Found normedVol = NaN');
                detectVolumeChangeCallback(normedVol(result));
            }
        }
    }
    // NOT ACTUALLY A DOT PRODUCT. EDIT: dot product is now a real dot product
    function dotP(a, b){
        var A = 1
        var B = 1
        return A*a[0]*b[0] + B*a[1]*b[1] + a[2]+b[2];
    }
    
    function cosine(a,b){
        if(a === [0,0,0] || b === [0,0,0])
            return 0;
        return dotP(a,b)/(magnitude3(a)*magnitude3(b))
    }

    function distance2(pt, ps){
        return magnitude3([pt[0]-ps[0], pt[1]-ps[1], 0]);
    }

    // Calls the callback function if current state is a beat.
    var NUM_FRAMES = 25;
    var TIME_DELAY = 350;
    var BEAT_THRESHOLD = -7000;
    var lastSpeeds = [];

    // Gets an array of the last n frames which had beats. If there aren't n of
    // them, returns a smaller array.
    function lastnBeats(n) {
        var arr = [];
        var beatsSeen = 0;
        for(var i = oldData.length - 1; i >= 0; i--) {
            //console.log(i);
            if(oldData[i].isBeat) {
                //console.log('Index ' + i + ' is a beat');
                beatsSeen++;
                arr.unshift(oldData[i]);
                if(beatsSeen === n) {
                    return arr;
                }
            } 
        }
        return arr;
    }

    /* To ensure backwards compatibilty. This needs to change */
    var MAX_TEMPO = 2*BASE_TEMPO;
    var MIN_TEMPO = parseInt(BASE_TEMPO/3);
    var TEMPO_SMOOTHING = 4;
    var IGNORE_FIRST_N_BEATS = 3;
    // var BEAT_RANGE_LOW = .8; //Patrick takes care of this
    var BEAT_RANGE_HIGH = 1.2;
    var numBeats = 0;

    function detectTempoChange(pointerTip, pointerSpeed, time) {
        var isBeat = beatReceived(pointerTip, pointerSpeed);
        if(isBeat) {
            numBeats++;
        }
        oldData[oldData.length - 1].isBeat = isBeat;
        //console.log('numBeats = ' + numBeats);
        if(numBeats <= TEMPO_SMOOTHING + IGNORE_FIRST_N_BEATS) {
            return;
        }
        
        // oldData is nonempty since the current frame is in it.
        //console.log('Index ' + (oldData.length - 1) + ' isBeat= ' + isBeat);
        
        var shouldBeBeat = time - lastBeatTime > BEAT_RANGE_HIGH*(60*1000)/tempo;
        
        if(isBeat || shouldBeBeat) {
            var oldBeats;
            if(shouldBeBeat) {
                oldBeats = lastnBeats(TEMPO_SMOOTHING);
                oldBeats.push(oldData[oldData.length - 1]);
            } else {
                oldBeats = lastnBeats(TEMPO_SMOOTHING+1);
            }
            if(oldBeats.length > TEMPO_SMOOTHING) {
                var newTempo = (60*1000)*TEMPO_SMOOTHING/(time - (oldBeats[0].time));
                //console.log('time =  ' + time);
                //console.log('oldBeats[0].time = ' + oldBeats[0].time);
                //console.log('time - ....time =  ' + (time - oldBeats[0].time));
                for(var i = 0; i < TEMPO_SMOOTHING + 1; i++) {
                    //console.log(oldBeats[i].time);
                }
                /*_.reduce(lastnBeats(TEMPO_SMOOTHING), function(a, b) {
                    return a.b;
                }, 0)/TEMPO_SMOOTHING;
                */
                //console.log("time" + time);
                //console.log("oooo"   + oldBeats[0].time);
                //console.log("tempo just set to " + newTempo);
                tempo = clamp(newTempo, MIN_TEMPO, MAX_TEMPO);
                detectTempoChangeCallback(tempo);
            } else {
                //console.log('Error: oldBeats.length = ' + oldBeats.length);
                //console.log('Error: numBeats = ' + numBeats);
                throw new Error('lastnBeats is malfunctioning');
            }
        }
    }
    /*
    var speeds = [];
    var NUM_SPEEDS = 1000;

    function detectTempoChange(pointerTip, pointerSpeed, time){
        
        if (pointerTip === null) return;

        //console.log(pointerTip, pointerSpeed);

        var speed = Math.sqrt(Math.pow(pointerSpeed[0], 2) + Math.pow(pointerSpeed[1], 2));
        speeds.push(speed);
        if (speeds.length >= NUM_SPEEDS) {
            speeds.shift();
        }
        
        var avg = 0;
        speeds.forEach(function(s) { avg += s; });
        avg /= speeds.length;

        var newAvg = 0;
        var counter = 0;
        speeds.forEach(function(s) {
            if (Math.abs(newAvg - s) < 300) {
                newAvg += s;
                counter++;
            }
        });

        avg = newAvg / counter;

        //console.log(avg);
        if (avg < 700) {
            detectTempoChangeCallback(0);
        } else if (avg < 1200) {
            detectTempoChangeCallback(1);
        } else {
            detectTempoChangeCallback(2);
        }
        */
        

        /*var isBeat = beatReceived(pointerTip, pointerSpeed);
          if(isBeat) {
          numBeats++;
          }
          if(numBeats <= TEMPO_SMOOTHING + IGNORE_FIRST_N_BEATS) {
          return;
          }
          
          // oldData is nonempty since the current frame is in it.
          oldData[oldData.length - 1].isBeat = isBeat;
          
          var shouldBeBeat = time - lastBeatTime > BEAT_RANGE_HIGH*(60*1000)/tempo;
          
          if(isBeat || shouldBeBeat) {
          var oldBeats = lastnBeats(lastnBeats(TEMPO_SMOOTHING+1));
          if(oldBeats.length > TEMPO_SMOOTHING) {
          var newTempo = TEMPO_SMOOTHING/(time - (oldBeats[0].time))*(60*1000);
          console.log('Old beats: ');
          for(var i = 0; i < TEMPO_SMOOTHING + 1; i++) {
          console.log(oldBeats[i].time);
          }
          //_.reduce(lastnBeats(TEMPO_SMOOTHING), function(a, b) {
          //    return a.b;
          //}, 0)/TEMPO_SMOOTHING;
          //console.log("time" + time);
          //console.log("oooo"   + oldBeats[0].time);
          //console.log("tempo just set to " + newTempo);
          tempo = clamp(newTempo, MIN_TEMPO, MAX_TEMPO);
          detectTempoChangeCallback(tempo);
          }
          }*/
    //}

    // For the lights!
    DIST_LOWER_BOUND = 50;
    DIST_UPPER_BOUND = 450;
    var INTENSITY_SMOOTHING = TEMPO_SMOOTHING;
    function detectIntensityChange(time) {
        oldData.beatDist = lastBeatDist;
        if(numBeats <= INTENSITY_SMOOTHING + IGNORE_FIRST_N_BEATS) {
            return;
        }
        
        // oldData is nonempty since the current frame is in it.
        //var shouldBeBeat = time - lastBeatTime > BEAT_RANGE_HIGH*(60*1000)/tempo;
        
        var oldBeats = lastnBeats(INTENSITY_SMOOTHING+1);
        if(oldBeats.length > INTENSITY_SMOOTHING) {
            var mapped = _.map(oldBeats, function(beat) {
                return beat.beatDist;
            });
            var avgDist = (_.reduce(mapped, function(a, b) { 
                return a+b;
            }, 0))/(INTENSITY_SMOOTHING+1);

            var clamped = clamp(avgDist, DIST_LOWER_BOUND, DIST_UPPER_BOUND);
            var normalized = (clamped - DIST_LOWER_BOUND)/DIST_UPPER_BOUND;

            detectIntensityChangeCallback(normalized);
        } else {
            throw new Error('lastnBeats is malfunctioning');
        }
    }

    // Preliminary detectTempoChange function.
    // Currently this OVERCOUNTS the beats.
    // IMPORTANT: RETURNS TRUE IF A BEAT IS RECEIVED
    // There are still bugs, I want to push out something so you guys
    // can use it first.
    function beatReceived(pointerTip, pointerSpeed){
        //REQUIRES tempo != nan.
        var V_SMOOTHNESS = 35;
        var V_BEGIN = 50;
       // var TIMEDELAY = (3/5)*(60000/tempo);      //Calibrate based on tempo
        var TIMEDELAY = (300);
        var EPSILON = (3*lastBeatDist)/5;        //Calibrate based on intensity (if exists)
        var returnVar = false;    // this variable is dumb.
        var COSTHRES = -0.25


        
        if(pointerTip != null){
            var oldvs = oldData.slice(-V_BEGIN, (-V_BEGIN + V_SMOOTHNESS)).
                filter(function(x){return x.pointerSpeed != null;}).
                map(function(y){return y.pointerSpeed});
            if(oldvs.length > 5){
                oldvs.push(lastAverageV);
            }
            var avgVel = averageVector3(oldvs);
            var beatSign = cosine([avgVel[0], avgVel[1], 0], [pointerSpeed[0], pointerSpeed[1], 0]);
            if(beatSign < COSTHRES){
                //console.log(beatSign, magnitude3(pointerSpeed), (new Date().getTime() - lastBeatTime), distance2(pointerTip, lastBeatLoc) );
                //console.log("For the above, time delay is" + TIMEDELAY + " and ep is" + EPSILON);
            }
            if( (beatSign < COSTHRES || magnitude3(pointerSpeed) < 30 ) 
                && (new Date().getTime() - lastBeatTime)> TIMEDELAY &&
                distance2(pointerTip, lastBeatLoc) > EPSILON ){
                console.log(beatSign, distance2(pointerTip, lastBeatLoc), pointerTip, magnitude3(pointerSpeed), new Date().getTime() - lastBeatTime);
                lastBeatTime = (new Date().getTime());
                lastBeatDist = distance2(pointerTip, lastBeatLoc);
                console.log(lastBeatDist);
                console.log("Tempo is " + tempo);
                lastBeatLoc = pointerTip;
                returnVar = true;
                onBeatCallback();
            }
            lastAverageV = pointerSpeed;

        }
        return returnVar;
    }

    // Helper for detectOrchLoc (Not used as of saturday morning)
    // function detectRecentHandLoc(){
    //     var LEFTEDGE = -300; 
    //     var TOPEDGE = 400;
    //     return [LEFTEDGE, TOPEDGE];
    // }

    // Points to a region in the orchestra.    
    // Does simple physics vector addition with some bounds.
    // Reasons why this doesn't work too well: Conductors point to groups of
    // musicians by a combination of their hand location and direction.
    // We can make the direction smooth (i.e. pointing at a place = place
    // lights up) but then left-right movement is shaky (really hard
    // to stay in the middle. Alternatively, we can have smooth
    // left-right movement but then pointing to a place won't work.
    // You can't point to the endpoints from the other endpoint.
    // There is not really a middle ground.

    // The variable to change is DEPTH. Lower DEPTH = smoother lateral movement.
    //                                  Higher DEPTH = smoother pointing.

    function detectOrchLoc(handLoc, fingerDir) {
        // Constants for determining edges

        var RIGHTEDGE = 50;
        var LEFTEDGE = -280; 
        var BOTTOMEDGE = 180;
        var TOPEDGE = 450;
        var DEPTH =  50;         //variable

        // Ignore out of place places, since the front end will 
        // display exactly what we want (unchanged).
        if(handLoc === null || (handLoc[0] < LEFTEDGE || handLoc[0] > RIGHTEDGE)
           || (handLoc[1] < BOTTOMEDGE || handLoc[1] > TOPEDGE)){
            return;
        }
        var handX = handLoc[0];
        var handY = handLoc[1];

        if(fingerDir === null){
            fingerDir = [0, 0, 1];
        }

        var fingerX = fingerDir[0];
        var fingerY = fingerDir[1];
        
        var fingerNorm = Math.sqrt(fingerX*fingerX + fingerY*fingerY);
        if(fingerNorm === 0){
            var fingerLocNorm = [0,0];
        }
        else{
            var fingerLocNorm = [fingerX/fingerNorm, fingerY/fingerNorm];
        }
        
        var finalHandLoc = [handX + fingerLocNorm[0]*DEPTH, 
                            handY + fingerLocNorm[1]*DEPTH];

        var finalNormedLoc = [(finalHandLoc[0] - LEFTEDGE)/(RIGHTEDGE-LEFTEDGE), 
                              (finalHandLoc[1] - BOTTOMEDGE)/(TOPEDGE-BOTTOMEDGE)];
        
        finalNormedLoc = _.map(finalNormedLoc, 
                               function (v){ if(v < 0) {return 0;} 
                                             else if(v > 1) {return 0.99;}
                                             else return v;});
        detectOrchLocCallback(finalNormedLoc);
    }

    var started = false;
    return {
        // Called when the leapmotion gets new data.
        // pointerTip : array 0..2
        // pointerSpeed : int
        // handLoc : array 0..2
        // palmVelocity : array 0..2 (normalized)
        // fingerDir : array 0..2 (normalized)
        // For each input, no data if null
        pushData: function(frame, hands, pointerTip, pointerSpeed, handLoc, palmVelocity, fingerDir) {
            if(handLoc === undefined) {
                throw new Error('undefined handLoc passed to pushData.');
            }
            if(palmVelocity === undefined) {
                throw new Error('undefined palmVelocity passed to pushData.');
            }

            onStartCallback();

            time = (new Date()).getTime();
            oldData.push({
                time: time,
                pointerTip: pointerTip,
                pointerSpeed: pointerSpeed, 
                handLoc: handLoc, 
                palmVelocity: palmVelocity,
                fingerDir: fingerDir
            });

            detectSelect(hands, frame);

            detectVolumeChange(handLoc, palmVelocity, time);
            detectTempoChange(pointerTip, pointerSpeed, time);
            detectOrchLoc(handLoc, fingerDir);
        },
        onDetectSelectChange: function(callback) {
            detectSelectCallback = callback;
        },
        onDetectVolumeChange: function(callback) {
            detectVolumeChangeCallback = callback;
        },
        onDetectTempoChange: function(callback) {
            detectTempoChangeCallback = callback;
        },
        onDetectIntensityChange: function(callback) {
            onDetectIntesityCallback = callback;
        },
        onDetectOrchLoc: function(callback) {
            detectOrchLocCallback = callback;
        },
        onBeat: function(callback) {
            onBeatCallback = callback;
        },
        onStart: function(callback) {
            onStartCallback = callback;
        }
    }
})();
