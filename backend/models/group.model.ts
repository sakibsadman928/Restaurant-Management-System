import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type GroupPaymentStatus = 'unpaid' | 'paid';
export type GroupPaymentMethod = 'cash' | 'card';

export interface IGroup extends Document {
  _id: Types.ObjectId;
  table: Types.ObjectId;
  groupLabel: string;
  guestCount: number;
  paymentStatus: GroupPaymentStatus;
  paymentMethod: GroupPaymentMethod | null;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    table: { type: Schema.Types.ObjectId, ref: 'Table', required: true },
    groupLabel: { type: String, required: true },
    guestCount: { type: Number, required: true, min: [1, 'Guest count must be at least 1'] },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['cash', 'card'], default: null },
  },
  { timestamps: true, versionKey: false }
);

GroupSchema.index({ table: 1, paymentStatus: 1 });

const Group: Model<IGroup> = mongoose.model<IGroup>('Group', GroupSchema);
export default Group;
