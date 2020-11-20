const handpose = import(/* webpackPreload: true */ '@tensorflow-models/handpose');
const tfjsBackendWebgl = import(/* webpackPreload: true */ '@tensorflow/tfjs-backend-webgl');
const tf = import(/* webpackPreload: true */ '@tensorflow/tfjs-core');

const video = document.getElementById('video');
const canvas = document.getElementById('output');
const cursor = document.getElementById('cursor');

const hightlights = {
    wide: document.getElementsByClassName('wide'),
    heavy: document.getElementsByClassName('heavy'),
    italic: document.getElementsByClassName('italic'),
}

let cursorX = 0;
let cursorY = 0;

// Reference: p5.js
const mapRange = (value, a, b, c, d) => {
    // first map value from (a..b) to (0..1)
    value = (value - a) / (b - a);
    // then map it from (0..1) to (c..d) and return it
    return c + value * (d - c);
}

// Detect handpose in image – tensorflow.js
class HandposeDetection {
    constructor(input, output) {
        this.WINDOW_WIDTH = window.innerWidth;
        this.WINDOW_HEIGHT = window.innerHeight;
        this.TF_BACKEND = 'webgl';
        this.input = input;
        this.output = output;
        this.videoWidth = undefined;
        this.videoHeight = undefined;
        this.model = undefined;
        this.ctx = undefined;
    }

    async init() {
        await tfjsBackendWebgl;
        await (await tf).setBackend(this.TF_BACKEND);
        // Start webcam
        await this.setupCamera();
        // Play video
        this.input.play();
        this.input.width = this.WINDOW_WIDTH;
        this.input.height = this.WINDOW_HEIGHT;
        // Style canvas
        this.output.width = this.WINDOW_WIDTH;
        this.output.height = this.WINDOW_HEIGHT;
        // Setup context
        this.ctx = this.output.getContext('2d');
        this.ctx.translate(this.output.width, 0);
        this.ctx.scale(-1, 1);
        // Setup tensorflow.js handpose model
        this.model = await (await handpose).load();
        // Start making predictions
        this.renderPrediction();
    }

    async setupCamera() {
        // Create new stream from camera
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: 'user',
                width: this.WINDOW_WIDTH,
                height: this.WINDOW_HEIGHT,
            },
        });
        let { width, height } = stream.getTracks()[0].getSettings();
        this.videoWidth = width;
        this.videoHeight = height;
        // Set input source to created stream
        this.input.srcObject = stream;
        // Return promise that resolves if video is loaded
        return new Promise((resolve) => {
            this.input.onloadedmetadata = () => {
                resolve(this.input);
            };
        });
    }

    async renderPrediction() {
        // Make a prediction about the handposes
        // the first prediction is taking very long.
        const predictions = await this.model.estimateHands(this.input);
        // Plott the prediction onto the context
        if (predictions.length > 0) {
            const firstHand = predictions[0];
            if (!firstHand.annotations
                && !firstHand.annotations.indexFinger
                && !firstHand.annotations.indexFinger.length) return false;
            // The pointer fingers position
            const pointer = firstHand.annotations.indexFinger[3];
            pointer[0] = mapRange(pointer[0], (this.WINDOW_WIDTH - this.videoWidth), this.videoWidth, 0, this.WINDOW_WIDTH);
            pointer[1] = mapRange(pointer[1], 0, this.videoHeight, 0, this.WINDOW_HEIGHT);
            // Mirror that position for "right" ux
            let mirroredPointer = [
                this.WINDOW_WIDTH - pointer[0] + (this.videoWidth - this.WINDOW_WIDTH),
                pointer[1],
            ];
            // Difference between (mirrored) pointer and cursor position
            let calcDifferenceX = mirroredPointer[0] - cursorX;
            let calcDifferenceY = mirroredPointer[1] - cursorY;
            // Add a fraction of that difference to the cursors coordinates to achieve an "eased" animation 
            // towards the pointers position
            cursorX += (calcDifferenceX / 2);
            cursorY += (calcDifferenceY / 2);
            // Update the cursors position in the DOM
            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
            // Update font display
            adjustFontPropertyFromDistance([cursorX, cursorY]);
        }
        // Render the next prediction
        requestAnimationFrame(() => this.renderPrediction());
    }
}

const handposeDetection = new HandposeDetection(video, canvas);

const adjustFontPropertyFromDistance = (pointer) => {
    // Get the element pointed on
    const pointedElement = document.elementFromPoint(pointer[0], pointer[1]);
    if (!pointedElement) return false;
    // Check if element is already highlighted
    if (pointedElement.classList.contains('highlighted')) return false;
    // Highlight the pointedElement
    if (pointedElement.classList.contains('wide')
        || pointedElement.classList.contains('heavy')
        || pointedElement.classList.contains('italic')) {
        pointedElement.classList.add('highlighted');
    } else {
        const elems = document.getElementsByClassName('highlighted');
        for (const elem of elems) {
            elem.classList.remove('highlighted');
        }
    }
};

handposeDetection.init();