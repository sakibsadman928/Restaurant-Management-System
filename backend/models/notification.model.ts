import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type NotificationType = 'order_ready';
export type NotificationStatus = 'unread' | 'read';

export interface INotification extends Document {
  _id: Types.ObjectId;
  type: NotificationType;
  order: Types.ObjectId;
  table: Types.ObjectId;
  waiter: Types.ObjectId;
  status: NotificationStatus;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: {
        values: ['order_ready'],
        message: 'Invalid notification type',
      },
      required: [true, 'Notification type is required'],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
    },
    table: {
      type: Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Table reference is required'],
    },
    waiter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Waiter reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['unread', 'read'],
        message: 'Status must be unread or read',
      },
      default: 'unread',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

NotificationSchema.index({ waiter: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
export default Notification;
