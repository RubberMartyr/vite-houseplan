import { jsx as br, Fragment as Fn, jsxs as Cn } from "react/jsx-runtime";
import { m as Dn, n as An, R as En, U as Mn, o as Gn, p as mt, M as Rn, C as zr, V as ir, q as On, r as Wr, I as Ln, t as Bn, w as fn, x as Pn, T as In, y as zt, z as Nn, A as jt, D as Wn, P as yt, u as zn, _ as jn, G as Vt, c as Xt, e as Ht } from "./index-9DageTfe.js";
import * as qe from "react";
const Vn = (u) => typeof u == "object" && typeof u.then == "function", Lr = [];
function Xn(u, t, d = (c, r) => c === r) {
  if (u === t) return !0;
  if (!u || !t) return !1;
  const c = u.length;
  if (t.length !== c) return !1;
  for (let r = 0; r < c; r++) if (!d(u[r], t[r])) return !1;
  return !0;
}
function Hn(u, t = null, d = !1, c = {}) {
  t === null && (t = [u]);
  for (const e of Lr)
    if (Xn(t, e.keys, e.equal)) {
      if (d) return;
      if (Object.prototype.hasOwnProperty.call(e, "error")) throw e.error;
      if (Object.prototype.hasOwnProperty.call(e, "response"))
        return c.lifespan && c.lifespan > 0 && (e.timeout && clearTimeout(e.timeout), e.timeout = setTimeout(e.remove, c.lifespan)), e.response;
      if (!d) throw e.promise;
    }
  const r = {
    keys: t,
    equal: c.equal,
    remove: () => {
      const e = Lr.indexOf(r);
      e !== -1 && Lr.splice(e, 1);
    },
    promise: (
      // Execute the promise
      (Vn(u) ? u : u(...t)).then((e) => {
        r.response = e, c.lifespan && c.lifespan > 0 && (r.timeout = setTimeout(r.remove, c.lifespan));
      }).catch((e) => r.error = e)
    )
  };
  if (Lr.push(r), !d) throw r.promise;
}
const Yn = (u, t, d) => Hn(u, t, !1, d);
function Jn() {
  var u = /* @__PURE__ */ Object.create(null);
  function t(r, e) {
    var a = r.id, i = r.name, n = r.dependencies;
    n === void 0 && (n = []);
    var o = r.init;
    o === void 0 && (o = function() {
    });
    var s = r.getTransferables;
    if (s === void 0 && (s = null), !u[a])
      try {
        n = n.map(function(l) {
          return l && l.isWorkerModule && (t(l, function(h) {
            if (h instanceof Error)
              throw h;
          }), l = u[l.id].value), l;
        }), o = c("<" + i + ">.init", o), s && (s = c("<" + i + ">.getTransferables", s));
        var f = null;
        typeof o == "function" ? f = o.apply(void 0, n) : console.error("worker module init function failed to rehydrate"), u[a] = {
          id: a,
          value: f,
          getTransferables: s
        }, e(f);
      } catch (l) {
        l && l.noLog || console.error(l), e(l);
      }
  }
  function d(r, e) {
    var a, i = r.id, n = r.args;
    (!u[i] || typeof u[i].value != "function") && e(new Error("Worker module " + i + ": not found or its 'init' did not return a function"));
    try {
      var o = (a = u[i]).value.apply(a, n);
      o && typeof o.then == "function" ? o.then(s, function(f) {
        return e(f instanceof Error ? f : new Error("" + f));
      }) : s(o);
    } catch (f) {
      e(f);
    }
    function s(f) {
      try {
        var l = u[i].getTransferables && u[i].getTransferables(f);
        (!l || !Array.isArray(l) || !l.length) && (l = void 0), e(f, l);
      } catch (h) {
        console.error(h), e(h);
      }
    }
  }
  function c(r, e) {
    var a = void 0;
    self.troikaDefine = function(n) {
      return a = n;
    };
    var i = URL.createObjectURL(
      new Blob(
        ["/** " + r.replace(/\*/g, "") + ` **/

troikaDefine(
` + e + `
)`],
        { type: "application/javascript" }
      )
    );
    try {
      importScripts(i);
    } catch (n) {
      console.error(n);
    }
    return URL.revokeObjectURL(i), delete self.troikaDefine, a;
  }
  self.addEventListener("message", function(r) {
    var e = r.data, a = e.messageId, i = e.action, n = e.data;
    try {
      i === "registerModule" && t(n, function(o) {
        o instanceof Error ? postMessage({
          messageId: a,
          success: !1,
          error: o.message
        }) : postMessage({
          messageId: a,
          success: !0,
          result: { isCallable: typeof o == "function" }
        });
      }), i === "callModule" && d(n, function(o, s) {
        o instanceof Error ? postMessage({
          messageId: a,
          success: !1,
          error: o.message
        }) : postMessage({
          messageId: a,
          success: !0,
          result: o
        }, s || void 0);
      });
    } catch (o) {
      postMessage({
        messageId: a,
        success: !1,
        error: o.stack
      });
    }
  });
}
function Kn(u) {
  var t = function() {
    for (var d = [], c = arguments.length; c--; ) d[c] = arguments[c];
    return t._getInitResult().then(function(r) {
      if (typeof r == "function")
        return r.apply(void 0, d);
      throw new Error("Worker module function was called but `init` did not return a callable function");
    });
  };
  return t._getInitResult = function() {
    var d = u.dependencies, c = u.init;
    d = Array.isArray(d) ? d.map(function(e) {
      return e && (e = e.onMainThread || e, e._getInitResult && (e = e._getInitResult())), e;
    }) : [];
    var r = Promise.all(d).then(function(e) {
      return c.apply(null, e);
    });
    return t._getInitResult = function() {
      return r;
    }, r;
  }, t;
}
var ln = function() {
  var u = !1;
  if (typeof window < "u" && typeof window.document < "u")
    try {
      var t = new Worker(
        URL.createObjectURL(new Blob([""], { type: "application/javascript" }))
      );
      t.terminate(), u = !0;
    } catch (d) {
      typeof process < "u" && process.env.NODE_ENV === "test" || console.log(
        "Troika createWorkerModule: web workers not allowed; falling back to main thread execution. Cause: [" + d.message + "]"
      );
    }
  return ln = function() {
    return u;
  }, u;
}, Qn = 0, Zn = 0, ut = !1, _r = /* @__PURE__ */ Object.create(null), xr = /* @__PURE__ */ Object.create(null), dt = /* @__PURE__ */ Object.create(null);
function sr(u) {
  if ((!u || typeof u.init != "function") && !ut)
    throw new Error("requires `options.init` function");
  var t = u.dependencies, d = u.init, c = u.getTransferables, r = u.workerId, e = Kn(u);
  r == null && (r = "#default");
  var a = "workerModule" + ++Qn, i = u.name || a, n = null;
  t = t && t.map(function(s) {
    return typeof s == "function" && !s.workerModuleData && (ut = !0, s = sr({
      workerId: r,
      name: "<" + i + "> function dependency: " + s.name,
      init: `function(){return (
` + Ir(s) + `
)}`
    }), ut = !1), s && s.workerModuleData && (s = s.workerModuleData), s;
  });
  function o() {
    for (var s = [], f = arguments.length; f--; ) s[f] = arguments[f];
    if (!ln())
      return e.apply(void 0, s);
    if (!n) {
      n = Yt(r, "registerModule", o.workerModuleData);
      var l = function() {
        n = null, xr[r].delete(l);
      };
      (xr[r] || (xr[r] = /* @__PURE__ */ new Set())).add(l);
    }
    return n.then(function(h) {
      var p = h.isCallable;
      if (p)
        return Yt(r, "callModule", { id: a, args: s });
      throw new Error("Worker module function was called but `init` did not return a callable function");
    });
  }
  return o.workerModuleData = {
    isWorkerModule: !0,
    id: a,
    name: i,
    dependencies: t,
    init: Ir(d),
    getTransferables: c && Ir(c)
  }, o.onMainThread = e, o;
}
function qn(u) {
  xr[u] && xr[u].forEach(function(t) {
    t();
  }), _r[u] && (_r[u].terminate(), delete _r[u]);
}
function Ir(u) {
  var t = u.toString();
  return !/^function/.test(t) && /^\w+\s*\(/.test(t) && (t = "function " + t), t;
}
function $n(u) {
  var t = _r[u];
  if (!t) {
    var d = Ir(Jn);
    t = _r[u] = new Worker(
      URL.createObjectURL(
        new Blob(
          ["/** Worker Module Bootstrap: " + u.replace(/\*/g, "") + ` **/

;(` + d + ")()"],
          { type: "application/javascript" }
        )
      )
    ), t.onmessage = function(c) {
      var r = c.data, e = r.messageId, a = dt[e];
      if (!a)
        throw new Error("WorkerModule response with empty or unknown messageId");
      delete dt[e], a(r);
    };
  }
  return t;
}
function Yt(u, t, d) {
  return new Promise(function(c, r) {
    var e = ++Zn;
    dt[e] = function(a) {
      a.success ? c(a.result) : r(new Error("Error in worker " + t + " call: " + a.error));
    }, $n(u).postMessage({
      messageId: e,
      action: t,
      data: d
    });
  });
}
function un() {
  var u = function(t) {
    function d(B, G, v, b, T, D, _, N) {
      var E = 1 - _;
      N.x = E * E * B + 2 * E * _ * v + _ * _ * T, N.y = E * E * G + 2 * E * _ * b + _ * _ * D;
    }
    function c(B, G, v, b, T, D, _, N, E, P) {
      var H = 1 - E;
      P.x = H * H * H * B + 3 * H * H * E * v + 3 * H * E * E * T + E * E * E * _, P.y = H * H * H * G + 3 * H * H * E * b + 3 * H * E * E * D + E * E * E * N;
    }
    function r(B, G) {
      for (var v = /([MLQCZ])([^MLQCZ]*)/g, b, T, D, _, N; b = v.exec(B); ) {
        var E = b[2].replace(/^\s*|\s*$/g, "").split(/[,\s]+/).map(function(P) {
          return parseFloat(P);
        });
        switch (b[1]) {
          case "M":
            _ = T = E[0], N = D = E[1];
            break;
          case "L":
            (E[0] !== _ || E[1] !== N) && G("L", _, N, _ = E[0], N = E[1]);
            break;
          case "Q": {
            G("Q", _, N, _ = E[2], N = E[3], E[0], E[1]);
            break;
          }
          case "C": {
            G("C", _, N, _ = E[4], N = E[5], E[0], E[1], E[2], E[3]);
            break;
          }
          case "Z":
            (_ !== T || N !== D) && G("L", _, N, T, D);
            break;
        }
      }
    }
    function e(B, G, v) {
      v === void 0 && (v = 16);
      var b = { x: 0, y: 0 };
      r(B, function(T, D, _, N, E, P, H, $, V) {
        switch (T) {
          case "L":
            G(D, _, N, E);
            break;
          case "Q": {
            for (var W = D, pe = _, ue = 1; ue < v; ue++)
              d(
                D,
                _,
                P,
                H,
                N,
                E,
                ue / (v - 1),
                b
              ), G(W, pe, b.x, b.y), W = b.x, pe = b.y;
            break;
          }
          case "C": {
            for (var Q = D, ee = _, se = 1; se < v; se++)
              c(
                D,
                _,
                P,
                H,
                $,
                V,
                N,
                E,
                se / (v - 1),
                b
              ), G(Q, ee, b.x, b.y), Q = b.x, ee = b.y;
            break;
          }
        }
      });
    }
    var a = "precision highp float;attribute vec2 aUV;varying vec2 vUV;void main(){vUV=aUV;gl_Position=vec4(mix(vec2(-1.0),vec2(1.0),aUV),0.0,1.0);}", i = "precision highp float;uniform sampler2D tex;varying vec2 vUV;void main(){gl_FragColor=texture2D(tex,vUV);}", n = /* @__PURE__ */ new WeakMap(), o = {
      premultipliedAlpha: !1,
      preserveDrawingBuffer: !0,
      antialias: !1,
      depth: !1
    };
    function s(B, G) {
      var v = B.getContext ? B.getContext("webgl", o) : B, b = n.get(v);
      if (!b) {
        let H = function(Q) {
          var ee = D[Q];
          if (!ee && (ee = D[Q] = v.getExtension(Q), !ee))
            throw new Error(Q + " not supported");
          return ee;
        }, $ = function(Q, ee) {
          var se = v.createShader(ee);
          return v.shaderSource(se, Q), v.compileShader(se), se;
        }, V = function(Q, ee, se, j) {
          if (!_[Q]) {
            var re = {}, q = {}, L = v.createProgram();
            v.attachShader(L, $(ee, v.VERTEX_SHADER)), v.attachShader(L, $(se, v.FRAGMENT_SHADER)), v.linkProgram(L), _[Q] = {
              program: L,
              transaction: function(K) {
                v.useProgram(L), K({
                  setUniform: function(Y, be) {
                    for (var ne = [], oe = arguments.length - 2; oe-- > 0; ) ne[oe] = arguments[oe + 2];
                    var le = q[be] || (q[be] = v.getUniformLocation(L, be));
                    v["uniform" + Y].apply(v, [le].concat(ne));
                  },
                  setAttribute: function(Y, be, ne, oe, le) {
                    var de = re[Y];
                    de || (de = re[Y] = {
                      buf: v.createBuffer(),
                      // TODO should we destroy our buffers?
                      loc: v.getAttribLocation(L, Y),
                      data: null
                    }), v.bindBuffer(v.ARRAY_BUFFER, de.buf), v.vertexAttribPointer(de.loc, be, v.FLOAT, !1, 0, 0), v.enableVertexAttribArray(de.loc), T ? v.vertexAttribDivisor(de.loc, oe) : H("ANGLE_instanced_arrays").vertexAttribDivisorANGLE(de.loc, oe), le !== de.data && (v.bufferData(v.ARRAY_BUFFER, le, ne), de.data = le);
                  }
                });
              }
            };
          }
          _[Q].transaction(j);
        }, W = function(Q, ee) {
          E++;
          try {
            v.activeTexture(v.TEXTURE0 + E);
            var se = N[Q];
            se || (se = N[Q] = v.createTexture(), v.bindTexture(v.TEXTURE_2D, se), v.texParameteri(v.TEXTURE_2D, v.TEXTURE_MIN_FILTER, v.NEAREST), v.texParameteri(v.TEXTURE_2D, v.TEXTURE_MAG_FILTER, v.NEAREST)), v.bindTexture(v.TEXTURE_2D, se), ee(se, E);
          } finally {
            E--;
          }
        }, pe = function(Q, ee, se) {
          var j = v.createFramebuffer();
          P.push(j), v.bindFramebuffer(v.FRAMEBUFFER, j), v.activeTexture(v.TEXTURE0 + ee), v.bindTexture(v.TEXTURE_2D, Q), v.framebufferTexture2D(v.FRAMEBUFFER, v.COLOR_ATTACHMENT0, v.TEXTURE_2D, Q, 0);
          try {
            se(j);
          } finally {
            v.deleteFramebuffer(j), v.bindFramebuffer(v.FRAMEBUFFER, P[--P.length - 1] || null);
          }
        }, ue = function() {
          D = {}, _ = {}, N = {}, E = -1, P.length = 0;
        };
        var T = typeof WebGL2RenderingContext < "u" && v instanceof WebGL2RenderingContext, D = {}, _ = {}, N = {}, E = -1, P = [];
        v.canvas.addEventListener("webglcontextlost", function(Q) {
          ue(), Q.preventDefault();
        }, !1), n.set(v, b = {
          gl: v,
          isWebGL2: T,
          getExtension: H,
          withProgram: V,
          withTexture: W,
          withTextureFramebuffer: pe,
          handleContextLoss: ue
        });
      }
      G(b);
    }
    function f(B, G, v, b, T, D, _, N) {
      _ === void 0 && (_ = 15), N === void 0 && (N = null), s(B, function(E) {
        var P = E.gl, H = E.withProgram, $ = E.withTexture;
        $("copy", function(V, W) {
          P.texImage2D(P.TEXTURE_2D, 0, P.RGBA, T, D, 0, P.RGBA, P.UNSIGNED_BYTE, G), H("copy", a, i, function(pe) {
            var ue = pe.setUniform, Q = pe.setAttribute;
            Q("aUV", 2, P.STATIC_DRAW, 0, new Float32Array([0, 0, 2, 0, 0, 2])), ue("1i", "image", W), P.bindFramebuffer(P.FRAMEBUFFER, N || null), P.disable(P.BLEND), P.colorMask(_ & 8, _ & 4, _ & 2, _ & 1), P.viewport(v, b, T, D), P.scissor(v, b, T, D), P.drawArrays(P.TRIANGLES, 0, 3);
          });
        });
      });
    }
    function l(B, G, v) {
      var b = B.width, T = B.height;
      s(B, function(D) {
        var _ = D.gl, N = new Uint8Array(b * T * 4);
        _.readPixels(0, 0, b, T, _.RGBA, _.UNSIGNED_BYTE, N), B.width = G, B.height = v, f(_, N, 0, 0, b, T);
      });
    }
    var h = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      withWebGLContext: s,
      renderImageData: f,
      resizeWebGLCanvasWithoutClearing: l
    });
    function p(B, G, v, b, T, D) {
      D === void 0 && (D = 1);
      var _ = new Uint8Array(B * G), N = b[2] - b[0], E = b[3] - b[1], P = [];
      e(v, function(Q, ee, se, j) {
        P.push({
          x1: Q,
          y1: ee,
          x2: se,
          y2: j,
          minX: Math.min(Q, se),
          minY: Math.min(ee, j),
          maxX: Math.max(Q, se),
          maxY: Math.max(ee, j)
        });
      }), P.sort(function(Q, ee) {
        return Q.maxX - ee.maxX;
      });
      for (var H = 0; H < B; H++)
        for (var $ = 0; $ < G; $++) {
          var V = pe(
            b[0] + N * (H + 0.5) / B,
            b[1] + E * ($ + 0.5) / G
          ), W = Math.pow(1 - Math.abs(V) / T, D) / 2;
          V < 0 && (W = 1 - W), W = Math.max(0, Math.min(255, Math.round(W * 255))), _[$ * B + H] = W;
        }
      return _;
      function pe(Q, ee) {
        for (var se = 1 / 0, j = 1 / 0, re = P.length; re--; ) {
          var q = P[re];
          if (q.maxX + j <= Q)
            break;
          if (Q + j > q.minX && ee - j < q.maxY && ee + j > q.minY) {
            var L = O(Q, ee, q.x1, q.y1, q.x2, q.y2);
            L < se && (se = L, j = Math.sqrt(se));
          }
        }
        return ue(Q, ee) && (j = -j), j;
      }
      function ue(Q, ee) {
        for (var se = 0, j = P.length; j--; ) {
          var re = P[j];
          if (re.maxX <= Q)
            break;
          var q = re.y1 > ee != re.y2 > ee && Q < (re.x2 - re.x1) * (ee - re.y1) / (re.y2 - re.y1) + re.x1;
          q && (se += re.y1 < re.y2 ? 1 : -1);
        }
        return se !== 0;
      }
    }
    function g(B, G, v, b, T, D, _, N, E, P) {
      D === void 0 && (D = 1), N === void 0 && (N = 0), E === void 0 && (E = 0), P === void 0 && (P = 0), m(B, G, v, b, T, D, _, null, N, E, P);
    }
    function m(B, G, v, b, T, D, _, N, E, P, H) {
      D === void 0 && (D = 1), E === void 0 && (E = 0), P === void 0 && (P = 0), H === void 0 && (H = 0);
      for (var $ = p(B, G, v, b, T, D), V = new Uint8Array($.length * 4), W = 0; W < $.length; W++)
        V[W * 4 + H] = $[W];
      f(_, V, E, P, B, G, 1 << 3 - H, N);
    }
    function O(B, G, v, b, T, D) {
      var _ = T - v, N = D - b, E = _ * _ + N * N, P = E ? Math.max(0, Math.min(1, ((B - v) * _ + (G - b) * N) / E)) : 0, H = B - (v + P * _), $ = G - (b + P * N);
      return H * H + $ * $;
    }
    var S = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      generate: p,
      generateIntoCanvas: g,
      generateIntoFramebuffer: m
    }), F = "precision highp float;uniform vec4 uGlyphBounds;attribute vec2 aUV;attribute vec4 aLineSegment;varying vec4 vLineSegment;varying vec2 vGlyphXY;void main(){vLineSegment=aLineSegment;vGlyphXY=mix(uGlyphBounds.xy,uGlyphBounds.zw,aUV);gl_Position=vec4(mix(vec2(-1.0),vec2(1.0),aUV),0.0,1.0);}", U = "precision highp float;uniform vec4 uGlyphBounds;uniform float uMaxDistance;uniform float uExponent;varying vec4 vLineSegment;varying vec2 vGlyphXY;float absDistToSegment(vec2 point,vec2 lineA,vec2 lineB){vec2 lineDir=lineB-lineA;float lenSq=dot(lineDir,lineDir);float t=lenSq==0.0 ? 0.0 : clamp(dot(point-lineA,lineDir)/lenSq,0.0,1.0);vec2 linePt=lineA+t*lineDir;return distance(point,linePt);}void main(){vec4 seg=vLineSegment;vec2 p=vGlyphXY;float dist=absDistToSegment(p,seg.xy,seg.zw);float val=pow(1.0-clamp(dist/uMaxDistance,0.0,1.0),uExponent)*0.5;bool crossing=(seg.y>p.y!=seg.w>p.y)&&(p.x<(seg.z-seg.x)*(p.y-seg.y)/(seg.w-seg.y)+seg.x);bool crossingUp=crossing&&vLineSegment.y<vLineSegment.w;gl_FragColor=vec4(crossingUp ? 1.0/255.0 : 0.0,crossing&&!crossingUp ? 1.0/255.0 : 0.0,0.0,val);}", w = "precision highp float;uniform sampler2D tex;varying vec2 vUV;void main(){vec4 color=texture2D(tex,vUV);bool inside=color.r!=color.g;float val=inside ? 1.0-color.a : color.a;gl_FragColor=vec4(val);}", R = new Float32Array([0, 0, 2, 0, 0, 2]), x = null, C = !1, I = {}, M = /* @__PURE__ */ new WeakMap();
    function J(B) {
      if (!C && !X(B))
        throw new Error("WebGL generation not supported");
    }
    function y(B, G, v, b, T, D, _) {
      if (D === void 0 && (D = 1), _ === void 0 && (_ = null), !_ && (_ = x, !_)) {
        var N = typeof OffscreenCanvas == "function" ? new OffscreenCanvas(1, 1) : typeof document < "u" ? document.createElement("canvas") : null;
        if (!N)
          throw new Error("OffscreenCanvas or DOM canvas not supported");
        _ = x = N.getContext("webgl", { depth: !1 });
      }
      J(_);
      var E = new Uint8Array(B * G * 4);
      s(_, function(V) {
        var W = V.gl, pe = V.withTexture, ue = V.withTextureFramebuffer;
        pe("readable", function(Q, ee) {
          W.texImage2D(W.TEXTURE_2D, 0, W.RGBA, B, G, 0, W.RGBA, W.UNSIGNED_BYTE, null), ue(Q, ee, function(se) {
            k(
              B,
              G,
              v,
              b,
              T,
              D,
              W,
              se,
              0,
              0,
              0
              // red channel
            ), W.readPixels(0, 0, B, G, W.RGBA, W.UNSIGNED_BYTE, E);
          });
        });
      });
      for (var P = new Uint8Array(B * G), H = 0, $ = 0; H < E.length; H += 4)
        P[$++] = E[H];
      return P;
    }
    function A(B, G, v, b, T, D, _, N, E, P) {
      D === void 0 && (D = 1), N === void 0 && (N = 0), E === void 0 && (E = 0), P === void 0 && (P = 0), k(B, G, v, b, T, D, _, null, N, E, P);
    }
    function k(B, G, v, b, T, D, _, N, E, P, H) {
      D === void 0 && (D = 1), E === void 0 && (E = 0), P === void 0 && (P = 0), H === void 0 && (H = 0), J(_);
      var $ = [];
      e(v, function(V, W, pe, ue) {
        $.push(V, W, pe, ue);
      }), $ = new Float32Array($), s(_, function(V) {
        var W = V.gl, pe = V.isWebGL2, ue = V.getExtension, Q = V.withProgram, ee = V.withTexture, se = V.withTextureFramebuffer, j = V.handleContextLoss;
        if (ee("rawDistances", function(re, q) {
          (B !== re._lastWidth || G !== re._lastHeight) && W.texImage2D(
            W.TEXTURE_2D,
            0,
            W.RGBA,
            re._lastWidth = B,
            re._lastHeight = G,
            0,
            W.RGBA,
            W.UNSIGNED_BYTE,
            null
          ), Q("main", F, U, function(L) {
            var he = L.setAttribute, K = L.setUniform, ae = !pe && ue("ANGLE_instanced_arrays"), Y = !pe && ue("EXT_blend_minmax");
            he("aUV", 2, W.STATIC_DRAW, 0, R), he("aLineSegment", 4, W.DYNAMIC_DRAW, 1, $), K.apply(void 0, ["4f", "uGlyphBounds"].concat(b)), K("1f", "uMaxDistance", T), K("1f", "uExponent", D), se(re, q, function(be) {
              W.enable(W.BLEND), W.colorMask(!0, !0, !0, !0), W.viewport(0, 0, B, G), W.scissor(0, 0, B, G), W.blendFunc(W.ONE, W.ONE), W.blendEquationSeparate(W.FUNC_ADD, pe ? W.MAX : Y.MAX_EXT), W.clear(W.COLOR_BUFFER_BIT), pe ? W.drawArraysInstanced(W.TRIANGLES, 0, 3, $.length / 4) : ae.drawArraysInstancedANGLE(W.TRIANGLES, 0, 3, $.length / 4);
            });
          }), Q("post", a, w, function(L) {
            L.setAttribute("aUV", 2, W.STATIC_DRAW, 0, R), L.setUniform("1i", "tex", q), W.bindFramebuffer(W.FRAMEBUFFER, N), W.disable(W.BLEND), W.colorMask(H === 0, H === 1, H === 2, H === 3), W.viewport(E, P, B, G), W.scissor(E, P, B, G), W.drawArrays(W.TRIANGLES, 0, 3);
          });
        }), W.isContextLost())
          throw j(), new Error("webgl context lost");
      });
    }
    function X(B) {
      var G = !B || B === x ? I : B.canvas || B, v = M.get(G);
      if (v === void 0) {
        C = !0;
        var b = null;
        try {
          var T = [
            97,
            106,
            97,
            61,
            99,
            137,
            118,
            80,
            80,
            118,
            137,
            99,
            61,
            97,
            106,
            97
          ], D = y(
            4,
            4,
            "M8,8L16,8L24,24L16,24Z",
            [0, 0, 32, 32],
            24,
            1,
            B
          );
          v = D && T.length === D.length && D.every(function(_, N) {
            return _ === T[N];
          }), v || (b = "bad trial run results", console.info(T, D));
        } catch (_) {
          v = !1, b = _.message;
        }
        b && console.warn("WebGL SDF generation not supported:", b), C = !1, M.set(G, v);
      }
      return v;
    }
    var z = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      generate: y,
      generateIntoCanvas: A,
      generateIntoFramebuffer: k,
      isSupported: X
    });
    function Z(B, G, v, b, T, D) {
      T === void 0 && (T = Math.max(b[2] - b[0], b[3] - b[1]) / 2), D === void 0 && (D = 1);
      try {
        return y.apply(z, arguments);
      } catch (_) {
        return console.info("WebGL SDF generation failed, falling back to JS", _), p.apply(S, arguments);
      }
    }
    function te(B, G, v, b, T, D, _, N, E, P) {
      T === void 0 && (T = Math.max(b[2] - b[0], b[3] - b[1]) / 2), D === void 0 && (D = 1), N === void 0 && (N = 0), E === void 0 && (E = 0), P === void 0 && (P = 0);
      try {
        return A.apply(z, arguments);
      } catch (H) {
        return console.info("WebGL SDF generation failed, falling back to JS", H), g.apply(S, arguments);
      }
    }
    return t.forEachPathCommand = r, t.generate = Z, t.generateIntoCanvas = te, t.javascript = S, t.pathToLineSegments = e, t.webgl = z, t.webglUtils = h, Object.defineProperty(t, "__esModule", { value: !0 }), t;
  }({});
  return u;
}
function ea() {
  var u = function(t) {
    var d = {
      R: "13k,1a,2,3,3,2+1j,ch+16,a+1,5+2,2+n,5,a,4,6+16,4+3,h+1b,4mo,179q,2+9,2+11,2i9+7y,2+68,4,3+4,5+13,4+3,2+4k,3+29,8+cf,1t+7z,w+17,3+3m,1t+3z,16o1+5r,8+30,8+mc,29+1r,29+4v,75+73",
      EN: "1c+9,3d+1,6,187+9,513,4+5,7+9,sf+j,175h+9,qw+q,161f+1d,4xt+a,25i+9",
      ES: "17,2,6dp+1,f+1,av,16vr,mx+1,4o,2",
      ET: "z+2,3h+3,b+1,ym,3e+1,2o,p4+1,8,6u,7c,g6,1wc,1n9+4,30+1b,2n,6d,qhx+1,h0m,a+1,49+2,63+1,4+1,6bb+3,12jj",
      AN: "16o+5,2j+9,2+1,35,ed,1ff2+9,87+u",
      CS: "18,2+1,b,2u,12k,55v,l,17v0,2,3,53,2+1,b",
      B: "a,3,f+2,2v,690",
      S: "9,2,k",
      WS: "c,k,4f4,1vk+a,u,1j,335",
      ON: "x+1,4+4,h+5,r+5,r+3,z,5+3,2+1,2+1,5,2+2,3+4,o,w,ci+1,8+d,3+d,6+8,2+g,39+1,9,6+1,2,33,b8,3+1,3c+1,7+1,5r,b,7h+3,sa+5,2,3i+6,jg+3,ur+9,2v,ij+1,9g+9,7+a,8m,4+1,49+x,14u,2+2,c+2,e+2,e+2,e+1,i+n,e+e,2+p,u+2,e+2,36+1,2+3,2+1,b,2+2,6+5,2,2,2,h+1,5+4,6+3,3+f,16+2,5+3l,3+81,1y+p,2+40,q+a,m+13,2r+ch,2+9e,75+hf,3+v,2+2w,6e+5,f+6,75+2a,1a+p,2+2g,d+5x,r+b,6+3,4+o,g,6+1,6+2,2k+1,4,2j,5h+z,1m+1,1e+f,t+2,1f+e,d+3,4o+3,2s+1,w,535+1r,h3l+1i,93+2,2s,b+1,3l+x,2v,4g+3,21+3,kz+1,g5v+1,5a,j+9,n+v,2,3,2+8,2+1,3+2,2,3,46+1,4+4,h+5,r+5,r+a,3h+2,4+6,b+4,78,1r+24,4+c,4,1hb,ey+6,103+j,16j+c,1ux+7,5+g,fsh,jdq+1t,4,57+2e,p1,1m,1m,1m,1m,4kt+1,7j+17,5+2r,d+e,3+e,2+e,2+10,m+4,w,1n+5,1q,4z+5,4b+rb,9+c,4+c,4+37,d+2g,8+b,l+b,5+1j,9+9,7+13,9+t,3+1,27+3c,2+29,2+3q,d+d,3+4,4+2,6+6,a+o,8+6,a+2,e+6,16+42,2+1i",
      BN: "0+8,6+d,2s+5,2+p,e,4m9,1kt+2,2b+5,5+5,17q9+v,7k,6p+8,6+1,119d+3,440+7,96s+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+1,1ekf+75,6p+2rz,1ben+1,1ekf+1,1ekf+1",
      NSM: "lc+33,7o+6,7c+18,2,2+1,2+1,2,21+a,1d+k,h,2u+6,3+5,3+1,2+3,10,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,g+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+g,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,k1+w,2db+2,3y,2p+v,ff+3,30+1,n9x+3,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,r2,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+5,3+1,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2d+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,f0c+4,1o+6,t5,1s+3,2a,f5l+1,43t+2,i+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,gzhy+6n",
      AL: "16w,3,2,e+1b,z+2,2+2s,g+1,8+1,b+m,2+t,s+2i,c+e,4h+f,1d+1e,1bwe+dp,3+3z,x+c,2+1,35+3y,2rm+z,5+7,b+5,dt+l,c+u,17nl+27,1t+27,4x+6n,3+d",
      LRO: "6ct",
      RLO: "6cu",
      LRE: "6cq",
      RLE: "6cr",
      PDF: "6cs",
      LRI: "6ee",
      RLI: "6ef",
      FSI: "6eg",
      PDI: "6eh"
    }, c = {}, r = {};
    c.L = 1, r[1] = "L", Object.keys(d).forEach(function(j, re) {
      c[j] = 1 << re + 1, r[c[j]] = j;
    }), Object.freeze(c);
    var e = c.LRI | c.RLI | c.FSI, a = c.L | c.R | c.AL, i = c.B | c.S | c.WS | c.ON | c.FSI | c.LRI | c.RLI | c.PDI, n = c.BN | c.RLE | c.LRE | c.RLO | c.LRO | c.PDF, o = c.S | c.WS | c.B | e | c.PDI | n, s = null;
    function f() {
      if (!s) {
        s = /* @__PURE__ */ new Map();
        var j = function(q) {
          if (d.hasOwnProperty(q)) {
            var L = 0;
            d[q].split(",").forEach(function(he) {
              var K = he.split("+"), ae = K[0], Y = K[1];
              ae = parseInt(ae, 36), Y = Y ? parseInt(Y, 36) : 0, s.set(L += ae, c[q]);
              for (var be = 0; be < Y; be++)
                s.set(++L, c[q]);
            });
          }
        };
        for (var re in d) j(re);
      }
    }
    function l(j) {
      return f(), s.get(j.codePointAt(0)) || c.L;
    }
    function h(j) {
      return r[l(j)];
    }
    var p = {
      pairs: "14>1,1e>2,u>2,2wt>1,1>1,1ge>1,1wp>1,1j>1,f>1,hm>1,1>1,u>1,u6>1,1>1,+5,28>1,w>1,1>1,+3,b8>1,1>1,+3,1>3,-1>-1,3>1,1>1,+2,1s>1,1>1,x>1,th>1,1>1,+2,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,4q>1,1e>2,u>2,2>1,+1",
      canonical: "6f1>-6dx,6dy>-6dx,6ec>-6ed,6ee>-6ed,6ww>2jj,-2ji>2jj,14r4>-1e7l,1e7m>-1e7l,1e7m>-1e5c,1e5d>-1e5b,1e5c>-14qx,14qy>-14qx,14vn>-1ecg,1ech>-1ecg,1edu>-1ecg,1eci>-1ecg,1eda>-1ecg,1eci>-1ecg,1eci>-168q,168r>-168q,168s>-14ye,14yf>-14ye"
    };
    function g(j, re) {
      var q = 36, L = 0, he = /* @__PURE__ */ new Map(), K = re && /* @__PURE__ */ new Map(), ae;
      return j.split(",").forEach(function Y(be) {
        if (be.indexOf("+") !== -1)
          for (var ne = +be; ne--; )
            Y(ae);
        else {
          ae = be;
          var oe = be.split(">"), le = oe[0], de = oe[1];
          le = String.fromCodePoint(L += parseInt(le, q)), de = String.fromCodePoint(L += parseInt(de, q)), he.set(le, de), re && K.set(de, le);
        }
      }), { map: he, reverseMap: K };
    }
    var m, O, S;
    function F() {
      if (!m) {
        var j = g(p.pairs, !0), re = j.map, q = j.reverseMap;
        m = re, O = q, S = g(p.canonical, !1).map;
      }
    }
    function U(j) {
      return F(), m.get(j) || null;
    }
    function w(j) {
      return F(), O.get(j) || null;
    }
    function R(j) {
      return F(), S.get(j) || null;
    }
    var x = c.L, C = c.R, I = c.EN, M = c.ES, J = c.ET, y = c.AN, A = c.CS, k = c.B, X = c.S, z = c.ON, Z = c.BN, te = c.NSM, B = c.AL, G = c.LRO, v = c.RLO, b = c.LRE, T = c.RLE, D = c.PDF, _ = c.LRI, N = c.RLI, E = c.FSI, P = c.PDI;
    function H(j, re) {
      for (var q = 125, L = new Uint32Array(j.length), he = 0; he < j.length; he++)
        L[he] = l(j[he]);
      var K = /* @__PURE__ */ new Map();
      function ae(Le, We) {
        var Be = L[Le];
        L[Le] = We, K.set(Be, K.get(Be) - 1), Be & i && K.set(i, K.get(i) - 1), K.set(We, (K.get(We) || 0) + 1), We & i && K.set(i, (K.get(i) || 0) + 1);
      }
      for (var Y = new Uint8Array(j.length), be = /* @__PURE__ */ new Map(), ne = [], oe = null, le = 0; le < j.length; le++)
        oe || ne.push(oe = {
          start: le,
          end: j.length - 1,
          // 3.3.1 P2-P3: Determine the paragraph level
          level: re === "rtl" ? 1 : re === "ltr" ? 0 : Nt(le, !1)
        }), L[le] & k && (oe.end = le, oe = null);
      for (var de = T | b | v | G | e | P | D | k, xe = function(Le) {
        return Le + (Le & 1 ? 1 : 2);
      }, Fe = function(Le) {
        return Le + (Le & 1 ? 2 : 1);
      }, ge = 0; ge < ne.length; ge++) {
        oe = ne[ge];
        var me = [{
          _level: oe.level,
          _override: 0,
          //0=neutral, 1=L, 2=R
          _isolate: 0
          //bool
        }], fe = void 0, Ce = 0, Te = 0, Oe = 0;
        K.clear();
        for (var Se = oe.start; Se <= oe.end; Se++) {
          var ce = L[Se];
          if (fe = me[me.length - 1], K.set(ce, (K.get(ce) || 0) + 1), ce & i && K.set(i, (K.get(i) || 0) + 1), ce & de)
            if (ce & (T | b)) {
              Y[Se] = fe._level;
              var Ue = (ce === T ? Fe : xe)(fe._level);
              Ue <= q && !Ce && !Te ? me.push({
                _level: Ue,
                _override: 0,
                _isolate: 0
              }) : Ce || Te++;
            } else if (ce & (v | G)) {
              Y[Se] = fe._level;
              var Xe = (ce === v ? Fe : xe)(fe._level);
              Xe <= q && !Ce && !Te ? me.push({
                _level: Xe,
                _override: ce & v ? C : x,
                _isolate: 0
              }) : Ce || Te++;
            } else if (ce & e) {
              ce & E && (ce = Nt(Se + 1, !0) === 1 ? N : _), Y[Se] = fe._level, fe._override && ae(Se, fe._override);
              var _e = (ce === N ? Fe : xe)(fe._level);
              _e <= q && Ce === 0 && Te === 0 ? (Oe++, me.push({
                _level: _e,
                _override: 0,
                _isolate: 1,
                _isolInitIndex: Se
              })) : Ce++;
            } else if (ce & P) {
              if (Ce > 0)
                Ce--;
              else if (Oe > 0) {
                for (Te = 0; !me[me.length - 1]._isolate; )
                  me.pop();
                var ye = me[me.length - 1]._isolInitIndex;
                ye != null && (be.set(ye, Se), be.set(Se, ye)), me.pop(), Oe--;
              }
              fe = me[me.length - 1], Y[Se] = fe._level, fe._override && ae(Se, fe._override);
            } else ce & D ? (Ce === 0 && (Te > 0 ? Te-- : !fe._isolate && me.length > 1 && (me.pop(), fe = me[me.length - 1])), Y[Se] = fe._level) : ce & k && (Y[Se] = oe.level);
          else
            Y[Se] = fe._level, fe._override && ce !== Z && ae(Se, fe._override);
        }
        for (var De = [], we = null, ve = oe.start; ve <= oe.end; ve++) {
          var ke = L[ve];
          if (!(ke & n)) {
            var Ge = Y[ve], Me = ke & e, Ae = ke === P;
            we && Ge === we._level ? (we._end = ve, we._endsWithIsolInit = Me) : De.push(we = {
              _start: ve,
              _end: ve,
              _level: Ge,
              _startsWithPDI: Ae,
              _endsWithIsolInit: Me
            });
          }
        }
        for (var Ie = [], He = 0; He < De.length; He++) {
          var je = De[He];
          if (!je._startsWithPDI || je._startsWithPDI && !be.has(je._start)) {
            for (var Ye = [we = je], Qe = void 0; we && we._endsWithIsolInit && (Qe = be.get(we._end)) != null; )
              for (var Ve = He + 1; Ve < De.length; Ve++)
                if (De[Ve]._start === Qe) {
                  Ye.push(we = De[Ve]);
                  break;
                }
            for (var Re = [], Ze = 0; Ze < Ye.length; Ze++)
              for (var Ut = Ye[Ze], Vr = Ut._start; Vr <= Ut._end; Vr++)
                Re.push(Vr);
            for (var _n = Y[Re[0]], _t = oe.level, Sr = Re[0] - 1; Sr >= 0; Sr--)
              if (!(L[Sr] & n)) {
                _t = Y[Sr];
                break;
              }
            var Xr = Re[Re.length - 1], xn = Y[Xr], xt = oe.level;
            if (!(L[Xr] & e)) {
              for (var Tr = Xr + 1; Tr <= oe.end; Tr++)
                if (!(L[Tr] & n)) {
                  xt = Y[Tr];
                  break;
                }
            }
            Ie.push({
              _seqIndices: Re,
              _sosType: Math.max(_t, _n) % 2 ? C : x,
              _eosType: Math.max(xt, xn) % 2 ? C : x
            });
          }
        }
        for (var Hr = 0; Hr < Ie.length; Hr++) {
          var Yr = Ie[Hr], ie = Yr._seqIndices, fr = Yr._sosType, Sn = Yr._eosType, rr = Y[ie[0]] & 1 ? C : x;
          if (K.get(te))
            for (var wr = 0; wr < ie.length; wr++) {
              var St = ie[wr];
              if (L[St] & te) {
                for (var Jr = fr, kr = wr - 1; kr >= 0; kr--)
                  if (!(L[ie[kr]] & n)) {
                    Jr = L[ie[kr]];
                    break;
                  }
                ae(St, Jr & (e | P) ? z : Jr);
              }
            }
          if (K.get(I))
            for (var Fr = 0; Fr < ie.length; Fr++) {
              var Tt = ie[Fr];
              if (L[Tt] & I)
                for (var Cr = Fr - 1; Cr >= -1; Cr--) {
                  var wt = Cr === -1 ? fr : L[ie[Cr]];
                  if (wt & a) {
                    wt === B && ae(Tt, y);
                    break;
                  }
                }
            }
          if (K.get(B))
            for (var Kr = 0; Kr < ie.length; Kr++) {
              var kt = ie[Kr];
              L[kt] & B && ae(kt, C);
            }
          if (K.get(M) || K.get(A))
            for (var lr = 1; lr < ie.length - 1; lr++) {
              var Qr = ie[lr];
              if (L[Qr] & (M | A)) {
                for (var tr = 0, Zr = 0, qr = lr - 1; qr >= 0 && (tr = L[ie[qr]], !!(tr & n)); qr--)
                  ;
                for (var $r = lr + 1; $r < ie.length && (Zr = L[ie[$r]], !!(Zr & n)); $r++)
                  ;
                tr === Zr && (L[Qr] === M ? tr === I : tr & (I | y)) && ae(Qr, tr);
              }
            }
          if (K.get(I))
            for (var ze = 0; ze < ie.length; ze++) {
              var Tn = ie[ze];
              if (L[Tn] & I) {
                for (var Dr = ze - 1; Dr >= 0 && L[ie[Dr]] & (J | n); Dr--)
                  ae(ie[Dr], I);
                for (ze++; ze < ie.length && L[ie[ze]] & (J | n | I); ze++)
                  L[ie[ze]] !== I && ae(ie[ze], I);
              }
            }
          if (K.get(J) || K.get(M) || K.get(A))
            for (var ur = 0; ur < ie.length; ur++) {
              var Ft = ie[ur];
              if (L[Ft] & (J | M | A)) {
                ae(Ft, z);
                for (var Ar = ur - 1; Ar >= 0 && L[ie[Ar]] & n; Ar--)
                  ae(ie[Ar], z);
                for (var Er = ur + 1; Er < ie.length && L[ie[Er]] & n; Er++)
                  ae(ie[Er], z);
              }
            }
          if (K.get(I))
            for (var et = 0, Ct = fr; et < ie.length; et++) {
              var Dt = ie[et], rt = L[Dt];
              rt & I ? Ct === x && ae(Dt, x) : rt & a && (Ct = rt);
            }
          if (K.get(i)) {
            var cr = C | I | y, At = cr | x, Mr = [];
            {
              for (var nr = [], ar = 0; ar < ie.length; ar++)
                if (L[ie[ar]] & i) {
                  var hr = j[ie[ar]], Et = void 0;
                  if (U(hr) !== null)
                    if (nr.length < 63)
                      nr.push({ char: hr, seqIndex: ar });
                    else
                      break;
                  else if ((Et = w(hr)) !== null)
                    for (var dr = nr.length - 1; dr >= 0; dr--) {
                      var tt = nr[dr].char;
                      if (tt === Et || tt === w(R(hr)) || U(R(tt)) === hr) {
                        Mr.push([nr[dr].seqIndex, ar]), nr.length = dr;
                        break;
                      }
                    }
                }
              Mr.sort(function(Le, We) {
                return Le[0] - We[0];
              });
            }
            for (var nt = 0; nt < Mr.length; nt++) {
              for (var Mt = Mr[nt], Gr = Mt[0], at = Mt[1], Gt = !1, Ne = 0, ot = Gr + 1; ot < at; ot++) {
                var Rt = ie[ot];
                if (L[Rt] & At) {
                  Gt = !0;
                  var Ot = L[Rt] & cr ? C : x;
                  if (Ot === rr) {
                    Ne = Ot;
                    break;
                  }
                }
              }
              if (Gt && !Ne) {
                Ne = fr;
                for (var it = Gr - 1; it >= 0; it--) {
                  var Lt = ie[it];
                  if (L[Lt] & At) {
                    var Bt = L[Lt] & cr ? C : x;
                    Bt !== rr ? Ne = Bt : Ne = rr;
                    break;
                  }
                }
              }
              if (Ne) {
                if (L[ie[Gr]] = L[ie[at]] = Ne, Ne !== rr) {
                  for (var vr = Gr + 1; vr < ie.length; vr++)
                    if (!(L[ie[vr]] & n)) {
                      l(j[ie[vr]]) & te && (L[ie[vr]] = Ne);
                      break;
                    }
                }
                if (Ne !== rr) {
                  for (var pr = at + 1; pr < ie.length; pr++)
                    if (!(L[ie[pr]] & n)) {
                      l(j[ie[pr]]) & te && (L[ie[pr]] = Ne);
                      break;
                    }
                }
              }
            }
            for (var Je = 0; Je < ie.length; Je++)
              if (L[ie[Je]] & i) {
                for (var Pt = Je, st = Je, ft = fr, gr = Je - 1; gr >= 0; gr--)
                  if (L[ie[gr]] & n)
                    Pt = gr;
                  else {
                    ft = L[ie[gr]] & cr ? C : x;
                    break;
                  }
                for (var It = Sn, mr = Je + 1; mr < ie.length; mr++)
                  if (L[ie[mr]] & (i | n))
                    st = mr;
                  else {
                    It = L[ie[mr]] & cr ? C : x;
                    break;
                  }
                for (var lt = Pt; lt <= st; lt++)
                  L[ie[lt]] = ft === It ? ft : rr;
                Je = st;
              }
          }
        }
        for (var Pe = oe.start; Pe <= oe.end; Pe++) {
          var wn = Y[Pe], Rr = L[Pe];
          if (wn & 1 ? Rr & (x | I | y) && Y[Pe]++ : Rr & C ? Y[Pe]++ : Rr & (y | I) && (Y[Pe] += 2), Rr & n && (Y[Pe] = Pe === 0 ? oe.level : Y[Pe - 1]), Pe === oe.end || l(j[Pe]) & (X | k))
            for (var Or = Pe; Or >= 0 && l(j[Or]) & o; Or--)
              Y[Or] = oe.level;
        }
      }
      return {
        levels: Y,
        paragraphs: ne
      };
      function Nt(Le, We) {
        for (var Be = Le; Be < j.length; Be++) {
          var Ke = L[Be];
          if (Ke & (C | B))
            return 1;
          if (Ke & (k | x) || We && Ke === P)
            return 0;
          if (Ke & e) {
            var Wt = kn(Be);
            Be = Wt === -1 ? j.length : Wt;
          }
        }
        return 0;
      }
      function kn(Le) {
        for (var We = 1, Be = Le + 1; Be < j.length; Be++) {
          var Ke = L[Be];
          if (Ke & k)
            break;
          if (Ke & P) {
            if (--We === 0)
              return Be;
          } else Ke & e && We++;
        }
        return -1;
      }
    }
    var $ = "14>1,j>2,t>2,u>2,1a>g,2v3>1,1>1,1ge>1,1wd>1,b>1,1j>1,f>1,ai>3,-2>3,+1,8>1k0,-1jq>1y7,-1y6>1hf,-1he>1h6,-1h5>1ha,-1h8>1qi,-1pu>1,6>3u,-3s>7,6>1,1>1,f>1,1>1,+2,3>1,1>1,+13,4>1,1>1,6>1eo,-1ee>1,3>1mg,-1me>1mk,-1mj>1mi,-1mg>1mi,-1md>1,1>1,+2,1>10k,-103>1,1>1,4>1,5>1,1>1,+10,3>1,1>8,-7>8,+1,-6>7,+1,a>1,1>1,u>1,u6>1,1>1,+5,26>1,1>1,2>1,2>2,8>1,7>1,4>1,1>1,+5,b8>1,1>1,+3,1>3,-2>1,2>1,1>1,+2,c>1,3>1,1>1,+2,h>1,3>1,a>1,1>1,2>1,3>1,1>1,d>1,f>1,3>1,1a>1,1>1,6>1,7>1,13>1,k>1,1>1,+19,4>1,1>1,+2,2>1,1>1,+18,m>1,a>1,1>1,lk>1,1>1,4>1,2>1,f>1,3>1,1>1,+3,db>1,1>1,+3,3>1,1>1,+2,14qm>1,1>1,+1,6>1,4j>1,j>2,t>2,u>2,2>1,+1", V;
    function W() {
      if (!V) {
        var j = g($, !0), re = j.map, q = j.reverseMap;
        q.forEach(function(L, he) {
          re.set(he, L);
        }), V = re;
      }
    }
    function pe(j) {
      return W(), V.get(j) || null;
    }
    function ue(j, re, q, L) {
      var he = j.length;
      q = Math.max(0, q == null ? 0 : +q), L = Math.min(he - 1, L == null ? he - 1 : +L);
      for (var K = /* @__PURE__ */ new Map(), ae = q; ae <= L; ae++)
        if (re[ae] & 1) {
          var Y = pe(j[ae]);
          Y !== null && K.set(ae, Y);
        }
      return K;
    }
    function Q(j, re, q, L) {
      var he = j.length;
      q = Math.max(0, q == null ? 0 : +q), L = Math.min(he - 1, L == null ? he - 1 : +L);
      var K = [];
      return re.paragraphs.forEach(function(ae) {
        var Y = Math.max(q, ae.start), be = Math.min(L, ae.end);
        if (Y < be) {
          for (var ne = re.levels.slice(Y, be + 1), oe = be; oe >= Y && l(j[oe]) & o; oe--)
            ne[oe] = ae.level;
          for (var le = ae.level, de = 1 / 0, xe = 0; xe < ne.length; xe++) {
            var Fe = ne[xe];
            Fe > le && (le = Fe), Fe < de && (de = Fe | 1);
          }
          for (var ge = le; ge >= de; ge--)
            for (var me = 0; me < ne.length; me++)
              if (ne[me] >= ge) {
                for (var fe = me; me + 1 < ne.length && ne[me + 1] >= ge; )
                  me++;
                me > fe && K.push([fe + Y, me + Y]);
              }
        }
      }), K;
    }
    function ee(j, re, q, L) {
      var he = se(j, re, q, L), K = [].concat(j);
      return he.forEach(function(ae, Y) {
        K[Y] = (re.levels[ae] & 1 ? pe(j[ae]) : null) || j[ae];
      }), K.join("");
    }
    function se(j, re, q, L) {
      for (var he = Q(j, re, q, L), K = [], ae = 0; ae < j.length; ae++)
        K[ae] = ae;
      return he.forEach(function(Y) {
        for (var be = Y[0], ne = Y[1], oe = K.slice(be, ne + 1), le = oe.length; le--; )
          K[ne - le] = oe[le];
      }), K;
    }
    return t.closingToOpeningBracket = w, t.getBidiCharType = l, t.getBidiCharTypeName = h, t.getCanonicalBracket = R, t.getEmbeddingLevels = H, t.getMirroredCharacter = pe, t.getMirroredCharactersMap = ue, t.getReorderSegments = Q, t.getReorderedIndices = se, t.getReorderedString = ee, t.openingToClosingBracket = U, Object.defineProperty(t, "__esModule", { value: !0 }), t;
  }({});
  return u;
}
const cn = /\bvoid\s+main\s*\(\s*\)\s*{/g;
function vt(u) {
  const t = /^[ \t]*#include +<([\w\d./]+)>/gm;
  function d(c, r) {
    let e = Gn[r];
    return e ? vt(e) : c;
  }
  return u.replace(t, d);
}
const Ee = [];
for (let u = 0; u < 256; u++)
  Ee[u] = (u < 16 ? "0" : "") + u.toString(16);
function ra() {
  const u = Math.random() * 4294967295 | 0, t = Math.random() * 4294967295 | 0, d = Math.random() * 4294967295 | 0, c = Math.random() * 4294967295 | 0;
  return (Ee[u & 255] + Ee[u >> 8 & 255] + Ee[u >> 16 & 255] + Ee[u >> 24 & 255] + "-" + Ee[t & 255] + Ee[t >> 8 & 255] + "-" + Ee[t >> 16 & 15 | 64] + Ee[t >> 24 & 255] + "-" + Ee[d & 63 | 128] + Ee[d >> 8 & 255] + "-" + Ee[d >> 16 & 255] + Ee[d >> 24 & 255] + Ee[c & 255] + Ee[c >> 8 & 255] + Ee[c >> 16 & 255] + Ee[c >> 24 & 255]).toUpperCase();
}
const $e = Object.assign || function() {
  let u = arguments[0];
  for (let t = 1, d = arguments.length; t < d; t++) {
    let c = arguments[t];
    if (c)
      for (let r in c)
        Object.prototype.hasOwnProperty.call(c, r) && (u[r] = c[r]);
  }
  return u;
}, ta = Date.now(), Jt = /* @__PURE__ */ new WeakMap(), Kt = /* @__PURE__ */ new Map();
let na = 1e10;
function pt(u, t) {
  const d = sa(t);
  let c = Jt.get(u);
  if (c || Jt.set(u, c = /* @__PURE__ */ Object.create(null)), c[d])
    return new c[d]();
  const r = `_onBeforeCompile${d}`, e = function(o, s) {
    u.onBeforeCompile.call(this, o, s);
    const f = this.customProgramCacheKey() + "|" + o.vertexShader + "|" + o.fragmentShader;
    let l = Kt[f];
    if (!l) {
      const h = aa(this, o, t, d);
      l = Kt[f] = h;
    }
    o.vertexShader = l.vertexShader, o.fragmentShader = l.fragmentShader, $e(o.uniforms, this.uniforms), t.timeUniform && (o.uniforms[t.timeUniform] = {
      get value() {
        return Date.now() - ta;
      }
    }), this[r] && this[r](o);
  }, a = function() {
    return i(t.chained ? u : u.clone());
  }, i = function(o) {
    const s = Object.create(o, n);
    return Object.defineProperty(s, "baseMaterial", { value: u }), Object.defineProperty(s, "id", { value: na++ }), s.uuid = ra(), s.uniforms = $e({}, o.uniforms, t.uniforms), s.defines = $e({}, o.defines, t.defines), s.defines[`TROIKA_DERIVED_MATERIAL_${d}`] = "", s.extensions = $e({}, o.extensions, t.extensions), s._listeners = void 0, s;
  }, n = {
    constructor: { value: a },
    isDerivedMaterial: { value: !0 },
    type: {
      get: () => u.type,
      set: (o) => {
        u.type = o;
      }
    },
    isDerivedFrom: {
      writable: !0,
      configurable: !0,
      value: function(o) {
        const s = this.baseMaterial;
        return o === s || s.isDerivedMaterial && s.isDerivedFrom(o) || !1;
      }
    },
    customProgramCacheKey: {
      writable: !0,
      configurable: !0,
      value: function() {
        return u.customProgramCacheKey() + "|" + d;
      }
    },
    onBeforeCompile: {
      get() {
        return e;
      },
      set(o) {
        this[r] = o;
      }
    },
    copy: {
      writable: !0,
      configurable: !0,
      value: function(o) {
        return u.copy.call(this, o), !u.isShaderMaterial && !u.isDerivedMaterial && ($e(this.extensions, o.extensions), $e(this.defines, o.defines), $e(this.uniforms, Mn.clone(o.uniforms))), this;
      }
    },
    clone: {
      writable: !0,
      configurable: !0,
      value: function() {
        const o = new u.constructor();
        return i(o).copy(this);
      }
    },
    /**
     * Utility to get a MeshDepthMaterial that will honor this derived material's vertex
     * transformations and discarded fragments.
     */
    getDepthMaterial: {
      writable: !0,
      configurable: !0,
      value: function() {
        let o = this._depthMaterial;
        return o || (o = this._depthMaterial = pt(
          u.isDerivedMaterial ? u.getDepthMaterial() : new An({ depthPacking: En }),
          t
        ), o.defines.IS_DEPTH_MATERIAL = "", o.uniforms = this.uniforms), o;
      }
    },
    /**
     * Utility to get a MeshDistanceMaterial that will honor this derived material's vertex
     * transformations and discarded fragments.
     */
    getDistanceMaterial: {
      writable: !0,
      configurable: !0,
      value: function() {
        let o = this._distanceMaterial;
        return o || (o = this._distanceMaterial = pt(
          u.isDerivedMaterial ? u.getDistanceMaterial() : new Dn(),
          t
        ), o.defines.IS_DISTANCE_MATERIAL = "", o.uniforms = this.uniforms), o;
      }
    },
    dispose: {
      writable: !0,
      configurable: !0,
      value() {
        const { _depthMaterial: o, _distanceMaterial: s } = this;
        o && o.dispose(), s && s.dispose(), u.dispose.call(this);
      }
    }
  };
  return c[d] = a, new a();
}
function aa(u, { vertexShader: t, fragmentShader: d }, c, r) {
  let {
    vertexDefs: e,
    vertexMainIntro: a,
    vertexMainOutro: i,
    vertexTransform: n,
    fragmentDefs: o,
    fragmentMainIntro: s,
    fragmentMainOutro: f,
    fragmentColorTransform: l,
    customRewriter: h,
    timeUniform: p
  } = c;
  if (e = e || "", a = a || "", i = i || "", o = o || "", s = s || "", f = f || "", (n || h) && (t = vt(t)), (l || h) && (d = d.replace(
    /^[ \t]*#include <((?:tonemapping|encodings|colorspace|fog|premultiplied_alpha|dithering)_fragment)>/gm,
    `
//!BEGIN_POST_CHUNK $1
$&
//!END_POST_CHUNK
`
  ), d = vt(d)), h) {
    let g = h({ vertexShader: t, fragmentShader: d });
    t = g.vertexShader, d = g.fragmentShader;
  }
  if (l) {
    let g = [];
    d = d.replace(
      /^\/\/!BEGIN_POST_CHUNK[^]+?^\/\/!END_POST_CHUNK/gm,
      // [^]+? = non-greedy match of any chars including newlines
      (m) => (g.push(m), "")
    ), f = `${l}
${g.join(`
`)}
${f}`;
  }
  if (p) {
    const g = `
uniform float ${p};
`;
    e = g + e, o = g + o;
  }
  return n && (t = `vec3 troika_position_${r};
vec3 troika_normal_${r};
vec2 troika_uv_${r};
${t}
`, e = `${e}
void troikaVertexTransform${r}(inout vec3 position, inout vec3 normal, inout vec2 uv) {
  ${n}
}
`, a = `
troika_position_${r} = vec3(position);
troika_normal_${r} = vec3(normal);
troika_uv_${r} = vec2(uv);
troikaVertexTransform${r}(troika_position_${r}, troika_normal_${r}, troika_uv_${r});
${a}
`, t = t.replace(/\b(position|normal|uv)\b/g, (g, m, O, S) => /\battribute\s+vec[23]\s+$/.test(S.substr(0, O)) ? m : `troika_${m}_${r}`), u.map && u.map.channel > 0 || (t = t.replace(/\bMAP_UV\b/g, `troika_uv_${r}`))), t = Qt(t, r, e, a, i), d = Qt(d, r, o, s, f), {
    vertexShader: t,
    fragmentShader: d
  };
}
function Qt(u, t, d, c, r) {
  return (c || r || d) && (u = u.replace(
    cn,
    `
${d}
void troikaOrigMain${t}() {`
  ), u += `
void main() {
  ${c}
  troikaOrigMain${t}();
  ${r}
}`), u;
}
function oa(u, t) {
  return u === "uniforms" ? void 0 : typeof t == "function" ? t.toString() : t;
}
let ia = 0;
const Zt = /* @__PURE__ */ new Map();
function sa(u) {
  const t = JSON.stringify(u, oa);
  let d = Zt.get(t);
  return d == null && Zt.set(t, d = ++ia), d;
}
/*!
Custom build of Typr.ts (https://github.com/fredli74/Typr.ts) for use in Troika text rendering.
Original MIT license applies: https://github.com/fredli74/Typr.ts/blob/master/LICENSE
*/
function fa() {
  return typeof window > "u" && (self.window = self), function(u) {
    var t = { parse: function(r) {
      var e = t._bin, a = new Uint8Array(r);
      if (e.readASCII(a, 0, 4) == "ttcf") {
        var i = 4;
        e.readUshort(a, i), i += 2, e.readUshort(a, i), i += 2;
        var n = e.readUint(a, i);
        i += 4;
        for (var o = [], s = 0; s < n; s++) {
          var f = e.readUint(a, i);
          i += 4, o.push(t._readFont(a, f));
        }
        return o;
      }
      return [t._readFont(a, 0)];
    }, _readFont: function(r, e) {
      var a = t._bin, i = e;
      a.readFixed(r, e), e += 4;
      var n = a.readUshort(r, e);
      e += 2, a.readUshort(r, e), e += 2, a.readUshort(r, e), e += 2, a.readUshort(r, e), e += 2;
      for (var o = ["cmap", "head", "hhea", "maxp", "hmtx", "name", "OS/2", "post", "loca", "glyf", "kern", "CFF ", "GDEF", "GPOS", "GSUB", "SVG "], s = { _data: r, _offset: i }, f = {}, l = 0; l < n; l++) {
        var h = a.readASCII(r, e, 4);
        e += 4, a.readUint(r, e), e += 4;
        var p = a.readUint(r, e);
        e += 4;
        var g = a.readUint(r, e);
        e += 4, f[h] = { offset: p, length: g };
      }
      for (l = 0; l < o.length; l++) {
        var m = o[l];
        f[m] && (s[m.trim()] = t[m.trim()].parse(r, f[m].offset, f[m].length, s));
      }
      return s;
    }, _tabOffset: function(r, e, a) {
      for (var i = t._bin, n = i.readUshort(r, a + 4), o = a + 12, s = 0; s < n; s++) {
        var f = i.readASCII(r, o, 4);
        o += 4, i.readUint(r, o), o += 4;
        var l = i.readUint(r, o);
        if (o += 4, i.readUint(r, o), o += 4, f == e) return l;
      }
      return 0;
    } };
    t._bin = { readFixed: function(r, e) {
      return (r[e] << 8 | r[e + 1]) + (r[e + 2] << 8 | r[e + 3]) / 65540;
    }, readF2dot14: function(r, e) {
      return t._bin.readShort(r, e) / 16384;
    }, readInt: function(r, e) {
      return t._bin._view(r).getInt32(e);
    }, readInt8: function(r, e) {
      return t._bin._view(r).getInt8(e);
    }, readShort: function(r, e) {
      return t._bin._view(r).getInt16(e);
    }, readUshort: function(r, e) {
      return t._bin._view(r).getUint16(e);
    }, readUshorts: function(r, e, a) {
      for (var i = [], n = 0; n < a; n++) i.push(t._bin.readUshort(r, e + 2 * n));
      return i;
    }, readUint: function(r, e) {
      return t._bin._view(r).getUint32(e);
    }, readUint64: function(r, e) {
      return 4294967296 * t._bin.readUint(r, e) + t._bin.readUint(r, e + 4);
    }, readASCII: function(r, e, a) {
      for (var i = "", n = 0; n < a; n++) i += String.fromCharCode(r[e + n]);
      return i;
    }, readUnicode: function(r, e, a) {
      for (var i = "", n = 0; n < a; n++) {
        var o = r[e++] << 8 | r[e++];
        i += String.fromCharCode(o);
      }
      return i;
    }, _tdec: typeof window < "u" && window.TextDecoder ? new window.TextDecoder() : null, readUTF8: function(r, e, a) {
      var i = t._bin._tdec;
      return i && e == 0 && a == r.length ? i.decode(r) : t._bin.readASCII(r, e, a);
    }, readBytes: function(r, e, a) {
      for (var i = [], n = 0; n < a; n++) i.push(r[e + n]);
      return i;
    }, readASCIIArray: function(r, e, a) {
      for (var i = [], n = 0; n < a; n++) i.push(String.fromCharCode(r[e + n]));
      return i;
    }, _view: function(r) {
      return r._dataView || (r._dataView = r.buffer ? new DataView(r.buffer, r.byteOffset, r.byteLength) : new DataView(new Uint8Array(r).buffer));
    } }, t._lctf = {}, t._lctf.parse = function(r, e, a, i, n) {
      var o = t._bin, s = {}, f = e;
      o.readFixed(r, e), e += 4;
      var l = o.readUshort(r, e);
      e += 2;
      var h = o.readUshort(r, e);
      e += 2;
      var p = o.readUshort(r, e);
      return e += 2, s.scriptList = t._lctf.readScriptList(r, f + l), s.featureList = t._lctf.readFeatureList(r, f + h), s.lookupList = t._lctf.readLookupList(r, f + p, n), s;
    }, t._lctf.readLookupList = function(r, e, a) {
      var i = t._bin, n = e, o = [], s = i.readUshort(r, e);
      e += 2;
      for (var f = 0; f < s; f++) {
        var l = i.readUshort(r, e);
        e += 2;
        var h = t._lctf.readLookupTable(r, n + l, a);
        o.push(h);
      }
      return o;
    }, t._lctf.readLookupTable = function(r, e, a) {
      var i = t._bin, n = e, o = { tabs: [] };
      o.ltype = i.readUshort(r, e), e += 2, o.flag = i.readUshort(r, e), e += 2;
      var s = i.readUshort(r, e);
      e += 2;
      for (var f = o.ltype, l = 0; l < s; l++) {
        var h = i.readUshort(r, e);
        e += 2;
        var p = a(r, f, n + h, o);
        o.tabs.push(p);
      }
      return o;
    }, t._lctf.numOfOnes = function(r) {
      for (var e = 0, a = 0; a < 32; a++) r >>> a & 1 && e++;
      return e;
    }, t._lctf.readClassDef = function(r, e) {
      var a = t._bin, i = [], n = a.readUshort(r, e);
      if (e += 2, n == 1) {
        var o = a.readUshort(r, e);
        e += 2;
        var s = a.readUshort(r, e);
        e += 2;
        for (var f = 0; f < s; f++) i.push(o + f), i.push(o + f), i.push(a.readUshort(r, e)), e += 2;
      }
      if (n == 2) {
        var l = a.readUshort(r, e);
        for (e += 2, f = 0; f < l; f++) i.push(a.readUshort(r, e)), e += 2, i.push(a.readUshort(r, e)), e += 2, i.push(a.readUshort(r, e)), e += 2;
      }
      return i;
    }, t._lctf.getInterval = function(r, e) {
      for (var a = 0; a < r.length; a += 3) {
        var i = r[a], n = r[a + 1];
        if (r[a + 2], i <= e && e <= n) return a;
      }
      return -1;
    }, t._lctf.readCoverage = function(r, e) {
      var a = t._bin, i = {};
      i.fmt = a.readUshort(r, e), e += 2;
      var n = a.readUshort(r, e);
      return e += 2, i.fmt == 1 && (i.tab = a.readUshorts(r, e, n)), i.fmt == 2 && (i.tab = a.readUshorts(r, e, 3 * n)), i;
    }, t._lctf.coverageIndex = function(r, e) {
      var a = r.tab;
      if (r.fmt == 1) return a.indexOf(e);
      if (r.fmt == 2) {
        var i = t._lctf.getInterval(a, e);
        if (i != -1) return a[i + 2] + (e - a[i]);
      }
      return -1;
    }, t._lctf.readFeatureList = function(r, e) {
      var a = t._bin, i = e, n = [], o = a.readUshort(r, e);
      e += 2;
      for (var s = 0; s < o; s++) {
        var f = a.readASCII(r, e, 4);
        e += 4;
        var l = a.readUshort(r, e);
        e += 2;
        var h = t._lctf.readFeatureTable(r, i + l);
        h.tag = f.trim(), n.push(h);
      }
      return n;
    }, t._lctf.readFeatureTable = function(r, e) {
      var a = t._bin, i = e, n = {}, o = a.readUshort(r, e);
      e += 2, o > 0 && (n.featureParams = i + o);
      var s = a.readUshort(r, e);
      e += 2, n.tab = [];
      for (var f = 0; f < s; f++) n.tab.push(a.readUshort(r, e + 2 * f));
      return n;
    }, t._lctf.readScriptList = function(r, e) {
      var a = t._bin, i = e, n = {}, o = a.readUshort(r, e);
      e += 2;
      for (var s = 0; s < o; s++) {
        var f = a.readASCII(r, e, 4);
        e += 4;
        var l = a.readUshort(r, e);
        e += 2, n[f.trim()] = t._lctf.readScriptTable(r, i + l);
      }
      return n;
    }, t._lctf.readScriptTable = function(r, e) {
      var a = t._bin, i = e, n = {}, o = a.readUshort(r, e);
      e += 2, o > 0 && (n.default = t._lctf.readLangSysTable(r, i + o));
      var s = a.readUshort(r, e);
      e += 2;
      for (var f = 0; f < s; f++) {
        var l = a.readASCII(r, e, 4);
        e += 4;
        var h = a.readUshort(r, e);
        e += 2, n[l.trim()] = t._lctf.readLangSysTable(r, i + h);
      }
      return n;
    }, t._lctf.readLangSysTable = function(r, e) {
      var a = t._bin, i = {};
      a.readUshort(r, e), e += 2, i.reqFeature = a.readUshort(r, e), e += 2;
      var n = a.readUshort(r, e);
      return e += 2, i.features = a.readUshorts(r, e, n), i;
    }, t.CFF = {}, t.CFF.parse = function(r, e, a) {
      var i = t._bin;
      (r = new Uint8Array(r.buffer, e, a))[e = 0], r[++e], r[++e], r[++e], e++;
      var n = [];
      e = t.CFF.readIndex(r, e, n);
      for (var o = [], s = 0; s < n.length - 1; s++) o.push(i.readASCII(r, e + n[s], n[s + 1] - n[s]));
      e += n[n.length - 1];
      var f = [];
      e = t.CFF.readIndex(r, e, f);
      var l = [];
      for (s = 0; s < f.length - 1; s++) l.push(t.CFF.readDict(r, e + f[s], e + f[s + 1]));
      e += f[f.length - 1];
      var h = l[0], p = [];
      e = t.CFF.readIndex(r, e, p);
      var g = [];
      for (s = 0; s < p.length - 1; s++) g.push(i.readASCII(r, e + p[s], p[s + 1] - p[s]));
      if (e += p[p.length - 1], t.CFF.readSubrs(r, e, h), h.CharStrings) {
        e = h.CharStrings, p = [], e = t.CFF.readIndex(r, e, p);
        var m = [];
        for (s = 0; s < p.length - 1; s++) m.push(i.readBytes(r, e + p[s], p[s + 1] - p[s]));
        h.CharStrings = m;
      }
      if (h.ROS) {
        e = h.FDArray;
        var O = [];
        for (e = t.CFF.readIndex(r, e, O), h.FDArray = [], s = 0; s < O.length - 1; s++) {
          var S = t.CFF.readDict(r, e + O[s], e + O[s + 1]);
          t.CFF._readFDict(r, S, g), h.FDArray.push(S);
        }
        e += O[O.length - 1], e = h.FDSelect, h.FDSelect = [];
        var F = r[e];
        if (e++, F != 3) throw F;
        var U = i.readUshort(r, e);
        for (e += 2, s = 0; s < U + 1; s++) h.FDSelect.push(i.readUshort(r, e), r[e + 2]), e += 3;
      }
      return h.Encoding && (h.Encoding = t.CFF.readEncoding(r, h.Encoding, h.CharStrings.length)), h.charset && (h.charset = t.CFF.readCharset(r, h.charset, h.CharStrings.length)), t.CFF._readFDict(r, h, g), h;
    }, t.CFF._readFDict = function(r, e, a) {
      var i;
      for (var n in e.Private && (i = e.Private[1], e.Private = t.CFF.readDict(r, i, i + e.Private[0]), e.Private.Subrs && t.CFF.readSubrs(r, i + e.Private.Subrs, e.Private)), e) ["FamilyName", "FontName", "FullName", "Notice", "version", "Copyright"].indexOf(n) != -1 && (e[n] = a[e[n] - 426 + 35]);
    }, t.CFF.readSubrs = function(r, e, a) {
      var i = t._bin, n = [];
      e = t.CFF.readIndex(r, e, n);
      var o, s = n.length;
      o = s < 1240 ? 107 : s < 33900 ? 1131 : 32768, a.Bias = o, a.Subrs = [];
      for (var f = 0; f < n.length - 1; f++) a.Subrs.push(i.readBytes(r, e + n[f], n[f + 1] - n[f]));
    }, t.CFF.tableSE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 0, 111, 112, 113, 114, 0, 115, 116, 117, 118, 119, 120, 121, 122, 0, 123, 0, 124, 125, 126, 127, 128, 129, 130, 131, 0, 132, 133, 0, 134, 135, 136, 137, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 138, 0, 139, 0, 0, 0, 0, 140, 141, 142, 143, 0, 0, 0, 0, 0, 144, 0, 0, 0, 145, 0, 0, 146, 147, 148, 149, 0, 0, 0, 0], t.CFF.glyphByUnicode = function(r, e) {
      for (var a = 0; a < r.charset.length; a++) if (r.charset[a] == e) return a;
      return -1;
    }, t.CFF.glyphBySE = function(r, e) {
      return e < 0 || e > 255 ? -1 : t.CFF.glyphByUnicode(r, t.CFF.tableSE[e]);
    }, t.CFF.readEncoding = function(r, e, a) {
      t._bin;
      var i = [".notdef"], n = r[e];
      if (e++, n != 0) throw "error: unknown encoding format: " + n;
      var o = r[e];
      e++;
      for (var s = 0; s < o; s++) i.push(r[e + s]);
      return i;
    }, t.CFF.readCharset = function(r, e, a) {
      var i = t._bin, n = [".notdef"], o = r[e];
      if (e++, o == 0) for (var s = 0; s < a; s++) {
        var f = i.readUshort(r, e);
        e += 2, n.push(f);
      }
      else {
        if (o != 1 && o != 2) throw "error: format: " + o;
        for (; n.length < a; ) {
          f = i.readUshort(r, e), e += 2;
          var l = 0;
          for (o == 1 ? (l = r[e], e++) : (l = i.readUshort(r, e), e += 2), s = 0; s <= l; s++) n.push(f), f++;
        }
      }
      return n;
    }, t.CFF.readIndex = function(r, e, a) {
      var i = t._bin, n = i.readUshort(r, e) + 1, o = r[e += 2];
      if (e++, o == 1) for (var s = 0; s < n; s++) a.push(r[e + s]);
      else if (o == 2) for (s = 0; s < n; s++) a.push(i.readUshort(r, e + 2 * s));
      else if (o == 3) for (s = 0; s < n; s++) a.push(16777215 & i.readUint(r, e + 3 * s - 1));
      else if (n != 1) throw "unsupported offset size: " + o + ", count: " + n;
      return (e += n * o) - 1;
    }, t.CFF.getCharString = function(r, e, a) {
      var i = t._bin, n = r[e], o = r[e + 1];
      r[e + 2], r[e + 3], r[e + 4];
      var s = 1, f = null, l = null;
      n <= 20 && (f = n, s = 1), n == 12 && (f = 100 * n + o, s = 2), 21 <= n && n <= 27 && (f = n, s = 1), n == 28 && (l = i.readShort(r, e + 1), s = 3), 29 <= n && n <= 31 && (f = n, s = 1), 32 <= n && n <= 246 && (l = n - 139, s = 1), 247 <= n && n <= 250 && (l = 256 * (n - 247) + o + 108, s = 2), 251 <= n && n <= 254 && (l = 256 * -(n - 251) - o - 108, s = 2), n == 255 && (l = i.readInt(r, e + 1) / 65535, s = 5), a.val = l ?? "o" + f, a.size = s;
    }, t.CFF.readCharString = function(r, e, a) {
      for (var i = e + a, n = t._bin, o = []; e < i; ) {
        var s = r[e], f = r[e + 1];
        r[e + 2], r[e + 3], r[e + 4];
        var l = 1, h = null, p = null;
        s <= 20 && (h = s, l = 1), s == 12 && (h = 100 * s + f, l = 2), s != 19 && s != 20 || (h = s, l = 2), 21 <= s && s <= 27 && (h = s, l = 1), s == 28 && (p = n.readShort(r, e + 1), l = 3), 29 <= s && s <= 31 && (h = s, l = 1), 32 <= s && s <= 246 && (p = s - 139, l = 1), 247 <= s && s <= 250 && (p = 256 * (s - 247) + f + 108, l = 2), 251 <= s && s <= 254 && (p = 256 * -(s - 251) - f - 108, l = 2), s == 255 && (p = n.readInt(r, e + 1) / 65535, l = 5), o.push(p ?? "o" + h), e += l;
      }
      return o;
    }, t.CFF.readDict = function(r, e, a) {
      for (var i = t._bin, n = {}, o = []; e < a; ) {
        var s = r[e], f = r[e + 1];
        r[e + 2], r[e + 3], r[e + 4];
        var l = 1, h = null, p = null;
        if (s == 28 && (p = i.readShort(r, e + 1), l = 3), s == 29 && (p = i.readInt(r, e + 1), l = 5), 32 <= s && s <= 246 && (p = s - 139, l = 1), 247 <= s && s <= 250 && (p = 256 * (s - 247) + f + 108, l = 2), 251 <= s && s <= 254 && (p = 256 * -(s - 251) - f - 108, l = 2), s == 255) throw p = i.readInt(r, e + 1) / 65535, l = 5, "unknown number";
        if (s == 30) {
          var g = [];
          for (l = 1; ; ) {
            var m = r[e + l];
            l++;
            var O = m >> 4, S = 15 & m;
            if (O != 15 && g.push(O), S != 15 && g.push(S), S == 15) break;
          }
          for (var F = "", U = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ".", "e", "e-", "reserved", "-", "endOfNumber"], w = 0; w < g.length; w++) F += U[g[w]];
          p = parseFloat(F);
        }
        s <= 21 && (h = ["version", "Notice", "FullName", "FamilyName", "Weight", "FontBBox", "BlueValues", "OtherBlues", "FamilyBlues", "FamilyOtherBlues", "StdHW", "StdVW", "escape", "UniqueID", "XUID", "charset", "Encoding", "CharStrings", "Private", "Subrs", "defaultWidthX", "nominalWidthX"][s], l = 1, s == 12 && (h = ["Copyright", "isFixedPitch", "ItalicAngle", "UnderlinePosition", "UnderlineThickness", "PaintType", "CharstringType", "FontMatrix", "StrokeWidth", "BlueScale", "BlueShift", "BlueFuzz", "StemSnapH", "StemSnapV", "ForceBold", 0, 0, "LanguageGroup", "ExpansionFactor", "initialRandomSeed", "SyntheticBase", "PostScript", "BaseFontName", "BaseFontBlend", 0, 0, 0, 0, 0, 0, "ROS", "CIDFontVersion", "CIDFontRevision", "CIDFontType", "CIDCount", "UIDBase", "FDArray", "FDSelect", "FontName"][f], l = 2)), h != null ? (n[h] = o.length == 1 ? o[0] : o, o = []) : o.push(p), e += l;
      }
      return n;
    }, t.cmap = {}, t.cmap.parse = function(r, e, a) {
      r = new Uint8Array(r.buffer, e, a), e = 0;
      var i = t._bin, n = {};
      i.readUshort(r, e), e += 2;
      var o = i.readUshort(r, e);
      e += 2;
      var s = [];
      n.tables = [];
      for (var f = 0; f < o; f++) {
        var l = i.readUshort(r, e);
        e += 2;
        var h = i.readUshort(r, e);
        e += 2;
        var p = i.readUint(r, e);
        e += 4;
        var g = "p" + l + "e" + h, m = s.indexOf(p);
        if (m == -1) {
          var O;
          m = n.tables.length, s.push(p);
          var S = i.readUshort(r, p);
          S == 0 ? O = t.cmap.parse0(r, p) : S == 4 ? O = t.cmap.parse4(r, p) : S == 6 ? O = t.cmap.parse6(r, p) : S == 12 ? O = t.cmap.parse12(r, p) : console.debug("unknown format: " + S, l, h, p), n.tables.push(O);
        }
        if (n[g] != null) throw "multiple tables for one platform+encoding";
        n[g] = m;
      }
      return n;
    }, t.cmap.parse0 = function(r, e) {
      var a = t._bin, i = {};
      i.format = a.readUshort(r, e), e += 2;
      var n = a.readUshort(r, e);
      e += 2, a.readUshort(r, e), e += 2, i.map = [];
      for (var o = 0; o < n - 6; o++) i.map.push(r[e + o]);
      return i;
    }, t.cmap.parse4 = function(r, e) {
      var a = t._bin, i = e, n = {};
      n.format = a.readUshort(r, e), e += 2;
      var o = a.readUshort(r, e);
      e += 2, a.readUshort(r, e), e += 2;
      var s = a.readUshort(r, e);
      e += 2;
      var f = s / 2;
      n.searchRange = a.readUshort(r, e), e += 2, n.entrySelector = a.readUshort(r, e), e += 2, n.rangeShift = a.readUshort(r, e), e += 2, n.endCount = a.readUshorts(r, e, f), e += 2 * f, e += 2, n.startCount = a.readUshorts(r, e, f), e += 2 * f, n.idDelta = [];
      for (var l = 0; l < f; l++) n.idDelta.push(a.readShort(r, e)), e += 2;
      for (n.idRangeOffset = a.readUshorts(r, e, f), e += 2 * f, n.glyphIdArray = []; e < i + o; ) n.glyphIdArray.push(a.readUshort(r, e)), e += 2;
      return n;
    }, t.cmap.parse6 = function(r, e) {
      var a = t._bin, i = {};
      i.format = a.readUshort(r, e), e += 2, a.readUshort(r, e), e += 2, a.readUshort(r, e), e += 2, i.firstCode = a.readUshort(r, e), e += 2;
      var n = a.readUshort(r, e);
      e += 2, i.glyphIdArray = [];
      for (var o = 0; o < n; o++) i.glyphIdArray.push(a.readUshort(r, e)), e += 2;
      return i;
    }, t.cmap.parse12 = function(r, e) {
      var a = t._bin, i = {};
      i.format = a.readUshort(r, e), e += 2, e += 2, a.readUint(r, e), e += 4, a.readUint(r, e), e += 4;
      var n = a.readUint(r, e);
      e += 4, i.groups = [];
      for (var o = 0; o < n; o++) {
        var s = e + 12 * o, f = a.readUint(r, s + 0), l = a.readUint(r, s + 4), h = a.readUint(r, s + 8);
        i.groups.push([f, l, h]);
      }
      return i;
    }, t.glyf = {}, t.glyf.parse = function(r, e, a, i) {
      for (var n = [], o = 0; o < i.maxp.numGlyphs; o++) n.push(null);
      return n;
    }, t.glyf._parseGlyf = function(r, e) {
      var a = t._bin, i = r._data, n = t._tabOffset(i, "glyf", r._offset) + r.loca[e];
      if (r.loca[e] == r.loca[e + 1]) return null;
      var o = {};
      if (o.noc = a.readShort(i, n), n += 2, o.xMin = a.readShort(i, n), n += 2, o.yMin = a.readShort(i, n), n += 2, o.xMax = a.readShort(i, n), n += 2, o.yMax = a.readShort(i, n), n += 2, o.xMin >= o.xMax || o.yMin >= o.yMax) return null;
      if (o.noc > 0) {
        o.endPts = [];
        for (var s = 0; s < o.noc; s++) o.endPts.push(a.readUshort(i, n)), n += 2;
        var f = a.readUshort(i, n);
        if (n += 2, i.length - n < f) return null;
        o.instructions = a.readBytes(i, n, f), n += f;
        var l = o.endPts[o.noc - 1] + 1;
        for (o.flags = [], s = 0; s < l; s++) {
          var h = i[n];
          if (n++, o.flags.push(h), (8 & h) != 0) {
            var p = i[n];
            n++;
            for (var g = 0; g < p; g++) o.flags.push(h), s++;
          }
        }
        for (o.xs = [], s = 0; s < l; s++) {
          var m = (2 & o.flags[s]) != 0, O = (16 & o.flags[s]) != 0;
          m ? (o.xs.push(O ? i[n] : -i[n]), n++) : O ? o.xs.push(0) : (o.xs.push(a.readShort(i, n)), n += 2);
        }
        for (o.ys = [], s = 0; s < l; s++)
          m = (4 & o.flags[s]) != 0, O = (32 & o.flags[s]) != 0, m ? (o.ys.push(O ? i[n] : -i[n]), n++) : O ? o.ys.push(0) : (o.ys.push(a.readShort(i, n)), n += 2);
        var S = 0, F = 0;
        for (s = 0; s < l; s++) S += o.xs[s], F += o.ys[s], o.xs[s] = S, o.ys[s] = F;
      } else {
        var U;
        o.parts = [];
        do {
          U = a.readUshort(i, n), n += 2;
          var w = { m: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 }, p1: -1, p2: -1 };
          if (o.parts.push(w), w.glyphIndex = a.readUshort(i, n), n += 2, 1 & U) {
            var R = a.readShort(i, n);
            n += 2;
            var x = a.readShort(i, n);
            n += 2;
          } else
            R = a.readInt8(i, n), n++, x = a.readInt8(i, n), n++;
          2 & U ? (w.m.tx = R, w.m.ty = x) : (w.p1 = R, w.p2 = x), 8 & U ? (w.m.a = w.m.d = a.readF2dot14(i, n), n += 2) : 64 & U ? (w.m.a = a.readF2dot14(i, n), n += 2, w.m.d = a.readF2dot14(i, n), n += 2) : 128 & U && (w.m.a = a.readF2dot14(i, n), n += 2, w.m.b = a.readF2dot14(i, n), n += 2, w.m.c = a.readF2dot14(i, n), n += 2, w.m.d = a.readF2dot14(i, n), n += 2);
        } while (32 & U);
        if (256 & U) {
          var C = a.readUshort(i, n);
          for (n += 2, o.instr = [], s = 0; s < C; s++) o.instr.push(i[n]), n++;
        }
      }
      return o;
    }, t.GDEF = {}, t.GDEF.parse = function(r, e, a, i) {
      var n = e;
      e += 4;
      var o = t._bin.readUshort(r, e);
      return { glyphClassDef: o === 0 ? null : t._lctf.readClassDef(r, n + o) };
    }, t.GPOS = {}, t.GPOS.parse = function(r, e, a, i) {
      return t._lctf.parse(r, e, a, i, t.GPOS.subt);
    }, t.GPOS.subt = function(r, e, a, i) {
      var n = t._bin, o = a, s = {};
      if (s.fmt = n.readUshort(r, a), a += 2, e == 1 || e == 2 || e == 3 || e == 7 || e == 8 && s.fmt <= 2) {
        var f = n.readUshort(r, a);
        a += 2, s.coverage = t._lctf.readCoverage(r, f + o);
      }
      if (e == 1 && s.fmt == 1) {
        var l = n.readUshort(r, a);
        a += 2, l != 0 && (s.pos = t.GPOS.readValueRecord(r, a, l));
      } else if (e == 2 && s.fmt >= 1 && s.fmt <= 2) {
        l = n.readUshort(r, a), a += 2;
        var h = n.readUshort(r, a);
        a += 2;
        var p = t._lctf.numOfOnes(l), g = t._lctf.numOfOnes(h);
        if (s.fmt == 1) {
          s.pairsets = [];
          var m = n.readUshort(r, a);
          a += 2;
          for (var O = 0; O < m; O++) {
            var S = o + n.readUshort(r, a);
            a += 2;
            var F = n.readUshort(r, S);
            S += 2;
            for (var U = [], w = 0; w < F; w++) {
              var R = n.readUshort(r, S);
              S += 2, l != 0 && (y = t.GPOS.readValueRecord(r, S, l), S += 2 * p), h != 0 && (A = t.GPOS.readValueRecord(r, S, h), S += 2 * g), U.push({ gid2: R, val1: y, val2: A });
            }
            s.pairsets.push(U);
          }
        }
        if (s.fmt == 2) {
          var x = n.readUshort(r, a);
          a += 2;
          var C = n.readUshort(r, a);
          a += 2;
          var I = n.readUshort(r, a);
          a += 2;
          var M = n.readUshort(r, a);
          for (a += 2, s.classDef1 = t._lctf.readClassDef(r, o + x), s.classDef2 = t._lctf.readClassDef(r, o + C), s.matrix = [], O = 0; O < I; O++) {
            var J = [];
            for (w = 0; w < M; w++) {
              var y = null, A = null;
              l != 0 && (y = t.GPOS.readValueRecord(r, a, l), a += 2 * p), h != 0 && (A = t.GPOS.readValueRecord(r, a, h), a += 2 * g), J.push({ val1: y, val2: A });
            }
            s.matrix.push(J);
          }
        }
      } else if (e == 4 && s.fmt == 1) s.markCoverage = t._lctf.readCoverage(r, n.readUshort(r, a) + o), s.baseCoverage = t._lctf.readCoverage(r, n.readUshort(r, a + 2) + o), s.markClassCount = n.readUshort(r, a + 4), s.markArray = t.GPOS.readMarkArray(r, n.readUshort(r, a + 6) + o), s.baseArray = t.GPOS.readBaseArray(r, n.readUshort(r, a + 8) + o, s.markClassCount);
      else if (e == 6 && s.fmt == 1) s.mark1Coverage = t._lctf.readCoverage(r, n.readUshort(r, a) + o), s.mark2Coverage = t._lctf.readCoverage(r, n.readUshort(r, a + 2) + o), s.markClassCount = n.readUshort(r, a + 4), s.mark1Array = t.GPOS.readMarkArray(r, n.readUshort(r, a + 6) + o), s.mark2Array = t.GPOS.readBaseArray(r, n.readUshort(r, a + 8) + o, s.markClassCount);
      else {
        if (e == 9 && s.fmt == 1) {
          var k = n.readUshort(r, a);
          a += 2;
          var X = n.readUint(r, a);
          if (a += 4, i.ltype == 9) i.ltype = k;
          else if (i.ltype != k) throw "invalid extension substitution";
          return t.GPOS.subt(r, i.ltype, o + X);
        }
        console.debug("unsupported GPOS table LookupType", e, "format", s.fmt);
      }
      return s;
    }, t.GPOS.readValueRecord = function(r, e, a) {
      var i = t._bin, n = [];
      return n.push(1 & a ? i.readShort(r, e) : 0), e += 1 & a ? 2 : 0, n.push(2 & a ? i.readShort(r, e) : 0), e += 2 & a ? 2 : 0, n.push(4 & a ? i.readShort(r, e) : 0), e += 4 & a ? 2 : 0, n.push(8 & a ? i.readShort(r, e) : 0), e += 8 & a ? 2 : 0, n;
    }, t.GPOS.readBaseArray = function(r, e, a) {
      var i = t._bin, n = [], o = e, s = i.readUshort(r, e);
      e += 2;
      for (var f = 0; f < s; f++) {
        for (var l = [], h = 0; h < a; h++) l.push(t.GPOS.readAnchorRecord(r, o + i.readUshort(r, e))), e += 2;
        n.push(l);
      }
      return n;
    }, t.GPOS.readMarkArray = function(r, e) {
      var a = t._bin, i = [], n = e, o = a.readUshort(r, e);
      e += 2;
      for (var s = 0; s < o; s++) {
        var f = t.GPOS.readAnchorRecord(r, a.readUshort(r, e + 2) + n);
        f.markClass = a.readUshort(r, e), i.push(f), e += 4;
      }
      return i;
    }, t.GPOS.readAnchorRecord = function(r, e) {
      var a = t._bin, i = {};
      return i.fmt = a.readUshort(r, e), i.x = a.readShort(r, e + 2), i.y = a.readShort(r, e + 4), i;
    }, t.GSUB = {}, t.GSUB.parse = function(r, e, a, i) {
      return t._lctf.parse(r, e, a, i, t.GSUB.subt);
    }, t.GSUB.subt = function(r, e, a, i) {
      var n = t._bin, o = a, s = {};
      if (s.fmt = n.readUshort(r, a), a += 2, e != 1 && e != 2 && e != 4 && e != 5 && e != 6) return null;
      if (e == 1 || e == 2 || e == 4 || e == 5 && s.fmt <= 2 || e == 6 && s.fmt <= 2) {
        var f = n.readUshort(r, a);
        a += 2, s.coverage = t._lctf.readCoverage(r, o + f);
      }
      if (e == 1 && s.fmt >= 1 && s.fmt <= 2) {
        if (s.fmt == 1) s.delta = n.readShort(r, a), a += 2;
        else if (s.fmt == 2) {
          var l = n.readUshort(r, a);
          a += 2, s.newg = n.readUshorts(r, a, l), a += 2 * s.newg.length;
        }
      } else if (e == 2 && s.fmt == 1) {
        l = n.readUshort(r, a), a += 2, s.seqs = [];
        for (var h = 0; h < l; h++) {
          var p = n.readUshort(r, a) + o;
          a += 2;
          var g = n.readUshort(r, p);
          s.seqs.push(n.readUshorts(r, p + 2, g));
        }
      } else if (e == 4)
        for (s.vals = [], l = n.readUshort(r, a), a += 2, h = 0; h < l; h++) {
          var m = n.readUshort(r, a);
          a += 2, s.vals.push(t.GSUB.readLigatureSet(r, o + m));
        }
      else if (e == 5 && s.fmt == 2) {
        if (s.fmt == 2) {
          var O = n.readUshort(r, a);
          a += 2, s.cDef = t._lctf.readClassDef(r, o + O), s.scset = [];
          var S = n.readUshort(r, a);
          for (a += 2, h = 0; h < S; h++) {
            var F = n.readUshort(r, a);
            a += 2, s.scset.push(F == 0 ? null : t.GSUB.readSubClassSet(r, o + F));
          }
        }
      } else if (e == 6 && s.fmt == 3) {
        if (s.fmt == 3) {
          for (h = 0; h < 3; h++) {
            l = n.readUshort(r, a), a += 2;
            for (var U = [], w = 0; w < l; w++) U.push(t._lctf.readCoverage(r, o + n.readUshort(r, a + 2 * w)));
            a += 2 * l, h == 0 && (s.backCvg = U), h == 1 && (s.inptCvg = U), h == 2 && (s.ahedCvg = U);
          }
          l = n.readUshort(r, a), a += 2, s.lookupRec = t.GSUB.readSubstLookupRecords(r, a, l);
        }
      } else {
        if (e == 7 && s.fmt == 1) {
          var R = n.readUshort(r, a);
          a += 2;
          var x = n.readUint(r, a);
          if (a += 4, i.ltype == 9) i.ltype = R;
          else if (i.ltype != R) throw "invalid extension substitution";
          return t.GSUB.subt(r, i.ltype, o + x);
        }
        console.debug("unsupported GSUB table LookupType", e, "format", s.fmt);
      }
      return s;
    }, t.GSUB.readSubClassSet = function(r, e) {
      var a = t._bin.readUshort, i = e, n = [], o = a(r, e);
      e += 2;
      for (var s = 0; s < o; s++) {
        var f = a(r, e);
        e += 2, n.push(t.GSUB.readSubClassRule(r, i + f));
      }
      return n;
    }, t.GSUB.readSubClassRule = function(r, e) {
      var a = t._bin.readUshort, i = {}, n = a(r, e), o = a(r, e += 2);
      e += 2, i.input = [];
      for (var s = 0; s < n - 1; s++) i.input.push(a(r, e)), e += 2;
      return i.substLookupRecords = t.GSUB.readSubstLookupRecords(r, e, o), i;
    }, t.GSUB.readSubstLookupRecords = function(r, e, a) {
      for (var i = t._bin.readUshort, n = [], o = 0; o < a; o++) n.push(i(r, e), i(r, e + 2)), e += 4;
      return n;
    }, t.GSUB.readChainSubClassSet = function(r, e) {
      var a = t._bin, i = e, n = [], o = a.readUshort(r, e);
      e += 2;
      for (var s = 0; s < o; s++) {
        var f = a.readUshort(r, e);
        e += 2, n.push(t.GSUB.readChainSubClassRule(r, i + f));
      }
      return n;
    }, t.GSUB.readChainSubClassRule = function(r, e) {
      for (var a = t._bin, i = {}, n = ["backtrack", "input", "lookahead"], o = 0; o < n.length; o++) {
        var s = a.readUshort(r, e);
        e += 2, o == 1 && s--, i[n[o]] = a.readUshorts(r, e, s), e += 2 * i[n[o]].length;
      }
      return s = a.readUshort(r, e), e += 2, i.subst = a.readUshorts(r, e, 2 * s), e += 2 * i.subst.length, i;
    }, t.GSUB.readLigatureSet = function(r, e) {
      var a = t._bin, i = e, n = [], o = a.readUshort(r, e);
      e += 2;
      for (var s = 0; s < o; s++) {
        var f = a.readUshort(r, e);
        e += 2, n.push(t.GSUB.readLigature(r, i + f));
      }
      return n;
    }, t.GSUB.readLigature = function(r, e) {
      var a = t._bin, i = { chain: [] };
      i.nglyph = a.readUshort(r, e), e += 2;
      var n = a.readUshort(r, e);
      e += 2;
      for (var o = 0; o < n - 1; o++) i.chain.push(a.readUshort(r, e)), e += 2;
      return i;
    }, t.head = {}, t.head.parse = function(r, e, a) {
      var i = t._bin, n = {};
      return i.readFixed(r, e), e += 4, n.fontRevision = i.readFixed(r, e), e += 4, i.readUint(r, e), e += 4, i.readUint(r, e), e += 4, n.flags = i.readUshort(r, e), e += 2, n.unitsPerEm = i.readUshort(r, e), e += 2, n.created = i.readUint64(r, e), e += 8, n.modified = i.readUint64(r, e), e += 8, n.xMin = i.readShort(r, e), e += 2, n.yMin = i.readShort(r, e), e += 2, n.xMax = i.readShort(r, e), e += 2, n.yMax = i.readShort(r, e), e += 2, n.macStyle = i.readUshort(r, e), e += 2, n.lowestRecPPEM = i.readUshort(r, e), e += 2, n.fontDirectionHint = i.readShort(r, e), e += 2, n.indexToLocFormat = i.readShort(r, e), e += 2, n.glyphDataFormat = i.readShort(r, e), e += 2, n;
    }, t.hhea = {}, t.hhea.parse = function(r, e, a) {
      var i = t._bin, n = {};
      return i.readFixed(r, e), e += 4, n.ascender = i.readShort(r, e), e += 2, n.descender = i.readShort(r, e), e += 2, n.lineGap = i.readShort(r, e), e += 2, n.advanceWidthMax = i.readUshort(r, e), e += 2, n.minLeftSideBearing = i.readShort(r, e), e += 2, n.minRightSideBearing = i.readShort(r, e), e += 2, n.xMaxExtent = i.readShort(r, e), e += 2, n.caretSlopeRise = i.readShort(r, e), e += 2, n.caretSlopeRun = i.readShort(r, e), e += 2, n.caretOffset = i.readShort(r, e), e += 2, e += 8, n.metricDataFormat = i.readShort(r, e), e += 2, n.numberOfHMetrics = i.readUshort(r, e), e += 2, n;
    }, t.hmtx = {}, t.hmtx.parse = function(r, e, a, i) {
      for (var n = t._bin, o = { aWidth: [], lsBearing: [] }, s = 0, f = 0, l = 0; l < i.maxp.numGlyphs; l++) l < i.hhea.numberOfHMetrics && (s = n.readUshort(r, e), e += 2, f = n.readShort(r, e), e += 2), o.aWidth.push(s), o.lsBearing.push(f);
      return o;
    }, t.kern = {}, t.kern.parse = function(r, e, a, i) {
      var n = t._bin, o = n.readUshort(r, e);
      if (e += 2, o == 1) return t.kern.parseV1(r, e - 2, a, i);
      var s = n.readUshort(r, e);
      e += 2;
      for (var f = { glyph1: [], rval: [] }, l = 0; l < s; l++) {
        e += 2, a = n.readUshort(r, e), e += 2;
        var h = n.readUshort(r, e);
        e += 2;
        var p = h >>> 8;
        if ((p &= 15) != 0) throw "unknown kern table format: " + p;
        e = t.kern.readFormat0(r, e, f);
      }
      return f;
    }, t.kern.parseV1 = function(r, e, a, i) {
      var n = t._bin;
      n.readFixed(r, e), e += 4;
      var o = n.readUint(r, e);
      e += 4;
      for (var s = { glyph1: [], rval: [] }, f = 0; f < o; f++) {
        n.readUint(r, e), e += 4;
        var l = n.readUshort(r, e);
        e += 2, n.readUshort(r, e), e += 2;
        var h = l >>> 8;
        if ((h &= 15) != 0) throw "unknown kern table format: " + h;
        e = t.kern.readFormat0(r, e, s);
      }
      return s;
    }, t.kern.readFormat0 = function(r, e, a) {
      var i = t._bin, n = -1, o = i.readUshort(r, e);
      e += 2, i.readUshort(r, e), e += 2, i.readUshort(r, e), e += 2, i.readUshort(r, e), e += 2;
      for (var s = 0; s < o; s++) {
        var f = i.readUshort(r, e);
        e += 2;
        var l = i.readUshort(r, e);
        e += 2;
        var h = i.readShort(r, e);
        e += 2, f != n && (a.glyph1.push(f), a.rval.push({ glyph2: [], vals: [] }));
        var p = a.rval[a.rval.length - 1];
        p.glyph2.push(l), p.vals.push(h), n = f;
      }
      return e;
    }, t.loca = {}, t.loca.parse = function(r, e, a, i) {
      var n = t._bin, o = [], s = i.head.indexToLocFormat, f = i.maxp.numGlyphs + 1;
      if (s == 0) for (var l = 0; l < f; l++) o.push(n.readUshort(r, e + (l << 1)) << 1);
      if (s == 1) for (l = 0; l < f; l++) o.push(n.readUint(r, e + (l << 2)));
      return o;
    }, t.maxp = {}, t.maxp.parse = function(r, e, a) {
      var i = t._bin, n = {}, o = i.readUint(r, e);
      return e += 4, n.numGlyphs = i.readUshort(r, e), e += 2, o == 65536 && (n.maxPoints = i.readUshort(r, e), e += 2, n.maxContours = i.readUshort(r, e), e += 2, n.maxCompositePoints = i.readUshort(r, e), e += 2, n.maxCompositeContours = i.readUshort(r, e), e += 2, n.maxZones = i.readUshort(r, e), e += 2, n.maxTwilightPoints = i.readUshort(r, e), e += 2, n.maxStorage = i.readUshort(r, e), e += 2, n.maxFunctionDefs = i.readUshort(r, e), e += 2, n.maxInstructionDefs = i.readUshort(r, e), e += 2, n.maxStackElements = i.readUshort(r, e), e += 2, n.maxSizeOfInstructions = i.readUshort(r, e), e += 2, n.maxComponentElements = i.readUshort(r, e), e += 2, n.maxComponentDepth = i.readUshort(r, e), e += 2), n;
    }, t.name = {}, t.name.parse = function(r, e, a) {
      var i = t._bin, n = {};
      i.readUshort(r, e), e += 2;
      var o = i.readUshort(r, e);
      e += 2, i.readUshort(r, e);
      for (var s, f = ["copyright", "fontFamily", "fontSubfamily", "ID", "fullName", "version", "postScriptName", "trademark", "manufacturer", "designer", "description", "urlVendor", "urlDesigner", "licence", "licenceURL", "---", "typoFamilyName", "typoSubfamilyName", "compatibleFull", "sampleText", "postScriptCID", "wwsFamilyName", "wwsSubfamilyName", "lightPalette", "darkPalette"], l = e += 2, h = 0; h < o; h++) {
        var p = i.readUshort(r, e);
        e += 2;
        var g = i.readUshort(r, e);
        e += 2;
        var m = i.readUshort(r, e);
        e += 2;
        var O = i.readUshort(r, e);
        e += 2;
        var S = i.readUshort(r, e);
        e += 2;
        var F = i.readUshort(r, e);
        e += 2;
        var U, w = f[O], R = l + 12 * o + F;
        if (p == 0) U = i.readUnicode(r, R, S / 2);
        else if (p == 3 && g == 0) U = i.readUnicode(r, R, S / 2);
        else if (g == 0) U = i.readASCII(r, R, S);
        else if (g == 1) U = i.readUnicode(r, R, S / 2);
        else if (g == 3) U = i.readUnicode(r, R, S / 2);
        else {
          if (p != 1) throw "unknown encoding " + g + ", platformID: " + p;
          U = i.readASCII(r, R, S), console.debug("reading unknown MAC encoding " + g + " as ASCII");
        }
        var x = "p" + p + "," + m.toString(16);
        n[x] == null && (n[x] = {}), n[x][w !== void 0 ? w : O] = U, n[x]._lang = m;
      }
      for (var C in n) if (n[C].postScriptName != null && n[C]._lang == 1033) return n[C];
      for (var C in n) if (n[C].postScriptName != null && n[C]._lang == 0) return n[C];
      for (var C in n) if (n[C].postScriptName != null && n[C]._lang == 3084) return n[C];
      for (var C in n) if (n[C].postScriptName != null) return n[C];
      for (var C in n) {
        s = C;
        break;
      }
      return console.debug("returning name table with languageID " + n[s]._lang), n[s];
    }, t["OS/2"] = {}, t["OS/2"].parse = function(r, e, a) {
      var i = t._bin.readUshort(r, e);
      e += 2;
      var n = {};
      if (i == 0) t["OS/2"].version0(r, e, n);
      else if (i == 1) t["OS/2"].version1(r, e, n);
      else if (i == 2 || i == 3 || i == 4) t["OS/2"].version2(r, e, n);
      else {
        if (i != 5) throw "unknown OS/2 table version: " + i;
        t["OS/2"].version5(r, e, n);
      }
      return n;
    }, t["OS/2"].version0 = function(r, e, a) {
      var i = t._bin;
      return a.xAvgCharWidth = i.readShort(r, e), e += 2, a.usWeightClass = i.readUshort(r, e), e += 2, a.usWidthClass = i.readUshort(r, e), e += 2, a.fsType = i.readUshort(r, e), e += 2, a.ySubscriptXSize = i.readShort(r, e), e += 2, a.ySubscriptYSize = i.readShort(r, e), e += 2, a.ySubscriptXOffset = i.readShort(r, e), e += 2, a.ySubscriptYOffset = i.readShort(r, e), e += 2, a.ySuperscriptXSize = i.readShort(r, e), e += 2, a.ySuperscriptYSize = i.readShort(r, e), e += 2, a.ySuperscriptXOffset = i.readShort(r, e), e += 2, a.ySuperscriptYOffset = i.readShort(r, e), e += 2, a.yStrikeoutSize = i.readShort(r, e), e += 2, a.yStrikeoutPosition = i.readShort(r, e), e += 2, a.sFamilyClass = i.readShort(r, e), e += 2, a.panose = i.readBytes(r, e, 10), e += 10, a.ulUnicodeRange1 = i.readUint(r, e), e += 4, a.ulUnicodeRange2 = i.readUint(r, e), e += 4, a.ulUnicodeRange3 = i.readUint(r, e), e += 4, a.ulUnicodeRange4 = i.readUint(r, e), e += 4, a.achVendID = [i.readInt8(r, e), i.readInt8(r, e + 1), i.readInt8(r, e + 2), i.readInt8(r, e + 3)], e += 4, a.fsSelection = i.readUshort(r, e), e += 2, a.usFirstCharIndex = i.readUshort(r, e), e += 2, a.usLastCharIndex = i.readUshort(r, e), e += 2, a.sTypoAscender = i.readShort(r, e), e += 2, a.sTypoDescender = i.readShort(r, e), e += 2, a.sTypoLineGap = i.readShort(r, e), e += 2, a.usWinAscent = i.readUshort(r, e), e += 2, a.usWinDescent = i.readUshort(r, e), e += 2;
    }, t["OS/2"].version1 = function(r, e, a) {
      var i = t._bin;
      return e = t["OS/2"].version0(r, e, a), a.ulCodePageRange1 = i.readUint(r, e), e += 4, a.ulCodePageRange2 = i.readUint(r, e), e += 4;
    }, t["OS/2"].version2 = function(r, e, a) {
      var i = t._bin;
      return e = t["OS/2"].version1(r, e, a), a.sxHeight = i.readShort(r, e), e += 2, a.sCapHeight = i.readShort(r, e), e += 2, a.usDefault = i.readUshort(r, e), e += 2, a.usBreak = i.readUshort(r, e), e += 2, a.usMaxContext = i.readUshort(r, e), e += 2;
    }, t["OS/2"].version5 = function(r, e, a) {
      var i = t._bin;
      return e = t["OS/2"].version2(r, e, a), a.usLowerOpticalPointSize = i.readUshort(r, e), e += 2, a.usUpperOpticalPointSize = i.readUshort(r, e), e += 2;
    }, t.post = {}, t.post.parse = function(r, e, a) {
      var i = t._bin, n = {};
      return n.version = i.readFixed(r, e), e += 4, n.italicAngle = i.readFixed(r, e), e += 4, n.underlinePosition = i.readShort(r, e), e += 2, n.underlineThickness = i.readShort(r, e), e += 2, n;
    }, t == null && (t = {}), t.U == null && (t.U = {}), t.U.codeToGlyph = function(r, e) {
      var a = r.cmap, i = -1;
      if (a.p0e4 != null ? i = a.p0e4 : a.p3e1 != null ? i = a.p3e1 : a.p1e0 != null ? i = a.p1e0 : a.p0e3 != null && (i = a.p0e3), i == -1) throw "no familiar platform and encoding!";
      var n = a.tables[i];
      if (n.format == 0) return e >= n.map.length ? 0 : n.map[e];
      if (n.format == 4) {
        for (var o = -1, s = 0; s < n.endCount.length; s++) if (e <= n.endCount[s]) {
          o = s;
          break;
        }
        return o == -1 || n.startCount[o] > e ? 0 : 65535 & (n.idRangeOffset[o] != 0 ? n.glyphIdArray[e - n.startCount[o] + (n.idRangeOffset[o] >> 1) - (n.idRangeOffset.length - o)] : e + n.idDelta[o]);
      }
      if (n.format == 12) {
        if (e > n.groups[n.groups.length - 1][1]) return 0;
        for (s = 0; s < n.groups.length; s++) {
          var f = n.groups[s];
          if (f[0] <= e && e <= f[1]) return f[2] + (e - f[0]);
        }
        return 0;
      }
      throw "unknown cmap table format " + n.format;
    }, t.U.glyphToPath = function(r, e) {
      var a = { cmds: [], crds: [] };
      if (r.SVG && r.SVG.entries[e]) {
        var i = r.SVG.entries[e];
        return i == null ? a : (typeof i == "string" && (i = t.SVG.toPath(i), r.SVG.entries[e] = i), i);
      }
      if (r.CFF) {
        var n = { x: 0, y: 0, stack: [], nStems: 0, haveWidth: !1, width: r.CFF.Private ? r.CFF.Private.defaultWidthX : 0, open: !1 }, o = r.CFF, s = r.CFF.Private;
        if (o.ROS) {
          for (var f = 0; o.FDSelect[f + 2] <= e; ) f += 2;
          s = o.FDArray[o.FDSelect[f + 1]].Private;
        }
        t.U._drawCFF(r.CFF.CharStrings[e], n, o, s, a);
      } else r.glyf && t.U._drawGlyf(e, r, a);
      return a;
    }, t.U._drawGlyf = function(r, e, a) {
      var i = e.glyf[r];
      i == null && (i = e.glyf[r] = t.glyf._parseGlyf(e, r)), i != null && (i.noc > -1 ? t.U._simpleGlyph(i, a) : t.U._compoGlyph(i, e, a));
    }, t.U._simpleGlyph = function(r, e) {
      for (var a = 0; a < r.noc; a++) {
        for (var i = a == 0 ? 0 : r.endPts[a - 1] + 1, n = r.endPts[a], o = i; o <= n; o++) {
          var s = o == i ? n : o - 1, f = o == n ? i : o + 1, l = 1 & r.flags[o], h = 1 & r.flags[s], p = 1 & r.flags[f], g = r.xs[o], m = r.ys[o];
          if (o == i) if (l) {
            if (!h) {
              t.U.P.moveTo(e, g, m);
              continue;
            }
            t.U.P.moveTo(e, r.xs[s], r.ys[s]);
          } else h ? t.U.P.moveTo(e, r.xs[s], r.ys[s]) : t.U.P.moveTo(e, (r.xs[s] + g) / 2, (r.ys[s] + m) / 2);
          l ? h && t.U.P.lineTo(e, g, m) : p ? t.U.P.qcurveTo(e, g, m, r.xs[f], r.ys[f]) : t.U.P.qcurveTo(e, g, m, (g + r.xs[f]) / 2, (m + r.ys[f]) / 2);
        }
        t.U.P.closePath(e);
      }
    }, t.U._compoGlyph = function(r, e, a) {
      for (var i = 0; i < r.parts.length; i++) {
        var n = { cmds: [], crds: [] }, o = r.parts[i];
        t.U._drawGlyf(o.glyphIndex, e, n);
        for (var s = o.m, f = 0; f < n.crds.length; f += 2) {
          var l = n.crds[f], h = n.crds[f + 1];
          a.crds.push(l * s.a + h * s.b + s.tx), a.crds.push(l * s.c + h * s.d + s.ty);
        }
        for (f = 0; f < n.cmds.length; f++) a.cmds.push(n.cmds[f]);
      }
    }, t.U._getGlyphClass = function(r, e) {
      var a = t._lctf.getInterval(e, r);
      return a == -1 ? 0 : e[a + 2];
    }, t.U._applySubs = function(r, e, a, i) {
      for (var n = r.length - e - 1, o = 0; o < a.tabs.length; o++) if (a.tabs[o] != null) {
        var s, f = a.tabs[o];
        if (!f.coverage || (s = t._lctf.coverageIndex(f.coverage, r[e])) != -1) {
          if (a.ltype == 1) r[e], f.fmt == 1 ? r[e] = r[e] + f.delta : r[e] = f.newg[s];
          else if (a.ltype == 4) for (var l = f.vals[s], h = 0; h < l.length; h++) {
            var p = l[h], g = p.chain.length;
            if (!(g > n)) {
              for (var m = !0, O = 0, S = 0; S < g; S++) {
                for (; r[e + O + (1 + S)] == -1; ) O++;
                p.chain[S] != r[e + O + (1 + S)] && (m = !1);
              }
              if (m) {
                for (r[e] = p.nglyph, S = 0; S < g + O; S++) r[e + S + 1] = -1;
                break;
              }
            }
          }
          else if (a.ltype == 5 && f.fmt == 2) for (var F = t._lctf.getInterval(f.cDef, r[e]), U = f.cDef[F + 2], w = f.scset[U], R = 0; R < w.length; R++) {
            var x = w[R], C = x.input;
            if (!(C.length > n)) {
              for (m = !0, S = 0; S < C.length; S++) {
                var I = t._lctf.getInterval(f.cDef, r[e + 1 + S]);
                if (F == -1 && f.cDef[I + 2] != C[S]) {
                  m = !1;
                  break;
                }
              }
              if (m) {
                var M = x.substLookupRecords;
                for (h = 0; h < M.length; h += 2) M[h], M[h + 1];
              }
            }
          }
          else if (a.ltype == 6 && f.fmt == 3) {
            if (!t.U._glsCovered(r, f.backCvg, e - f.backCvg.length) || !t.U._glsCovered(r, f.inptCvg, e) || !t.U._glsCovered(r, f.ahedCvg, e + f.inptCvg.length)) continue;
            var J = f.lookupRec;
            for (R = 0; R < J.length; R += 2) {
              F = J[R];
              var y = i[J[R + 1]];
              t.U._applySubs(r, e + F, y, i);
            }
          }
        }
      }
    }, t.U._glsCovered = function(r, e, a) {
      for (var i = 0; i < e.length; i++)
        if (t._lctf.coverageIndex(e[i], r[a + i]) == -1) return !1;
      return !0;
    }, t.U.glyphsToPath = function(r, e, a) {
      for (var i = { cmds: [], crds: [] }, n = 0, o = 0; o < e.length; o++) {
        var s = e[o];
        if (s != -1) {
          for (var f = o < e.length - 1 && e[o + 1] != -1 ? e[o + 1] : 0, l = t.U.glyphToPath(r, s), h = 0; h < l.crds.length; h += 2) i.crds.push(l.crds[h] + n), i.crds.push(l.crds[h + 1]);
          for (a && i.cmds.push(a), h = 0; h < l.cmds.length; h++) i.cmds.push(l.cmds[h]);
          a && i.cmds.push("X"), n += r.hmtx.aWidth[s], o < e.length - 1 && (n += t.U.getPairAdjustment(r, s, f));
        }
      }
      return i;
    }, t.U.P = {}, t.U.P.moveTo = function(r, e, a) {
      r.cmds.push("M"), r.crds.push(e, a);
    }, t.U.P.lineTo = function(r, e, a) {
      r.cmds.push("L"), r.crds.push(e, a);
    }, t.U.P.curveTo = function(r, e, a, i, n, o, s) {
      r.cmds.push("C"), r.crds.push(e, a, i, n, o, s);
    }, t.U.P.qcurveTo = function(r, e, a, i, n) {
      r.cmds.push("Q"), r.crds.push(e, a, i, n);
    }, t.U.P.closePath = function(r) {
      r.cmds.push("Z");
    }, t.U._drawCFF = function(r, e, a, i, n) {
      for (var o = e.stack, s = e.nStems, f = e.haveWidth, l = e.width, h = e.open, p = 0, g = e.x, m = e.y, O = 0, S = 0, F = 0, U = 0, w = 0, R = 0, x = 0, C = 0, I = 0, M = 0, J = { val: 0, size: 0 }; p < r.length; ) {
        t.CFF.getCharString(r, p, J);
        var y = J.val;
        if (p += J.size, y == "o1" || y == "o18") o.length % 2 != 0 && !f && (l = o.shift() + i.nominalWidthX), s += o.length >> 1, o.length = 0, f = !0;
        else if (y == "o3" || y == "o23")
          o.length % 2 != 0 && !f && (l = o.shift() + i.nominalWidthX), s += o.length >> 1, o.length = 0, f = !0;
        else if (y == "o4") o.length > 1 && !f && (l = o.shift() + i.nominalWidthX, f = !0), h && t.U.P.closePath(n), m += o.pop(), t.U.P.moveTo(n, g, m), h = !0;
        else if (y == "o5") for (; o.length > 0; ) g += o.shift(), m += o.shift(), t.U.P.lineTo(n, g, m);
        else if (y == "o6" || y == "o7") for (var A = o.length, k = y == "o6", X = 0; X < A; X++) {
          var z = o.shift();
          k ? g += z : m += z, k = !k, t.U.P.lineTo(n, g, m);
        }
        else if (y == "o8" || y == "o24") {
          A = o.length;
          for (var Z = 0; Z + 6 <= A; ) O = g + o.shift(), S = m + o.shift(), F = O + o.shift(), U = S + o.shift(), g = F + o.shift(), m = U + o.shift(), t.U.P.curveTo(n, O, S, F, U, g, m), Z += 6;
          y == "o24" && (g += o.shift(), m += o.shift(), t.U.P.lineTo(n, g, m));
        } else {
          if (y == "o11") break;
          if (y == "o1234" || y == "o1235" || y == "o1236" || y == "o1237") y == "o1234" && (S = m, F = (O = g + o.shift()) + o.shift(), M = U = S + o.shift(), R = U, C = m, g = (x = (w = (I = F + o.shift()) + o.shift()) + o.shift()) + o.shift(), t.U.P.curveTo(n, O, S, F, U, I, M), t.U.P.curveTo(n, w, R, x, C, g, m)), y == "o1235" && (O = g + o.shift(), S = m + o.shift(), F = O + o.shift(), U = S + o.shift(), I = F + o.shift(), M = U + o.shift(), w = I + o.shift(), R = M + o.shift(), x = w + o.shift(), C = R + o.shift(), g = x + o.shift(), m = C + o.shift(), o.shift(), t.U.P.curveTo(n, O, S, F, U, I, M), t.U.P.curveTo(n, w, R, x, C, g, m)), y == "o1236" && (O = g + o.shift(), S = m + o.shift(), F = O + o.shift(), M = U = S + o.shift(), R = U, x = (w = (I = F + o.shift()) + o.shift()) + o.shift(), C = R + o.shift(), g = x + o.shift(), t.U.P.curveTo(n, O, S, F, U, I, M), t.U.P.curveTo(n, w, R, x, C, g, m)), y == "o1237" && (O = g + o.shift(), S = m + o.shift(), F = O + o.shift(), U = S + o.shift(), I = F + o.shift(), M = U + o.shift(), w = I + o.shift(), R = M + o.shift(), x = w + o.shift(), C = R + o.shift(), Math.abs(x - g) > Math.abs(C - m) ? g = x + o.shift() : m = C + o.shift(), t.U.P.curveTo(n, O, S, F, U, I, M), t.U.P.curveTo(n, w, R, x, C, g, m));
          else if (y == "o14") {
            if (o.length > 0 && !f && (l = o.shift() + a.nominalWidthX, f = !0), o.length == 4) {
              var te = o.shift(), B = o.shift(), G = o.shift(), v = o.shift(), b = t.CFF.glyphBySE(a, G), T = t.CFF.glyphBySE(a, v);
              t.U._drawCFF(a.CharStrings[b], e, a, i, n), e.x = te, e.y = B, t.U._drawCFF(a.CharStrings[T], e, a, i, n);
            }
            h && (t.U.P.closePath(n), h = !1);
          } else if (y == "o19" || y == "o20")
            o.length % 2 != 0 && !f && (l = o.shift() + i.nominalWidthX), s += o.length >> 1, o.length = 0, f = !0, p += s + 7 >> 3;
          else if (y == "o21") o.length > 2 && !f && (l = o.shift() + i.nominalWidthX, f = !0), m += o.pop(), g += o.pop(), h && t.U.P.closePath(n), t.U.P.moveTo(n, g, m), h = !0;
          else if (y == "o22") o.length > 1 && !f && (l = o.shift() + i.nominalWidthX, f = !0), g += o.pop(), h && t.U.P.closePath(n), t.U.P.moveTo(n, g, m), h = !0;
          else if (y == "o25") {
            for (; o.length > 6; ) g += o.shift(), m += o.shift(), t.U.P.lineTo(n, g, m);
            O = g + o.shift(), S = m + o.shift(), F = O + o.shift(), U = S + o.shift(), g = F + o.shift(), m = U + o.shift(), t.U.P.curveTo(n, O, S, F, U, g, m);
          } else if (y == "o26") for (o.length % 2 && (g += o.shift()); o.length > 0; ) O = g, S = m + o.shift(), g = F = O + o.shift(), m = (U = S + o.shift()) + o.shift(), t.U.P.curveTo(n, O, S, F, U, g, m);
          else if (y == "o27") for (o.length % 2 && (m += o.shift()); o.length > 0; ) S = m, F = (O = g + o.shift()) + o.shift(), U = S + o.shift(), g = F + o.shift(), m = U, t.U.P.curveTo(n, O, S, F, U, g, m);
          else if (y == "o10" || y == "o29") {
            var D = y == "o10" ? i : a;
            if (o.length == 0) console.debug("error: empty stack");
            else {
              var _ = o.pop(), N = D.Subrs[_ + D.Bias];
              e.x = g, e.y = m, e.nStems = s, e.haveWidth = f, e.width = l, e.open = h, t.U._drawCFF(N, e, a, i, n), g = e.x, m = e.y, s = e.nStems, f = e.haveWidth, l = e.width, h = e.open;
            }
          } else if (y == "o30" || y == "o31") {
            var E = o.length, P = (Z = 0, y == "o31");
            for (Z += E - (A = -3 & E); Z < A; ) P ? (S = m, F = (O = g + o.shift()) + o.shift(), m = (U = S + o.shift()) + o.shift(), A - Z == 5 ? (g = F + o.shift(), Z++) : g = F, P = !1) : (O = g, S = m + o.shift(), F = O + o.shift(), U = S + o.shift(), g = F + o.shift(), A - Z == 5 ? (m = U + o.shift(), Z++) : m = U, P = !0), t.U.P.curveTo(n, O, S, F, U, g, m), Z += 4;
          } else {
            if ((y + "").charAt(0) == "o") throw console.debug("Unknown operation: " + y, r), y;
            o.push(y);
          }
        }
      }
      e.x = g, e.y = m, e.nStems = s, e.haveWidth = f, e.width = l, e.open = h;
    };
    var d = t, c = { Typr: d };
    return u.Typr = d, u.default = c, Object.defineProperty(u, "__esModule", { value: !0 }), u;
  }({}).Typr;
}
/*!
Custom bundle of woff2otf (https://github.com/arty-name/woff2otf) with fflate
(https://github.com/101arrowz/fflate) for use in Troika text rendering. 
Original licenses apply: 
- fflate: https://github.com/101arrowz/fflate/blob/master/LICENSE (MIT)
- woff2otf.js: https://github.com/arty-name/woff2otf/blob/master/woff2otf.js (Apache2)
*/
function la() {
  return function(u) {
    var t = Uint8Array, d = Uint16Array, c = Uint32Array, r = new t([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]), e = new t([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]), a = new t([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), i = function(y, A) {
      for (var k = new d(31), X = 0; X < 31; ++X) k[X] = A += 1 << y[X - 1];
      var z = new c(k[30]);
      for (X = 1; X < 30; ++X) for (var Z = k[X]; Z < k[X + 1]; ++Z) z[Z] = Z - k[X] << 5 | X;
      return [k, z];
    }, n = i(r, 2), o = n[0], s = n[1];
    o[28] = 258, s[258] = 28;
    for (var f = i(e, 0)[0], l = new d(32768), h = 0; h < 32768; ++h) {
      var p = (43690 & h) >>> 1 | (21845 & h) << 1;
      p = (61680 & (p = (52428 & p) >>> 2 | (13107 & p) << 2)) >>> 4 | (3855 & p) << 4, l[h] = ((65280 & p) >>> 8 | (255 & p) << 8) >>> 1;
    }
    var g = function(y, A, k) {
      for (var X = y.length, z = 0, Z = new d(A); z < X; ++z) ++Z[y[z] - 1];
      var te, B = new d(A);
      for (z = 0; z < A; ++z) B[z] = B[z - 1] + Z[z - 1] << 1;
      {
        te = new d(1 << A);
        var G = 15 - A;
        for (z = 0; z < X; ++z) if (y[z]) for (var v = z << 4 | y[z], b = A - y[z], T = B[y[z] - 1]++ << b, D = T | (1 << b) - 1; T <= D; ++T) te[l[T] >>> G] = v;
      }
      return te;
    }, m = new t(288);
    for (h = 0; h < 144; ++h) m[h] = 8;
    for (h = 144; h < 256; ++h) m[h] = 9;
    for (h = 256; h < 280; ++h) m[h] = 7;
    for (h = 280; h < 288; ++h) m[h] = 8;
    var O = new t(32);
    for (h = 0; h < 32; ++h) O[h] = 5;
    var S = g(m, 9), F = g(O, 5), U = function(y) {
      for (var A = y[0], k = 1; k < y.length; ++k) y[k] > A && (A = y[k]);
      return A;
    }, w = function(y, A, k) {
      var X = A / 8 | 0;
      return (y[X] | y[X + 1] << 8) >> (7 & A) & k;
    }, R = function(y, A) {
      var k = A / 8 | 0;
      return (y[k] | y[k + 1] << 8 | y[k + 2] << 16) >> (7 & A);
    }, x = ["unexpected EOF", "invalid block type", "invalid length/literal", "invalid distance", "stream finished", "no stream handler", , "no callback", "invalid UTF-8 data", "extra field too long", "date not in range 1980-2099", "filename too long", "stream finishing", "invalid zip data"], C = function(y, A, k) {
      var X = new Error(A || x[y]);
      if (X.code = y, Error.captureStackTrace && Error.captureStackTrace(X, C), !k) throw X;
      return X;
    }, I = function(y, A, k) {
      var X = y.length;
      if (!X || k && !k.l && X < 5) return A || new t(0);
      var z = !A || k, Z = !k || k.i;
      k || (k = {}), A || (A = new t(3 * X));
      var te, B = function(fe) {
        var Ce = A.length;
        if (fe > Ce) {
          var Te = new t(Math.max(2 * Ce, fe));
          Te.set(A), A = Te;
        }
      }, G = k.f || 0, v = k.p || 0, b = k.b || 0, T = k.l, D = k.d, _ = k.m, N = k.n, E = 8 * X;
      do {
        if (!T) {
          k.f = G = w(y, v, 1);
          var P = w(y, v + 1, 3);
          if (v += 3, !P) {
            var H = y[(q = ((te = v) / 8 | 0) + (7 & te && 1) + 4) - 4] | y[q - 3] << 8, $ = q + H;
            if ($ > X) {
              Z && C(0);
              break;
            }
            z && B(b + H), A.set(y.subarray(q, $), b), k.b = b += H, k.p = v = 8 * $;
            continue;
          }
          if (P == 1) T = S, D = F, _ = 9, N = 5;
          else if (P == 2) {
            var V = w(y, v, 31) + 257, W = w(y, v + 10, 15) + 4, pe = V + w(y, v + 5, 31) + 1;
            v += 14;
            for (var ue = new t(pe), Q = new t(19), ee = 0; ee < W; ++ee) Q[a[ee]] = w(y, v + 3 * ee, 7);
            v += 3 * W;
            var se = U(Q), j = (1 << se) - 1, re = g(Q, se);
            for (ee = 0; ee < pe; ) {
              var q, L = re[w(y, v, j)];
              if (v += 15 & L, (q = L >>> 4) < 16) ue[ee++] = q;
              else {
                var he = 0, K = 0;
                for (q == 16 ? (K = 3 + w(y, v, 3), v += 2, he = ue[ee - 1]) : q == 17 ? (K = 3 + w(y, v, 7), v += 3) : q == 18 && (K = 11 + w(y, v, 127), v += 7); K--; ) ue[ee++] = he;
              }
            }
            var ae = ue.subarray(0, V), Y = ue.subarray(V);
            _ = U(ae), N = U(Y), T = g(ae, _), D = g(Y, N);
          } else C(1);
          if (v > E) {
            Z && C(0);
            break;
          }
        }
        z && B(b + 131072);
        for (var be = (1 << _) - 1, ne = (1 << N) - 1, oe = v; ; oe = v) {
          var le = (he = T[R(y, v) & be]) >>> 4;
          if ((v += 15 & he) > E) {
            Z && C(0);
            break;
          }
          if (he || C(2), le < 256) A[b++] = le;
          else {
            if (le == 256) {
              oe = v, T = null;
              break;
            }
            var de = le - 254;
            if (le > 264) {
              var xe = r[ee = le - 257];
              de = w(y, v, (1 << xe) - 1) + o[ee], v += xe;
            }
            var Fe = D[R(y, v) & ne], ge = Fe >>> 4;
            if (Fe || C(3), v += 15 & Fe, Y = f[ge], ge > 3 && (xe = e[ge], Y += R(y, v) & (1 << xe) - 1, v += xe), v > E) {
              Z && C(0);
              break;
            }
            z && B(b + 131072);
            for (var me = b + de; b < me; b += 4) A[b] = A[b - Y], A[b + 1] = A[b + 1 - Y], A[b + 2] = A[b + 2 - Y], A[b + 3] = A[b + 3 - Y];
            b = me;
          }
        }
        k.l = T, k.p = oe, k.b = b, T && (G = 1, k.m = _, k.d = D, k.n = N);
      } while (!G);
      return b == A.length ? A : function(fe, Ce, Te) {
        (Te == null || Te > fe.length) && (Te = fe.length);
        var Oe = new (fe instanceof d ? d : fe instanceof c ? c : t)(Te - Ce);
        return Oe.set(fe.subarray(Ce, Te)), Oe;
      }(A, 0, b);
    }, M = new t(0), J = typeof TextDecoder < "u" && new TextDecoder();
    try {
      J.decode(M, { stream: !0 });
    } catch {
    }
    return u.convert_streams = function(y) {
      var A = new DataView(y), k = 0;
      function X() {
        var V = A.getUint16(k);
        return k += 2, V;
      }
      function z() {
        var V = A.getUint32(k);
        return k += 4, V;
      }
      function Z(V) {
        H.setUint16($, V), $ += 2;
      }
      function te(V) {
        H.setUint32($, V), $ += 4;
      }
      for (var B = { signature: z(), flavor: z(), length: z(), numTables: X(), reserved: X(), totalSfntSize: z(), majorVersion: X(), minorVersion: X(), metaOffset: z(), metaLength: z(), metaOrigLength: z(), privOffset: z(), privLength: z() }, G = 0; Math.pow(2, G) <= B.numTables; ) G++;
      G--;
      for (var v = 16 * Math.pow(2, G), b = 16 * B.numTables - v, T = 12, D = [], _ = 0; _ < B.numTables; _++) D.push({ tag: z(), offset: z(), compLength: z(), origLength: z(), origChecksum: z() }), T += 16;
      var N, E = new Uint8Array(12 + 16 * D.length + D.reduce(function(V, W) {
        return V + W.origLength + 4;
      }, 0)), P = E.buffer, H = new DataView(P), $ = 0;
      return te(B.flavor), Z(B.numTables), Z(v), Z(G), Z(b), D.forEach(function(V) {
        te(V.tag), te(V.origChecksum), te(T), te(V.origLength), V.outOffset = T, (T += V.origLength) % 4 != 0 && (T += 4 - T % 4);
      }), D.forEach(function(V) {
        var W, pe = y.slice(V.offset, V.offset + V.compLength);
        if (V.compLength != V.origLength) {
          var ue = new Uint8Array(V.origLength);
          W = new Uint8Array(pe, 2), I(W, ue);
        } else ue = new Uint8Array(pe);
        E.set(ue, V.outOffset);
        var Q = 0;
        (T = V.outOffset + V.origLength) % 4 != 0 && (Q = 4 - T % 4), E.set(new Uint8Array(Q).buffer, V.outOffset + V.origLength), N = T + Q;
      }), P.slice(0, N);
    }, Object.defineProperty(u, "__esModule", { value: !0 }), u;
  }({}).convert_streams;
}
function ua(u, t) {
  const d = {
    M: 2,
    L: 2,
    Q: 4,
    C: 6,
    Z: 0
  }, c = { C: "18g,ca,368,1kz", D: "17k,6,2,2+4,5+c,2+6,2+1,10+1,9+f,j+11,2+1,a,2,2+1,15+2,3,j+2,6+3,2+8,2,2,2+1,w+a,4+e,3+3,2,3+2,3+5,23+w,2f+4,3,2+9,2,b,2+3,3,1k+9,6+1,3+1,2+2,2+d,30g,p+y,1,1+1g,f+x,2,sd2+1d,jf3+4,f+3,2+4,2+2,b+3,42,2,4+2,2+1,2,3,t+1,9f+w,2,el+2,2+g,d+2,2l,2+1,5,3+1,2+1,2,3,6,16wm+1v", R: "17m+3,2,2,6+3,m,15+2,2+2,h+h,13,3+8,2,2,3+1,2,p+1,x,5+4,5,a,2,2,3,u,c+2,g+1,5,2+1,4+1,5j,6+1,2,b,2+2,f,2+1,1s+2,2,3+1,7,1ez0,2,2+1,4+4,b,4,3,b,42,2+2,4,3,2+1,2,o+3,ae,ep,x,2o+2,3+1,3,5+1,6", L: "x9u,jff,a,fd,jv", T: "4t,gj+33,7o+4,1+1,7c+18,2,2+1,2+1,2,21+a,2,1b+k,h,2u+6,3+5,3+1,2+3,y,2,v+q,2k+a,1n+8,a,p+3,2+8,2+2,2+4,18+2,3c+e,2+v,1k,2,5+7,5,4+6,b+1,u,1n,5+3,9,l+1,r,3+1,1m,5+1,5+1,3+2,4,v+1,4,c+1,1m,5+4,2+1,5,l+1,n+5,2,1n,3,2+3,9,8+1,c+1,v,1q,d,1f,4,1m+2,6+2,2+3,8+1,c+1,u,1n,3,7,6+1,l+1,t+1,1m+1,5+3,9,l+1,u,21,8+2,2,2j,3+6,d+7,2r,3+8,c+5,23+1,s,2,2,1k+d,2+4,2+1,6+a,2+z,a,2v+3,2+5,2+1,3+1,q+1,5+2,h+3,e,3+1,7,g,jk+2,qb+2,u+2,u+1,v+1,1t+1,2+6,9,3+a,a,1a+2,3c+1,z,3b+2,5+1,a,7+2,64+1,3,1n,2+6,2,2,3+7,7+9,3,1d+d,1,1+1,1s+3,1d,2+4,2,6,15+8,d+1,x+3,3+1,2+2,1l,2+1,4,2+2,1n+7,3+1,49+2,2+c,2+6,5,7,4+1,5j+1l,2+4,ek,3+1,r+4,1e+4,6+5,2p+c,1+3,1,1+2,1+b,2db+2,3y,2p+v,ff+3,30+1,n9x,1+2,2+9,x+1,29+1,7l,4,5,q+1,6,48+1,r+h,e,13+7,q+a,1b+2,1d,3+3,3+1,14,1w+5,3+1,3+1,d,9,1c,1g,2+2,3+1,6+1,2,17+1,9,6n,3,5,fn5,ki+f,h+f,5s,6y+2,ea,6b,46+4,1af+2,2+1,6+3,15+2,5,4m+1,fy+3,as+1,4a+a,4x,1j+e,1l+2,1e+3,3+1,1y+2,11+4,2+7,1r,d+1,1h+8,b+3,3,2o+2,3,2+1,7,4h,4+7,m+1,1m+1,4,12+6,4+4,5g+7,3+2,2,o,2d+5,2,5+1,2+1,6n+3,7+1,2+1,s+1,2e+7,3,2+1,2z,2,3+5,2,2u+2,3+3,2+4,78+8,2+1,75+1,2,5,41+3,3+1,5,x+9,15+5,3+3,9,a+5,3+2,1b+c,2+1,bb+6,2+5,2,2b+l,3+6,2+1,2+1,3f+5,4,2+1,2+6,2,21+1,4,2,9o+1,470+8,at4+4,1o+6,t5,1s+3,2a,f5l+1,2+3,43o+2,a+7,1+7,3+6,v+3,45+2,1j0+1i,5+1d,9,f,n+4,2+e,11t+6,2+g,3+6,2+1,2+4,7a+6,c6+3,15t+6,32+6,1,gzau,v+2n,3l+6n" }, r = 1, e = 2, a = 4, i = 8, n = 16, o = 32;
  let s;
  function f(x) {
    if (!s) {
      const C = {
        R: e,
        L: r,
        D: a,
        C: n,
        U: o,
        T: i
      };
      s = /* @__PURE__ */ new Map();
      for (let I in c) {
        let M = 0;
        c[I].split(",").forEach((J) => {
          let [y, A] = J.split("+");
          y = parseInt(y, 36), A = A ? parseInt(A, 36) : 0, s.set(M += y, C[I]);
          for (let k = A; k--; )
            s.set(++M, C[I]);
        });
      }
    }
    return s.get(x) || o;
  }
  const l = 1, h = 2, p = 3, g = 4, m = [null, "isol", "init", "fina", "medi"];
  function O(x) {
    const C = new Uint8Array(x.length);
    let I = o, M = l, J = -1;
    for (let y = 0; y < x.length; y++) {
      const A = x.codePointAt(y);
      let k = f(A) | 0, X = l;
      k & i || (I & (r | a | n) ? k & (e | a | n) ? (X = p, (M === l || M === p) && C[J]++) : k & (r | o) && (M === h || M === g) && C[J]-- : I & (e | o) && (M === h || M === g) && C[J]--, M = C[y] = X, I = k, J = y, A > 65535 && y++);
    }
    return C;
  }
  function S(x, C) {
    const I = [];
    for (let J = 0; J < C.length; J++) {
      const y = C.codePointAt(J);
      y > 65535 && J++, I.push(u.U.codeToGlyph(x, y));
    }
    const M = x.GSUB;
    if (M) {
      const { lookupList: J, featureList: y } = M;
      let A;
      const k = /^(rlig|liga|mset|isol|init|fina|medi|half|pres|blws|ccmp)$/, X = [];
      y.forEach((z) => {
        if (k.test(z.tag))
          for (let Z = 0; Z < z.tab.length; Z++) {
            if (X[z.tab[Z]]) continue;
            X[z.tab[Z]] = !0;
            const te = J[z.tab[Z]], B = /^(isol|init|fina|medi)$/.test(z.tag);
            B && !A && (A = O(C));
            for (let G = 0; G < I.length; G++)
              (!A || !B || m[A[G]] === z.tag) && u.U._applySubs(I, G, te, J);
          }
      });
    }
    return I;
  }
  function F(x, C) {
    const I = new Int16Array(C.length * 3);
    let M = 0;
    for (; M < C.length; M++) {
      const k = C[M];
      if (k === -1) continue;
      I[M * 3 + 2] = x.hmtx.aWidth[k];
      const X = x.GPOS;
      if (X) {
        const z = X.lookupList;
        for (let Z = 0; Z < z.length; Z++) {
          const te = z[Z];
          for (let B = 0; B < te.tabs.length; B++) {
            const G = te.tabs[B];
            if (te.ltype === 1) {
              if (u._lctf.coverageIndex(G.coverage, k) !== -1 && G.pos) {
                A(G.pos, M);
                break;
              }
            } else if (te.ltype === 2) {
              let v = null, b = J();
              if (b !== -1) {
                const T = u._lctf.coverageIndex(G.coverage, C[b]);
                if (T !== -1) {
                  if (G.fmt === 1) {
                    const D = G.pairsets[T];
                    for (let _ = 0; _ < D.length; _++)
                      D[_].gid2 === k && (v = D[_]);
                  } else if (G.fmt === 2) {
                    const D = u.U._getGlyphClass(C[b], G.classDef1), _ = u.U._getGlyphClass(k, G.classDef2);
                    v = G.matrix[D][_];
                  }
                  if (v) {
                    v.val1 && A(v.val1, b), v.val2 && A(v.val2, M);
                    break;
                  }
                }
              }
            } else if (te.ltype === 4) {
              const v = u._lctf.coverageIndex(G.markCoverage, k);
              if (v !== -1) {
                const b = J(y), T = b === -1 ? -1 : u._lctf.coverageIndex(G.baseCoverage, C[b]);
                if (T !== -1) {
                  const D = G.markArray[v], _ = G.baseArray[T][D.markClass];
                  I[M * 3] = _.x - D.x + I[b * 3] - I[b * 3 + 2], I[M * 3 + 1] = _.y - D.y + I[b * 3 + 1];
                  break;
                }
              }
            } else if (te.ltype === 6) {
              const v = u._lctf.coverageIndex(G.mark1Coverage, k);
              if (v !== -1) {
                const b = J();
                if (b !== -1) {
                  const T = C[b];
                  if (U(x, T) === 3) {
                    const D = u._lctf.coverageIndex(G.mark2Coverage, T);
                    if (D !== -1) {
                      const _ = G.mark1Array[v], N = G.mark2Array[D][_.markClass];
                      I[M * 3] = N.x - _.x + I[b * 3] - I[b * 3 + 2], I[M * 3 + 1] = N.y - _.y + I[b * 3 + 1];
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      } else if (x.kern && !x.cff) {
        const z = J();
        if (z !== -1) {
          const Z = x.kern.glyph1.indexOf(C[z]);
          if (Z !== -1) {
            const te = x.kern.rval[Z].glyph2.indexOf(k);
            te !== -1 && (I[z * 3 + 2] += x.kern.rval[Z].vals[te]);
          }
        }
      }
    }
    return I;
    function J(k) {
      for (let X = M - 1; X >= 0; X--)
        if (C[X] !== -1 && (!k || k(C[X])))
          return X;
      return -1;
    }
    function y(k) {
      return U(x, k) === 1;
    }
    function A(k, X) {
      for (let z = 0; z < 3; z++)
        I[X * 3 + z] += k[z] || 0;
    }
  }
  function U(x, C) {
    const I = x.GDEF && x.GDEF.glyphClassDef;
    return I ? u.U._getGlyphClass(C, I) : 0;
  }
  function w(...x) {
    for (let C = 0; C < x.length; C++)
      if (typeof x[C] == "number")
        return x[C];
  }
  function R(x) {
    const C = /* @__PURE__ */ Object.create(null), I = x["OS/2"], M = x.hhea, J = x.head.unitsPerEm, y = w(I && I.sTypoAscender, M && M.ascender, J), A = {
      unitsPerEm: J,
      ascender: y,
      descender: w(I && I.sTypoDescender, M && M.descender, 0),
      capHeight: w(I && I.sCapHeight, y),
      xHeight: w(I && I.sxHeight, y),
      lineGap: w(I && I.sTypoLineGap, M && M.lineGap),
      supportsCodePoint(k) {
        return u.U.codeToGlyph(x, k) > 0;
      },
      forEachGlyph(k, X, z, Z) {
        let te = 0;
        const B = 1 / A.unitsPerEm * X, G = S(x, k);
        let v = 0;
        const b = F(x, G);
        return G.forEach((T, D) => {
          if (T !== -1) {
            let _ = C[T];
            if (!_) {
              const { cmds: N, crds: E } = u.U.glyphToPath(x, T);
              let P = "", H = 0;
              for (let ue = 0, Q = N.length; ue < Q; ue++) {
                const ee = d[N[ue]];
                P += N[ue];
                for (let se = 1; se <= ee; se++)
                  P += (se > 1 ? "," : "") + E[H++];
              }
              let $, V, W, pe;
              if (E.length) {
                $ = V = 1 / 0, W = pe = -1 / 0;
                for (let ue = 0, Q = E.length; ue < Q; ue += 2) {
                  let ee = E[ue], se = E[ue + 1];
                  ee < $ && ($ = ee), se < V && (V = se), ee > W && (W = ee), se > pe && (pe = se);
                }
              } else
                $ = W = V = pe = 0;
              _ = C[T] = {
                index: T,
                advanceWidth: x.hmtx.aWidth[T],
                xMin: $,
                yMin: V,
                xMax: W,
                yMax: pe,
                path: P
              };
            }
            Z.call(
              null,
              _,
              te + b[D * 3] * B,
              b[D * 3 + 1] * B,
              v
            ), te += b[D * 3 + 2] * B, z && (te += z * X);
          }
          v += k.codePointAt(v) > 65535 ? 2 : 1;
        }), te;
      }
    };
    return A;
  }
  return function(C) {
    const I = new Uint8Array(C, 0, 4), M = u._bin.readASCII(I, 0, 4);
    if (M === "wOFF")
      C = t(C);
    else if (M === "wOF2")
      throw new Error("woff2 fonts not supported");
    return R(u.parse(C)[0]);
  };
}
const ca = /* @__PURE__ */ sr({
  name: "Typr Font Parser",
  dependencies: [fa, la, ua],
  init(u, t, d) {
    const c = u(), r = t();
    return d(c, r);
  }
});
/*!
Custom bundle of @unicode-font-resolver/client v1.0.2 (https://github.com/lojjic/unicode-font-resolver)
for use in Troika text rendering. 
Original MIT license applies
*/
function ha() {
  return function(u) {
    var t = function() {
      this.buckets = /* @__PURE__ */ new Map();
    };
    t.prototype.add = function(F) {
      var U = F >> 5;
      this.buckets.set(U, (this.buckets.get(U) || 0) | 1 << (31 & F));
    }, t.prototype.has = function(F) {
      var U = this.buckets.get(F >> 5);
      return U !== void 0 && (U & 1 << (31 & F)) != 0;
    }, t.prototype.serialize = function() {
      var F = [];
      return this.buckets.forEach(function(U, w) {
        F.push((+w).toString(36) + ":" + U.toString(36));
      }), F.join(",");
    }, t.prototype.deserialize = function(F) {
      var U = this;
      this.buckets.clear(), F.split(",").forEach(function(w) {
        var R = w.split(":");
        U.buckets.set(parseInt(R[0], 36), parseInt(R[1], 36));
      });
    };
    var d = Math.pow(2, 8), c = d - 1, r = ~c;
    function e(F) {
      var U = function(R) {
        return R & r;
      }(F).toString(16), w = function(R) {
        return (R & r) + d - 1;
      }(F).toString(16);
      return "codepoint-index/plane" + (F >> 16) + "/" + U + "-" + w + ".json";
    }
    function a(F, U) {
      var w = F & c, R = U.codePointAt(w / 6 | 0);
      return ((R = (R || 48) - 48) & 1 << w % 6) != 0;
    }
    function i(F, U) {
      var w;
      (w = F, w.replace(/U\+/gi, "").replace(/^,+|,+$/g, "").split(/,+/).map(function(R) {
        return R.split("-").map(function(x) {
          return parseInt(x.trim(), 16);
        });
      })).forEach(function(R) {
        var x = R[0], C = R[1];
        C === void 0 && (C = x), U(x, C);
      });
    }
    function n(F, U) {
      i(F, function(w, R) {
        for (var x = w; x <= R; x++) U(x);
      });
    }
    var o = {}, s = {}, f = /* @__PURE__ */ new WeakMap(), l = "https://cdn.jsdelivr.net/gh/lojjic/unicode-font-resolver@v1.0.1/packages/data";
    function h(F) {
      var U = f.get(F);
      return U || (U = new t(), n(F.ranges, function(w) {
        return U.add(w);
      }), f.set(F, U)), U;
    }
    var p, g = /* @__PURE__ */ new Map();
    function m(F, U, w) {
      return F[U] ? U : F[w] ? w : function(R) {
        for (var x in R) return x;
      }(F);
    }
    function O(F, U) {
      var w = U;
      if (!F.includes(w)) {
        w = 1 / 0;
        for (var R = 0; R < F.length; R++) Math.abs(F[R] - U) < Math.abs(w - U) && (w = F[R]);
      }
      return w;
    }
    function S(F) {
      return p || (p = /* @__PURE__ */ new Set(), n("9-D,20,85,A0,1680,2000-200A,2028-202F,205F,3000", function(U) {
        p.add(U);
      })), p.has(F);
    }
    return u.CodePointSet = t, u.clearCache = function() {
      o = {}, s = {};
    }, u.getFontsForString = function(F, U) {
      U === void 0 && (U = {});
      var w, R = U.lang;
      R === void 0 && (R = new RegExp("\\p{Script=Hangul}", "u").test(w = F) ? "ko" : new RegExp("\\p{Script=Hiragana}|\\p{Script=Katakana}", "u").test(w) ? "ja" : "en");
      var x = U.category;
      x === void 0 && (x = "sans-serif");
      var C = U.style;
      C === void 0 && (C = "normal");
      var I = U.weight;
      I === void 0 && (I = 400);
      var M = (U.dataUrl || l).replace(/\/$/g, ""), J = /* @__PURE__ */ new Map(), y = new Uint8Array(F.length), A = {}, k = {}, X = new Array(F.length), z = /* @__PURE__ */ new Map(), Z = !1;
      function te(v) {
        var b = g.get(v);
        return b || (b = fetch(M + "/" + v).then(function(T) {
          if (!T.ok) throw new Error(T.statusText);
          return T.json().then(function(D) {
            if (!Array.isArray(D) || D[0] !== 1) throw new Error("Incorrect schema version; need 1, got " + D[0]);
            return D[1];
          });
        }).catch(function(T) {
          if (M !== l) return Z || (console.error('unicode-font-resolver: Failed loading from dataUrl "' + M + '", trying default CDN. ' + T.message), Z = !0), M = l, g.delete(v), te(v);
          throw T;
        }), g.set(v, b)), b;
      }
      for (var B = function(v) {
        var b = F.codePointAt(v), T = e(b);
        X[v] = T, o[T] || z.has(T) || z.set(T, te(T).then(function(D) {
          o[T] = D;
        })), b > 65535 && (v++, G = v);
      }, G = 0; G < F.length; G++) B(G);
      return Promise.all(z.values()).then(function() {
        z.clear();
        for (var v = function(T) {
          var D = F.codePointAt(T), _ = null, N = o[X[T]], E = void 0;
          for (var P in N) {
            var H = k[P];
            if (H === void 0 && (H = k[P] = new RegExp(P).test(R || "en")), H) {
              for (var $ in E = P, N[P]) if (a(D, N[P][$])) {
                _ = $;
                break;
              }
              break;
            }
          }
          if (!_) {
            e: for (var V in N) if (V !== E) {
              for (var W in N[V]) if (a(D, N[V][W])) {
                _ = W;
                break e;
              }
            }
          }
          _ || (console.debug("No font coverage for U+" + D.toString(16)), _ = "latin"), X[T] = _, s[_] || z.has(_) || z.set(_, te("font-meta/" + _ + ".json").then(function(pe) {
            s[_] = pe;
          })), D > 65535 && (T++, b = T);
        }, b = 0; b < F.length; b++) v(b);
        return Promise.all(z.values());
      }).then(function() {
        for (var v, b = null, T = 0; T < F.length; T++) {
          var D = F.codePointAt(T);
          if (b && (S(D) || h(b).has(D))) y[T] = y[T - 1];
          else {
            b = s[X[T]];
            var _ = A[b.id];
            if (!_) {
              var N = b.typeforms, E = m(N, x, "sans-serif"), P = m(N[E], C, "normal"), H = O((v = N[E]) === null || v === void 0 ? void 0 : v[P], I);
              _ = A[b.id] = M + "/font-files/" + b.id + "/" + E + "." + P + "." + H + ".woff";
            }
            var $ = J.get(_);
            $ == null && ($ = J.size, J.set(_, $)), y[T] = $;
          }
          D > 65535 && (T++, y[T] = y[T - 1]);
        }
        return { fontUrls: Array.from(J.keys()), chars: y };
      });
    }, Object.defineProperty(u, "__esModule", { value: !0 }), u;
  }({});
}
function da(u, t) {
  const d = /* @__PURE__ */ Object.create(null), c = /* @__PURE__ */ Object.create(null);
  function r(a, i) {
    const n = (o) => {
      console.error(`Failure loading font ${a}`, o);
    };
    try {
      const o = new XMLHttpRequest();
      o.open("get", a, !0), o.responseType = "arraybuffer", o.onload = function() {
        if (o.status >= 400)
          n(new Error(o.statusText));
        else if (o.status > 0)
          try {
            const s = u(o.response);
            s.src = a, i(s);
          } catch (s) {
            n(s);
          }
      }, o.onerror = n, o.send();
    } catch (o) {
      n(o);
    }
  }
  function e(a, i) {
    let n = d[a];
    n ? i(n) : c[a] ? c[a].push(i) : (c[a] = [i], r(a, (o) => {
      o.src = a, d[a] = o, c[a].forEach((s) => s(o)), delete c[a];
    }));
  }
  return function(a, i, {
    lang: n,
    fonts: o = [],
    style: s = "normal",
    weight: f = "normal",
    unicodeFontsURL: l
  } = {}) {
    const h = new Uint8Array(a.length), p = [];
    a.length || S();
    const g = /* @__PURE__ */ new Map(), m = [];
    if (s !== "italic" && (s = "normal"), typeof f != "number" && (f = f === "bold" ? 700 : 400), o && !Array.isArray(o) && (o = [o]), o = o.slice().filter((U) => !U.lang || U.lang.test(n)).reverse(), o.length) {
      let x = 0;
      (function C(I = 0) {
        for (let M = I, J = a.length; M < J; M++) {
          const y = a.codePointAt(M);
          if (x === 1 && p[h[M - 1]].supportsCodePoint(y) || M > 0 && /\s/.test(a[M]))
            h[M] = h[M - 1], x === 2 && (m[m.length - 1][1] = M);
          else
            for (let A = h[M], k = o.length; A <= k; A++)
              if (A === k) {
                const X = x === 2 ? m[m.length - 1] : m[m.length] = [M, M];
                X[1] = M, x = 2;
              } else {
                h[M] = A;
                const { src: X, unicodeRange: z } = o[A];
                if (!z || F(y, z)) {
                  const Z = d[X];
                  if (!Z) {
                    e(X, () => {
                      C(M);
                    });
                    return;
                  }
                  if (Z.supportsCodePoint(y)) {
                    let te = g.get(Z);
                    typeof te != "number" && (te = p.length, p.push(Z), g.set(Z, te)), h[M] = te, x = 1;
                    break;
                  }
                }
              }
          y > 65535 && M + 1 < J && (h[M + 1] = h[M], M++, x === 2 && (m[m.length - 1][1] = M));
        }
        O();
      })();
    } else
      m.push([0, a.length - 1]), O();
    function O() {
      if (m.length) {
        const U = m.map((w) => a.substring(w[0], w[1] + 1)).join(`
`);
        t.getFontsForString(U, {
          lang: n || void 0,
          style: s,
          weight: f,
          dataUrl: l
        }).then(({ fontUrls: w, chars: R }) => {
          const x = p.length;
          let C = 0;
          m.forEach((M) => {
            for (let J = 0, y = M[1] - M[0]; J <= y; J++)
              h[M[0] + J] = R[C++] + x;
            C++;
          });
          let I = 0;
          w.forEach((M, J) => {
            e(M, (y) => {
              p[J + x] = y, ++I === w.length && S();
            });
          });
        });
      } else
        S();
    }
    function S() {
      i({
        chars: h,
        fonts: p
      });
    }
    function F(U, w) {
      for (let R = 0; R < w.length; R++) {
        const [x, C = x] = w[R];
        if (x <= U && U <= C)
          return !0;
      }
      return !1;
    }
  };
}
const va = /* @__PURE__ */ sr({
  name: "FontResolver",
  dependencies: [
    da,
    ca,
    ha
  ],
  init(u, t, d) {
    return u(t, d());
  }
});
function pa(u, t) {
  const c = /[\u00AD\u034F\u061C\u115F-\u1160\u17B4-\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8]/, r = "[^\\S\\u00A0]", e = new RegExp(`${r}|[\\-\\u007C\\u00AD\\u2010\\u2012-\\u2014\\u2027\\u2056\\u2E17\\u2E40]`);
  function a({ text: p, lang: g, fonts: m, style: O, weight: S, preResolvedFonts: F, unicodeFontsURL: U }, w) {
    const R = ({ chars: x, fonts: C }) => {
      let I, M;
      const J = [];
      for (let y = 0; y < x.length; y++)
        x[y] !== M ? (M = x[y], J.push(I = { start: y, end: y, fontObj: C[x[y]] })) : I.end = y;
      w(J);
    };
    F ? R(F) : u(
      p,
      R,
      { lang: g, fonts: m, style: O, weight: S, unicodeFontsURL: U }
    );
  }
  function i({
    text: p = "",
    font: g,
    lang: m,
    sdfGlyphSize: O = 64,
    fontSize: S = 400,
    fontWeight: F = 1,
    fontStyle: U = "normal",
    letterSpacing: w = 0,
    lineHeight: R = "normal",
    maxWidth: x = 1 / 0,
    direction: C,
    textAlign: I = "left",
    textIndent: M = 0,
    whiteSpace: J = "normal",
    overflowWrap: y = "normal",
    anchorX: A = 0,
    anchorY: k = 0,
    metricsOnly: X = !1,
    unicodeFontsURL: z,
    preResolvedFonts: Z = null,
    includeCaretPositions: te = !1,
    chunkedBoundsSize: B = 8192,
    colorRanges: G = null
  }, v) {
    const b = f(), T = { fontLoad: 0, typesetting: 0 };
    p.indexOf("\r") > -1 && (console.info("Typesetter: got text with \\r chars; normalizing to \\n"), p = p.replace(/\r\n/g, `
`).replace(/\r/g, `
`)), S = +S, w = +w, x = +x, R = R || "normal", M = +M, a({
      text: p,
      lang: m,
      style: U,
      weight: F,
      fonts: typeof g == "string" ? [{ src: g }] : g,
      unicodeFontsURL: z,
      preResolvedFonts: Z
    }, (D) => {
      T.fontLoad = f() - b;
      const _ = isFinite(x);
      let N = null, E = null, P = null, H = null, $ = null, V = null, W = null, pe = null, ue = 0, Q = 0, ee = J !== "nowrap";
      const se = /* @__PURE__ */ new Map(), j = f();
      let re = M, q = 0, L = new l();
      const he = [L];
      D.forEach((ne) => {
        const { fontObj: oe } = ne, { ascender: le, descender: de, unitsPerEm: xe, lineGap: Fe, capHeight: ge, xHeight: me } = oe;
        let fe = se.get(oe);
        if (!fe) {
          const ce = S / xe, Ue = R === "normal" ? (le - de + Fe) * ce : R * S, Xe = (Ue - (le - de) * ce) / 2, _e = Math.min(Ue, (le - de) * ce), ye = (le + de) / 2 * ce + _e / 2;
          fe = {
            index: se.size,
            src: oe.src,
            fontObj: oe,
            fontSizeMult: ce,
            unitsPerEm: xe,
            ascender: le * ce,
            descender: de * ce,
            capHeight: ge * ce,
            xHeight: me * ce,
            lineHeight: Ue,
            baseline: -Xe - le * ce,
            // baseline offset from top of line height
            // cap: -halfLeading - capHeight * fontSizeMult, // cap from top of line height
            // ex: -halfLeading - xHeight * fontSizeMult, // ex from top of line height
            caretTop: ye,
            caretBottom: ye - _e
          }, se.set(oe, fe);
        }
        const { fontSizeMult: Ce } = fe, Te = p.slice(ne.start, ne.end + 1);
        let Oe, Se;
        oe.forEachGlyph(Te, S, w, (ce, Ue, Xe, _e) => {
          Ue += q, _e += ne.start, Oe = Ue, Se = ce;
          const ye = p.charAt(_e), De = ce.advanceWidth * Ce, we = L.count;
          let ve;
          if ("isEmpty" in ce || (ce.isWhitespace = !!ye && new RegExp(r).test(ye), ce.canBreakAfter = !!ye && e.test(ye), ce.isEmpty = ce.xMin === ce.xMax || ce.yMin === ce.yMax || c.test(ye)), !ce.isWhitespace && !ce.isEmpty && Q++, ee && _ && !ce.isWhitespace && Ue + De + re > x && we) {
            if (L.glyphAt(we - 1).glyphObj.canBreakAfter)
              ve = new l(), re = -Ue;
            else
              for (let Ge = we; Ge--; )
                if (Ge === 0 && y === "break-word") {
                  ve = new l(), re = -Ue;
                  break;
                } else if (L.glyphAt(Ge).glyphObj.canBreakAfter) {
                  ve = L.splitAt(Ge + 1);
                  const Me = ve.glyphAt(0).x;
                  re -= Me;
                  for (let Ae = ve.count; Ae--; )
                    ve.glyphAt(Ae).x -= Me;
                  break;
                }
            ve && (L.isSoftWrapped = !0, L = ve, he.push(L), ue = x);
          }
          let ke = L.glyphAt(L.count);
          ke.glyphObj = ce, ke.x = Ue + re, ke.y = Xe, ke.width = De, ke.charIndex = _e, ke.fontData = fe, ye === `
` && (L = new l(), he.push(L), re = -(Ue + De + w * S) + M);
        }), q = Oe + Se.advanceWidth * Ce + w * S;
      });
      let K = 0;
      he.forEach((ne) => {
        let oe = !0;
        for (let le = ne.count; le--; ) {
          const de = ne.glyphAt(le);
          oe && !de.glyphObj.isWhitespace && (ne.width = de.x + de.width, ne.width > ue && (ue = ne.width), oe = !1);
          let { lineHeight: xe, capHeight: Fe, xHeight: ge, baseline: me } = de.fontData;
          xe > ne.lineHeight && (ne.lineHeight = xe);
          const fe = me - ne.baseline;
          fe < 0 && (ne.baseline += fe, ne.cap += fe, ne.ex += fe), ne.cap = Math.max(ne.cap, ne.baseline + Fe), ne.ex = Math.max(ne.ex, ne.baseline + ge);
        }
        ne.baseline -= K, ne.cap -= K, ne.ex -= K, K += ne.lineHeight;
      });
      let ae = 0, Y = 0;
      if (A && (typeof A == "number" ? ae = -A : typeof A == "string" && (ae = -ue * (A === "left" ? 0 : A === "center" ? 0.5 : A === "right" ? 1 : o(A)))), k && (typeof k == "number" ? Y = -k : typeof k == "string" && (Y = k === "top" ? 0 : k === "top-baseline" ? -he[0].baseline : k === "top-cap" ? -he[0].cap : k === "top-ex" ? -he[0].ex : k === "middle" ? K / 2 : k === "bottom" ? K : k === "bottom-baseline" ? -he[he.length - 1].baseline : o(k) * K)), !X) {
        const ne = t.getEmbeddingLevels(p, C);
        N = new Uint16Array(Q), E = new Uint8Array(Q), P = new Float32Array(Q * 2), H = {}, W = [1 / 0, 1 / 0, -1 / 0, -1 / 0], pe = [], te && (V = new Float32Array(p.length * 4)), G && ($ = new Uint8Array(Q * 3));
        let oe = 0, le = -1, de = -1, xe, Fe;
        if (he.forEach((ge, me) => {
          let { count: fe, width: Ce } = ge;
          if (fe > 0) {
            let Te = 0;
            for (let _e = fe; _e-- && ge.glyphAt(_e).glyphObj.isWhitespace; )
              Te++;
            let Oe = 0, Se = 0;
            if (I === "center")
              Oe = (ue - Ce) / 2;
            else if (I === "right")
              Oe = ue - Ce;
            else if (I === "justify" && ge.isSoftWrapped) {
              let _e = 0;
              for (let ye = fe - Te; ye--; )
                ge.glyphAt(ye).glyphObj.isWhitespace && _e++;
              Se = (ue - Ce) / _e;
            }
            if (Se || Oe) {
              let _e = 0;
              for (let ye = 0; ye < fe; ye++) {
                let De = ge.glyphAt(ye);
                const we = De.glyphObj;
                De.x += Oe + _e, Se !== 0 && we.isWhitespace && ye < fe - Te && (_e += Se, De.width += Se);
              }
            }
            const ce = t.getReorderSegments(
              p,
              ne,
              ge.glyphAt(0).charIndex,
              ge.glyphAt(ge.count - 1).charIndex
            );
            for (let _e = 0; _e < ce.length; _e++) {
              const [ye, De] = ce[_e];
              let we = 1 / 0, ve = -1 / 0;
              for (let ke = 0; ke < fe; ke++)
                if (ge.glyphAt(ke).charIndex >= ye) {
                  let Ge = ke, Me = ke;
                  for (; Me < fe; Me++) {
                    let Ae = ge.glyphAt(Me);
                    if (Ae.charIndex > De)
                      break;
                    Me < fe - Te && (we = Math.min(we, Ae.x), ve = Math.max(ve, Ae.x + Ae.width));
                  }
                  for (let Ae = Ge; Ae < Me; Ae++) {
                    const Ie = ge.glyphAt(Ae);
                    Ie.x = ve - (Ie.x + Ie.width - we);
                  }
                  break;
                }
            }
            let Ue;
            const Xe = (_e) => Ue = _e;
            for (let _e = 0; _e < fe; _e++) {
              const ye = ge.glyphAt(_e);
              Ue = ye.glyphObj;
              const De = Ue.index, we = ne.levels[ye.charIndex] & 1;
              if (we) {
                const ve = t.getMirroredCharacter(p[ye.charIndex]);
                ve && ye.fontData.fontObj.forEachGlyph(ve, 0, 0, Xe);
              }
              if (te) {
                const { charIndex: ve, fontData: ke } = ye, Ge = ye.x + ae, Me = ye.x + ye.width + ae;
                V[ve * 4] = we ? Me : Ge, V[ve * 4 + 1] = we ? Ge : Me, V[ve * 4 + 2] = ge.baseline + ke.caretBottom + Y, V[ve * 4 + 3] = ge.baseline + ke.caretTop + Y;
                const Ae = ve - le;
                Ae > 1 && s(V, le, Ae), le = ve;
              }
              if (G) {
                const { charIndex: ve } = ye;
                for (; ve > de; )
                  de++, G.hasOwnProperty(de) && (Fe = G[de]);
              }
              if (!Ue.isWhitespace && !Ue.isEmpty) {
                const ve = oe++, { fontSizeMult: ke, src: Ge, index: Me } = ye.fontData, Ae = H[Ge] || (H[Ge] = {});
                Ae[De] || (Ae[De] = {
                  path: Ue.path,
                  pathBounds: [Ue.xMin, Ue.yMin, Ue.xMax, Ue.yMax]
                });
                const Ie = ye.x + ae, He = ye.y + ge.baseline + Y;
                P[ve * 2] = Ie, P[ve * 2 + 1] = He;
                const je = Ie + Ue.xMin * ke, Ye = He + Ue.yMin * ke, Qe = Ie + Ue.xMax * ke, Ve = He + Ue.yMax * ke;
                je < W[0] && (W[0] = je), Ye < W[1] && (W[1] = Ye), Qe > W[2] && (W[2] = Qe), Ve > W[3] && (W[3] = Ve), ve % B === 0 && (xe = { start: ve, end: ve, rect: [1 / 0, 1 / 0, -1 / 0, -1 / 0] }, pe.push(xe)), xe.end++;
                const Re = xe.rect;
                if (je < Re[0] && (Re[0] = je), Ye < Re[1] && (Re[1] = Ye), Qe > Re[2] && (Re[2] = Qe), Ve > Re[3] && (Re[3] = Ve), N[ve] = De, E[ve] = Me, G) {
                  const Ze = ve * 3;
                  $[Ze] = Fe >> 16 & 255, $[Ze + 1] = Fe >> 8 & 255, $[Ze + 2] = Fe & 255;
                }
              }
            }
          }
        }), V) {
          const ge = p.length - le;
          ge > 1 && s(V, le, ge);
        }
      }
      const be = [];
      se.forEach(({ index: ne, src: oe, unitsPerEm: le, ascender: de, descender: xe, lineHeight: Fe, capHeight: ge, xHeight: me }) => {
        be[ne] = { src: oe, unitsPerEm: le, ascender: de, descender: xe, lineHeight: Fe, capHeight: ge, xHeight: me };
      }), T.typesetting = f() - j, v({
        glyphIds: N,
        //id for each glyph, specific to that glyph's font
        glyphFontIndices: E,
        //index into fontData for each glyph
        glyphPositions: P,
        //x,y of each glyph's origin in layout
        glyphData: H,
        //dict holding data about each glyph appearing in the text
        fontData: be,
        //data about each font used in the text
        caretPositions: V,
        //startX,endX,bottomY caret positions for each char
        // caretHeight, //height of cursor from bottom to top - todo per glyph?
        glyphColors: $,
        //color for each glyph, if color ranges supplied
        chunkedBounds: pe,
        //total rects per (n=chunkedBoundsSize) consecutive glyphs
        fontSize: S,
        //calculated em height
        topBaseline: Y + he[0].baseline,
        //y coordinate of the top line's baseline
        blockBounds: [
          //bounds for the whole block of text, including vertical padding for lineHeight
          ae,
          Y - K,
          ae + ue,
          Y
        ],
        visibleBounds: W,
        //total bounds of visible text paths, may be larger or smaller than blockBounds
        timings: T
      });
    });
  }
  function n(p, g) {
    i({ ...p, metricsOnly: !0 }, (m) => {
      const [O, S, F, U] = m.blockBounds;
      g({
        width: F - O,
        height: U - S
      });
    });
  }
  function o(p) {
    let g = p.match(/^([\d.]+)%$/), m = g ? parseFloat(g[1]) : NaN;
    return isNaN(m) ? 0 : m / 100;
  }
  function s(p, g, m) {
    const O = p[g * 4], S = p[g * 4 + 1], F = p[g * 4 + 2], U = p[g * 4 + 3], w = (S - O) / m;
    for (let R = 0; R < m; R++) {
      const x = (g + R) * 4;
      p[x] = O + w * R, p[x + 1] = O + w * (R + 1), p[x + 2] = F, p[x + 3] = U;
    }
  }
  function f() {
    return (self.performance || Date).now();
  }
  function l() {
    this.data = [];
  }
  const h = ["glyphObj", "x", "y", "width", "charIndex", "fontData"];
  return l.prototype = {
    width: 0,
    lineHeight: 0,
    baseline: 0,
    cap: 0,
    ex: 0,
    isSoftWrapped: !1,
    get count() {
      return Math.ceil(this.data.length / h.length);
    },
    glyphAt(p) {
      let g = l.flyweight;
      return g.data = this.data, g.index = p, g;
    },
    splitAt(p) {
      let g = new l();
      return g.data = this.data.splice(p * h.length), g;
    }
  }, l.flyweight = h.reduce((p, g, m, O) => (Object.defineProperty(p, g, {
    get() {
      return this.data[this.index * h.length + m];
    },
    set(S) {
      this.data[this.index * h.length + m] = S;
    }
  }), p), { data: null, index: 0 }), {
    typeset: i,
    measure: n
  };
}
const er = () => (self.performance || Date).now(), jr = /* @__PURE__ */ un();
let qt;
function ga(u, t, d, c, r, e, a, i, n, o, s = !0) {
  return s ? ya(u, t, d, c, r, e, a, i, n, o).then(
    null,
    (f) => (qt || (console.warn("WebGL SDF generation failed, falling back to JS", f), qt = !0), en(u, t, d, c, r, e, a, i, n, o))
  ) : en(u, t, d, c, r, e, a, i, n, o);
}
const Nr = [], ma = 5;
let gt = 0;
function hn() {
  const u = er();
  for (; Nr.length && er() - u < ma; )
    Nr.shift()();
  gt = Nr.length ? setTimeout(hn, 0) : 0;
}
const ya = (...u) => new Promise((t, d) => {
  Nr.push(() => {
    const c = er();
    try {
      jr.webgl.generateIntoCanvas(...u), t({ timing: er() - c });
    } catch (r) {
      d(r);
    }
  }), gt || (gt = setTimeout(hn, 0));
}), ba = 4, Ua = 2e3, $t = {};
let _a = 0;
function en(u, t, d, c, r, e, a, i, n, o) {
  const s = "TroikaTextSDFGenerator_JS_" + _a++ % ba;
  let f = $t[s];
  return f || (f = $t[s] = {
    workerModule: sr({
      name: s,
      workerId: s,
      dependencies: [
        un,
        er
      ],
      init(l, h) {
        const p = l().javascript.generate;
        return function(...g) {
          const m = h();
          return {
            textureData: p(...g),
            timing: h() - m
          };
        };
      },
      getTransferables(l) {
        return [l.textureData.buffer];
      }
    }),
    requests: 0,
    idleTimer: null
  }), f.requests++, clearTimeout(f.idleTimer), f.workerModule(u, t, d, c, r, e).then(({ textureData: l, timing: h }) => {
    const p = er(), g = new Uint8Array(l.length * 4);
    for (let m = 0; m < l.length; m++)
      g[m * 4 + o] = l[m];
    return jr.webglUtils.renderImageData(a, g, i, n, u, t, 1 << 3 - o), h += er() - p, --f.requests === 0 && (f.idleTimer = setTimeout(() => {
      qn(s);
    }, Ua)), { timing: h };
  });
}
function xa(u) {
  u._warm || (jr.webgl.isSupported(u), u._warm = !0);
}
const Sa = jr.webglUtils.resizeWebGLCanvasWithoutClearing, Ur = {
  unicodeFontsURL: null,
  sdfGlyphSize: 64,
  sdfMargin: 1 / 16,
  sdfExponent: 9,
  textureWidth: 2048
}, Ta = /* @__PURE__ */ new zr();
function or() {
  return (self.performance || Date).now();
}
const rn = /* @__PURE__ */ Object.create(null);
function dn(u, t) {
  u = Fa({}, u);
  const d = or(), c = [];
  if (u.font && c.push({ label: "user", src: Ca(u.font) }), u.font = c, u.text = "" + u.text, u.sdfGlyphSize = u.sdfGlyphSize || Ur.sdfGlyphSize, u.unicodeFontsURL = u.unicodeFontsURL || Ur.unicodeFontsURL, u.colorRanges != null) {
    let l = {};
    for (let h in u.colorRanges)
      if (u.colorRanges.hasOwnProperty(h)) {
        let p = u.colorRanges[h];
        typeof p != "number" && (p = Ta.set(p).getHex()), l[h] = p;
      }
    u.colorRanges = l;
  }
  Object.freeze(u);
  const { textureWidth: r, sdfExponent: e } = Ur, { sdfGlyphSize: a } = u, i = r / a * 4;
  let n = rn[a];
  if (!n) {
    const l = document.createElement("canvas");
    l.width = r, l.height = a * 256 / i, n = rn[a] = {
      glyphCount: 0,
      sdfGlyphSize: a,
      sdfCanvas: l,
      sdfTexture: new In(
        l,
        void 0,
        void 0,
        void 0,
        zt,
        zt
      ),
      contextLost: !1,
      glyphsByFont: /* @__PURE__ */ new Map()
    }, n.sdfTexture.generateMipmaps = !1, wa(n);
  }
  const { sdfTexture: o, sdfCanvas: s } = n;
  gn(u).then((l) => {
    const { glyphIds: h, glyphFontIndices: p, fontData: g, glyphPositions: m, fontSize: O, timings: S } = l, F = [], U = new Float32Array(h.length * 4);
    let w = 0, R = 0;
    const x = or(), C = g.map((A) => {
      let k = n.glyphsByFont.get(A.src);
      return k || n.glyphsByFont.set(A.src, k = /* @__PURE__ */ new Map()), k;
    });
    h.forEach((A, k) => {
      const X = p[k], { src: z, unitsPerEm: Z } = g[X];
      let te = C[X].get(A);
      if (!te) {
        const { path: T, pathBounds: D } = l.glyphData[z][A], _ = Math.max(D[2] - D[0], D[3] - D[1]) / a * (Ur.sdfMargin * a + 0.5), N = n.glyphCount++, E = [
          D[0] - _,
          D[1] - _,
          D[2] + _,
          D[3] + _
        ];
        C[X].set(A, te = { path: T, atlasIndex: N, sdfViewBox: E }), F.push(te);
      }
      const { sdfViewBox: B } = te, G = m[R++], v = m[R++], b = O / Z;
      U[w++] = G + B[0] * b, U[w++] = v + B[1] * b, U[w++] = G + B[2] * b, U[w++] = v + B[3] * b, h[k] = te.atlasIndex;
    }), S.quads = (S.quads || 0) + (or() - x);
    const I = or();
    S.sdf = {};
    const M = s.height, J = Math.ceil(n.glyphCount / i), y = Math.pow(2, Math.ceil(Math.log2(J * a)));
    y > M && (console.info(`Increasing SDF texture size ${M}->${y}`), Sa(s, r, y), o.dispose()), Promise.all(F.map(
      (A) => vn(A, n, u.gpuAccelerateSDF).then(({ timing: k }) => {
        S.sdf[A.atlasIndex] = k;
      })
    )).then(() => {
      F.length && !n.contextLost && (pn(n), o.needsUpdate = !0), S.sdfTotal = or() - I, S.total = or() - d, t(Object.freeze({
        parameters: u,
        sdfTexture: o,
        sdfGlyphSize: a,
        sdfExponent: e,
        glyphBounds: U,
        glyphAtlasIndices: h,
        glyphColors: l.glyphColors,
        caretPositions: l.caretPositions,
        chunkedBounds: l.chunkedBounds,
        ascender: l.ascender,
        descender: l.descender,
        lineHeight: l.lineHeight,
        capHeight: l.capHeight,
        xHeight: l.xHeight,
        topBaseline: l.topBaseline,
        blockBounds: l.blockBounds,
        visibleBounds: l.visibleBounds,
        timings: l.timings
      }));
    });
  }), Promise.resolve().then(() => {
    n.contextLost || xa(s);
  });
}
function vn({ path: u, atlasIndex: t, sdfViewBox: d }, { sdfGlyphSize: c, sdfCanvas: r, contextLost: e }, a) {
  if (e)
    return Promise.resolve({ timing: -1 });
  const { textureWidth: i, sdfExponent: n } = Ur, o = Math.max(d[2] - d[0], d[3] - d[1]), s = Math.floor(t / 4), f = s % (i / c) * c, l = Math.floor(s / (i / c)) * c, h = t % 4;
  return ga(c, c, u, d, o, n, r, f, l, h, a);
}
function wa(u) {
  const t = u.sdfCanvas;
  t.addEventListener("webglcontextlost", (d) => {
    console.log("Context Lost", d), d.preventDefault(), u.contextLost = !0;
  }), t.addEventListener("webglcontextrestored", (d) => {
    console.log("Context Restored", d), u.contextLost = !1;
    const c = [];
    u.glyphsByFont.forEach((r) => {
      r.forEach((e) => {
        c.push(vn(e, u, !0));
      });
    }), Promise.all(c).then(() => {
      pn(u), u.sdfTexture.needsUpdate = !0;
    });
  });
}
function ka({ font: u, characters: t, sdfGlyphSize: d }, c) {
  let r = Array.isArray(t) ? t.join(`
`) : "" + t;
  dn({ font: u, sdfGlyphSize: d, text: r }, c);
}
function Fa(u, t) {
  for (let d in t)
    t.hasOwnProperty(d) && (u[d] = t[d]);
  return u;
}
let Br;
function Ca(u) {
  return Br || (Br = typeof document > "u" ? {} : document.createElement("a")), Br.href = u, Br.href;
}
function pn(u) {
  if (typeof createImageBitmap != "function") {
    console.info("Safari<15: applying SDF canvas workaround");
    const { sdfCanvas: t, sdfTexture: d } = u, { width: c, height: r } = t, e = u.sdfCanvas.getContext("webgl");
    let a = d.image.data;
    (!a || a.length !== c * r * 4) && (a = new Uint8Array(c * r * 4), d.image = { width: c, height: r, data: a }, d.flipY = !1, d.isDataTexture = !0), e.readPixels(0, 0, c, r, e.RGBA, e.UNSIGNED_BYTE, a);
  }
}
const Da = /* @__PURE__ */ sr({
  name: "Typesetter",
  dependencies: [
    pa,
    va,
    ea
  ],
  init(u, t, d) {
    return u(t, d());
  }
}), gn = /* @__PURE__ */ sr({
  name: "Typesetter",
  dependencies: [
    Da
  ],
  init(u) {
    return function(t) {
      return new Promise((d) => {
        u.typeset(t, d);
      });
    };
  },
  getTransferables(u) {
    const t = [];
    for (let d in u)
      u[d] && u[d].buffer && t.push(u[d].buffer);
    return t;
  }
});
gn.onMainThread;
const tn = {};
function Aa(u) {
  let t = tn[u];
  return t || (t = tn[u] = new yt(1, 1, u, u).translate(0.5, 0.5, 0)), t;
}
const Ea = "aTroikaGlyphBounds", nn = "aTroikaGlyphIndex", Ma = "aTroikaGlyphColor";
class Ga extends Ln {
  constructor() {
    super(), this.detail = 1, this.curveRadius = 0, this.groups = [
      { start: 0, count: 1 / 0, materialIndex: 0 },
      { start: 0, count: 1 / 0, materialIndex: 1 }
    ], this.boundingSphere = new Bn(), this.boundingBox = new fn();
  }
  computeBoundingSphere() {
  }
  computeBoundingBox() {
  }
  set detail(t) {
    if (t !== this._detail) {
      this._detail = t, (typeof t != "number" || t < 1) && (t = 1);
      let d = Aa(t);
      ["position", "normal", "uv"].forEach((c) => {
        this.attributes[c] = d.attributes[c].clone();
      }), this.setIndex(d.getIndex().clone());
    }
  }
  get detail() {
    return this._detail;
  }
  set curveRadius(t) {
    t !== this._curveRadius && (this._curveRadius = t, this._updateBounds());
  }
  get curveRadius() {
    return this._curveRadius;
  }
  /**
   * Update the geometry for a new set of glyphs.
   * @param {Float32Array} glyphBounds - An array holding the planar bounds for all glyphs
   *        to be rendered, 4 entries for each glyph: x1,x2,y1,y1
   * @param {Float32Array} glyphAtlasIndices - An array holding the index of each glyph within
   *        the SDF atlas texture.
   * @param {Array} blockBounds - An array holding the [minX, minY, maxX, maxY] across all glyphs
   * @param {Array} [chunkedBounds] - An array of objects describing bounds for each chunk of N
   *        consecutive glyphs: `{start:N, end:N, rect:[minX, minY, maxX, maxY]}`. This can be
   *        used with `applyClipRect` to choose an optimized `instanceCount`.
   * @param {Uint8Array} [glyphColors] - An array holding r,g,b values for each glyph.
   */
  updateGlyphs(t, d, c, r, e) {
    this.updateAttributeData(Ea, t, 4), this.updateAttributeData(nn, d, 1), this.updateAttributeData(Ma, e, 3), this._blockBounds = c, this._chunkedBounds = r, this.instanceCount = d.length, this._updateBounds();
  }
  _updateBounds() {
    const t = this._blockBounds;
    if (t) {
      const { curveRadius: d, boundingBox: c } = this;
      if (d) {
        const { PI: r, floor: e, min: a, max: i, sin: n, cos: o } = Math, s = r / 2, f = r * 2, l = Math.abs(d), h = t[0] / l, p = t[2] / l, g = e((h + s) / f) !== e((p + s) / f) ? -l : a(n(h) * l, n(p) * l), m = e((h - s) / f) !== e((p - s) / f) ? l : i(n(h) * l, n(p) * l), O = e((h + r) / f) !== e((p + r) / f) ? l * 2 : i(l - o(h) * l, l - o(p) * l);
        c.min.set(g, t[1], d < 0 ? -O : 0), c.max.set(m, t[3], d < 0 ? 0 : O);
      } else
        c.min.set(t[0], t[1], 0), c.max.set(t[2], t[3], 0);
      c.getBoundingSphere(this.boundingSphere);
    }
  }
  /**
   * Given a clipping rect, and the chunkedBounds from the last updateGlyphs call, choose the lowest
   * `instanceCount` that will show all glyphs within the clipped view. This is an optimization
   * for long blocks of text that are clipped, to skip vertex shader evaluation for glyphs that would
   * be clipped anyway.
   *
   * Note that since `drawElementsInstanced[ANGLE]` only accepts an instance count and not a starting
   * offset, this optimization becomes less effective as the clipRect moves closer to the end of the
   * text block. We could fix that by switching from instancing to a full geometry with a drawRange,
   * but at the expense of much larger attribute buffers (see classdoc above.)
   *
   * @param {Vector4} clipRect
   */
  applyClipRect(t) {
    let d = this.getAttribute(nn).count, c = this._chunkedBounds;
    if (c)
      for (let r = c.length; r--; ) {
        d = c[r].end;
        let e = c[r].rect;
        if (e[1] < t.w && e[3] > t.y && e[0] < t.z && e[2] > t.x)
          break;
      }
    this.instanceCount = d;
  }
  /**
   * Utility for updating instance attributes with automatic resizing
   */
  updateAttributeData(t, d, c) {
    const r = this.getAttribute(t);
    d ? r && r.array.length === d.length ? (r.array.set(d), r.needsUpdate = !0) : (this.setAttribute(t, new Pn(d, c)), delete this._maxInstanceCount, this.dispose()) : r && this.deleteAttribute(t);
  }
}
const Ra = `
uniform vec2 uTroikaSDFTextureSize;
uniform float uTroikaSDFGlyphSize;
uniform vec4 uTroikaTotalBounds;
uniform vec4 uTroikaClipRect;
uniform mat3 uTroikaOrient;
uniform bool uTroikaUseGlyphColors;
uniform float uTroikaEdgeOffset;
uniform float uTroikaBlurRadius;
uniform vec2 uTroikaPositionOffset;
uniform float uTroikaCurveRadius;
attribute vec4 aTroikaGlyphBounds;
attribute float aTroikaGlyphIndex;
attribute vec3 aTroikaGlyphColor;
varying vec2 vTroikaGlyphUV;
varying vec4 vTroikaTextureUVBounds;
varying float vTroikaTextureChannel;
varying vec3 vTroikaGlyphColor;
varying vec2 vTroikaGlyphDimensions;
`, Oa = `
vec4 bounds = aTroikaGlyphBounds;
bounds.xz += uTroikaPositionOffset.x;
bounds.yw -= uTroikaPositionOffset.y;

vec4 outlineBounds = vec4(
  bounds.xy - uTroikaEdgeOffset - uTroikaBlurRadius,
  bounds.zw + uTroikaEdgeOffset + uTroikaBlurRadius
);
vec4 clippedBounds = vec4(
  clamp(outlineBounds.xy, uTroikaClipRect.xy, uTroikaClipRect.zw),
  clamp(outlineBounds.zw, uTroikaClipRect.xy, uTroikaClipRect.zw)
);

vec2 clippedXY = (mix(clippedBounds.xy, clippedBounds.zw, position.xy) - bounds.xy) / (bounds.zw - bounds.xy);

position.xy = mix(bounds.xy, bounds.zw, clippedXY);

uv = (position.xy - uTroikaTotalBounds.xy) / (uTroikaTotalBounds.zw - uTroikaTotalBounds.xy);

float rad = uTroikaCurveRadius;
if (rad != 0.0) {
  float angle = position.x / rad;
  position.xz = vec2(sin(angle) * rad, rad - cos(angle) * rad);
  normal.xz = vec2(sin(angle), cos(angle));
}
  
position = uTroikaOrient * position;
normal = uTroikaOrient * normal;

vTroikaGlyphUV = clippedXY.xy;
vTroikaGlyphDimensions = vec2(bounds[2] - bounds[0], bounds[3] - bounds[1]);


float txCols = uTroikaSDFTextureSize.x / uTroikaSDFGlyphSize;
vec2 txUvPerSquare = uTroikaSDFGlyphSize / uTroikaSDFTextureSize;
vec2 txStartUV = txUvPerSquare * vec2(
  mod(floor(aTroikaGlyphIndex / 4.0), txCols),
  floor(floor(aTroikaGlyphIndex / 4.0) / txCols)
);
vTroikaTextureUVBounds = vec4(txStartUV, vec2(txStartUV) + txUvPerSquare);
vTroikaTextureChannel = mod(aTroikaGlyphIndex, 4.0);
`, La = `
uniform sampler2D uTroikaSDFTexture;
uniform vec2 uTroikaSDFTextureSize;
uniform float uTroikaSDFGlyphSize;
uniform float uTroikaSDFExponent;
uniform float uTroikaEdgeOffset;
uniform float uTroikaFillOpacity;
uniform float uTroikaBlurRadius;
uniform vec3 uTroikaStrokeColor;
uniform float uTroikaStrokeWidth;
uniform float uTroikaStrokeOpacity;
uniform bool uTroikaSDFDebug;
varying vec2 vTroikaGlyphUV;
varying vec4 vTroikaTextureUVBounds;
varying float vTroikaTextureChannel;
varying vec2 vTroikaGlyphDimensions;

float troikaSdfValueToSignedDistance(float alpha) {
  // Inverse of exponential encoding in webgl-sdf-generator
  
  float maxDimension = max(vTroikaGlyphDimensions.x, vTroikaGlyphDimensions.y);
  float absDist = (1.0 - pow(2.0 * (alpha > 0.5 ? 1.0 - alpha : alpha), 1.0 / uTroikaSDFExponent)) * maxDimension;
  float signedDist = absDist * (alpha > 0.5 ? -1.0 : 1.0);
  return signedDist;
}

float troikaGlyphUvToSdfValue(vec2 glyphUV) {
  vec2 textureUV = mix(vTroikaTextureUVBounds.xy, vTroikaTextureUVBounds.zw, glyphUV);
  vec4 rgba = texture2D(uTroikaSDFTexture, textureUV);
  float ch = floor(vTroikaTextureChannel + 0.5); //NOTE: can't use round() in WebGL1
  return ch == 0.0 ? rgba.r : ch == 1.0 ? rgba.g : ch == 2.0 ? rgba.b : rgba.a;
}

float troikaGlyphUvToDistance(vec2 uv) {
  return troikaSdfValueToSignedDistance(troikaGlyphUvToSdfValue(uv));
}

float troikaGetAADist() {
  
  #if defined(GL_OES_standard_derivatives) || __VERSION__ >= 300
  return length(fwidth(vTroikaGlyphUV * vTroikaGlyphDimensions)) * 0.5;
  #else
  return vTroikaGlyphDimensions.x / 64.0;
  #endif
}

float troikaGetFragDistValue() {
  vec2 clampedGlyphUV = clamp(vTroikaGlyphUV, 0.5 / uTroikaSDFGlyphSize, 1.0 - 0.5 / uTroikaSDFGlyphSize);
  float distance = troikaGlyphUvToDistance(clampedGlyphUV);
 
  // Extrapolate distance when outside bounds:
  distance += clampedGlyphUV == vTroikaGlyphUV ? 0.0 : 
    length((vTroikaGlyphUV - clampedGlyphUV) * vTroikaGlyphDimensions);

  

  return distance;
}

float troikaGetEdgeAlpha(float distance, float distanceOffset, float aaDist) {
  #if defined(IS_DEPTH_MATERIAL) || defined(IS_DISTANCE_MATERIAL)
  float alpha = step(-distanceOffset, -distance);
  #else

  float alpha = smoothstep(
    distanceOffset + aaDist,
    distanceOffset - aaDist,
    distance
  );
  #endif

  return alpha;
}
`, Ba = `
float aaDist = troikaGetAADist();
float fragDistance = troikaGetFragDistValue();
float edgeAlpha = uTroikaSDFDebug ?
  troikaGlyphUvToSdfValue(vTroikaGlyphUV) :
  troikaGetEdgeAlpha(fragDistance, uTroikaEdgeOffset, max(aaDist, uTroikaBlurRadius));

#if !defined(IS_DEPTH_MATERIAL) && !defined(IS_DISTANCE_MATERIAL)
vec4 fillRGBA = gl_FragColor;
fillRGBA.a *= uTroikaFillOpacity;
vec4 strokeRGBA = uTroikaStrokeWidth == 0.0 ? fillRGBA : vec4(uTroikaStrokeColor, uTroikaStrokeOpacity);
if (fillRGBA.a == 0.0) fillRGBA.rgb = strokeRGBA.rgb;
gl_FragColor = mix(fillRGBA, strokeRGBA, smoothstep(
  -uTroikaStrokeWidth - aaDist,
  -uTroikaStrokeWidth + aaDist,
  fragDistance
));
gl_FragColor.a *= edgeAlpha;
#endif

if (edgeAlpha == 0.0) {
  discard;
}
`;
function Pa(u) {
  const t = pt(u, {
    chained: !0,
    extensions: {
      derivatives: !0
    },
    uniforms: {
      uTroikaSDFTexture: { value: null },
      uTroikaSDFTextureSize: { value: new Wr() },
      uTroikaSDFGlyphSize: { value: 0 },
      uTroikaSDFExponent: { value: 0 },
      uTroikaTotalBounds: { value: new jt(0, 0, 0, 0) },
      uTroikaClipRect: { value: new jt(0, 0, 0, 0) },
      uTroikaEdgeOffset: { value: 0 },
      uTroikaFillOpacity: { value: 1 },
      uTroikaPositionOffset: { value: new Wr() },
      uTroikaCurveRadius: { value: 0 },
      uTroikaBlurRadius: { value: 0 },
      uTroikaStrokeWidth: { value: 0 },
      uTroikaStrokeColor: { value: new zr() },
      uTroikaStrokeOpacity: { value: 1 },
      uTroikaOrient: { value: new Nn() },
      uTroikaUseGlyphColors: { value: !0 },
      uTroikaSDFDebug: { value: !1 }
    },
    vertexDefs: Ra,
    vertexTransform: Oa,
    fragmentDefs: La,
    fragmentColorTransform: Ba,
    customRewriter({ vertexShader: d, fragmentShader: c }) {
      let r = /\buniform\s+vec3\s+diffuse\b/;
      return r.test(c) && (c = c.replace(r, "varying vec3 vTroikaGlyphColor").replace(/\bdiffuse\b/g, "vTroikaGlyphColor"), r.test(d) || (d = d.replace(
        cn,
        `uniform vec3 diffuse;
$&
vTroikaGlyphColor = uTroikaUseGlyphColors ? aTroikaGlyphColor / 255.0 : diffuse;
`
      ))), { vertexShader: d, fragmentShader: c };
    }
  });
  return t.transparent = !0, t.forceSinglePass = !0, Object.defineProperties(t, {
    isTroikaTextMaterial: { value: !0 },
    // WebGLShadowMap reverses the side of the shadow material by default, which fails
    // for planes, so here we force the `shadowSide` to always match the main side.
    shadowSide: {
      get() {
        return this.side;
      },
      set() {
      }
    }
  }), t;
}
const bt = /* @__PURE__ */ new Rn({
  color: 16777215,
  side: Wn,
  transparent: !0
}), an = 8421504, on = /* @__PURE__ */ new On(), Pr = /* @__PURE__ */ new ir(), ct = /* @__PURE__ */ new ir(), yr = [], Ia = /* @__PURE__ */ new ir(), ht = "+x+y";
function sn(u) {
  return Array.isArray(u) ? u[0] : u;
}
let mn = () => {
  const u = new mt(
    new yt(1, 1),
    bt
  );
  return mn = () => u, u;
}, yn = () => {
  const u = new mt(
    new yt(1, 1, 32, 1),
    bt
  );
  return yn = () => u, u;
};
const Na = { type: "syncstart" }, Wa = { type: "synccomplete" }, bn = [
  "font",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "lang",
  "letterSpacing",
  "lineHeight",
  "maxWidth",
  "overflowWrap",
  "text",
  "direction",
  "textAlign",
  "textIndent",
  "whiteSpace",
  "anchorX",
  "anchorY",
  "colorRanges",
  "sdfGlyphSize"
], za = bn.concat(
  "material",
  "color",
  "depthOffset",
  "clipRect",
  "curveRadius",
  "orientation",
  "glyphGeometryDetail"
);
let Un = class extends mt {
  constructor() {
    const t = new Ga();
    super(t, null), this.text = "", this.anchorX = 0, this.anchorY = 0, this.curveRadius = 0, this.direction = "auto", this.font = null, this.unicodeFontsURL = null, this.fontSize = 0.1, this.fontWeight = "normal", this.fontStyle = "normal", this.lang = null, this.letterSpacing = 0, this.lineHeight = "normal", this.maxWidth = 1 / 0, this.overflowWrap = "normal", this.textAlign = "left", this.textIndent = 0, this.whiteSpace = "normal", this.material = null, this.color = null, this.colorRanges = null, this.outlineWidth = 0, this.outlineColor = 0, this.outlineOpacity = 1, this.outlineBlur = 0, this.outlineOffsetX = 0, this.outlineOffsetY = 0, this.strokeWidth = 0, this.strokeColor = an, this.strokeOpacity = 1, this.fillOpacity = 1, this.depthOffset = 0, this.clipRect = null, this.orientation = ht, this.glyphGeometryDetail = 1, this.sdfGlyphSize = null, this.gpuAccelerateSDF = !0, this.debugSDF = !1;
  }
  /**
   * Updates the text rendering according to the current text-related configuration properties.
   * This is an async process, so you can pass in a callback function to be executed when it
   * finishes.
   * @param {function} [callback]
   */
  sync(t) {
    this._needsSync && (this._needsSync = !1, this._isSyncing ? (this._queuedSyncs || (this._queuedSyncs = [])).push(t) : (this._isSyncing = !0, this.dispatchEvent(Na), dn({
      text: this.text,
      font: this.font,
      lang: this.lang,
      fontSize: this.fontSize || 0.1,
      fontWeight: this.fontWeight || "normal",
      fontStyle: this.fontStyle || "normal",
      letterSpacing: this.letterSpacing || 0,
      lineHeight: this.lineHeight || "normal",
      maxWidth: this.maxWidth,
      direction: this.direction || "auto",
      textAlign: this.textAlign,
      textIndent: this.textIndent,
      whiteSpace: this.whiteSpace,
      overflowWrap: this.overflowWrap,
      anchorX: this.anchorX,
      anchorY: this.anchorY,
      colorRanges: this.colorRanges,
      includeCaretPositions: !0,
      //TODO parameterize
      sdfGlyphSize: this.sdfGlyphSize,
      gpuAccelerateSDF: this.gpuAccelerateSDF,
      unicodeFontsURL: this.unicodeFontsURL
    }, (d) => {
      this._isSyncing = !1, this._textRenderInfo = d, this.geometry.updateGlyphs(
        d.glyphBounds,
        d.glyphAtlasIndices,
        d.blockBounds,
        d.chunkedBounds,
        d.glyphColors
      );
      const c = this._queuedSyncs;
      c && (this._queuedSyncs = null, this._needsSync = !0, this.sync(() => {
        c.forEach((r) => r && r());
      })), this.dispatchEvent(Wa), t && t();
    })));
  }
  /**
   * Initiate a sync if needed - note it won't complete until next frame at the
   * earliest so if possible it's a good idea to call sync() manually as soon as
   * all the properties have been set.
   * @override
   */
  onBeforeRender(t, d, c, r, e, a) {
    this.sync(), e.isTroikaTextMaterial && this._prepareForRender(e);
  }
  /**
   * Shortcut to dispose the geometry specific to this instance.
   * Note: we don't also dispose the derived material here because if anything else is
   * sharing the same base material it will result in a pause next frame as the program
   * is recompiled. Instead users can dispose the base material manually, like normal,
   * and we'll also dispose the derived material at that time.
   */
  dispose() {
    this.geometry.dispose();
  }
  /**
   * @property {TroikaTextRenderInfo|null} textRenderInfo
   * @readonly
   * The current processed rendering data for this TextMesh, returned by the TextBuilder after
   * a `sync()` call. This will be `null` initially, and may be stale for a short period until
   * the asynchrous `sync()` process completes.
   */
  get textRenderInfo() {
    return this._textRenderInfo || null;
  }
  /**
   * Create the text derived material from the base material. Can be overridden to use a custom
   * derived material.
   */
  createDerivedMaterial(t) {
    return Pa(t);
  }
  // Handler for automatically wrapping the base material with our upgrades. We do the wrapping
  // lazily on _read_ rather than write to avoid unnecessary wrapping on transient values.
  get material() {
    let t = this._derivedMaterial;
    const d = this._baseMaterial || this._defaultMaterial || (this._defaultMaterial = bt.clone());
    if ((!t || !t.isDerivedFrom(d)) && (t = this._derivedMaterial = this.createDerivedMaterial(d), d.addEventListener("dispose", function c() {
      d.removeEventListener("dispose", c), t.dispose();
    })), this.hasOutline()) {
      let c = t._outlineMtl;
      return c || (c = t._outlineMtl = Object.create(t, {
        id: { value: t.id + 0.1 }
      }), c.isTextOutlineMaterial = !0, c.depthWrite = !1, c.map = null, t.addEventListener("dispose", function r() {
        t.removeEventListener("dispose", r), c.dispose();
      })), [
        c,
        t
      ];
    } else
      return t;
  }
  set material(t) {
    t && t.isTroikaTextMaterial ? (this._derivedMaterial = t, this._baseMaterial = t.baseMaterial) : this._baseMaterial = t;
  }
  hasOutline() {
    return !!(this.outlineWidth || this.outlineBlur || this.outlineOffsetX || this.outlineOffsetY);
  }
  get glyphGeometryDetail() {
    return this.geometry.detail;
  }
  set glyphGeometryDetail(t) {
    this.geometry.detail = t;
  }
  get curveRadius() {
    return this.geometry.curveRadius;
  }
  set curveRadius(t) {
    this.geometry.curveRadius = t;
  }
  // Create and update material for shadows upon request:
  get customDepthMaterial() {
    return sn(this.material).getDepthMaterial();
  }
  set customDepthMaterial(t) {
  }
  get customDistanceMaterial() {
    return sn(this.material).getDistanceMaterial();
  }
  set customDistanceMaterial(t) {
  }
  _prepareForRender(t) {
    const d = t.isTextOutlineMaterial, c = t.uniforms, r = this.textRenderInfo;
    if (r) {
      const { sdfTexture: i, blockBounds: n } = r;
      c.uTroikaSDFTexture.value = i, c.uTroikaSDFTextureSize.value.set(i.image.width, i.image.height), c.uTroikaSDFGlyphSize.value = r.sdfGlyphSize, c.uTroikaSDFExponent.value = r.sdfExponent, c.uTroikaTotalBounds.value.fromArray(n), c.uTroikaUseGlyphColors.value = !d && !!r.glyphColors;
      let o = 0, s = 0, f = 0, l, h, p, g = 0, m = 0;
      if (d) {
        let { outlineWidth: S, outlineOffsetX: F, outlineOffsetY: U, outlineBlur: w, outlineOpacity: R } = this;
        o = this._parsePercent(S) || 0, s = Math.max(0, this._parsePercent(w) || 0), l = R, g = this._parsePercent(F) || 0, m = this._parsePercent(U) || 0;
      } else
        f = Math.max(0, this._parsePercent(this.strokeWidth) || 0), f && (p = this.strokeColor, c.uTroikaStrokeColor.value.set(p ?? an), h = this.strokeOpacity, h == null && (h = 1)), l = this.fillOpacity;
      c.uTroikaEdgeOffset.value = o, c.uTroikaPositionOffset.value.set(g, m), c.uTroikaBlurRadius.value = s, c.uTroikaStrokeWidth.value = f, c.uTroikaStrokeOpacity.value = h, c.uTroikaFillOpacity.value = l ?? 1, c.uTroikaCurveRadius.value = this.curveRadius || 0;
      let O = this.clipRect;
      if (O && Array.isArray(O) && O.length === 4)
        c.uTroikaClipRect.value.fromArray(O);
      else {
        const S = (this.fontSize || 0.1) * 100;
        c.uTroikaClipRect.value.set(
          n[0] - S,
          n[1] - S,
          n[2] + S,
          n[3] + S
        );
      }
      this.geometry.applyClipRect(c.uTroikaClipRect.value);
    }
    c.uTroikaSDFDebug.value = !!this.debugSDF, t.polygonOffset = !!this.depthOffset, t.polygonOffsetFactor = t.polygonOffsetUnits = this.depthOffset || 0;
    const e = d ? this.outlineColor || 0 : this.color;
    if (e == null)
      delete t.color;
    else {
      const i = t.hasOwnProperty("color") ? t.color : t.color = new zr();
      (e !== i._input || typeof e == "object") && i.set(i._input = e);
    }
    let a = this.orientation || ht;
    if (a !== t._orientation) {
      let i = c.uTroikaOrient.value;
      a = a.replace(/[^-+xyz]/g, "");
      let n = a !== ht && a.match(/^([-+])([xyz])([-+])([xyz])$/);
      if (n) {
        let [, o, s, f, l] = n;
        Pr.set(0, 0, 0)[s] = o === "-" ? 1 : -1, ct.set(0, 0, 0)[l] = f === "-" ? -1 : 1, on.lookAt(Ia, Pr.cross(ct), ct), i.setFromMatrix4(on);
      } else
        i.identity();
      t._orientation = a;
    }
  }
  _parsePercent(t) {
    if (typeof t == "string") {
      let d = t.match(/^(-?[\d.]+)%$/), c = d ? parseFloat(d[1]) : NaN;
      t = (isNaN(c) ? 0 : c / 100) * this.fontSize;
    }
    return t;
  }
  /**
   * Translate a point in local space to an x/y in the text plane.
   */
  localPositionToTextCoords(t, d = new Wr()) {
    d.copy(t);
    const c = this.curveRadius;
    return c && (d.x = Math.atan2(t.x, Math.abs(c) - Math.abs(t.z)) * Math.abs(c)), d;
  }
  /**
   * Translate a point in world space to an x/y in the text plane.
   */
  worldPositionToTextCoords(t, d = new Wr()) {
    return Pr.copy(t), this.localPositionToTextCoords(this.worldToLocal(Pr), d);
  }
  /**
   * @override Custom raycasting to test against the whole text block's max rectangular bounds
   * TODO is there any reason to make this more granular, like within individual line or glyph rects?
   */
  raycast(t, d) {
    const { textRenderInfo: c, curveRadius: r } = this;
    if (c) {
      const e = c.blockBounds, a = r ? yn() : mn(), i = a.geometry, { position: n, uv: o } = i.attributes;
      for (let s = 0; s < o.count; s++) {
        let f = e[0] + o.getX(s) * (e[2] - e[0]);
        const l = e[1] + o.getY(s) * (e[3] - e[1]);
        let h = 0;
        r && (h = r - Math.cos(f / r) * r, f = Math.sin(f / r) * r), n.setXYZ(s, f, l, h);
      }
      i.boundingSphere = this.geometry.boundingSphere, i.boundingBox = this.geometry.boundingBox, a.matrixWorld = this.matrixWorld, a.material.side = this.material.side, yr.length = 0, a.raycast(t, yr);
      for (let s = 0; s < yr.length; s++)
        yr[s].object = this, d.push(yr[s]);
    }
  }
  copy(t) {
    const d = this.geometry;
    return super.copy(t), this.geometry = d, za.forEach((c) => {
      this[c] = t[c];
    }), this;
  }
  clone() {
    return new this.constructor().copy(this);
  }
};
bn.forEach((u) => {
  const t = "_private_" + u;
  Object.defineProperty(Un.prototype, u, {
    get() {
      return this[t];
    },
    set(d) {
      d !== this[t] && (this[t] = d, this._needsSync = !0);
    }
  });
});
new fn();
new zr();
const ja = /* @__PURE__ */ qe.forwardRef(({
  sdfGlyphSize: u = 64,
  anchorX: t = "center",
  anchorY: d = "middle",
  font: c,
  fontSize: r = 1,
  children: e,
  characters: a,
  onSync: i,
  ...n
}, o) => {
  const s = zn(({
    invalidate: p
  }) => p), [f] = qe.useState(() => new Un()), [l, h] = qe.useMemo(() => {
    const p = [];
    let g = "";
    return qe.Children.forEach(e, (m) => {
      typeof m == "string" || typeof m == "number" ? g += m : p.push(m);
    }), [p, g];
  }, [e]);
  return Yn(() => new Promise((p) => ka({
    font: c,
    characters: a
  }, p)), ["troika-text", c, a]), qe.useLayoutEffect(() => void f.sync(() => {
    s(), i && i(f);
  })), qe.useEffect(() => () => f.dispose(), [f]), /* @__PURE__ */ qe.createElement("primitive", jn({
    object: f,
    ref: o,
    font: c,
    text: h,
    anchorX: t,
    anchorY: d,
    fontSize: r,
    sdfGlyphSize: u
  }, n), l);
});
function Va({ walls: u }) {
  const t = Math.min(...u.map((d) => Vt(d)));
  return /* @__PURE__ */ br(Fn, { children: u.map((d) => {
    const c = Xt(d.start.x, d.start.y, d.start.z), r = Xt(d.end.x, d.end.y, d.end.z), e = new ir().addVectors(c, r).multiplyScalar(0.5), a = new ir().subVectors(r, c).normalize(), i = new ir().copy(e).add(a.multiplyScalar(0.5)), n = Math.abs(Vt(d) - t) < 1e-6 ? "cyan" : "magenta";
    return /* @__PURE__ */ Cn("group", { children: [
      /* @__PURE__ */ br(Ht, { points: [c, r], color: n, lineWidth: 2 }),
      /* @__PURE__ */ br(Ht, { points: [e, i], color: "yellow", lineWidth: 2 }),
      /* @__PURE__ */ br(
        ja,
        {
          position: [e.x, e.y + 0.2, e.z],
          fontSize: 0.2,
          color: "white",
          anchorX: "center",
          anchorY: "middle",
          children: d.id
        }
      )
    ] }, d.id);
  }) });
}
function Ja({ walls: u }) {
  return /* @__PURE__ */ br(Va, { walls: u });
}
export {
  Ja as WallNormalsOverlay
};
