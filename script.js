const video = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('models'),
  faceapi.nets.faceExpressionNet.loadFromUri('models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

const popup = document.getElementById('popup')
let neutralSince = null

video.addEventListener('play', () => {
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const face = detections[0]
    if (!face) return
    const deviation = 1 - face.expressions.neutral
    console.log(deviation)

    if (deviation > 0.28) {
      popup.style.display = 'block'
      popup.play()
      document.body.style.overflow = 'hidden'
      neutralSince = null
    } else if (popup.style.display === 'block') {
      if (!neutralSince) neutralSince = Date.now()
      if (Date.now() - neutralSince > 2000) {
        popup.style.display = 'none'
        popup.pause()
        document.body.style.overflow = 'auto'
      }
    }
  }, 100)
})