const camera = document.getElementById("camera");
const cameraButton = document.getElementById("cameraButton");
const micButton = document.getElementById("micButton");
const askButton = document.getElementById("askButton");
const question = document.getElementById("question");
const statusText = document.getElementById("status");
const answer = document.getElementById("answer");

let cameraStream = null;
let cameraOn = false;

// The deployed backend URL.
const BACKEND_URL = "http://127.0.0.1:8000";


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
      console.error(error);
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

  recognition.addEventListener("error", (event) => {
    console.error(event);

    statusText.textContent =
      "Microphone input was not available.";

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
askButton.addEventListener("click", async () => {
  const userQuestion = question.value.trim();

  if (!userQuestion) {
    answer.textContent = "Please ask a question first.";
    return;
  }

  answer.textContent = "Thinking...";

  const formData = new FormData();

  // Add the user's question.
  formData.append("question", userQuestion);


  // If the camera is on, capture the current frame.
  if (
    cameraOn &&
    camera.videoWidth &&
    camera.videoHeight
  ) {
    const canvas = document.createElement("canvas");

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      camera,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Turn the current camera frame into a JPEG image.
    const imageBlob = await new Promise((resolve) => {
      canvas.toBlob(
        resolve,
        "image/jpeg",
        0.8
      );
    });

    if (imageBlob) {
      formData.append(
        "image",
        imageBlob,
        "camera.jpg"
      );
    }
  }


  // SEND QUESTION + OPTIONAL IMAGE TO BACKEND
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/ask`,
      {
        method: "POST",
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(
        `Backend request failed: ${response.status}`
      );
    }

    const data = await response.json();

    answer.textContent =
      data.answer || "The server returned no answer.";

  } catch (error) {
    console.error(error);

    answer.textContent =
      "Sorry, something went wrong while contacting the server.";
  }
});