(function() {
  "use strict";

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
  panelEl.textContent = "";

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
        case "test": {
          frameIdx = 0;
          let el = document.createElement("div");
          el.textContent = `Test #${++testIdx}: ${data}`;
          panelEl.appendChild(el);
        } break;

        case "frame-size":
          frameEl = document.createElement("div");
          frameEl.className = "frame";
          frameEl.innerHTML = `<span class="failed">!</span> <a href="">Frame #${++frameIdx}</a>`;
          frameEl.onclick = ev => {
            let prevEl = document.querySelector("[current]");
            if (prevEl) {
              prevEl.removeAttribute("current");
            }
            let el = ev.currentTarget;
            el.setAttribute("current", "true");
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

        case "frame-pic":
          frameEl.data.pic = data;
          break;

        case "frame-expected-rects": {
          frameEl.data.rects = JSON.parse(data);
          appendRects("Expected rects: ", "green", frameEl.data.rects);
        } break;

        case "frame-accepted-rects": {
          frameEl.data.acceptedRects = JSON.parse(data);
          appendRects("Accepted rects: ", "blue", frameEl.data.acceptedRects);
        } break;

        case "frame-unexpected-rects":
          frameEl.setAttribute("failed", "true");
          frameEl.data.unexpectedRects = JSON.parse(data);
          appendRects("Unexpected rects: ", "red", frameEl.data.unexpectedRects);
          break;
      }
    }
    if (frameEl) {
      frameEl.click();
    }
  }
};

function appendRects(label, color, rects)
{
  let el = document.createElement("div");
  el.innerHTML = `<span style="background-color: ${color}">&nbsp;</span> ${label}`;

  for (let r of rects) {
    el.appendChild(document.createElement("br"));

    let l = document.createElement("label");
    l.innerHTML = `
      <input type="checkbox" checked>${JSON.stringify(r)}
    `;
    let i = l.querySelector("input");
    i.rect = r;
    i.rect.visible = true;
    i.onclick = ev => {
      ev.target.rect.visible = !ev.target.rect.visible;
      showFrame();
    }
    l.appendChild(i);
    el.appendChild(l);
  }

  el.className = "rects";
  panelEl.appendChild(el);
}

let currentData = null;

function showFrame()
{
  let w = currentData.size.width;
  let h = currentData.size.height;

  let canvas = document.getElementById("canvas");
  canvas.mozOpaque = true;
  canvas.width = w;
  canvas.height = h;

  let ctx = canvas.getContext("2d", {alpha: false, willReadFrequently: true});

  let img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, w, h);

    const areasInfo = [
      [currentData.rects, "green"],
      [currentData.acceptedRects, "blue"],
      [currentData.unexpectedRects, "red"],
    ];
    for (let [ rects, color] of areasInfo) {
      if (rects && rects.length > 0) {
        ctx.strokeStyle = color;
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

let panelEl = null;

window.init = () => {
  panelEl = document.getElementById("panel");

  let params = {};
  let raw_params = decodeURIComponent(window.location.hash).substr(1).split(/[&;]/);
  for (let raw_param of raw_params) {
    let pair = raw_param.split("=");
    params[pair[0]] = pair[1];
  }

  if (params.log) {
    analyse(params.log);
  } else if (params.logurl) {
    analyseURL(params.logurl);
  }
}

}());
