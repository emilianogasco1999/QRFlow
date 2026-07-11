import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string; // Guardado como hash SHA-256
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, "El nombre de usuario es requerido"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "La contraseña es requerida"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
