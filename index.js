(function() {
  'use strict';

/**
 *
 */
window.analyse = file => {
  const reader = new FileReader();
  reader.onload = ev => {
    let panelEl = document.getElementById('panel');
    let frameEl = null;
    let testIdx = 0;
    let frameIdx = 0;

    let content = ev.target.result;
    let logs = content.match(/\[fta\:.+\]\s.*/g);
    if (logs) {
      for (let log of logs) {
        let blocks = log.match(/\[fta\:([^\]]+)\]\s(.*)/);
        let event = blocks && blocks[1];
        console.log(event);
        let data = blocks && blocks[2];

        switch (event) {
          case 'test': {
            frameIdx = 0;
            let el = document.createElement('div');
            el.textContent = `Test #${++testIdx}: ${data}`;
            panelEl.appendChild(el);
          } break;

          case 'frame-size':
            frameEl = document.createElement('div');
            frameEl.className = 'frame';
            frameEl.innerHTML = `<span class='failed'>!</span> <a href=''>Frame #${++frameIdx}</a>`;
            frameEl.onclick = ev => {
              let prevEl = document.querySelector('[current]');
              if (prevEl) {
                prevEl.removeAttribute('current');
              }
              let el = ev.currentTarget;
              el.setAttribute('current', 'true');
              ev.preventDefault();
              currentData = ev.currentTarget.data;
              showFrame(currentData);
            }
            panelEl.appendChild(frameEl);
            frameEl.data = {
              idx: frameIdx,
              size: JSON.parse(data),
              pic: data,
              unexpectedRects: []
            };
            break;

          case 'frame-pic':
            frameEl.data.pic = data;
            break;

          case 'frame-unexpected-rects':
            frameEl.setAttribute('failed', 'true');
            frameEl.data.unexpectedRects = JSON.parse(data);
            break;
        }
      }
      if (frameEl) {
        frameEl.click();
      }
    }
  }
  reader.readAsText(file);
};

let currentData = null;

function showFrame()
{
  let w = currentData.size.width;
  let h = currentData.size.height;

  let canvas = document.getElementById('canvas');
  canvas.mozOpaque = true;
  canvas.width = w;
  canvas.height = h;

  let ctx = canvas.getContext('2d', {alpha: false, willReadFrequently: true});

  let img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, w, h);

    if (showUnexpectedRects) {
      let rects = currentData.unexpectedRects;
      if (rects && rects.length > 0) {
        ctx.strokeStyle = 'red';
        for (let rect of rects) {
          ctx.strokeRect(rect.x1, rect.y1, rect.w, rect.h);
        }
      }
    }
  }
  img.src = currentData.pic;
}

let showUnexpectedRects = true;
function toggleUnexpectedRects()
{
  showUnexpectedRects = !showUnexpectedRects;
  showFrame(currentData);
}

}());
