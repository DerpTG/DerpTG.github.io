/* ---------- Accordions (lab log, experience) ---------- */
document.querySelectorAll('.e-btn').forEach(function(b){
  b.addEventListener('click',function(){
    var e=b.closest('.entry');
    var open=e.classList.toggle('on');
    b.setAttribute('aria-expanded',open?'true':'false');
  });
});

/* ---------- Resume modal ---------- */
(function(){
  var modal=document.getElementById('resumeModal');
  if(!modal)return;
  var frame=document.getElementById('resumeFrame');
  var openers=document.querySelectorAll('[data-resume]');
  openers.forEach(function(o){
    o.addEventListener('click',function(e){
      e.preventDefault();
      if(!frame.src||frame.src==='about:blank'||frame.src.indexOf('about:blank')>-1){
        frame.src='resume.pdf';
      }
      modal.classList.add('show');
    });
  });
  function close(){modal.classList.remove('show');}
  var cb=document.getElementById('closeResume');
  if(cb)cb.addEventListener('click',close);
  modal.addEventListener('click',function(e){if(e.target===modal)close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
})();
