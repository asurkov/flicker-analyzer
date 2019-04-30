(function() {
  'use strict';

/**
 * Visualizes the log.
 */
window.analyseFile = file => {
  const reader = new FileReader();
  reader.onload = ev => {
    window.analyse(ev.target.result);
  }
  reader.readAsText(file);
}

window.analyseURL = url => {
  const request = new Request(url);
  fetch(request).
    then(response => response.text()).
    then(content => window.analyse(content));
}

window.analyse = content => {
  panelEl.textContent = '';

  let frameEl = null;
  let testIdx = 0;
  let frameIdx = 0;

  let logs = content.match(/\[fta\:[^\]]+\]\s[^\n]*/g);
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

        case 'frame-expected-rects': {
          frameEl.data.rects = JSON.parse(data);
          appendRects('Expected rects: ', frameEl.data.rects);
        } break;

        case 'frame-unexpected-rects':
          frameEl.setAttribute('failed', 'true');
          frameEl.data.unexpectedRects = JSON.parse(data);
          appendRects('Unexpected rects: ', frameEl.data.unexpectedRects);
          break;
      }
    }
    if (frameEl) {
      frameEl.click();
    }
  }
};

function appendRects(label, rects)
{
  let el = document.createElement('div');
  el.textContent = label;

  for (let r of rects) {
    el.appendChild(document.createElement('br'));

    let l = document.createElement('label')
    l.innerHTML = `<input type="checkbox" checked>${JSON.stringify(r)}`;
    let i = l.querySelector('input');
    i.rect = r;
    i.rect.visible = true;
    i.onclick = ev => {
      ev.target.rect.visible = !ev.target.rect.visible;
      showFrame();
    }
    l.appendChild(i);
    el.appendChild(l);
  }

  el.className = 'rects';
  panelEl.appendChild(el);
}

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

    if (showExpectedRects) {
      let rects = currentData.rects;
      if (rects && rects.length > 0) {
        ctx.strokeStyle = 'green';
        for (let r of rects) {
          if (r.visible) {
            ctx.strokeRect(r.left, r.top, r.right - r.left, r.bottom - r.top);
          }
        }
      }
    }

    if (showUnexpectedRects) {
      let rects = currentData.unexpectedRects;
      if (rects && rects.length > 0) {
        ctx.strokeStyle = 'red';
        for (let r of rects) {
          if (r.visible) {
            ctx.strokeRect(r.left, r.top, r.right - r.left, r.bottom - r.top);
          }
        }
      }
    }
  }
  img.src = currentData.pic;
}

let showUnexpectedRects = true;
let showExpectedRects = true;
let panelEl = null;

window.init = () => {
  panelEl = document.getElementById('panel');

  showExpectedRects = document.getElementById('show-expected').checked;
  showUnexpectedRects = document.getElementById('show-unexpected').checked;
}

window.toggleUnexpectedRects = () => {
  showUnexpectedRects = !showUnexpectedRects;
  showFrame(currentData);
}

window.toggleExpectedRects = () => {
  showExpectedRects = !showExpectedRects;
  showFrame(currentData);
}

}());
