const { connect, createLocalAudioTrack } = window.LivekitClient;

let room = null;
let callStartTime = null;
let timerInterval = null;

// DOM refs
const answerBtn = document.getElementById("answer-btn");
const endBtn = document.getElementById("end-btn");
const statusText = document.getElementById("status-text");
const timerEl = document.getElementById("call-timer");
const transcriptEl = document.getElementById("transcript-content");
const scriptEl = document.getElementById("script-content");

const WIDGET_BACKEND = window.location.origin;

// -------- FETCH AGENT SCRIPT --------
fetch(`${WIDGET_BACKEND}/api/agent`)
  .then(r => r.json())
  .then(data => {
    scriptEl.textContent = JSON.stringify(data, null, 2);
  });

// -------- CALL TIMER --------
function startTimer() {
  callStartTime = new Date();
  timerInterval = setInterval(() => {
    const diff = Math.floor((new Date() - callStartTime) / 1000);
    const m = String(Math.floor(diff / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// -------- WAVEFORM ANIMATION --------
function animateWaveform(volume) {
  const wf = document.getElementById("waveform");
  const height = Math.min(60, volume * 200);
  wf.style.transform = `scaleY(${1 + height / 100})`;
}

// -------- JOIN LIVEKIT --------
async function startCall() {
  statusText.textContent = "Connecting…";

  // get token
  const res = await fetch(`${WIDGET_BACKEND}/api/room-token`);
  const { token, room: roomName, host } = await res.json();

  // connect
  room = await connect(host, token);

  // publish mic
  const audio = await createLocalAudioTrack();
  room.localParticipant.publishTrack(audio);

  // subscribe to Blake_35_audio
  room.on("trackSubscribed", (track, publication, participant) => {
    if (publication.trackName === "Blake_35_audio") {
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      track.attach(audioEl);

      // For waveform
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      const src = ctx.createMediaStreamSource(track.mediaStreamTrack);
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      function loop() {
        requestAnimationFrame(loop);
        analyser.getByteFrequencyData(data);
        const volume = data.reduce((a, b) => a + b, 0) / data.length / 255;
        animateWaveform(volume);
      }
      loop();
    }
  });

  // transcripts
  room.on("dataReceived", (payload, participant) => {
    const text = new TextDecoder().decode(payload);
    const div = document.createElement("div");
    div.textContent = text;
    transcriptEl.appendChild(div);
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  });

  statusText.textContent = "Connected";
  startTimer();
}

// -------- END CALL --------
function endCall() {
  if (room) {
    room.disconnect();
  }
  statusText.textContent = "Call Ended";
  stopTimer();
}

// -------- UI EVENTS --------
answerBtn.onclick = () => {
  answerBtn.style.display = "none";
  endBtn.style.display = "block";
  startCall();
};

endBtn.onclick = endCall;
