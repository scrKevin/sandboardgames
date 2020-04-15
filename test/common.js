// For testing on node, we must provide a WebRTC implementation
if (process.env.NODE_ENV === 'test') {
  exports.wrtc = require('wrtc')
}

// create a test MediaStream with two tracks
var canvas
exports.getMediaStream = function () {
  if (exports.wrtc) {
    const source = new exports.wrtc.nonstandard.RTCVideoSource()
    const tracks = [source.createTrack(), source.createTrack()]
    return new exports.wrtc.MediaStream(tracks)
  } else {
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.width = canvas.height = 100
      canvas.getContext('2d') // initialize canvas
    }
    const stream = canvas.captureStream(30)
    stream.addTrack(stream.getTracks()[0].clone()) // should have 2 tracks
    return stream
  }
}