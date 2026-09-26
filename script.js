const startButton = document.getElementById("startButton");
const statusMessage = document.getElementById("statusMessage");

startButton.addEventListener("click", () => {

    statusMessage.textContent =
        "PathVoice has started successfully.";

});
