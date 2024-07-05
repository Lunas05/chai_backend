import mongoose, {Schema} from "mongoose";
import mongooseAggregatepaginate from "mongoose-aggregate-paginate-v2"


const vidoeSchema = new Schema(
    {
        videofile: {
            type: String, //cloudinary url
            required: true
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true
        },
        description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, //cloudinary url
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }


    },
    {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatepaginate)

export const Video = mongoose.model("Video", videoSchema)