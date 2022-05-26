"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CircuitBreaker_1 = require("./CircuitBreaker");
const request = () => {
    return new Promise((resolve, reject) => {
        if (Math.random() > .6) {
            resolve("Success");
        }
        else {
            reject("Failed");
        }
    });
};
const breaker = new CircuitBreaker_1.CircuitBreaker(request, { minFailedRequestThreshold: 2 });
setInterval(() => breaker.fire()
    .then(console.log)
    .catch((e) => console.error(e.message)), 1000);
//# sourceMappingURL=app.js.map