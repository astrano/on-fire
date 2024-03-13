// Copyright 2023 The MediaPipe Authors.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//      http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import vision from "@mediapipe/tasks-vision";
const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
const demosSection = document.getElementById("demos");
const imageBlendShapes = document.getElementById("image-blend-shapes");
const videoBlendShapes = document.getElementById("video-blend-shapes");

let faceLandmarker;
let runningMode: "IMAGE" | "VIDEO" = "IMAGE";
let enableWebcamButton: HTMLButtonElement;
let webcamRunning: Boolean = false;
const videoWidth = 480;

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
async function createFaceLandmarker() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode,
    numFaces: 1
  });
  demosSection.classList.remove("invisible");
}
createFaceLandmarker();


/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

const video = document.getElementById("webcam") as HTMLVideoElement;
const canvasElement = document.getElementById(
  "output_canvas"
) as HTMLCanvasElement;

const canvasCtx = canvasElement.getContext("2d");

enableWebcamButton = document.getElementById(
  "webcamButton"
) as HTMLButtonElement;
enableWebcamButton.addEventListener("click", enableCam);
setTimeout(() => {
  console.log("clicking", enableWebcamButton)
  enableWebcamButton.click();
}, 1000);

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!faceLandmarker) {
    console.log("Wait! faceLandmarker not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "BURN";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "Stop watching me";
  }

  // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;
const drawingUtils = new DrawingUtils(canvasCtx);
async function predictWebcam() {
  const radio = video.videoHeight / video.videoWidth;
  video.style.width = videoWidth + "px";
  video.style.height = videoWidth * radio + "px";
  canvasElement.style.width = videoWidth + "px";
  canvasElement.style.height = videoWidth * radio + "px";
  canvasElement.width = video.videoWidth;
  canvasElement.height = video.videoHeight;
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await faceLandmarker.setOptions({ runningMode: runningMode });
  }
  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = faceLandmarker.detectForVideo(video, startTimeMs);
  }
  if (results.faceLandmarks) {
    computeAndDisplayLookingAtScreenStats(results.faceBlendshapes);
    for (const landmarks of results.faceLandmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
        { color: "#30FF30" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LIPS,
        { color: "#E0E0E0" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
        { color: "#FF3030" }
      );
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
        { color: "#30FF30" }
      );
    }
  }
  drawBlendShapes(videoBlendShapes, results.faceBlendshapes);

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function drawBlendShapes(el: HTMLElement, blendShapes: any[]) {
  if (!blendShapes.length) {
    return;
  }

  //console.log(blendShapes[0]);

  let htmlMaker = "";
  blendShapes[0].categories.map((shape) => {
    htmlMaker += `
      <li class="blend-shapes-item">
        <span class="blend-shapes-label">${shape.displayName || shape.categoryName
      }</span>
        <span class="blend-shapes-value" style="width: calc(${+shape.score * 100
      }% - 120px)">${(+shape.score).toFixed(4)}</span>
      </li>
    `;
  });

  el.innerHTML = htmlMaker;
}

function aaa(faceBlendShapes) {
  const eyeLookDownLeft = faceBlendshapes[0].categories[9].score;
  const eyeLookDownRight = faceBlendshapes[0].categories[10].score;
  console.log({ eyeLookDownLeft, eyeLookDownRight })
  let lookDown = eyeLookDownLeft + eyeLookDownRight - 0.2;

  const eyeLookInLeft = faceBlendshapes[0].categories[9].score;
  const eyeLookOutRight = faceBlendshapes[0].categories[10].score;
  console.log({ eyeLookinLeft, eyeLookOutRight })
  let lookRight = eyeLookinLeft + eyeLookOutRight - 0.2;

  const eyeLookUpLeft = faceBlendshapes[0].categories[9].score;
  const eyeLookUpRight = faceBlendshapes[0].categories[10].score;
  console.log({ eyeLookUpLeft, eyeLookUpRight })
  let lookUp = eyeLookUpLeft + eyeLookUpRight - 0.2;

  const eyeLookOutLeft = faceBlendshapes[0].categories[9].score;
  const eyeLookInRight = faceBlendshapes[0].categories[10].score;
  console.log({ eyeLookOutLeft, eyeLookInRight })
  let lookLeft = eyeLookOutLeft + eyeLookInRight - 0.2;

  console.log({lookDown, lookRight, lookLeft, lookUp});

}

function computeAndDisplayLookingAtScreenStats(faceBlendshapes) {
  const eyeLookDownLeft = faceBlendshapes[0].categories[9].score;
  const eyeLookDownRight = faceBlendshapes[0].categories[10].score;
  console.log(eyeLookDownLeft)
  let lookDown = eyeLookDownLeft + eyeLookDownRight - 0.2;
}

setInterval(() => {
  window.fakeSeconds++;
}, 1000)