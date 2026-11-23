const video = document.getElementById('video')
const popup = document.getElementById('popup')
const debug = document.getElementById('debug')
const MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model'
let neutralSince = null
let player

// add ?debug to the URL to see the status bar
if (location.search.includes('debug')) debug.style.display = 'block'
function log(t) { debug.textContent = t }
window.onerror = (msg) => log('ERROR: ' + msg)

// YouTube video: starts muted in the background, invisible until needed
function onYouTubeIframeAPIReady() {
  player = new YT.Player('yt', {
    videoId: 'wdyxvfMKhI4',
    playerVars: { autoplay: 1, mute: 1, loop: 1, playlist: 'wdyxvfMKhI4', controls: 0, rel: 0, playsinline: 1 },
    events: { onReady: e => { e.target.mute(); e.target.playVideo() } }
  })
}

// backup: if the phone blocked autoplay, the first tap starts it
document.addEventListener('touchstart', playYT, { once: true })
document.addEventListener('click', playYT, { once: true })
function playYT() { if (player && player.playVideo) player.playVideo() }

log('loading models...')
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODELS),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODELS),
  faceapi.nets.faceExpressionNet.loadFromUri(MODELS)
]).then(startVideo).catch(err => log('MODEL ERROR: ' + err))

function startVideo() {
  log('starting camera...')
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(stream => { video.srcObject = stream; video.play() })
    .catch(err => log('CAMERA ERROR: ' + err))
}

video.addEventListener('playing', () => { log('camera on'); detect() }, { once: true })

const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 })

async function detect() {
  try {
    const face = await faceapi.detectSingleFace(video, options).withFaceLandmarks().withFaceExpressions()

    if (!face) {
      log('no face found')
    } else {
      const deviation = 1 - face.expressions.neutral
      log('deviation: ' + deviation.toFixed(2))

      if (deviation > 0.28) {
        popup.classList.add('show')
        playYT()
        document.body.style.overflow = 'hidden'
        neutralSince = null
      } else if (popup.classList.contains('show')) {
        if (!neutralSince) neutralSince = Date.now()
        if (Date.now() - neutralSince > 2000) {
          popup.classList.remove('show')
          document.body.style.overflow = 'auto'
        }
      }
    }
  } catch (err) {
    log('DETECT ERROR: ' + err)
  }

  setTimeout(detect, 100)
}
