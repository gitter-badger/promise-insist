"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var PromiseInsist = /** @class */ (function () {
    /**
     *
     * @param retries Number of retries, default is 10
     * @param delay the delay in ms as a Number or DelayFunc, Default is 1000
     * @param errorFilter a function that allows retrying only the whitelisted error.
     */
    function PromiseInsist(config) {
        //global config per instance.
        this.globalConfig = {
            retries: 10,
            delay: 1000,
            errorFilter: function (err) { return true; }
        };
        this.taskMeta = new Map();
        this.verbose = true;
        if (config !== undefined) {
            var retries = config.retries, delay = config.delay, errorFilter = config.errorFilter;
            if (retries !== undefined) {
                this.globalConfig.retries = retries;
            }
            if (delay !== undefined) {
                this.globalConfig.delay = delay;
            }
            if (errorFilter !== undefined) {
                this.globalConfig.errorFilter = errorFilter;
            }
        }
        this.insist = this.insist.bind(this);
        this.cancel = this.cancel.bind(this);
        this.replaceTask = this.replaceTask.bind(this);
        this.addRetryHook = this.addRetryHook.bind(this);
    }
    /**
     *
     * @param id the id associated with the retryable promise/task
     */
    PromiseInsist.prototype.cancel = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                        var meta;
                        return __generator(this, function (_a) {
                            meta = this.taskMeta.get(id);
                            if (meta === undefined ||
                                !('timeout' in meta) ||
                                meta.canceled === true) {
                                resolve();
                            }
                            else {
                                clearTimeout(meta.timeout);
                                this.taskMeta.set(id, __assign({}, meta, { canceled: true, cancelResolver: resolve }));
                                meta.resolve();
                            }
                            return [2 /*return*/];
                        });
                    }); })];
            });
        });
    };
    /**
     * Insists on resolving the promise via x tries
     * @param id ID of the promise/task
     * @param promiseRetriever A function that when executed returns a promise
     * @param config
     * Optional configuration , if not specified the config passed in the constructor will be used,
     * if that latter wasn't specified either, the default will be used .
     */
    PromiseInsist.prototype.insist = function (id, taskRetriever, retryHook, config) {
        if (config === void 0) { config = this.globalConfig; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.taskMeta.has(id)) {
                    throw new Error('Task is still pending, if you want to cancel it call cancel(id).');
                }
                this.taskMeta.set(id, { canceled: false, starttime: Date.now(), onRetry: retryHook });
                return [2 /*return*/, this._insist(id, taskRetriever, config, config.retries)];
            });
        });
    };
    PromiseInsist.prototype.replaceTask = function (id, taskRetriever) {
        var meta = this.taskMeta.get(id);
        if (meta !== undefined) {
            meta.task = taskRetriever;
        }
        return Promise.resolve();
    };
    PromiseInsist.prototype.addRetryHook = function (id, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var meta;
            return __generator(this, function (_a) {
                meta = this.taskMeta.get(id);
                if (meta !== undefined) {
                    meta.onRetry = callback;
                }
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    PromiseInsist.prototype._insist = function (id, taskRetriever, config, maxRetries) {
        return __awaiter(this, void 0, void 0, function () {
            var taskStarttime, result, err_1, metaData_1, delay_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        taskStarttime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, taskRetriever()];
                    case 2:
                        result = _a.sent();
                        this.taskMeta.delete(id);
                        return [2 /*return*/, result];
                    case 3:
                        err_1 = _a.sent();
                        metaData_1 = this.taskMeta.get(id);
                        //required in case promise was revoked twice after cancel()
                        if (metaData_1 === undefined) {
                            return [2 /*return*/, Promise.resolve(err_1)];
                        }
                        delete metaData_1.timeout;
                        if (!config.errorFilter(err_1) ||
                            config.retries === 0 ||
                            metaData_1.canceled) {
                            if (this.verbose && metaData_1.canceled) {
                                console.log("Canceled task of ID : " + id + " (~ " + (Date.now() - (metaData_1.starttime || 0)) + " ms)");
                            }
                            this.taskMeta.delete(id);
                            if (typeof metaData_1.cancelResolver === 'function') {
                                metaData_1.cancelResolver({ id: id, time: Date.now() - (metaData_1.starttime || 0) });
                            }
                            return [2 /*return*/, Promise.reject(err_1)];
                        }
                        delay_1 = config.delay;
                        if (typeof delay_1 === 'function') {
                            delay_1 = delay_1(maxRetries, config.retries);
                        }
                        if (metaData_1.onRetry) {
                            metaData_1.onRetry(config.retries - 1, Math.max(taskStarttime - Date.now(), 0));
                        }
                        if (this.verbose) {
                            console.log("Retrying " + id + " after " + delay_1 + " ms");
                        }
                        config.retries -= 1;
                        return [2 /*return*/, new Promise(function (resolve) {
                                metaData_1.resolve = function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        return [2 /*return*/, resolve(this._insist(id, (metaData_1.task ? metaData_1.task : taskRetriever), config, maxRetries))];
                                    });
                                }); };
                                metaData_1.timeout = setTimeout(metaData_1.resolve, delay_1);
                            })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return PromiseInsist;
}());
exports.default = PromiseInsist;
//# sourceMappingURL=promise-insist.js.map