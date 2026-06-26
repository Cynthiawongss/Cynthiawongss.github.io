/**
 * Neural Noise Splash Screen
 * ───────────────────────────
 * Ported from the "Red" project (React + WebGL) to vanilla JavaScript.
 * Renders a full-screen animated neural-noise effect for 3 seconds,
 * then gracefully fades out to reveal the main portfolio page.
 *
 * Timeline:
 *   0.0 – 1.0s    Pure Red neural noise (text hidden, waiting for font load)
 *   1.0 – 3.0s    Red "CYNTHIA WONG" text fades in (matches Hero font & size)
 *   3.0s+          Splash fades out → white Hero "CYNTHIA WONG" underneath
 *
 * Dependencies: none (self-contained, raw WebGL + requestAnimationFrame)
 */
(function () {
  'use strict';

  var SPLASH_DURATION = 3000; // 3 seconds total
  var TEXT_REVEAL_TIME = 1000; // 1s before showing text
  var FADE_DURATION = 800;    // CSS transition matches this

  var overlay = document.getElementById('splashOverlay');
  var canvas = document.getElementById('splashCanvas');
  var splashText = document.getElementById('splashLabelText');

  if (!overlay || !canvas) return;

  /* ── Pointer state ── */
  var pointer = { x: 0, y: 0, tX: 0, tY: 0 };
  var gl = null;
  var uniforms = {};
  var animFrameId = null;
  var startedAt = 0;           // performance.now() timestamp of first render
  var textRevealed = false;
  var fontReady = false;

  /* ── Default colour: reddish-pink from the Red project ── */
  var color = [0.9, 0.2, 0.4];
  var speed = 0.001;

  /* ================================================================
     SHADERS (ported verbatim from the Red project)
     ================================================================ */

  var vsSource =
    'precision mediump float;\n' +
    'varying vec2 vUv;\n' +
    'attribute vec2 a_position;\n' +
    'void main() {\n' +
    '  vUv = 0.5 * (a_position + 1.0);\n' +
    '  gl_Position = vec4(a_position, 0.0, 1.0);\n' +
    '}\n';

  var fsSource =
    'precision mediump float;\n' +
    'varying vec2 vUv;\n' +
    'uniform float u_time;\n' +
    'uniform float u_ratio;\n' +
    'uniform vec2 u_pointer_position;\n' +
    'uniform vec3 u_color;\n' +
    'uniform float u_speed;\n' +
    'vec2 rotate(vec2 uv, float th) {\n' +
    '  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;\n' +
    '}\n' +
    'float neuro_shape(vec2 uv, float t, float p) {\n' +
    '  vec2 sine_acc = vec2(0.0);\n' +
    '  vec2 res = vec2(0.0);\n' +
    '  float scale = 8.0;\n' +
    '  for (int j = 0; j < 15; j++) {\n' +
    '    uv = rotate(uv, 1.0);\n' +
    '    sine_acc = rotate(sine_acc, 1.0);\n' +
    '    vec2 layer = uv * scale + float(j) + sine_acc - t;\n' +
    '    sine_acc += sin(layer) + 2.4 * p;\n' +
    '    res += (0.5 + 0.5 * cos(layer)) / scale;\n' +
    '    scale *= 1.2;\n' +
    '  }\n' +
    '  return res.x + res.y;\n' +
    '}\n' +
    'void main() {\n' +
    '  vec2 uv = 0.5 * vUv;\n' +
    '  uv.x *= u_ratio;\n' +
    '  vec2 pointer = vUv - u_pointer_position;\n' +
    '  pointer.x *= u_ratio;\n' +
    '  float p = clamp(length(pointer), 0.0, 1.0);\n' +
    '  p = 0.5 * pow(1.0 - p, 2.0);\n' +
    '  float t = u_speed * u_time;\n' +
    '  vec3 col = vec3(0.0);\n' +
    '  float noise = neuro_shape(uv, t, p);\n' +
    '  noise = 1.2 * pow(noise, 3.0);\n' +
    '  noise += pow(noise, 10.0);\n' +
    '  noise = max(0.0, noise - 0.5);\n' +
    '  noise *= (1.0 - length(vUv - 0.5));\n' +
    '  col = u_color * noise;\n' +
    '  gl_FragColor = vec4(col, noise);\n' +
    '}\n';

  /* ================================================================
     WEBGL BOOTSTRAP
     ================================================================ */

  function initWebGL() {
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })
      || canvas.getContext('experimental-webgl');

    if (!gl) {
      console.warn('WebGL not supported — skipping splash animation.');
      fadeOut();
      return false;
    }

    /* Compile shaders */
    var vs = createShader(gl.VERTEX_SHADER, vsSource);
    var fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return false;

    var program = createProgram(vs, fs);
    if (!program) return false;

    /* Full-screen quad (triangle strip: 2 triangles = 4 verts) */
    var vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.useProgram(program);

    var posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    /* Collect uniform locations */
    uniforms = getUniforms(program);

    /* Set fixed uniforms */
    gl.uniform3f(uniforms.u_color, color[0], color[1], color[2]);
    gl.uniform1f(uniforms.u_speed, speed);

    return true;
  }

  function createShader(type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(vs, fs) {
    var program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Program error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  function getUniforms(program) {
    var u = {};
    var count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < count; i++) {
      var info = gl.getActiveUniform(program, i);
      if (info) {
        u[info.name] = gl.getUniformLocation(program, info.name);
      }
    }
    return u;
  }

  /* ================================================================
     RENDER LOOP
     ================================================================ */

  function render(now) {
    if (!gl) return;

    /* Initialize start time on first frame */
    if (!startedAt) {
      startedAt = now;
    }

    var elapsed = now - startedAt;

    /* Smooth pointer interpolation */
    pointer.x += (pointer.tX - pointer.x) * 0.2;
    pointer.y += (pointer.tY - pointer.y) * 0.2;

    gl.uniform1f(uniforms.u_time, now);
    gl.uniform2f(
      uniforms.u_pointer_position,
      pointer.x / window.innerWidth,
      1 - pointer.y / window.innerHeight
    );
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    /* ── Timeline: reveal text at 1s if font is ready ── */
    if (fontReady && !textRevealed && elapsed >= TEXT_REVEAL_TIME) {
      textRevealed = true;
      if (splashText) {
        splashText.classList.add('visible');
      }
    }

    animFrameId = requestAnimationFrame(render);
  }

  /* ================================================================
     RESIZE
     ================================================================ */

  function resizeCanvas() {
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (uniforms.u_ratio) {
      gl.uniform1f(uniforms.u_ratio, canvas.width / canvas.height);
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  /* ================================================================
     POINTER EVENTS
     ================================================================ */

  function onPointerMove(e) {
    pointer.tX = e.clientX;
    pointer.tY = e.clientY;
  }

  function onTouchMove(e) {
    if (e.targetTouches[0]) {
      pointer.tX = e.targetTouches[0].clientX;
      pointer.tY = e.targetTouches[0].clientY;
    }
  }

  function onClick(e) {
    pointer.tX = e.clientX;
    pointer.tY = e.clientY;
  }

  function bindEvents() {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('click', onClick);
  }

  function unbindEvents() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('click', onClick);
  }

  /* ================================================================
     FADE OUT
     ================================================================ */

  function fadeOut() {
    /* Stop the render loop */
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    unbindEvents();
    window.removeEventListener('resize', resizeCanvas);

    /* Add CSS class to trigger opacity transition */
    overlay.classList.add('fade-out');

    /* After the CSS transition ends, hide completely */
    overlay.addEventListener('transitionend', function handler() {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      overlay.removeEventListener('transitionend', handler);
    });
  }

  /* ================================================================
     FONT LOADING — wait for Charmonman before revealing text
     ================================================================ */

  function waitForFont() {
    var HARD_TIMEOUT = 1800; // absolute upper bound for font reveal

    /* Strategy:
       1. If document.fonts is available, use it as the primary signal.
          We schedule the actual check 200ms after fonts.ready resolves
          to let the browser's layout engine pick up the font.
       2. In parallel, poll with a simple approach.
       3. Hard timeout ensures text always shows. */

    var resolved = false;

    function markReady() {
      if (resolved) return;
      resolved = true;
      fontReady = true;
    }

    /* Primary: CSS Font Loading API */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        /* fonts.ready fires when all initial fonts are done loading.
           Wait one extra animation frame so the browser composites
           with the new font. */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            markReady();
          });
        });
      }).catch(function () {
        /* fallback if promise rejects */
        setTimeout(markReady, 400);
      });
    } else {
      /* No Font API — short fallback delay */
      setTimeout(markReady, 600);
    }

    /* Hard timeout safety net */
    setTimeout(markReady, HARD_TIMEOUT);
  }

  /* ================================================================
     BOOT
     ================================================================ */

  /* Lock body scroll during splash */
  document.body.style.overflow = 'hidden';

  /* ── Align splash text to hero name position ──
     We mirror the hero's layout chain exactly so the red text
     overlaps the white text beneath it. */
  function alignToHero() {
    var heroName = document.querySelector('.hero-name');
    if (!heroName || !splashText) return;

    var hr = heroName.getBoundingClientRect();
    var sr = splashText.getBoundingClientRect();

    if (sr.height === 0) {
      // Not yet laid out — retry next frame
      requestAnimationFrame(alignToHero);
      return;
    }

    // Measure how far the splash text is from hero name
    var deltaY = hr.top - sr.top + 80; // 80px downward offset

    if (Math.abs(deltaY) > 0.5) {
      // Apply a corrective transform to the splash label wrapper
      var label = document.querySelector('.splash-label');
      if (label) {
        label.style.transform = 'translateY(' + deltaY + 'px)';
      }
    }
  }

  if (initWebGL()) {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    bindEvents();
    waitForFont();
    animFrameId = requestAnimationFrame(render);

    /* Align text position once hero is laid out */
    requestAnimationFrame(function() {
      requestAnimationFrame(alignToHero);
    });

    /* Schedule fade-out after SPLASH_DURATION */
    setTimeout(fadeOut, SPLASH_DURATION);
  } else {
    /* WebGL unavailable — fall through immediately */
    fadeOut();
  }
})();
