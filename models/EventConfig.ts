import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEventConfig extends Document {
  date?: string;
  time?: string;
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
  },
  {
    timestamps: true,
  }
);

const EventConfig: Model<IEventConfig> =
  mongoose.models.EventConfig ||
  mongoose.model<IEventConfig>("EventConfig", EventConfigSchema);

export default EventConfig;
