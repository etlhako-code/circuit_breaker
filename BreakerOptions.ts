export type CircuitBreakerOptions = {
    openBreakerTimeoutInMs?: number;
    closedBreakerTimeoutInMs?: number;
    minFailedRequestThreshold?: number;
    percentageFailedRequestsThreshold?: number;
}