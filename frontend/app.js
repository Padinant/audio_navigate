const camera = document.getElementById("camera");
const cameraButton = document.getElementById("cameraButton");
const micButton = document.getElementById("micButton");
const askButton = document.getElementById("askButton");
const question = document.getElementById("question");
const statusText = document.getElementById("status");
const answer = document.getElementById("answer");

let cameraStream = null;
let cameraOn = false;

// CAMERA
cameraButton.addEventListener("click", async () => {
  if (!cameraOn) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment"
        },
        audio: false
      });

      camera.srcObject = cameraStream;
      cameraOn = true;
      cameraButton.textContent = "Camera Off";
    } catch (error) {
      alert("Camera access was not available.");
    }
  } else {
    cameraStream.getTracks().forEach((track) => track.stop());

    camera.srcObject = null;
    cameraStream = null;
    cameraOn = false;

    cameraButton.textContent = "Camera On";
  }
});

// MICROPHONE / SPEECH TO TEXT
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.addEventListener("start", () => {
    statusText.textContent = "Listening...";
    micButton.textContent = "Listening...";
  });

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript;

    question.value = transcript;
  });

  recognition.addEventListener("end", () => {
    statusText.textContent = "Microphone is off.";
    micButton.textContent = "Start Microphone";
  });

  recognition.addEventListener("error", () => {
    statusText.textContent = "Microphone input was not available.";
    micButton.textContent = "Start Microphone";
  });

  micButton.addEventListener("click", () => {
    recognition.start();
  });
} else {
  micButton.disabled = true;

  statusText.textContent =
    "Speech recognition is not supported in this browser.";
}

// ASK BUTTON
askButton.addEventListener("click", () => {
  if (!question.value.trim()) {
    answer.textContent = "Please ask a question first.";
    return;
  }

  /*
    Later, this section would call the python backend

    Example:

  */

  answer.textContent =
    "Your question is ready to be sent to the Gemini backend.";
});