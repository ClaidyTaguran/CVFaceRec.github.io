const video = document.getElementById("video");
const loginVideo = document.getElementById("login-video");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const faceScanBtn = document.getElementById("face-scan-btn");
const loginFaceScanBtn = document.getElementById("login-face-scan-btn");
const registrationForm = document.getElementById("registration-form");
const landingPage = document.querySelector(".landing-page");
const registrationPage = document.querySelector(".registration-page");
const loginPage = document.querySelector(".login-page");
const loginBackBtn = document.getElementById("login-back-btn");

let registeredFaceDescriptors = [];

// Load models and start webcam
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
      loginVideo.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

// Save registered face descriptors to local storage
function saveRegisteredFaceDescriptors() {
  const descriptors = registeredFaceDescriptors.map((desc) => ({
    label: desc.label,
    descriptors: desc.descriptors.map((d) => Array.from(d)),
  }));
  localStorage.setItem("registeredFaceDescriptors", JSON.stringify(descriptors));
}

// Load registered face descriptors from local storage
function loadRegisteredFaceDescriptors() {
  const data = localStorage.getItem("registeredFaceDescriptors");
  if (data) {
    const parsed = JSON.parse(data);
    registeredFaceDescriptors = parsed.map(
      (desc) => new faceapi.LabeledFaceDescriptors(desc.label, desc.descriptors.map((d) => new Float32Array(d)))
    );
  }
}

// Display registered faces on the page
function displayRegisteredFaces() {
  const registeredFacesContainer = document.getElementById("registered-faces-container");
  registeredFacesContainer.innerHTML = "";

  registeredFaceDescriptors.forEach((descriptor) => {
    const faceDiv = document.createElement("div");
    faceDiv.classList.add("face-item");

    const label = document.createElement("p");
    label.textContent = `Label: ${descriptor.label}`;

    faceDiv.appendChild(label);
    registeredFacesContainer.appendChild(faceDiv);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadRegisteredFaceDescriptors();
  displayRegisteredFaces();
});

registerBtn.addEventListener("click", () => {
  landingPage.style.display = "none";
  registrationPage.style.display = "flex";
});

loginBtn.addEventListener("click", () => {
  landingPage.style.display = "none";
  loginPage.style.display = "flex";
});

loginBackBtn.addEventListener("click", () => {
  loginPage.style.display = "none";
  landingPage.style.display = "flex";
});

faceScanBtn.addEventListener("click", async () => {
  const userLabel = document.getElementById("name").value;
  if (!userLabel) {
    alert("Please enter a name.");
    return;
  }
  video.style.display = "block";

  const detections = await faceapi
    .detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detections) {
    alert("No face detected. Please try again.");
    return;
  }

  registeredFaceDescriptors.push(new faceapi.LabeledFaceDescriptors(userLabel, [detections.descriptor]));
  saveRegisteredFaceDescriptors();
  video.style.display = "none";
  alert("Face scan successful. Please complete the registration form.");
});

registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  alert("Registration Successful!");
  registrationPage.style.display = "none";
  landingPage.style.display = "flex";
  displayRegisteredFaces();
});

loginFaceScanBtn.addEventListener("click", async () => {
  const detections = await faceapi
    .detectAllFaces(loginVideo)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const resizedDetections = faceapi.resizeResults(detections, {
    width: loginVideo.width,
    height: loginVideo.height,
  });

  if (registeredFaceDescriptors.length === 0) {
    alert("No registered faces found. Please register first.");
    return;
  }

  const faceMatcher = new faceapi.FaceMatcher(registeredFaceDescriptors);
  const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));

  if (results.some((result) => result.label !== "unknown")) {
    alert("Login Successful!");
    loginPage.style.display = "none";
    window.location.href = "/MachineVP1/index.html";
  } else {
    alert("Login Failed!");
  }
});
