import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMenuItemImage {
  url: string;
  publicId: string;
}

export interface IMenuItem extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  image: IMenuItemImage;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    image: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

MenuItemSchema.index({ category: 1 });
MenuItemSchema.index({ isAvailable: 1 });

const MenuItem: Model<IMenuItem> = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
export default MenuItem;
