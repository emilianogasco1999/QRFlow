import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEventConfig extends Document {
  date?: string;
  time?: string;
  ticketPrice?: number;
  cardPrice?: number;
  location?: string;
  entryLimit?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventConfigSchema: Schema = new Schema(
  {
    date: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "",
    },
    ticketPrice: {
      type: Number,
      default: 0,
    },
    cardPrice: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: "",
    },
    entryLimit: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const EventConfig: Model<IEventConfig> =
  mongoose.models.EventConfig ||
  mongoose.model<IEventConfig>("EventConfig", EventConfigSchema);

export default EventConfig;
