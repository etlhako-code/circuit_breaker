"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
const BreakerStates_1 = require("./BreakerStates");
class CircuitBreaker {
    constructor(request, opts) {
        this.request = request;
        this.state = BreakerStates_1.CircuitBreakerState.OPENED;
        this.tryTriggerFromCloseAt = undefined;
        this.finishHalfStateAt = undefined;
        this.failCount = 0;
        this.successCount = 0;
        this.options = {
            openBreakerTimeoutInMs: (opts === null || opts === void 0 ? void 0 : opts.openBreakerTimeoutInMs) || 10000,
            closedBreakerTimeoutInMs: (opts === null || opts === void 0 ? void 0 : opts.closedBreakerTimeoutInMs) || 5000,
            minFailedRequestThreshold: (opts === null || opts === void 0 ? void 0 : opts.minFailedRequestThreshold) || 15,
            percentageFailedRequestsThreshold: (opts === null || opts === void 0 ? void 0 : opts.percentageFailedRequestsThreshold) || 50,
        };
    }
    resetStatistic() {
        this.successCount = 0;
        this.failCount = 0;
        this.finishHalfStateAt = undefined;
    }
    fire(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state === BreakerStates_1.CircuitBreakerState.CLOSED && (Date.now() < this.tryTriggerFromCloseAt)) {
                throw new Error('Breaker is closed');
            }
            try {
                const response = yield this.request(args);
                return this.success(response);
            }
            catch (e) {
                return this.fail(e, args);
            }
        });
    }
    success(response) {
        // handle successful requests
        if (this.state === BreakerStates_1.CircuitBreakerState.HALF) {
            this.successCount++;
            // the previous tracking window closed and
            // nothing happened to close breaker
            if (Date.now() >= this.finishHalfStateAt) {
                this.state = BreakerStates_1.CircuitBreakerState.OPENED;
                this.resetStatistic();
            }
        }
        // attempt after closedBreakerTimeoutInMs successful
        // it means that we should open breaker
        if (this.state === BreakerStates_1.CircuitBreakerState.CLOSED) {
            this.state = BreakerStates_1.CircuitBreakerState.OPENED;
            this.resetStatistic();
        }
        return response;
    }
    fail(e, args) {
        // handle failed requests
        if (this.state === BreakerStates_1.CircuitBreakerState.CLOSED) {
            this.tryTriggerFromCloseAt = Date.now() + this.options.closedBreakerTimeoutInMs;
            return e;
        }
        // the first failed request comes in
        if (this.state === BreakerStates_1.CircuitBreakerState.OPENED) {
            this.failCount = 1;
            this.state = BreakerStates_1.CircuitBreakerState.HALF;
            this.finishHalfStateAt = Date.now() + this.options.openBreakerTimeoutInMs;
            return e;
        }
        if (this.state === BreakerStates_1.CircuitBreakerState.HALF) {
            this.failCount++;
            // it means that the previous tracking window closed
            // and nothing happened to close breaker
            // but the new HALF state should be started immediately
            if (Date.now() > this.finishHalfStateAt) {
                this.resetStatistic();
                this.failCount = 1;
                this.finishHalfStateAt = Date.now() + this.options.openBreakerTimeoutInMs;
                return e;
            }
            // the tracking window isn't closed yet
            if (this.failCount >= this.options.minFailedRequestThreshold) {
                const failRate = this.failCount * 100 / (this.failCount + this.successCount);
                // failed rate exceeds and breaker is closed
                if (failRate >= this.options.percentageFailedRequestsThreshold) {
                    this.state = BreakerStates_1.CircuitBreakerState.CLOSED;
                    this.resetStatistic();
                    this.tryTriggerFromCloseAt = Date.now() + this.options.closedBreakerTimeoutInMs;
                    return e;
                }
                // otherwise it's considered as normal state
                // but the new tracking window should be started
                this.resetStatistic();
                this.failCount = 1;
                this.finishHalfStateAt = Date.now() + this.options.openBreakerTimeoutInMs;
                return e;
            }
        }
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=CircuitBreaker.js.map