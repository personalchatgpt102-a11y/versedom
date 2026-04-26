
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    oldId: Number,

    title: String,

    slug: {
      type: String,
      unique: true,
      index: true,
    },
    url: String,

    language: String,
    lang: String,
    type: String,
    rating: String,
    genre: String,
    tags: [String],
    views: Number,
    description: String,
    synopsis: String,
    cover: String,
    img: String,
    oldToken: String,
    oldDate: Date,
    status: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);
