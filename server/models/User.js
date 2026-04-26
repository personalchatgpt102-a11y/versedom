import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    oldId: Number,

    provider: {
      type: String,
      default: "email",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    oldToken: {
      type: String,
      index: true,
    },

    mode: Number,
    oldCreatedTime: String,
    otp: String,
    otpExp: String,

    profile: {
      oldProfileId: Number,

      usid: {
        type: String,
        index: true,
      },

      cat: {
        type: String,
        default: "alpha",
      },

      firstName: {
        type: String,
        default: "",
      },

      lastName: {
        type: String,
        default: "",
      },

      fullName: {
        type: String,
        default: "",
      },

      dob: Date,

      nation: String,

      genres: [String],

      image: {
        type: String,
        default: "default.png",
      },

      coins: {
        type: Number,
        default: 0,
      },

      betaCoins: {
        type: Number,
        default: 0,
      },

      lastCoinUpdate: Date,
    },

    authorProfile: {
      isAuthor: {
        type: Boolean,
        default: false,
      },

      oldAuthorId: Number,

      penName: {
        type: String,
        default: "",
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
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
