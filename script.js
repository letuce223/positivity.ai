const video = document.getElementById('video')
const popup = document.getElementById('popup')
const debug = document.getElementById('debug')
const MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model'
let neutralSince = null

// add ?debug to the URL to see the status bar
if (location.search.includes('debug')) debug.style.display = 'block'
function log(t) { debug.textContent = t }
window.onerror = (msg) => log('ERROR: ' + msg)

// first tap unlocks video playback on strict phones
document.addEventListener('touchstart', unlock, { once: true })
document.addEventListener('click', unlock, { once: true })
function unlock() { popup.play().then(() => { if (!popup.classList.contains('show')) popup.pause() }).catch(() => {}) }

log('loading models...')
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODELS),
  faceapi.nets.faceExpressionNet.loadFromUri(MODELS)
]).then(startVideo).catch(err => log('MODEL ERROR: ' + err))

function startVideo() {
  log('starting camera...')
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }, audio: false })
    .then(stream => { video.srcObject = stream; video.play() })
    .catch(err => log('CAMERA ERROR: ' + err))
}

video.addEventListener('playing', () => { log('camera on'); detect() }, { once: true })

const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })

async function detect() {
  try {
    const face = await faceapi.detectSingleFace(video, options).withFaceExpressions()

    if (!face) {
      log('no face found')
    } else {
      const deviation = 1 - face.expressions.neutral
      log('deviation: ' + deviation.toFixed(2))

      if (deviation > 0.28) {
        popup.classList.add('show')
        popup.play().catch(() => {})
        document.body.style.overflow = 'hidden'
        neutralSince = null
      } else if (popup.classList.contains('show')) {
        if (!neutralSince) neutralSince = Date.now()
        if (Date.now() - neutralSince > 2000) {
          popup.classList.remove('show')
          popup.pause()
          document.body.style.overflow = 'auto'
        }
      }
    }
  } catch (err) {
    log('DETECT ERROR: ' + err)
  }

  setTimeout(detect, 250)
}
