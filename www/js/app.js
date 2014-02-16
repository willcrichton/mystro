// hue integration
var Hue;
$(function() {
    // n = 0, 1, 2
    function hueURL(n) {
        return 'http://192.168.1.103/api/1234567890/groups/0/action';
    }

    // Converts a number from 0.0 to 1.0 to a color from blue to red
    function getHue(normalizedValue) {
        // 46920 = blue, 65535 = red
        return 46920 + parseInt((65535-46920)*normalizedValue);
    }

    // What message do we send next?
    var nextURL = null;
    var nextData = null;
    var nextCallback = null;

    // When did we last send a message?
    var lastMessage = 0;

    // How long (in milliseconds) to wait in between messages
    var MIN_INTERVAL = 150;

    function sendToHue(URL, lightData, callback) {
        nextURL = URL;
        nextData = lightData;
        nextCallback = callback;
    }

    var numberWaitingOn = 0;
    window.setInterval(function() {
        if(nextURL === null || nextData === null) {
            return;
        }

        if(window.XMLHttpRequest) {
            var http = new XMLHttpRequest();
            http.open('PUT', nextURL, true);

            http.onreadystatechange = function() {
                if(http.readyState == 4) {
                    var response;
                    if(http.status==200) {
                        response = 'Bad JSON: ' + http.responseText;
                        response = JSON.stringify(JSON.parse(http.responseText), null, '\t');
                    } else { 
                        response = 'Error ' + http.status;
                    }
                    numberWaitingOn--;
                    console.log('only waiting on  ' + numberWaitingOn + ' updates');
                    if(nextCallback !== null && nextCallback !== undefined) {
                        nextCallback();
                    }
                }
            }
            http.send(JSON.stringify(nextData));
            numberWaitingOn++;
            console.log('still waiting on ' + numberWaitingOn + ' updates');
        }
        nextURL = null;
        nextData = null;
        nextCallback = null;
    }, MIN_INTERVAL);

    Hue = {
        // An object with keys like 'hue', 'bri', 'sat'...
        send: function(newData, callback) { 
            sendToHue(hueURL(null), newData, callback);
        },
        // Integer in [0, \infty)
        setTransTime: function(time) {
            this.send({
                'transitiontime': time
            });
        },
        // From 0 to 255
        setBrightness: function(howBright) {
            this.send({
                'bri': howBright
            });
        },
        // From 0.0 to 1.0
        setColor: function(normalizedValue) {
            this.send({
                'hue': getHue(normalizedValue)
            });
        },
        setWhite: function() {
            this.send({
                'hue': 36210
            });
        },
        // 0 to 255
        setSat: function(saturation) {
            this.send({
                'sat': saturation
            });
        },
        animate: function() {
            var context = this;
            window.setTimeout(function() {
                context.setWhite();
                window.setTimeout(function() {
                    context.setColor(1);
                }, 585);
            }, 520);
        },
            
        // Initialize with our favorite settings
        setup: function() {
            this.send({
                'sat': 240,
                'hue': getHue(0),
                'transitiontime': 0,
                'bri': 100
            }, function() {
                console.log('Hue ready...');
            });
        }
    };
});


$(function() {
    Hue.setup();
    dataProcessing.onDetectIntensityChange(function(normedIntensity) {
        Hue.setColor(normedIntensity);
    });

    dataProcessing.onWhiten(Hue.setWhite);

    var ctl = new Leap.Controller({enableGestures: true});

    ctl.on('frame', function(frame){
        if(frame.pointables.length > 0 || frame.hands.length > 0)
        {
            var hands = frame.hands.filter(function(elem){return (elem.tools.length == 0)});
    	    var tools = frame.tools; //.filter(function(elem){return (elem.tools.length > 0)});
            if(tools.length > 0)
            {
                var pointerTip = tools[0].stabilizedTipPosition;
                var pointerSpeed = tools[0].tipVelocity;
            }
            else
            {
                var pointerTip = null;
                var pointerSpeed = null;
            }
            if(hands.length > 0)
            {
                var spherePos = hands[0].sphereCenter;
                var palmPos = hands[0].palmPosition;
                var handLoc = hands[0].stabilizedPalmPosition;
                var palmDir = $V(spherePos).subtract($V(palmPos)).elements;
                var palmVelocity = hands[0].palmVelocity;
                var fingerDir = hands[0].direction;
            }
            else
            {
                var handLoc = null;
                var palmDir = null;
                var palmVelocity = null;
                var fingerDir = null;
            }

            dataProcessing.pushData(frame, hands, pointerTip, pointerSpeed, handLoc, palmVelocity, fingerDir);
        }
    });
    ctl.connect();

    var context = new webkitAudioContext();
    
    function load(path, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', 'audio/' + path, true);
        request.responseType = 'arraybuffer';
        
        request.onload = function() {
            context.decodeAudioData(request.response, function(buffer) {
                callback(path, buffer);
            });
        }

        request.send();
    }

    function linearRange (a, b, y, z, c) {
        var x = (c - a) * (z - y) / (b - a) + y;
        return x;
    };

    //var sounds = ['medley1.mp3', 'medley2.mp3', 'medley3.mp3', 'medley4.mp3'];
    var sounds = ['beethoven.mp3'];
    var IS_BEETHOVEN = sounds[0] == 'beethoven.mp3';
    var buffers = [];
    var sources = [];
    var gains = [];
    var counter = 0;

    var processor = context.createJavaScriptNode(2048, 1, 1);
    var shifter = new Pitchshift(2048, context.sampleRate, 'FFT');
    var pitchShift = 0.33;
    processor.onaudioprocess = function(event) {
        for (var channel = 0; channel < event.outputBuffer.numberOfChannels; channel++) {
            var output = event.outputBuffer.getChannelData(channel);
            var input = event.inputBuffer.getChannelData(channel);
            
            var shift = linearRange(0, 1, -12, 12, pitchShift);
            var shift_value = pitchShift * 1.5 + 0.5; //Math.pow(1.0595, Math.round(shift));
            shifter.process(shift_value, input.length, 4, input);
            for (var j = 0; j < output.length; j++) {
                output[j] = shifter.outdata[j];
            }
        }
    };
    processor.connect(context.destination);

    var logoVisible = false;
    function onLoad(path, buffer) {
        buffers[sounds.indexOf(path)] = buffer;

        counter++;
        if (counter != sounds.length) return;

        console.log('Buffer loaded...');
        $('#logo').fadeIn(3000, function() {
            logoVisible = true;
        });

        buffers.forEach(function(buffer, i) {
            var source = context.createBufferSource();
            source.buffer = buffer;

            var gain = context.createGainNode();
            gain.connect(processor);
            source.connect(gain);
            gain.gain.value = 0.0;

            sources[i] = source;
            gains[i] = gain;
        });
    }
    
    var applause;
    load('applause.mp3', function(path, buffer) {
        applause = context.createBufferSource();
        applause.buffer = buffer;
        applause.connect(context.destination);
    });

    load('warmup.mp3', function(path, buffer) {
        var source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.start(0);
    });

    sounds.forEach(function(path) { load(path, onLoad); });

    function clamp(x, a, b) {
        return Math.max(Math.min(x, b), a);
    }

    function setVolumeFill(i) {
        var fill = clamp(gains[i].gain.value / 3 * 100, 0, 100);
        $('.instrument:nth-child(' + (i+1) + ')').css('background-position', 'left ' + fill + '%');
    }

    function onBeat() {
        var $particle, x, y;
        for (var i = 0; i < 10; i++) {
            $particle = $('<div class="particle"></div>');
            x = Math.random() - 0.5;
            y = Math.random() - 0.5;
            $('#dot').append($particle);
            $particle.animate({top: (x * 40), left: (y * 40), opacity: 0}, 400, function() {
                $(this).remove();
            });
        }
    }

    var started = false;
    var mainVisible = false;
    dataProcessing.onDetectVolumeChange(function(delta) {
        // if(delta > 0) {
        //     if(delta < 0.01) {
        //         delta = 0;
        //     } else {
        //         delta -= 0.01;
        //     }
        // } else {
        //     if(delta > -0.01) {
        //         delta = 0;
        //     } else {
        //         delta += 0.01
        //     }
        // }
        // } && delta < 0.1){
        //     delta = 0;
        // } else{
        //     delta = delta - 0.1;
        // }
        // if(delta < 0 && delta > -0.1){
        //     delta = 0;
        // } else{
        //     delta = delta + 0.1;
        // }
        if (isNaN(delta) || !gains.length || selectState === 1) return;

        if (!started && mainVisible && delta > 0.01) {
            console.log('Starting...');
            sources.forEach(function(source) {
                source.start(0);
            });
            started = true;
        }

        var maxVol = 0;
        if (selected === -1 || selected >= gains.length) {
            gains.forEach(function(node, i) {
                node.gain.value = clamp(node.gain.value + delta * 4, 0, 3.0);
                maxVol = Math.max(node.gain.value, maxVol)
                setVolumeFill(i);
            });
        } else {
            var node = gains[selected];
            gains[selected].gain.value = clamp(node.gain.value + delta * 4, 0, 3.0);
            maxVol = (gains[selected].gain.value > maxVol) ? node.gain.value : maxVol;
            setVolumeFill(selected);
        }
        //console.log('Max volume: ' + maxVol);
        //Hue.setColor(maxVol/3);
    });

    dataProcessing.onDetectOrchLoc(function(pair) {
        var x = pair[0], y = pair[1];

        if (selected !== -1) /*|| selectState === 1)*/ return;

        $('#dot').css('left', x * $('#instruments').width());

        var len = $('.instrument').length;
        $('.instrument').removeClass('hover');

        $($('.instrument')[Math.floor(len * x)]).addClass('hover');
    });

    var time = new Date().getTime();
    var frames = [];
    var NUM_FRAMES = 3;

    var currentTempo = 1;
    dataProcessing.onDetectTempoChange(function(tempo) {
        if (sounds[0] === 'beethoven.mp3') {
            currentTempo = tempo / C.BASE_TEMPO;
        }
    });

    setInterval(function() {
        sources.forEach(function(source) {
            var newVal = source.playbackRate.value * 0.9 + currentTempo * 0.1;
            source.playbackRate.value = newVal;
            pitchShift = 0.33 * (2 - newVal);
        });
    }, 100);

    var selected = -1;
    var selectState = 1;
    dataProcessing.onDetectSelectChange(function(state) {
        selectState = state;

        if (selectState === 2) {
            var $instrument = $('.instrument.hover');
            if (!$instrument.length) return;

            $instrument.addClass('active');
            selected = $instrument.index();

            $('#dot').css('left', $instrument.position().left + $instrument.width() / 2);
        } else {
            $('.instrument').removeClass('active');
            selected = -1;
        } 
    });

    var beatCount = 0;
    dataProcessing.onBeat(function() {
        beatCount++;

        if (beatCount % (IS_BEETHOVEN ? 15: 12) === 0) {
            $('#score').animate({
                scrollTop: '+=400'
            }, 200);
        }

        onBeat();
    });


    dataProcessing.onDetectOnPause(function(bool){
	if(started){
	    sources.forEach(function(source) {
		if(bool){
		    //console.log("disconnect");
		    source.disconnect(processor);
		}
		else{
		    source.connect(processor);
		}
	    });
	}
    });
	
	    


    dataProcessing.onStart(function() {
        if (logoVisible) {
            $('#logo').fadeOut(function() {
                $('#main').fadeIn(3000);
                applause.start(0);
                mainVisible = true;
            });

            logoVisible = false;
        }
    });

    if (IS_BEETHOVEN) {
        $('#score').animate({scrollTop: 40});
        $('.instrument:not(:first-child)').remove();
        $('.instrument').css({
            float: 'none',
            margin: '0 auto'
        });

        $('#score img').attr('src', 'score2.png');
    }
});
