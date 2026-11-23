const video = document.getElementById('video')
const popup = document.getElementById('popup')
const debug = document.getElementById('debug')
let neutralSince = null
let player

function log(t) { debug.textContent = t }
window.onerror = (msg) => log('ERROR: ' + msg)

function onYouTubeIframeAPIReady() {
  player = new YT.Player('yt', {
    videoId: 'wdyxvfMKhI4',
    playerVars: { mute: 1, loop: 1, playlist: 'wdyxvfMKhI4', controls: 0, rel: 0, playsinline: 1 },
    events: { onReady: e => e.target.mute() }
  })
}

log('loading models...')
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('models'),
  faceapi.nets.faceExpressionNet.loadFromUri('models')
]).then(startVideo).catch(err => log('MODEL ERROR: ' + err))

function startVideo() {
  log('starting camera...')
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(stream => { video.srcObject = stream; video.play() })
    .catch(err => log('CAMERA ERROR: ' + err))
}

video.addEventListener('playing', () => { log('camera on'); detect() }, { once: true })

async function detect() {
  try {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const face = detections[0]

    if (!face) {
      log('no face found')
    } else {
      const deviation = 1 - face.expressions.neutral
      log('deviation: ' + deviation.toFixed(2))

      if (deviation > 0.28) {
        popup.style.display = 'block'
        if (player && player.playVideo) player.playVideo()
        document.body.style.overflow = 'hidden'
        neutralSince = null
      } else if (popup.style.display === 'block') {
        if (!neutralSince) neutralSince = Date.now()
        if (Date.now() - neutralSince > 2000) {
          popup.style.display = 'none'
          if (player && player.pauseVideo) player.pauseVideo()
          document.body.style.overflow = 'auto'
        }
      }
    }
  } catch (err) {
    log('DETECT ERROR: ' + err)
  }

  setTimeout(detect, 100)
}
