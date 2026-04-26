import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    oldId: {
      type: Number,
      index: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      index: true,
    },

    bookSlug: {
      type: String,
      required: true,
      index: true,
    },

    chapterNumber: {
      type: Number,
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    oldToken: String,
    oldDate: Date,
  },
  { timestamps: true }
);

chapterSchema.index(
  {
    bookSlug: 1,
    chapterNumber: 1,
  },
  { unique: true }
);

export default mongoose.model("Chapter", chapterSchema);