import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed";
export type PaymentStatus = "unpaid" | "paid";
export type PaymentMethod = "cash" | "card";

export interface IOrderItem {
  _id?: Types.ObjectId;
  menuItem: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  table: Types.ObjectId;
  group: Types.ObjectId;
  waiter: Types.ObjectId;
  items: IOrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  kitchenSentAt: Date | null;
  readyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
  },
  specialInstructions: { type: String, default: "", maxlength: 200 },
});

const OrderSchema = new Schema<IOrder>(
  {
    table: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    waiter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "completed"],
      default: "pending",
    },
    totalAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paymentMethod: { type: String, enum: ["cash", "card"], default: null },
    kitchenSentAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

OrderSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
});

OrderSchema.index({ table: 1, status: 1 });
OrderSchema.index({ group: 1 });
OrderSchema.index({ waiter: 1 });
OrderSchema.index({ status: 1 });

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
