$(document).ready(function()
{
  $("#joinBtn").on('click', function (e) {
    $("#joinModal").modal();
  });

  $("#createBtn").on('click', function (e) {
    $("#createModal").modal();
  });

  $(".joinGroup").on('click', function (e){
    //console.log(e)
    $('#nameJoin').val(e.currentTarget.name);
    $("#joinModal").modal();
  })

  function addWebcam(stream, playerId, mirrored, muted)
  {
    var video = document.createElement('video');
    $("#webcam" + playerId).html(video)
    if (mirrored)
    {
      $("#webcam" + playerId).css("transform", "rotateY(180deg)")
    }
    video.muted = muted;
    video.srcObject = stream;
    // video.addEventListener("playing", function () {
    //   setTimeout(function () {
    //     console.log("Stream dimensions: " + video.videoWidth + "x" + video.videoHeight);
    //     var aspectRatio = video.videoWidth / video.videoHeight;
    //     if (aspectRatio < 1)
    //     {
    //       var correctedHeight = video.videoHeight * (webcamBoxWidth / video.videoWidth);
    //       $("#webcam" + playerId + " video").css("width", webcamBoxWidth + "px")
    //       $("#webcam" + playerId + " video").css("height", correctedHeight + "px");
    //       $("#webcam" + playerId + " video").css("margin-left", "0px")
    //       $("#webcam" + playerId + " video").css("margin-top", ((webcamBoxHeight - correctedHeight) * 0.5) + "px")
    //     }
    //     else
    //     {
    //       var correctedWidth = video.videoWidth * (webcamBoxHeight / video.videoHeight);
    //       $("#webcam" + playerId + " video").css("width", correctedWidth + "px")
    //       $("#webcam" + playerId + " video").css("height", webcamBoxHeight + "px");
    //       $("#webcam" + playerId + " video").css("margin-left", ((webcamBoxWidth - correctedWidth) * 0.5) + "px")
    //       $("#webcam" + playerId + " video").css("margin-top", "0px")
    //     }
    //   }, 500);
    // });
    video.play();
  }

  navigator.mediaDevices.getUserMedia({video: {
                          width: {
                              max: 640,
                              ideal: 320 
                          },
                          height: {
                              max: 480,
                              ideal: 240
                          }
                      }, audio: false})
    .then(function(stream) {
      addWebcam(stream, 0, true, true)
  });
})