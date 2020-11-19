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
    // drawPoints();
    drawPointer();
};


// Custom functions
const modelLoaded = () => {
  console.log('Model successfully loaded');
};

const drawPoints = () => {
  if (!predictions.length) return false;
  fill(0, 255, 0);
  noStroke();
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

const drawPointer = () => {
  if (!predictions.length) return false;
  fill(0, 255, 255);
  noStroke();
  // Only take one detected hand
  const hand = predictions[0];
  if (!hand.annotations && !hand.annotations.indexFinger && !hand.annotations.indexFinger.length) return false;
  const { indexFinger } = hand.annotations;
  const pointer = indexFinger[3];
  ellipse(pointer[0], pointer[1], 10, 10);
};