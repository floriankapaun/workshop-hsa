const handpose = import(/* webpackPreload: true */ '@tensorflow-models/handpose');
const tfjsBackendWebgl = import(/* webpackPreload: true */ '@tensorflow/tfjs-backend-webgl');
const tf = import(/* webpackPreload: true */ '@tensorflow/tfjs-core');

const video = document.getElementById('video');
const canvas = document.getElementById('output');
const cursor = document.getElementById('cursor');

let drawCursorX = 0;
let drawCursorY = 0;
let calcCursorX = 0;
let calcCursorY = 0;

// Geliehen von p5.js
const mapRange = (value, a, b, c, d) => {
    // first map value from (a..b) to (0..1)
    value = (value - a) / (b - a);
    // then map it from (0..1) to (c..d) and return it
    return c + value * (d - c);
}

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
        // NECESSARY?
        // const canvasContainer = document.querySelector('.canvas-wrapper');
        // canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;
        // Setup context
        this.ctx = this.output.getContext('2d');
        this.ctx.translate(this.output.width, 0);
        this.ctx.scale(-1, 1);
        this.ctx.fillStyle = '#CCCCCC';
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
        // Plott the input video as canvas background
        // Clip the image and position the clipped part on the canvas
        // ctx.drawImage(img,sx,sy,swidth,sheight,x,y,width,height)
        // this.ctx.drawImage(
        //     this.input,
        //     this.videoWidth - this.WINDOW_WIDTH, 0, this.WINDOW_WIDTH, this.WINDOW_HEIGHT,
        //     0, 0, this.output.width, this.output.height,
        // );
        // Plott the prediction onto the context
        if (predictions.length > 0) {
            const firstHand = predictions[0];
            if (!firstHand.annotations
                && !firstHand.annotations.indexFinger
                && !firstHand.annotations.indexFinger.length) return false;
            // For drawing
            let pointer = firstHand.annotations.indexFinger[3];

            pointer = [
                mapRange(pointer[0], (this.WINDOW_WIDTH - this.videoWidth), this.videoWidth, 0, this.WINDOW_WIDTH),
                mapRange(pointer[1], 0, this.videoHeight, 0, this.WINDOW_HEIGHT),
            ];

            let drawDifferenceX = pointer[0] - drawCursorX;
            let drawDifferenceY = pointer[1] - drawCursorY;

            drawCursorX += (drawDifferenceX / 2);
            drawCursorY += (drawDifferenceY / 2);

            // Draw the cursor
            // this.ctx.beginPath();
            // this.ctx.arc(drawCursorX - (this.videoWidth - this.WINDOW_WIDTH), drawCursorY, 3 /* radius */, 0, 2 * Math.PI);
            // this.ctx.fill();

            // For calculations
            let mirroredPointer = [
                this.WINDOW_WIDTH - pointer[0] + (this.videoWidth - this.WINDOW_WIDTH),
                pointer[1],
            ];

            let calcDifferenceX = mirroredPointer[0] - calcCursorX;
            let calcDifferenceY = mirroredPointer[1] - calcCursorY;

            calcCursorX += (calcDifferenceX / 2);
            calcCursorY += (calcDifferenceY / 2);

            cursor.style.transform = `translate(${calcCursorX}px, ${calcCursorY}px)`;

            adjustFontPropertyFromDistance([calcCursorX, calcCursorY]);
        }
        // Render the next prediction
        requestAnimationFrame(() => this.renderPrediction());
    }
}

const handposeDetection = new HandposeDetection(video, canvas);

handposeDetection.init();

const hightlights = {
    wide: document.getElementsByClassName('wide'),
    heavy: document.getElementsByClassName('heavy'),
    italic: document.getElementsByClassName('italic'),
}

const adjustFontPropertyFromDistance = (pointer) => {
    // Get the element pointed on
    const pointedElement = document.elementFromPoint(pointer[0], pointer[1]);
    if (!pointedElement) return false;
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