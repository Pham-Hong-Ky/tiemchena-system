import { EventEmitter } from "events";

class OrderEventEmitter extends EventEmitter {}

const globalForEvents = globalThis as unknown as {
  orderEvents: OrderEventEmitter | undefined;
};

export const orderEvents = globalForEvents.orderEvents ?? new OrderEventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.orderEvents = orderEvents;
}
