// This example shows a *scheduled* and a *transported* `SegmentEngine` with a few parameter controls.

var audioContext = wavesAudio.audioContext;
var loader = new wavesLoaders.SuperLoader(); // instantiate loader

// load audio and marker files
loader.load(["http://wavesjs.github.io/assets/drum-loop.wav", "http://wavesjs.github.io/assets/drum-loop.json"])
  .then(function(loaded) {
      var audioBuffer = loaded[0];
      var markerBuffer = loaded[1];
      var eighthBeatDuration = audioBuffer.duration / 8;

      // get scheduler and create scheduled segment engine
      var scheduler = wavesAudio.getScheduler();
      var scheduledSegmentEngine = new wavesAudio.SegmentEngine({
          buffer: audioBuffer,
          periodAbs: eighthBeatDuration,
          periodRel: 0,
          positionArray: markerBuffer.time,
          durationArray: markerBuffer.duration
        });
        scheduledSegmentEngine.connect(audioContext.destination);

        // create transport with play control and transported segment engine
        var transportedSegmentEngine = new wavesAudio.SegmentEngine({
          buffer: audioBuffer,
          positionArray: markerBuffer.time,
          durationArray: markerBuffer.duration,
          cyclic: true
        });
        var playControl = new wavesAudio.PlayControl(transportedSegmentEngine); transportedSegmentEngine.connect(audioContext.destination);

        // create GUI elements
        new wavesBasicControllers.Title("Segment Engine in Scheduler", '#container');
        
        new wavesBasicControllers.Toggle("Enable", false, '#container', function(value) {
          if (value)
            scheduler.add(scheduledSegmentEngine);
          else
            scheduler.remove(scheduledSegmentEngine);
        });

        new wavesBasicControllers.Slider("Segment Index", 0, 16, 1, 0, "", '', '#container', function(value) {
          scheduledSegmentEngine.segmentIndex = value;
        });

        new wavesBasicControllers.Slider("Period", 0.010, 1.000, 0.001, eighthBeatDuration, "sec", '', '#container', function(value) {
          scheduledSegmentEngine.periodAbs = value;
        });

        new wavesBasicControllers.Title("Segment Engine with Play Control", '#container');
        
        new wavesBasicControllers.Toggle("Play", false, '#container', function(value) {
          if (value)
            playControl.start();
          else
            playControl.stop();
        });

        var speedSlider = new wavesBasicControllers.Slider("Speed", -2, 2, 0.01, 1, "", '', '#container', function(value) {
          playControl.speed = value;
          speedSlider.value = playControl.speed;
        });

        new wavesBasicControllers.Title("Common Parameters", '#container');
        
        new wavesBasicControllers.Slider("Position Var", 0, 0.050, 0.001, 0, "sec", '', '#container', function(value) {
          scheduledSegmentEngine.positionVar = transportedSegmentEngine.positionVar = value;
        });

        new wavesBasicControllers.Slider("Duration", 0, 100, 1, 100, "%", '', '#container', function(value) {
          scheduledSegmentEngine.durationRel = transportedSegmentEngine.durationRel = 0.01 * value;
        });

        new wavesBasicControllers.Slider("Resampling", -2400, 2400, 1, 0, "cent", '', '#container', function(value) {
          scheduledSegmentEngine.resampling = transportedSegmentEngine.resampling = value;
        });

        new wavesBasicControllers.Slider("Resampling Var", 0, 1200, 1, 0, "cent", '', '#container', function(value) {
          scheduledSegmentEngine.resamplingVar = transportedSegmentEngine.resamplingVar = value;
        });
      });