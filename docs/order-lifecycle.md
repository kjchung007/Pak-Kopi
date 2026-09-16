# Order lifecycle

A cart remains client-side until create_pickup_order validates its branch, quantities, options and current availability. PostgreSQL calculates totals. The order starts new with pending payment. complete_demo_payment checks the customer and totals and marks payment paid without a gateway. Staff move new → preparing → ready → completed. Public boards show preparing and ready only. Financial changes and illegal transitions are rejected. Cancellation is supported through the inherited permitted workflow.
