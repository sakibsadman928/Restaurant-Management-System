export type UserRole = 'waiter' | 'chef' | 'admin';
export type TableStatus = 'available' | 'occupied';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';
export type PaymentMethod = 'cash' | 'card';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  assignedWaiter: User | string | null;
  remainingSeats?: number;
  usedSeats?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  table: Table | string;
  groupLabel: string;
  guestCount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  activeOrderCount?: number;
  runningTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemImage {
  url: string;
  publicId: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: MenuItemImage;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id?: string;
  menuItem: MenuItem | string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

export interface Order {
  _id: string;
  table: Table | string;
  group: Group | string;
  waiter: User | string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  type: 'order_ready';
  order: Order | string;
  table: Table | string;
  waiter: User | string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeTables: number;
  totalStaff: number;
  topDishes: { _id: string; name: string; totalOrdered: number }[];
}
