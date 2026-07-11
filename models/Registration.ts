import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRegistration extends Document {
  fullName: string;
  instagram: string;
  whatsapp: string;
  email: string;
  dob: string;
  location: string;
  referral: string;
  qrToken: string;
  emailSent: boolean;
  attended: boolean;
  paid: boolean;
  dni?: string;
  createdAt: Date;
}

const RegistrationSchema: Schema = new Schema({
  fullName: {
    type: String,
    required: [true, "El nombre y apellido es requerido"],
    trim: true,
  },
  instagram: {
    type: String,
    required: [true, "El Instagram es requerido"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  whatsapp: {
    type: String,
    required: [true, "El número de WhatsApp es requerido"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "El email es requerido"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  dob: {
    type: String,
    required: [true, "La fecha de nacimiento es requerida"],
  },
  location: {
    type: String,
    required: [true, "La ubicación es requerida"],
  },
  referral: {
    type: String,
    required: [true, "Cómo nos conociste es requerido"],
  },
  qrToken: {
    type: String,
    required: true,
    unique: true,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  attended: {
    type: Boolean,
    default: false,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  dni: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;
