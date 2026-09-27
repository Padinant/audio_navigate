// The deployed backend URL.
const BACKEND_URL = "http://127.0.0.1:8000";

const cameraButton = document.getElementById("cameraButton");
const micButton = document.getElementById("micButton");
const video = document.getElementById("camera");
const questionInput = document.getElementById("question");
const answerOutput = document.getElementById("answer");

// Optional testing controls.
// These only do anything if matching elements exist in index.html.
const testImageInput = document.getElementById("testImageInput");
const testImagePreview = document.getElementById("testImagePreview");

let cameraStream = null;
let currentTestImage = null;


// --------------------
// Camera
// --------------------

cameraButton.addEventListener("click", async () => {
    if (cameraStream) {
        stopCamera();
    } else {
        await startCamera();
    }
});

async function startCamera() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

        video.srcObject = cameraStream;
        await video.play();

        cameraButton.textContent = "Camera Off";
    } catch (error) {
        console.error("Camera error:", error);
        answerOutput.textContent = "Could not access the camera.";
    }
}

function stopCamera() {
    if (!cameraStream) return;

    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    video.srcObject = null;

    cameraButton.textContent = "Camera On";
}


// --------------------
// NEW - TESTING WITH IMAGES 
// --------------------
// Note: make sure the index.html file matches!
// If no test image is selected, the app continues to use the live camera.

if (testImageInput) {
    testImageInput.addEventListener("change", () => {
        const file = testImageInput.files?.[0];

        if (!file) {
            currentTestImage = null;

            if (testImagePreview) {
                testImagePreview.removeAttribute("src");
            }

            return;
        }

        currentTestImage = file;

        if (testImagePreview) {
            testImagePreview.src = URL.createObjectURL(file);
        }
    });
}


// --------------------
// Image capture
// --------------------

async function getCurrentImageBlob() {
    // If a test image is selected, use that instead of the camera.
    if (currentTestImage) {
        return currentTestImage;
    }

    // Otherwise capture the current camera frame.
    if (
        !cameraStream ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
    ) {
        return null;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise(resolve => {
        canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
}


// --------------------
// Backend request
// --------------------

async function askBackend(question) {
    const imageBlob = await getCurrentImageBlob();

    if (!imageBlob) {
        answerOutput.textContent =
            "Turn on the camera or select a test image first.";
        return;
    }

    const formData = new FormData();

    // The backend receives either the test image
    // or the captured camera frame in the same format.
    formData.append(
        "image",
        imageBlob,
        "camera-image.jpg"
    );

    formData.append(
        "question",
        question
    );

    try {
        answerOutput.textContent = "Processing...";

        const response = await fetch(
            `${BACKEND_URL}/ask`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(
                `Backend returned ${response.status}`
            );
        }

        const data = await response.json();

        answerOutput.textContent =
            data.answer || "No answer was returned.";

    } catch (error) {
        console.error("Backend error:", error);

        answerOutput.textContent =
            "There was a problem contacting the backend.";
    }
}


// --------------------
// Microphone / speech recognition
// --------------------

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.addEventListener(
        "result",
        async event => {
            const transcript =
                event.results[0][0].transcript;

            questionInput.value = transcript;

            await askBackend(transcript);
        }
    );

    recognition.addEventListener(
        "error",
        event => {
            console.error(
                "Speech recognition error:",
                event.error
            );

            answerOutput.textContent =
                "Could not understand the microphone input.";
        }
    );
}

micButton.addEventListener("click", () => {
    if (!recognition) {
        answerOutput.textContent =
            "Speech recognition is not supported in this browser.";
        return;
    }

    recognition.start();
});


// --------------------
// Allow typed questions too
// --------------------

questionInput.addEventListener(
    "keydown",
    async event => {
        if (event.key !== "Enter") {
            return;
        }

        const question =
            questionInput.value.trim();

        if (!question) {
            return;
        }

        await askBackend(question);
    }
);