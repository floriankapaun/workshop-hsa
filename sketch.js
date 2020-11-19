// Global variables
let video;
let handpose;
let predictions = [];

// Standard p5 structure
function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  // Create a new handpose method
  handpose = ml5.handpose(video, modelLoaded);
  handpose.on('predict', (results) => {
    predictions = results;
  });
  video.hide();
};


function draw(){
    background(255);
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    drawPoints();   
};


// Custom functions
const modelLoaded = () => {
  console.log('Model successfully loaded');
};

const drawPoints = () => {
  fill(0, 255, 0);
  noStroke();
  if (!predictions.length) return false;
  for (const hand of predictions) {
    /**
     * hand = {
     *   annotations: {
     *     indexFinger: [...indexFingerLandmarks],
     *     middleFinger: [...],
     *     palmBase: [...],
     *     pinky: [...],
     *     ringFinger: [...],
     *     thumb: [...],
     *   },
     *   boundingBox: {
     *     topLeft: [x, y],
     *     bottomRight: [x, y],
     *   },
     *   handInViewConfidence: Integer, // between 0 and 1
     *   landmarks: [
     *     [x, y, z],
     *     ...
     *   ],
     * }
     */
    if (!hand.landmarks) return false;
    for (const keypoint of hand.landmarks) {
      ellipse(keypoint[0], keypoint[1], 10, 10);
    }
  }
};