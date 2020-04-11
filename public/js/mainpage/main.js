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
})