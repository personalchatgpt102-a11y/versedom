import mongoose from "mongoose";

const bookshelfSchema = new mongoose.Schema(
  {
    oldId: {
      type: Number,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },

    sid: {
      type: String,
      index: true,
    },

    reading: {
      type: Number,
      default: 1,
    },

    verses: [mongoose.Schema.Types.Mixed],

    oldToken: String,

    date: Date,
  },
  { timestamps: true }
);

bookshelfSchema.index({ user: 1, sid: 1 });

export default mongoose.model("Bookshelf", bookshelfSchema);
