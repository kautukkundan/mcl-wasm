var Module = (function() {
    var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
    if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
    return (
        function(Module) {
            Module = Module || {};

            var Module = typeof Module !== "undefined" ? Module : {};
            var moduleOverrides = {};
            var key;
            for (key in Module) {
                if (Module.hasOwnProperty(key)) {
                    moduleOverrides[key] = Module[key]
                }
            }
            var arguments_ = [];
            var thisProgram = "./this.program";
            var quit_ = function(status, toThrow) {
                throw toThrow
            };
            var ENVIRONMENT_IS_WEB = false;
            var ENVIRONMENT_IS_WORKER = false;
            var ENVIRONMENT_IS_NODE = false;
            var ENVIRONMENT_IS_SHELL = false;
            ENVIRONMENT_IS_WEB = typeof window === "object";
            ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
            ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
            ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
            var scriptDirectory = "";

            function locateFile(path) {
                if (Module["locateFile"]) {
                    return Module["locateFile"](path, scriptDirectory)
                }
                return scriptDirectory + path
            }
            var read_, readAsync, readBinary, setWindowTitle;
            var nodeFS;
            var nodePath;
            if (ENVIRONMENT_IS_NODE) {
                if (ENVIRONMENT_IS_WORKER) {
                    scriptDirectory = require("path").dirname(scriptDirectory) + "/"
                } else {
                    scriptDirectory = __dirname + "/"
                }
                read_ = function shell_read(filename, binary) {
                    if (!nodeFS) nodeFS = require("fs");
                    if (!nodePath) nodePath = require("path");
                    filename = nodePath["normalize"](filename);
                    return nodeFS["readFileSync"](filename, binary ? null : "utf8")
                };
                readBinary = function readBinary(filename) {
                    var ret = read_(filename, true);
                    if (!ret.buffer) {
                        ret = new Uint8Array(ret)
                    }
                    assert(ret.buffer);
                    return ret
                };
                if (process["argv"].length > 1) {
                    thisProgram = process["argv"][1].replace(/\\/g, "/")
                }
                arguments_ = process["argv"].slice(2);
                quit_ = function(status) {
                    process["exit"](status)
                };
                Module["inspect"] = function() {
                    return "[Emscripten Module object]"
                }
            } else if (ENVIRONMENT_IS_SHELL) {
                if (typeof read != "undefined") {
                    read_ = function shell_read(f) {
                        return read(f)
                    }
                }
                readBinary = function readBinary(f) {
                    var data;
                    if (typeof readbuffer === "function") {
                        return new Uint8Array(readbuffer(f))
                    }
                    data = read(f, "binary");
                    assert(typeof data === "object");
                    return data
                };
                if (typeof scriptArgs != "undefined") {
                    arguments_ = scriptArgs
                } else if (typeof arguments != "undefined") {
                    arguments_ = arguments
                }
                if (typeof quit === "function") {
                    quit_ = function(status) {
                        quit(status)
                    }
                }
                if (typeof print !== "undefined") {
                    if (typeof console === "undefined") console = {};
                    console.log = print;
                    console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
                }
            } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
                if (ENVIRONMENT_IS_WORKER) {
                    scriptDirectory = self.location.href
                } else if (document.currentScript) {
                    scriptDirectory = document.currentScript.src
                }
                if (_scriptDir) {
                    scriptDirectory = _scriptDir
                }
                if (scriptDirectory.indexOf("blob:") !== 0) {
                    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
                } else {
                    scriptDirectory = ""
                } {
                    read_ = function shell_read(url) {
                        var xhr = new XMLHttpRequest;
                        xhr.open("GET", url, false);
                        xhr.send(null);
                        return xhr.responseText
                    };
                    if (ENVIRONMENT_IS_WORKER) {
                        readBinary = function readBinary(url) {
                            var xhr = new XMLHttpRequest;
                            xhr.open("GET", url, false);
                            xhr.responseType = "arraybuffer";
                            xhr.send(null);
                            return new Uint8Array(xhr.response)
                        }
                    }
                    readAsync = function readAsync(url, onload, onerror) {
                        var xhr = new XMLHttpRequest;
                        xhr.open("GET", url, true);
                        xhr.responseType = "arraybuffer";
                        xhr.onload = function xhr_onload() {
                            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                                onload(xhr.response);
                                return
                            }
                            onerror()
                        };
                        xhr.onerror = onerror;
                        xhr.send(null)
                    }
                }
                setWindowTitle = function(title) {
                    document.title = title
                }
            } else {}
            var out = Module["print"] || console.log.bind(console);
            var err = Module["printErr"] || console.warn.bind(console);
            for (key in moduleOverrides) {
                if (moduleOverrides.hasOwnProperty(key)) {
                    Module[key] = moduleOverrides[key]
                }
            }
            moduleOverrides = null;
            if (Module["arguments"]) arguments_ = Module["arguments"];
            if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
            if (Module["quit"]) quit_ = Module["quit"];
            var wasmBinary;
            if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
            var noExitRuntime;
            if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
            if (typeof WebAssembly !== "object") {
                err("no native wasm support detected")
            }
            var wasmMemory;
            var wasmTable = new WebAssembly.Table({
                "initial": 206,
                "maximum": 206 + 0,
                "element": "anyfunc"
            });
            var ABORT = false;
            var EXITSTATUS = 0;

            function assert(condition, text) {
                if (!condition) {
                    abort("Assertion failed: " + text)
                }
            }
            var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

            function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
                var endIdx = idx + maxBytesToRead;
                var endPtr = idx;
                while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
                if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
                    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
                } else {
                    var str = "";
                    while (idx < endPtr) {
                        var u0 = u8Array[idx++];
                        if (!(u0 & 128)) {
                            str += String.fromCharCode(u0);
                            continue
                        }
                        var u1 = u8Array[idx++] & 63;
                        if ((u0 & 224) == 192) {
                            str += String.fromCharCode((u0 & 31) << 6 | u1);
                            continue
                        }
                        var u2 = u8Array[idx++] & 63;
                        if ((u0 & 240) == 224) {
                            u0 = (u0 & 15) << 12 | u1 << 6 | u2
                        } else {
                            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
                        }
                        if (u0 < 65536) {
                            str += String.fromCharCode(u0)
                        } else {
                            var ch = u0 - 65536;
                            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                        }
                    }
                }
                return str
            }

            function UTF8ToString(ptr, maxBytesToRead) {
                return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
            }
            var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
            var WASM_PAGE_SIZE = 65536;
            var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

            function updateGlobalBufferAndViews(buf) {
                buffer = buf;
                Module["HEAP8"] = HEAP8 = new Int8Array(buf);
                Module["HEAP16"] = HEAP16 = new Int16Array(buf);
                Module["HEAP32"] = HEAP32 = new Int32Array(buf);
                Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
                Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
                Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
                Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
                Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
            }
            var DYNAMIC_BASE = 5276496,
                DYNAMICTOP_PTR = 33456;
            var INITIAL_INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
            if (Module["wasmMemory"]) {
                wasmMemory = Module["wasmMemory"]
            } else {
                wasmMemory = new WebAssembly.Memory({
                    "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
                    "maximum": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
                })
            }
            if (wasmMemory) {
                buffer = wasmMemory.buffer
            }
            INITIAL_INITIAL_MEMORY = buffer.byteLength;
            updateGlobalBufferAndViews(buffer);
            HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

            function callRuntimeCallbacks(callbacks) {
                while (callbacks.length > 0) {
                    var callback = callbacks.shift();
                    if (typeof callback == "function") {
                        callback();
                        continue
                    }
                    var func = callback.func;
                    if (typeof func === "number") {
                        if (callback.arg === undefined) {
                            Module["dynCall_v"](func)
                        } else {
                            Module["dynCall_vi"](func, callback.arg)
                        }
                    } else {
                        func(callback.arg === undefined ? null : callback.arg)
                    }
                }
            }
            var __ATPRERUN__ = [];
            var __ATINIT__ = [];
            var __ATMAIN__ = [];
            var __ATPOSTRUN__ = [];
            var runtimeInitialized = false;

            function preRun() {
                if (Module["preRun"]) {
                    if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
                    while (Module["preRun"].length) {
                        addOnPreRun(Module["preRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPRERUN__)
            }

            function initRuntime() {
                runtimeInitialized = true;
                callRuntimeCallbacks(__ATINIT__)
            }

            function preMain() {
                callRuntimeCallbacks(__ATMAIN__)
            }

            function postRun() {
                if (Module["postRun"]) {
                    if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
                    while (Module["postRun"].length) {
                        addOnPostRun(Module["postRun"].shift())
                    }
                }
                callRuntimeCallbacks(__ATPOSTRUN__)
            }

            function addOnPreRun(cb) {
                __ATPRERUN__.unshift(cb)
            }

            function addOnPostRun(cb) {
                __ATPOSTRUN__.unshift(cb)
            }
            var runDependencies = 0;
            var runDependencyWatcher = null;
            var dependenciesFulfilled = null;

            function addRunDependency(id) {
                runDependencies++;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
            }

            function removeRunDependency(id) {
                runDependencies--;
                if (Module["monitorRunDependencies"]) {
                    Module["monitorRunDependencies"](runDependencies)
                }
                if (runDependencies == 0) {
                    if (runDependencyWatcher !== null) {
                        clearInterval(runDependencyWatcher);
                        runDependencyWatcher = null
                    }
                    if (dependenciesFulfilled) {
                        var callback = dependenciesFulfilled;
                        dependenciesFulfilled = null;
                        callback()
                    }
                }
            }
            Module["preloadedImages"] = {};
            Module["preloadedAudios"] = {};

            function abort(what) {
                if (Module["onAbort"]) {
                    Module["onAbort"](what)
                }
                what += "";
                out(what);
                err(what);
                ABORT = true;
                EXITSTATUS = 1;
                what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
                throw new WebAssembly.RuntimeError(what)
            }
            var dataURIPrefix = "data:application/octet-stream;base64,";

            function isDataURI(filename) {
                return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
            }
            var wasmBinaryFile = "mcl_c384_256.wasm";
            if (!isDataURI(wasmBinaryFile)) {
                wasmBinaryFile = locateFile(wasmBinaryFile)
            }

            function getBinary() {
                try {
                    if (wasmBinary) {
                        return new Uint8Array(wasmBinary)
                    }
                    if (readBinary) {
                        return readBinary(wasmBinaryFile)
                    } else {
                        throw "both async and sync fetching of the wasm failed"
                    }
                } catch (err) {
                    abort(err)
                }
            }

            function getBinaryPromise() {
                if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
                    return fetch("./mcl_c384_256.wasm", {
                        credentials: "same-origin"
                    }).then(function(response) {
                        if (!response["ok"]) {
                            throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                        }
                        return response["arrayBuffer"]()
                    }).catch(function() {
                        return getBinary()
                    })
                }
                return new Promise(function(resolve, reject) {
                    resolve(getBinary())
                })
            }

            function createWasm() {
                var info = {
                    "a": asmLibraryArg
                };

                function receiveInstance(instance, module) {
                    var exports = instance.exports;
                    Module["asm"] = exports;
                    removeRunDependency("wasm-instantiate")
                }
                addRunDependency("wasm-instantiate");

                function receiveInstantiatedSource(output) {
                    receiveInstance(output["instance"])
                }

                function instantiateArrayBuffer(receiver) {
                    return getBinaryPromise().then(function(binary) {
                        return WebAssembly.instantiate(binary, info)
                    }).then(receiver, function(reason) {
                        err("failed to asynchronously prepare wasm: " + reason);
                        abort(reason)
                    })
                }

                function instantiateAsync() {
                    if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
                        fetch(wasmBinaryFile, {
                            credentials: "same-origin"
                        }).then(function(response) {
                            var result = WebAssembly.instantiateStreaming(response, info);
                            return result.then(receiveInstantiatedSource, function(reason) {
                                err("wasm streaming compile failed: " + reason);
                                err("falling back to ArrayBuffer instantiation");
                                instantiateArrayBuffer(receiveInstantiatedSource)
                            })
                        })
                    } else {
                        return instantiateArrayBuffer(receiveInstantiatedSource)
                    }
                }
                if (Module["instantiateWasm"]) {
                    try {
                        var exports = Module["instantiateWasm"](info, receiveInstance);
                        return exports
                    } catch (e) {
                        err("Module.instantiateWasm callback failed with error: " + e);
                        return false
                    }
                }
                instantiateAsync();
                return {}
            }
            var ASM_CONSTS = {
                3358: function($0, $1) {
                    Module.cryptoGetRandomValues($0, $1)
                }
            };

            function _emscripten_asm_const_iii(code, sigPtr, argbuf) {
                var args = readAsmConstArgs(sigPtr, argbuf);
                return ASM_CONSTS[code].apply(null, args)
            }
            __ATINIT__.push({
                func: function() {
                    ___wasm_call_ctors()
                }
            });

            function _abort() {
                abort()
            }

            function _emscripten_memcpy_big(dest, src, num) {
                HEAPU8.copyWithin(dest, src, src + num)
            }

            function _emscripten_resize_heap(requestedSize) {
                return false
            }
            var PATH = {
                splitPath: function(filename) {
                    var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
                    return splitPathRe.exec(filename).slice(1)
                },
                normalizeArray: function(parts, allowAboveRoot) {
                    var up = 0;
                    for (var i = parts.length - 1; i >= 0; i--) {
                        var last = parts[i];
                        if (last === ".") {
                            parts.splice(i, 1)
                        } else if (last === "..") {
                            parts.splice(i, 1);
                            up++
                        } else if (up) {
                            parts.splice(i, 1);
                            up--
                        }
                    }
                    if (allowAboveRoot) {
                        for (; up; up--) {
                            parts.unshift("..")
                        }
                    }
                    return parts
                },
                normalize: function(path) {
                    var isAbsolute = path.charAt(0) === "/",
                        trailingSlash = path.substr(-1) === "/";
                    path = PATH.normalizeArray(path.split("/").filter(function(p) {
                        return !!p
                    }), !isAbsolute).join("/");
                    if (!path && !isAbsolute) {
                        path = "."
                    }
                    if (path && trailingSlash) {
                        path += "/"
                    }
                    return (isAbsolute ? "/" : "") + path
                },
                dirname: function(path) {
                    var result = PATH.splitPath(path),
                        root = result[0],
                        dir = result[1];
                    if (!root && !dir) {
                        return "."
                    }
                    if (dir) {
                        dir = dir.substr(0, dir.length - 1)
                    }
                    return root + dir
                },
                basename: function(path) {
                    if (path === "/") return "/";
                    var lastSlash = path.lastIndexOf("/");
                    if (lastSlash === -1) return path;
                    return path.substr(lastSlash + 1)
                },
                extname: function(path) {
                    return PATH.splitPath(path)[3]
                },
                join: function() {
                    var paths = Array.prototype.slice.call(arguments, 0);
                    return PATH.normalize(paths.join("/"))
                },
                join2: function(l, r) {
                    return PATH.normalize(l + "/" + r)
                }
            };
            var SYSCALLS = {
                mappings: {},
                buffers: [null, [],
                    []
                ],
                printChar: function(stream, curr) {
                    var buffer = SYSCALLS.buffers[stream];
                    if (curr === 0 || curr === 10) {
                        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
                        buffer.length = 0
                    } else {
                        buffer.push(curr)
                    }
                },
                varargs: undefined,
                get: function() {
                    SYSCALLS.varargs += 4;
                    var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
                    return ret
                },
                getStr: function(ptr) {
                    var ret = UTF8ToString(ptr);
                    return ret
                },
                get64: function(low, high) {
                    return low
                }
            };

            function _fd_close(fd) {
                return 0
            }

            function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {}

            function _fd_write(fd, iov, iovcnt, pnum) {
                var num = 0;
                for (var i = 0; i < iovcnt; i++) {
                    var ptr = HEAP32[iov + i * 8 >> 2];
                    var len = HEAP32[iov + (i * 8 + 4) >> 2];
                    for (var j = 0; j < len; j++) {
                        SYSCALLS.printChar(fd, HEAPU8[ptr + j])
                    }
                    num += len
                }
                HEAP32[pnum >> 2] = num;
                return 0
            }

            function readAsmConstArgs(sigPtr, buf) {
                if (!readAsmConstArgs.array) {
                    readAsmConstArgs.array = []
                }
                var args = readAsmConstArgs.array;
                args.length = 0;
                var ch;
                while (ch = HEAPU8[sigPtr++]) {
                    if (ch === 100 || ch === 102) {
                        buf = buf + 7 & ~7;
                        args.push(HEAPF64[buf >> 3]);
                        buf += 8
                    } else {
                        buf = buf + 3 & ~3;
                        args.push(HEAP32[buf >> 2]);
                        buf += 4
                    }
                }
                return args
            }
            var asmLibraryArg = {
                "f": _abort,
                "b": _emscripten_asm_const_iii,
                "d": _emscripten_memcpy_big,
                "e": _emscripten_resize_heap,
                "g": _fd_close,
                "c": _fd_seek,
                "a": _fd_write,
                "memory": wasmMemory,
                "table": wasmTable
            };
            var asm = createWasm();
            Module["asm"] = asm;
            var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
                return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["h"]).apply(null, arguments)
            };
            var _mclBnMalloc = Module["_mclBnMalloc"] = function() {
                return (_mclBnMalloc = Module["_mclBnMalloc"] = Module["asm"]["i"]).apply(null, arguments)
            };
            var _mclBnFree = Module["_mclBnFree"] = function() {
                return (_mclBnFree = Module["_mclBnFree"] = Module["asm"]["j"]).apply(null, arguments)
            };
            var _mclBn_getVersion = Module["_mclBn_getVersion"] = function() {
                return (_mclBn_getVersion = Module["_mclBn_getVersion"] = Module["asm"]["k"]).apply(null, arguments)
            };
            var _mclBn_init = Module["_mclBn_init"] = function() {
                return (_mclBn_init = Module["_mclBn_init"] = Module["asm"]["l"]).apply(null, arguments)
            };
            var _mclBn_getCurveType = Module["_mclBn_getCurveType"] = function() {
                return (_mclBn_getCurveType = Module["_mclBn_getCurveType"] = Module["asm"]["m"]).apply(null, arguments)
            };
            var _mclBn_getOpUnitSize = Module["_mclBn_getOpUnitSize"] = function() {
                return (_mclBn_getOpUnitSize = Module["_mclBn_getOpUnitSize"] = Module["asm"]["n"]).apply(null, arguments)
            };
            var _mclBn_getG1ByteSize = Module["_mclBn_getG1ByteSize"] = function() {
                return (_mclBn_getG1ByteSize = Module["_mclBn_getG1ByteSize"] = Module["asm"]["o"]).apply(null, arguments)
            };
            var _mclBn_getFpByteSize = Module["_mclBn_getFpByteSize"] = function() {
                return (_mclBn_getFpByteSize = Module["_mclBn_getFpByteSize"] = Module["asm"]["p"]).apply(null, arguments)
            };
            var _mclBn_getFrByteSize = Module["_mclBn_getFrByteSize"] = function() {
                return (_mclBn_getFrByteSize = Module["_mclBn_getFrByteSize"] = Module["asm"]["q"]).apply(null, arguments)
            };
            var _mclBn_getCurveOrder = Module["_mclBn_getCurveOrder"] = function() {
                return (_mclBn_getCurveOrder = Module["_mclBn_getCurveOrder"] = Module["asm"]["r"]).apply(null, arguments)
            };
            var _mclBn_getFieldOrder = Module["_mclBn_getFieldOrder"] = function() {
                return (_mclBn_getFieldOrder = Module["_mclBn_getFieldOrder"] = Module["asm"]["s"]).apply(null, arguments)
            };
            var _mclBn_setETHserialization = Module["_mclBn_setETHserialization"] = function() {
                return (_mclBn_setETHserialization = Module["_mclBn_setETHserialization"] = Module["asm"]["t"]).apply(null, arguments)
            };
            var _mclBn_getETHserialization = Module["_mclBn_getETHserialization"] = function() {
                return (_mclBn_getETHserialization = Module["_mclBn_getETHserialization"] = Module["asm"]["u"]).apply(null, arguments)
            };
            var _mclBn_setMapToMode = Module["_mclBn_setMapToMode"] = function() {
                return (_mclBn_setMapToMode = Module["_mclBn_setMapToMode"] = Module["asm"]["v"]).apply(null, arguments)
            };
            var _mclBn_ethMsgToFp2 = Module["_mclBn_ethMsgToFp2"] = function() {
                return (_mclBn_ethMsgToFp2 = Module["_mclBn_ethMsgToFp2"] = Module["asm"]["w"]).apply(null, arguments)
            };
            var _mclBn_ethFp2ToG2 = Module["_mclBn_ethFp2ToG2"] = function() {
                return (_mclBn_ethFp2ToG2 = Module["_mclBn_ethFp2ToG2"] = Module["asm"]["x"]).apply(null, arguments)
            };
            var _mclBn_ethMsgToG2 = Module["_mclBn_ethMsgToG2"] = function() {
                return (_mclBn_ethMsgToG2 = Module["_mclBn_ethMsgToG2"] = Module["asm"]["y"]).apply(null, arguments)
            };
            var _mclBn_setOriginalG2cofactor = Module["_mclBn_setOriginalG2cofactor"] = function() {
                return (_mclBn_setOriginalG2cofactor = Module["_mclBn_setOriginalG2cofactor"] = Module["asm"]["z"]).apply(null, arguments)
            };
            var _mclBnFr_clear = Module["_mclBnFr_clear"] = function() {
                return (_mclBnFr_clear = Module["_mclBnFr_clear"] = Module["asm"]["A"]).apply(null, arguments)
            };
            var _mclBnFr_setInt = Module["_mclBnFr_setInt"] = function() {
                return (_mclBnFr_setInt = Module["_mclBnFr_setInt"] = Module["asm"]["B"]).apply(null, arguments)
            };
            var _mclBnFr_setInt32 = Module["_mclBnFr_setInt32"] = function() {
                return (_mclBnFr_setInt32 = Module["_mclBnFr_setInt32"] = Module["asm"]["C"]).apply(null, arguments)
            };
            var _mclBnFr_setStr = Module["_mclBnFr_setStr"] = function() {
                return (_mclBnFr_setStr = Module["_mclBnFr_setStr"] = Module["asm"]["D"]).apply(null, arguments)
            };
            var _mclBnFr_setLittleEndian = Module["_mclBnFr_setLittleEndian"] = function() {
                return (_mclBnFr_setLittleEndian = Module["_mclBnFr_setLittleEndian"] = Module["asm"]["E"]).apply(null, arguments)
            };
            var _mclBnFr_setBigEndianMod = Module["_mclBnFr_setBigEndianMod"] = function() {
                return (_mclBnFr_setBigEndianMod = Module["_mclBnFr_setBigEndianMod"] = Module["asm"]["F"]).apply(null, arguments)
            };
            var _mclBnFr_getLittleEndian = Module["_mclBnFr_getLittleEndian"] = function() {
                return (_mclBnFr_getLittleEndian = Module["_mclBnFr_getLittleEndian"] = Module["asm"]["G"]).apply(null, arguments)
            };
            var _mclBnFr_setLittleEndianMod = Module["_mclBnFr_setLittleEndianMod"] = function() {
                return (_mclBnFr_setLittleEndianMod = Module["_mclBnFr_setLittleEndianMod"] = Module["asm"]["H"]).apply(null, arguments)
            };
            var _mclBnFr_deserialize = Module["_mclBnFr_deserialize"] = function() {
                return (_mclBnFr_deserialize = Module["_mclBnFr_deserialize"] = Module["asm"]["I"]).apply(null, arguments)
            };
            var _mclBnFr_isValid = Module["_mclBnFr_isValid"] = function() {
                return (_mclBnFr_isValid = Module["_mclBnFr_isValid"] = Module["asm"]["J"]).apply(null, arguments)
            };
            var _mclBnFr_isEqual = Module["_mclBnFr_isEqual"] = function() {
                return (_mclBnFr_isEqual = Module["_mclBnFr_isEqual"] = Module["asm"]["K"]).apply(null, arguments)
            };
            var _mclBnFr_isZero = Module["_mclBnFr_isZero"] = function() {
                return (_mclBnFr_isZero = Module["_mclBnFr_isZero"] = Module["asm"]["L"]).apply(null, arguments)
            };
            var _mclBnFr_isOne = Module["_mclBnFr_isOne"] = function() {
                return (_mclBnFr_isOne = Module["_mclBnFr_isOne"] = Module["asm"]["M"]).apply(null, arguments)
            };
            var _mclBnFr_isOdd = Module["_mclBnFr_isOdd"] = function() {
                return (_mclBnFr_isOdd = Module["_mclBnFr_isOdd"] = Module["asm"]["N"]).apply(null, arguments)
            };
            var _mclBnFr_isNegative = Module["_mclBnFr_isNegative"] = function() {
                return (_mclBnFr_isNegative = Module["_mclBnFr_isNegative"] = Module["asm"]["O"]).apply(null, arguments)
            };
            var _mclBnFr_setByCSPRNG = Module["_mclBnFr_setByCSPRNG"] = function() {
                return (_mclBnFr_setByCSPRNG = Module["_mclBnFr_setByCSPRNG"] = Module["asm"]["P"]).apply(null, arguments)
            };
            var _mclBnFp_setByCSPRNG = Module["_mclBnFp_setByCSPRNG"] = function() {
                return (_mclBnFp_setByCSPRNG = Module["_mclBnFp_setByCSPRNG"] = Module["asm"]["Q"]).apply(null, arguments)
            };
            var _mclBn_setRandFunc = Module["_mclBn_setRandFunc"] = function() {
                return (_mclBn_setRandFunc = Module["_mclBn_setRandFunc"] = Module["asm"]["R"]).apply(null, arguments)
            };
            var _mclBnFr_setHashOf = Module["_mclBnFr_setHashOf"] = function() {
                return (_mclBnFr_setHashOf = Module["_mclBnFr_setHashOf"] = Module["asm"]["S"]).apply(null, arguments)
            };
            var _mclBnFr_getStr = Module["_mclBnFr_getStr"] = function() {
                return (_mclBnFr_getStr = Module["_mclBnFr_getStr"] = Module["asm"]["T"]).apply(null, arguments)
            };
            var _mclBnFr_serialize = Module["_mclBnFr_serialize"] = function() {
                return (_mclBnFr_serialize = Module["_mclBnFr_serialize"] = Module["asm"]["U"]).apply(null, arguments)
            };
            var _mclBnFr_neg = Module["_mclBnFr_neg"] = function() {
                return (_mclBnFr_neg = Module["_mclBnFr_neg"] = Module["asm"]["V"]).apply(null, arguments)
            };
            var _mclBnFr_inv = Module["_mclBnFr_inv"] = function() {
                return (_mclBnFr_inv = Module["_mclBnFr_inv"] = Module["asm"]["W"]).apply(null, arguments)
            };
            var _mclBnFr_sqr = Module["_mclBnFr_sqr"] = function() {
                return (_mclBnFr_sqr = Module["_mclBnFr_sqr"] = Module["asm"]["X"]).apply(null, arguments)
            };
            var _mclBnFr_add = Module["_mclBnFr_add"] = function() {
                return (_mclBnFr_add = Module["_mclBnFr_add"] = Module["asm"]["Y"]).apply(null, arguments)
            };
            var _mclBnFr_sub = Module["_mclBnFr_sub"] = function() {
                return (_mclBnFr_sub = Module["_mclBnFr_sub"] = Module["asm"]["Z"]).apply(null, arguments)
            };
            var _mclBnFr_mul = Module["_mclBnFr_mul"] = function() {
                return (_mclBnFr_mul = Module["_mclBnFr_mul"] = Module["asm"]["_"]).apply(null, arguments)
            };
            var _mclBnFr_div = Module["_mclBnFr_div"] = function() {
                return (_mclBnFr_div = Module["_mclBnFr_div"] = Module["asm"]["$"]).apply(null, arguments)
            };
            var _mclBnFp_neg = Module["_mclBnFp_neg"] = function() {
                return (_mclBnFp_neg = Module["_mclBnFp_neg"] = Module["asm"]["aa"]).apply(null, arguments)
            };
            var _mclBnFp_inv = Module["_mclBnFp_inv"] = function() {
                return (_mclBnFp_inv = Module["_mclBnFp_inv"] = Module["asm"]["ba"]).apply(null, arguments)
            };
            var _mclBnFp_sqr = Module["_mclBnFp_sqr"] = function() {
                return (_mclBnFp_sqr = Module["_mclBnFp_sqr"] = Module["asm"]["ca"]).apply(null, arguments)
            };
            var _mclBnFp_add = Module["_mclBnFp_add"] = function() {
                return (_mclBnFp_add = Module["_mclBnFp_add"] = Module["asm"]["da"]).apply(null, arguments)
            };
            var _mclBnFp_sub = Module["_mclBnFp_sub"] = function() {
                return (_mclBnFp_sub = Module["_mclBnFp_sub"] = Module["asm"]["ea"]).apply(null, arguments)
            };
            var _mclBnFp_mul = Module["_mclBnFp_mul"] = function() {
                return (_mclBnFp_mul = Module["_mclBnFp_mul"] = Module["asm"]["fa"]).apply(null, arguments)
            };
            var _mclBnFp_div = Module["_mclBnFp_div"] = function() {
                return (_mclBnFp_div = Module["_mclBnFp_div"] = Module["asm"]["ga"]).apply(null, arguments)
            };
            var _mclBnFp2_neg = Module["_mclBnFp2_neg"] = function() {
                return (_mclBnFp2_neg = Module["_mclBnFp2_neg"] = Module["asm"]["ha"]).apply(null, arguments)
            };
            var _mclBnFp2_inv = Module["_mclBnFp2_inv"] = function() {
                return (_mclBnFp2_inv = Module["_mclBnFp2_inv"] = Module["asm"]["ia"]).apply(null, arguments)
            };
            var _mclBnFp2_sqr = Module["_mclBnFp2_sqr"] = function() {
                return (_mclBnFp2_sqr = Module["_mclBnFp2_sqr"] = Module["asm"]["ja"]).apply(null, arguments)
            };
            var _mclBnFp2_add = Module["_mclBnFp2_add"] = function() {
                return (_mclBnFp2_add = Module["_mclBnFp2_add"] = Module["asm"]["ka"]).apply(null, arguments)
            };
            var _mclBnFp2_sub = Module["_mclBnFp2_sub"] = function() {
                return (_mclBnFp2_sub = Module["_mclBnFp2_sub"] = Module["asm"]["la"]).apply(null, arguments)
            };
            var _mclBnFp2_mul = Module["_mclBnFp2_mul"] = function() {
                return (_mclBnFp2_mul = Module["_mclBnFp2_mul"] = Module["asm"]["ma"]).apply(null, arguments)
            };
            var _mclBnFp2_div = Module["_mclBnFp2_div"] = function() {
                return (_mclBnFp2_div = Module["_mclBnFp2_div"] = Module["asm"]["na"]).apply(null, arguments)
            };
            var _mclBnFr_squareRoot = Module["_mclBnFr_squareRoot"] = function() {
                return (_mclBnFr_squareRoot = Module["_mclBnFr_squareRoot"] = Module["asm"]["oa"]).apply(null, arguments)
            };
            var _mclBnFp_squareRoot = Module["_mclBnFp_squareRoot"] = function() {
                return (_mclBnFp_squareRoot = Module["_mclBnFp_squareRoot"] = Module["asm"]["pa"]).apply(null, arguments)
            };
            var _mclBnFp2_squareRoot = Module["_mclBnFp2_squareRoot"] = function() {
                return (_mclBnFp2_squareRoot = Module["_mclBnFp2_squareRoot"] = Module["asm"]["qa"]).apply(null, arguments)
            };
            var _mclBnG1_clear = Module["_mclBnG1_clear"] = function() {
                return (_mclBnG1_clear = Module["_mclBnG1_clear"] = Module["asm"]["ra"]).apply(null, arguments)
            };
            var _mclBnG1_setStr = Module["_mclBnG1_setStr"] = function() {
                return (_mclBnG1_setStr = Module["_mclBnG1_setStr"] = Module["asm"]["sa"]).apply(null, arguments)
            };
            var _mclBnG1_deserialize = Module["_mclBnG1_deserialize"] = function() {
                return (_mclBnG1_deserialize = Module["_mclBnG1_deserialize"] = Module["asm"]["ta"]).apply(null, arguments)
            };
            var _mclBnG1_isValid = Module["_mclBnG1_isValid"] = function() {
                return (_mclBnG1_isValid = Module["_mclBnG1_isValid"] = Module["asm"]["ua"]).apply(null, arguments)
            };
            var _mclBnG1_isEqual = Module["_mclBnG1_isEqual"] = function() {
                return (_mclBnG1_isEqual = Module["_mclBnG1_isEqual"] = Module["asm"]["va"]).apply(null, arguments)
            };
            var _mclBnG1_isZero = Module["_mclBnG1_isZero"] = function() {
                return (_mclBnG1_isZero = Module["_mclBnG1_isZero"] = Module["asm"]["wa"]).apply(null, arguments)
            };
            var _mclBnG1_isValidOrder = Module["_mclBnG1_isValidOrder"] = function() {
                return (_mclBnG1_isValidOrder = Module["_mclBnG1_isValidOrder"] = Module["asm"]["xa"]).apply(null, arguments)
            };
            var _mclBnG1_hashAndMapTo = Module["_mclBnG1_hashAndMapTo"] = function() {
                return (_mclBnG1_hashAndMapTo = Module["_mclBnG1_hashAndMapTo"] = Module["asm"]["ya"]).apply(null, arguments)
            };
            var _mclBnG1_getStr = Module["_mclBnG1_getStr"] = function() {
                return (_mclBnG1_getStr = Module["_mclBnG1_getStr"] = Module["asm"]["za"]).apply(null, arguments)
            };
            var _mclBnG1_serialize = Module["_mclBnG1_serialize"] = function() {
                return (_mclBnG1_serialize = Module["_mclBnG1_serialize"] = Module["asm"]["Aa"]).apply(null, arguments)
            };
            var _mclBnG1_neg = Module["_mclBnG1_neg"] = function() {
                return (_mclBnG1_neg = Module["_mclBnG1_neg"] = Module["asm"]["Ba"]).apply(null, arguments)
            };
            var _mclBnG1_dbl = Module["_mclBnG1_dbl"] = function() {
                return (_mclBnG1_dbl = Module["_mclBnG1_dbl"] = Module["asm"]["Ca"]).apply(null, arguments)
            };
            var _mclBnG1_normalize = Module["_mclBnG1_normalize"] = function() {
                return (_mclBnG1_normalize = Module["_mclBnG1_normalize"] = Module["asm"]["Da"]).apply(null, arguments)
            };
            var _mclBnG1_add = Module["_mclBnG1_add"] = function() {
                return (_mclBnG1_add = Module["_mclBnG1_add"] = Module["asm"]["Ea"]).apply(null, arguments)
            };
            var _mclBnG1_sub = Module["_mclBnG1_sub"] = function() {
                return (_mclBnG1_sub = Module["_mclBnG1_sub"] = Module["asm"]["Fa"]).apply(null, arguments)
            };
            var _mclBnG1_mul = Module["_mclBnG1_mul"] = function() {
                return (_mclBnG1_mul = Module["_mclBnG1_mul"] = Module["asm"]["Ga"]).apply(null, arguments)
            };
            var _mclBnG1_mulCT = Module["_mclBnG1_mulCT"] = function() {
                return (_mclBnG1_mulCT = Module["_mclBnG1_mulCT"] = Module["asm"]["Ha"]).apply(null, arguments)
            };
            var _mclBnG2_clear = Module["_mclBnG2_clear"] = function() {
                return (_mclBnG2_clear = Module["_mclBnG2_clear"] = Module["asm"]["Ia"]).apply(null, arguments)
            };
            var _mclBnG2_setStr = Module["_mclBnG2_setStr"] = function() {
                return (_mclBnG2_setStr = Module["_mclBnG2_setStr"] = Module["asm"]["Ja"]).apply(null, arguments)
            };
            var _mclBnG2_deserialize = Module["_mclBnG2_deserialize"] = function() {
                return (_mclBnG2_deserialize = Module["_mclBnG2_deserialize"] = Module["asm"]["Ka"]).apply(null, arguments)
            };
            var _mclBnG2_isValid = Module["_mclBnG2_isValid"] = function() {
                return (_mclBnG2_isValid = Module["_mclBnG2_isValid"] = Module["asm"]["La"]).apply(null, arguments)
            };
            var _mclBnG2_isEqual = Module["_mclBnG2_isEqual"] = function() {
                return (_mclBnG2_isEqual = Module["_mclBnG2_isEqual"] = Module["asm"]["Ma"]).apply(null, arguments)
            };
            var _mclBnG2_isZero = Module["_mclBnG2_isZero"] = function() {
                return (_mclBnG2_isZero = Module["_mclBnG2_isZero"] = Module["asm"]["Na"]).apply(null, arguments)
            };
            var _mclBnG2_isValidOrder = Module["_mclBnG2_isValidOrder"] = function() {
                return (_mclBnG2_isValidOrder = Module["_mclBnG2_isValidOrder"] = Module["asm"]["Oa"]).apply(null, arguments)
            };
            var _mclBnG2_hashAndMapTo = Module["_mclBnG2_hashAndMapTo"] = function() {
                return (_mclBnG2_hashAndMapTo = Module["_mclBnG2_hashAndMapTo"] = Module["asm"]["Pa"]).apply(null, arguments)
            };
            var _mclBnG2_getStr = Module["_mclBnG2_getStr"] = function() {
                return (_mclBnG2_getStr = Module["_mclBnG2_getStr"] = Module["asm"]["Qa"]).apply(null, arguments)
            };
            var _mclBnG2_serialize = Module["_mclBnG2_serialize"] = function() {
                return (_mclBnG2_serialize = Module["_mclBnG2_serialize"] = Module["asm"]["Ra"]).apply(null, arguments)
            };
            var _mclBnG2_neg = Module["_mclBnG2_neg"] = function() {
                return (_mclBnG2_neg = Module["_mclBnG2_neg"] = Module["asm"]["Sa"]).apply(null, arguments)
            };
            var _mclBnG2_dbl = Module["_mclBnG2_dbl"] = function() {
                return (_mclBnG2_dbl = Module["_mclBnG2_dbl"] = Module["asm"]["Ta"]).apply(null, arguments)
            };
            var _mclBnG2_normalize = Module["_mclBnG2_normalize"] = function() {
                return (_mclBnG2_normalize = Module["_mclBnG2_normalize"] = Module["asm"]["Ua"]).apply(null, arguments)
            };
            var _mclBnG2_add = Module["_mclBnG2_add"] = function() {
                return (_mclBnG2_add = Module["_mclBnG2_add"] = Module["asm"]["Va"]).apply(null, arguments)
            };
            var _mclBnG2_sub = Module["_mclBnG2_sub"] = function() {
                return (_mclBnG2_sub = Module["_mclBnG2_sub"] = Module["asm"]["Wa"]).apply(null, arguments)
            };
            var _mclBnG2_mul = Module["_mclBnG2_mul"] = function() {
                return (_mclBnG2_mul = Module["_mclBnG2_mul"] = Module["asm"]["Xa"]).apply(null, arguments)
            };
            var _mclBnG2_mulCT = Module["_mclBnG2_mulCT"] = function() {
                return (_mclBnG2_mulCT = Module["_mclBnG2_mulCT"] = Module["asm"]["Ya"]).apply(null, arguments)
            };
            var _mclBnGT_clear = Module["_mclBnGT_clear"] = function() {
                return (_mclBnGT_clear = Module["_mclBnGT_clear"] = Module["asm"]["Za"]).apply(null, arguments)
            };
            var _mclBnGT_setInt = Module["_mclBnGT_setInt"] = function() {
                return (_mclBnGT_setInt = Module["_mclBnGT_setInt"] = Module["asm"]["_a"]).apply(null, arguments)
            };
            var _mclBnGT_setInt32 = Module["_mclBnGT_setInt32"] = function() {
                return (_mclBnGT_setInt32 = Module["_mclBnGT_setInt32"] = Module["asm"]["$a"]).apply(null, arguments)
            };
            var _mclBnGT_setStr = Module["_mclBnGT_setStr"] = function() {
                return (_mclBnGT_setStr = Module["_mclBnGT_setStr"] = Module["asm"]["ab"]).apply(null, arguments)
            };
            var _mclBnGT_deserialize = Module["_mclBnGT_deserialize"] = function() {
                return (_mclBnGT_deserialize = Module["_mclBnGT_deserialize"] = Module["asm"]["bb"]).apply(null, arguments)
            };
            var _mclBnGT_isEqual = Module["_mclBnGT_isEqual"] = function() {
                return (_mclBnGT_isEqual = Module["_mclBnGT_isEqual"] = Module["asm"]["cb"]).apply(null, arguments)
            };
            var _mclBnGT_isZero = Module["_mclBnGT_isZero"] = function() {
                return (_mclBnGT_isZero = Module["_mclBnGT_isZero"] = Module["asm"]["db"]).apply(null, arguments)
            };
            var _mclBnGT_isOne = Module["_mclBnGT_isOne"] = function() {
                return (_mclBnGT_isOne = Module["_mclBnGT_isOne"] = Module["asm"]["eb"]).apply(null, arguments)
            };
            var _mclBnGT_getStr = Module["_mclBnGT_getStr"] = function() {
                return (_mclBnGT_getStr = Module["_mclBnGT_getStr"] = Module["asm"]["fb"]).apply(null, arguments)
            };
            var _mclBnGT_serialize = Module["_mclBnGT_serialize"] = function() {
                return (_mclBnGT_serialize = Module["_mclBnGT_serialize"] = Module["asm"]["gb"]).apply(null, arguments)
            };
            var _mclBnGT_neg = Module["_mclBnGT_neg"] = function() {
                return (_mclBnGT_neg = Module["_mclBnGT_neg"] = Module["asm"]["hb"]).apply(null, arguments)
            };
            var _mclBnGT_inv = Module["_mclBnGT_inv"] = function() {
                return (_mclBnGT_inv = Module["_mclBnGT_inv"] = Module["asm"]["ib"]).apply(null, arguments)
            };
            var _mclBnGT_invGeneric = Module["_mclBnGT_invGeneric"] = function() {
                return (_mclBnGT_invGeneric = Module["_mclBnGT_invGeneric"] = Module["asm"]["jb"]).apply(null, arguments)
            };
            var _mclBnGT_sqr = Module["_mclBnGT_sqr"] = function() {
                return (_mclBnGT_sqr = Module["_mclBnGT_sqr"] = Module["asm"]["kb"]).apply(null, arguments)
            };
            var _mclBnGT_add = Module["_mclBnGT_add"] = function() {
                return (_mclBnGT_add = Module["_mclBnGT_add"] = Module["asm"]["lb"]).apply(null, arguments)
            };
            var _mclBnGT_sub = Module["_mclBnGT_sub"] = function() {
                return (_mclBnGT_sub = Module["_mclBnGT_sub"] = Module["asm"]["mb"]).apply(null, arguments)
            };
            var _mclBnGT_mul = Module["_mclBnGT_mul"] = function() {
                return (_mclBnGT_mul = Module["_mclBnGT_mul"] = Module["asm"]["nb"]).apply(null, arguments)
            };
            var _mclBnGT_div = Module["_mclBnGT_div"] = function() {
                return (_mclBnGT_div = Module["_mclBnGT_div"] = Module["asm"]["ob"]).apply(null, arguments)
            };
            var _mclBnGT_pow = Module["_mclBnGT_pow"] = function() {
                return (_mclBnGT_pow = Module["_mclBnGT_pow"] = Module["asm"]["pb"]).apply(null, arguments)
            };
            var _mclBnGT_powGeneric = Module["_mclBnGT_powGeneric"] = function() {
                return (_mclBnGT_powGeneric = Module["_mclBnGT_powGeneric"] = Module["asm"]["qb"]).apply(null, arguments)
            };
            var _mclBnG1_mulVec = Module["_mclBnG1_mulVec"] = function() {
                return (_mclBnG1_mulVec = Module["_mclBnG1_mulVec"] = Module["asm"]["rb"]).apply(null, arguments)
            };
            var _mclBnG2_mulVec = Module["_mclBnG2_mulVec"] = function() {
                return (_mclBnG2_mulVec = Module["_mclBnG2_mulVec"] = Module["asm"]["sb"]).apply(null, arguments)
            };
            var _mclBnGT_powVec = Module["_mclBnGT_powVec"] = function() {
                return (_mclBnGT_powVec = Module["_mclBnGT_powVec"] = Module["asm"]["tb"]).apply(null, arguments)
            };
            var _mclBn_pairing = Module["_mclBn_pairing"] = function() {
                return (_mclBn_pairing = Module["_mclBn_pairing"] = Module["asm"]["ub"]).apply(null, arguments)
            };
            var _mclBn_finalExp = Module["_mclBn_finalExp"] = function() {
                return (_mclBn_finalExp = Module["_mclBn_finalExp"] = Module["asm"]["vb"]).apply(null, arguments)
            };
            var _mclBn_millerLoop = Module["_mclBn_millerLoop"] = function() {
                return (_mclBn_millerLoop = Module["_mclBn_millerLoop"] = Module["asm"]["wb"]).apply(null, arguments)
            };
            var _mclBn_millerLoopVec = Module["_mclBn_millerLoopVec"] = function() {
                return (_mclBn_millerLoopVec = Module["_mclBn_millerLoopVec"] = Module["asm"]["xb"]).apply(null, arguments)
            };
            var _mclBn_getUint64NumToPrecompute = Module["_mclBn_getUint64NumToPrecompute"] = function() {
                return (_mclBn_getUint64NumToPrecompute = Module["_mclBn_getUint64NumToPrecompute"] = Module["asm"]["yb"]).apply(null, arguments)
            };
            var _mclBn_precomputeG2 = Module["_mclBn_precomputeG2"] = function() {
                return (_mclBn_precomputeG2 = Module["_mclBn_precomputeG2"] = Module["asm"]["zb"]).apply(null, arguments)
            };
            var _mclBn_precomputedMillerLoop = Module["_mclBn_precomputedMillerLoop"] = function() {
                return (_mclBn_precomputedMillerLoop = Module["_mclBn_precomputedMillerLoop"] = Module["asm"]["Ab"]).apply(null, arguments)
            };
            var _mclBn_precomputedMillerLoop2 = Module["_mclBn_precomputedMillerLoop2"] = function() {
                return (_mclBn_precomputedMillerLoop2 = Module["_mclBn_precomputedMillerLoop2"] = Module["asm"]["Bb"]).apply(null, arguments)
            };
            var _mclBn_precomputedMillerLoop2mixed = Module["_mclBn_precomputedMillerLoop2mixed"] = function() {
                return (_mclBn_precomputedMillerLoop2mixed = Module["_mclBn_precomputedMillerLoop2mixed"] = Module["asm"]["Cb"]).apply(null, arguments)
            };
            var _mclBn_FrLagrangeInterpolation = Module["_mclBn_FrLagrangeInterpolation"] = function() {
                return (_mclBn_FrLagrangeInterpolation = Module["_mclBn_FrLagrangeInterpolation"] = Module["asm"]["Db"]).apply(null, arguments)
            };
            var _mclBn_G1LagrangeInterpolation = Module["_mclBn_G1LagrangeInterpolation"] = function() {
                return (_mclBn_G1LagrangeInterpolation = Module["_mclBn_G1LagrangeInterpolation"] = Module["asm"]["Eb"]).apply(null, arguments)
            };
            var _mclBn_G2LagrangeInterpolation = Module["_mclBn_G2LagrangeInterpolation"] = function() {
                return (_mclBn_G2LagrangeInterpolation = Module["_mclBn_G2LagrangeInterpolation"] = Module["asm"]["Fb"]).apply(null, arguments)
            };
            var _mclBn_FrEvaluatePolynomial = Module["_mclBn_FrEvaluatePolynomial"] = function() {
                return (_mclBn_FrEvaluatePolynomial = Module["_mclBn_FrEvaluatePolynomial"] = Module["asm"]["Gb"]).apply(null, arguments)
            };
            var _mclBn_G1EvaluatePolynomial = Module["_mclBn_G1EvaluatePolynomial"] = function() {
                return (_mclBn_G1EvaluatePolynomial = Module["_mclBn_G1EvaluatePolynomial"] = Module["asm"]["Hb"]).apply(null, arguments)
            };
            var _mclBn_G2EvaluatePolynomial = Module["_mclBn_G2EvaluatePolynomial"] = function() {
                return (_mclBn_G2EvaluatePolynomial = Module["_mclBn_G2EvaluatePolynomial"] = Module["asm"]["Ib"]).apply(null, arguments)
            };
            var _mclBn_verifyOrderG1 = Module["_mclBn_verifyOrderG1"] = function() {
                return (_mclBn_verifyOrderG1 = Module["_mclBn_verifyOrderG1"] = Module["asm"]["Jb"]).apply(null, arguments)
            };
            var _mclBn_verifyOrderG2 = Module["_mclBn_verifyOrderG2"] = function() {
                return (_mclBn_verifyOrderG2 = Module["_mclBn_verifyOrderG2"] = Module["asm"]["Kb"]).apply(null, arguments)
            };
            var _mclBnFp_setInt = Module["_mclBnFp_setInt"] = function() {
                return (_mclBnFp_setInt = Module["_mclBnFp_setInt"] = Module["asm"]["Lb"]).apply(null, arguments)
            };
            var _mclBnFp_setInt32 = Module["_mclBnFp_setInt32"] = function() {
                return (_mclBnFp_setInt32 = Module["_mclBnFp_setInt32"] = Module["asm"]["Mb"]).apply(null, arguments)
            };
            var _mclBnFp_getStr = Module["_mclBnFp_getStr"] = function() {
                return (_mclBnFp_getStr = Module["_mclBnFp_getStr"] = Module["asm"]["Nb"]).apply(null, arguments)
            };
            var _mclBnFp_setStr = Module["_mclBnFp_setStr"] = function() {
                return (_mclBnFp_setStr = Module["_mclBnFp_setStr"] = Module["asm"]["Ob"]).apply(null, arguments)
            };
            var _mclBnFp_deserialize = Module["_mclBnFp_deserialize"] = function() {
                return (_mclBnFp_deserialize = Module["_mclBnFp_deserialize"] = Module["asm"]["Pb"]).apply(null, arguments)
            };
            var _mclBnFp_serialize = Module["_mclBnFp_serialize"] = function() {
                return (_mclBnFp_serialize = Module["_mclBnFp_serialize"] = Module["asm"]["Qb"]).apply(null, arguments)
            };
            var _mclBnFp_clear = Module["_mclBnFp_clear"] = function() {
                return (_mclBnFp_clear = Module["_mclBnFp_clear"] = Module["asm"]["Rb"]).apply(null, arguments)
            };
            var _mclBnFp_setLittleEndian = Module["_mclBnFp_setLittleEndian"] = function() {
                return (_mclBnFp_setLittleEndian = Module["_mclBnFp_setLittleEndian"] = Module["asm"]["Sb"]).apply(null, arguments)
            };
            var _mclBnFp_setLittleEndianMod = Module["_mclBnFp_setLittleEndianMod"] = function() {
                return (_mclBnFp_setLittleEndianMod = Module["_mclBnFp_setLittleEndianMod"] = Module["asm"]["Tb"]).apply(null, arguments)
            };
            var _mclBnFp_setBigEndianMod = Module["_mclBnFp_setBigEndianMod"] = function() {
                return (_mclBnFp_setBigEndianMod = Module["_mclBnFp_setBigEndianMod"] = Module["asm"]["Ub"]).apply(null, arguments)
            };
            var _mclBnFp_getLittleEndian = Module["_mclBnFp_getLittleEndian"] = function() {
                return (_mclBnFp_getLittleEndian = Module["_mclBnFp_getLittleEndian"] = Module["asm"]["Vb"]).apply(null, arguments)
            };
            var _mclBnFp_isValid = Module["_mclBnFp_isValid"] = function() {
                return (_mclBnFp_isValid = Module["_mclBnFp_isValid"] = Module["asm"]["Wb"]).apply(null, arguments)
            };
            var _mclBnFp_isEqual = Module["_mclBnFp_isEqual"] = function() {
                return (_mclBnFp_isEqual = Module["_mclBnFp_isEqual"] = Module["asm"]["Xb"]).apply(null, arguments)
            };
            var _mclBnFp_isZero = Module["_mclBnFp_isZero"] = function() {
                return (_mclBnFp_isZero = Module["_mclBnFp_isZero"] = Module["asm"]["Yb"]).apply(null, arguments)
            };
            var _mclBnFp_isOne = Module["_mclBnFp_isOne"] = function() {
                return (_mclBnFp_isOne = Module["_mclBnFp_isOne"] = Module["asm"]["Zb"]).apply(null, arguments)
            };
            var _mclBnFp_isOdd = Module["_mclBnFp_isOdd"] = function() {
                return (_mclBnFp_isOdd = Module["_mclBnFp_isOdd"] = Module["asm"]["_b"]).apply(null, arguments)
            };
            var _mclBnFp_isNegative = Module["_mclBnFp_isNegative"] = function() {
                return (_mclBnFp_isNegative = Module["_mclBnFp_isNegative"] = Module["asm"]["$b"]).apply(null, arguments)
            };
            var _mclBnFp_setHashOf = Module["_mclBnFp_setHashOf"] = function() {
                return (_mclBnFp_setHashOf = Module["_mclBnFp_setHashOf"] = Module["asm"]["ac"]).apply(null, arguments)
            };
            var _mclBnFp_mapToG1 = Module["_mclBnFp_mapToG1"] = function() {
                return (_mclBnFp_mapToG1 = Module["_mclBnFp_mapToG1"] = Module["asm"]["bc"]).apply(null, arguments)
            };
            var _mclBnFp2_deserialize = Module["_mclBnFp2_deserialize"] = function() {
                return (_mclBnFp2_deserialize = Module["_mclBnFp2_deserialize"] = Module["asm"]["cc"]).apply(null, arguments)
            };
            var _mclBnFp2_serialize = Module["_mclBnFp2_serialize"] = function() {
                return (_mclBnFp2_serialize = Module["_mclBnFp2_serialize"] = Module["asm"]["dc"]).apply(null, arguments)
            };
            var _mclBnFp2_clear = Module["_mclBnFp2_clear"] = function() {
                return (_mclBnFp2_clear = Module["_mclBnFp2_clear"] = Module["asm"]["ec"]).apply(null, arguments)
            };
            var _mclBnFp2_isEqual = Module["_mclBnFp2_isEqual"] = function() {
                return (_mclBnFp2_isEqual = Module["_mclBnFp2_isEqual"] = Module["asm"]["fc"]).apply(null, arguments)
            };
            var _mclBnFp2_isZero = Module["_mclBnFp2_isZero"] = function() {
                return (_mclBnFp2_isZero = Module["_mclBnFp2_isZero"] = Module["asm"]["gc"]).apply(null, arguments)
            };
            var _mclBnFp2_isOne = Module["_mclBnFp2_isOne"] = function() {
                return (_mclBnFp2_isOne = Module["_mclBnFp2_isOne"] = Module["asm"]["hc"]).apply(null, arguments)
            };
            var _mclBnFp2_mapToG2 = Module["_mclBnFp2_mapToG2"] = function() {
                return (_mclBnFp2_mapToG2 = Module["_mclBnFp2_mapToG2"] = Module["asm"]["ic"]).apply(null, arguments)
            };
            var _mclBnG1_getBasePoint = Module["_mclBnG1_getBasePoint"] = function() {
                return (_mclBnG1_getBasePoint = Module["_mclBnG1_getBasePoint"] = Module["asm"]["jc"]).apply(null, arguments)
            };
            var dynCall_vi = Module["dynCall_vi"] = function() {
                return (dynCall_vi = Module["dynCall_vi"] = Module["asm"]["kc"]).apply(null, arguments)
            };
            Module["asm"] = asm;
            var calledRun;
            Module["then"] = function(func) {
                if (calledRun) {
                    func(Module)
                } else {
                    var old = Module["onRuntimeInitialized"];
                    Module["onRuntimeInitialized"] = function() {
                        if (old) old();
                        func(Module)
                    }
                }
                return Module
            };
            dependenciesFulfilled = function runCaller() {
                if (!calledRun) run();
                if (!calledRun) dependenciesFulfilled = runCaller
            };

            function run(args) {
                args = args || arguments_;
                if (runDependencies > 0) {
                    return
                }
                preRun();
                if (runDependencies > 0) return;

                function doRun() {
                    if (calledRun) return;
                    calledRun = true;
                    Module["calledRun"] = true;
                    if (ABORT) return;
                    initRuntime();
                    preMain();
                    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
                    postRun()
                }
                if (Module["setStatus"]) {
                    Module["setStatus"]("Running...");
                    setTimeout(function() {
                        setTimeout(function() {
                            Module["setStatus"]("")
                        }, 1);
                        doRun()
                    }, 1)
                } else {
                    doRun()
                }
            }
            Module["run"] = run;
            if (Module["preInit"]) {
                if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
                while (Module["preInit"].length > 0) {
                    Module["preInit"].pop()()
                }
            }
            noExitRuntime = true;
            run();


            return Module
        }
    );
})();
if (typeof exports === 'object' && typeof module === 'object')
    module.exports = Module;
else if (typeof define === 'function' && define['amd'])
    define([], function() {
        return Module;
    });
else if (typeof exports === 'object')
    exports["Module"] = Module;