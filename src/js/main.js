const handpose = import(/* webpackPreload: true */ '@tensorflow-models/handpose');
const tfjsBackendWebgl = import(/* webpackPreload: true */ '@tensorflow/tfjs-backend-webgl');
const tf = import(/* webpackPreload: true */ '@tensorflow/tfjs-core');

const video = document.getElementById('video');
const canvas = document.getElementById('output');
const textContainer = document.getElementById('text');

class HandposeDetection {
    constructor(input, output) {
        this.VIDEO_WIDTH = window.innerWidth;
        this.VIDEO_HEIGHT = window.innerHeight;
        this.TF_BACKEND = 'webgl';
        this.input = input;
        this.output = output;
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
        this.input.width = this.VIDEO_WIDTH;
        this.input.height = this.VIDEO_HEIGHT;
        // Style canvas
        this.output.width = this.VIDEO_WIDTH;
        this.output.height = this.VIDEO_HEIGHT;
        // NECESSARY?
        // const canvasContainer = document.querySelector('.canvas-wrapper');
        // canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;
        // Setup context
        this.ctx = this.output.getContext('2d');
        this.ctx.translate(this.output.width, 0);
        this.ctx.scale(-1, 1);
        this.ctx.fillStyle = '#32EEDB';
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
                width: this.VIDEO_WIDTH,
                height: this.VIDEO_HEIGHT,
            },
        });
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
        this.ctx.drawImage(
            this.input,
            0, 0, this.VIDEO_WIDTH, this.VIDEO_HEIGHT,
            0, 0, this.output.width, this.output.height,
        );
        // Plott the prediction onto the context
        if (predictions.length > 0) {
            const firstHand = predictions[0];
            if (!firstHand.annotations
                && !firstHand.annotations.indexFinger
                && !firstHand.annotations.indexFinger.length) return false;
            const pointer = firstHand.annotations.indexFinger[3];
            this.ctx.beginPath();
            this.ctx.arc(pointer[0], pointer[1], 10 /* radius */, 0, 2 * Math.PI);
            const mirroredPointer = [
                this.VIDEO_WIDTH - pointer[0],
                pointer[1],
            ];
            adjustFontPropertyFromDistance(mirroredPointer);
            this.ctx.fill();
        }
        // Render the next prediction
        requestAnimationFrame(() => this.renderPrediction());
    }
}

const printSpannedText = (str) => {
    let output = '';
    for (let i = 0; i < str.length; i++) {
        const char = str.substring(i, i+1);
        output += `<span data-index="${i}">${char}</span>`;
    }
    textContainer.innerHTML = output;
}

const handposeDetection = new HandposeDetection(video, canvas);

handposeDetection.init();

const text = 'It is a technological advancement by humanity in which computers can understand language and perform complex mathematical operations to solve problems. Artificial intelligence is the most important challenge in the modern era, with the goal to replace human workers with machines and create new productive and intelligent jobs. A robot uses sophisticated neural networks, computer algorithms, deep learning, deep learning, to process different information and then create different products.';

printSpannedText(text);

const getDistanceToPointer = (elem, pointer) => {
    const elemX = elem.offsetLeft + (elem.offsetWidth / 2);
    const elemY = elem.offsetTop + (elem.offsetHeight / 2);
    const pointerX = pointer[0];
    const pointerY = pointer[1];
    const dist = Math.sqrt( Math.pow((elemX-pointerX), 2) + Math.pow((elemY-pointerY), 2) );
    return dist;
}

const spans = document.getElementsByTagName('SPAN');

const adjustFontPropertyFromDistance = (pointer) => {
    // for (const span of spans) {
    //     const distance = getDistanceToPointer(span, pointer);
    //     span.style.fontVariationSettings = `"wdth" 100, "wght" ${distance}`;
    //     // font-variation-settings: "wdth" 100, "wght" 400
    // }
    const pointedElement = document.elementFromPoint(pointer[0], pointer[1]);
    const indexOfPointedElement = parseInt(pointedElement.dataset.index);
    if (!indexOfPointedElement) return false;
    for (const span of spans) {
        span.style.fontVariationSettings = '"wdth" 100, "wght" 100';
    }
    for (let i = 0; i < 8; i++) {
        const wght = 900 / (i/2 + 1);
        spans[indexOfPointedElement + i].style.fontVariationSettings = `"wdth" 100, "wght" ${wght}`;
        spans[indexOfPointedElement - i].style.fontVariationSettings = `"wdth" 100, "wght" ${wght}`;
    }
};