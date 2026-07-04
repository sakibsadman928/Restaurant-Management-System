import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type TableStatus = 'available' | 'occupied';

export interface ITable extends Document {
  _id: Types.ObjectId;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  assignedWaiter: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TableSchema = new Schema<ITable>(
  {
    tableNumber: {
      type: Number,
      required: [true, 'Table number is required'],
      unique: true,
      min: [1, 'Table number must be at least 1'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'occupied'],
        message: 'Status must be available or occupied',
      },
      default: 'available',
    },
    assignedWaiter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

const Table: Model<ITable> = mongoose.model<ITable>('Table', TableSchema);
export default Table;
