enum OrderStatus {
    open = "open",
    matched = "matched",
    success = "success",
    retrying = "retrying",
    filling = "filling",
    failed = "failed",
    failed_smallOrder = "failed_smallOrder",
    failed_notEnoughBalance = "failed_not_enough_balance",
    filled = "filled",
    canceled = "canceled",
    expired = "expired",
};

export default OrderStatus;