enum OrderStatus {
    open = "open",
    matched = "matched",
    success = "success",
    retrying = "retrying",
    filling = "filling",
    failed = "failed",
    failed_smallOrder = "failed_smallOrder",
    filled = "filled",
    canceled = "canceled"
};

export default OrderStatus;