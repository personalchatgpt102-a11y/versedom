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

    url: {
      type: String,
      index: true,
    },

    language: String,
    type: String,
    rating: String,
    genre: String,
    tags: [mongoose.Schema.Types.Mixed],

    views: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    status: Number,
    progress: Number,
    description: String,
    cover: String,

    oldToken: {
      type: String,
      index: true,
    },

    oldDate: Date,
    reviewedStatus: Number,

    author: {
      oldId: Number,

      penName: {
        type: String,
        default: "Unknown Author",
      },

      gender: {
        type: String,
        default: "",
      },

      bio: {
        type: String,
        default: "",
      },

      token: {
        type: String,
        default: "",
        index: true,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Book", bookSchema);