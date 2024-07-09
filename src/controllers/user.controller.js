import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateAccessToken()
        
        user.refreshToken = refreshToken
        await user.save({validationBeforeSave: false})
        
        return {accessToken, refreshToken}



    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists
    // check for images, check for avatar
    // upload them to cloudinary 
    // create user object - create entry in db
    // remkve password and refresh token field from response
    // check for user creation 
    // return response

    const {fullName, email, username, password}= req.body
    
    if (
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    
    const existedUser =await user.findOne({
        $or: [( username ), ( email )]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    let coverImageLocalpath;
    if(req.files && Array.isArray( req.files.
        coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }


    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary
    (coverimageLocalPath )

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverimage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

    
})

const loginUser = asyncHnadler(async (req,res) => {
    // req body -> data 
    // username or email
    // find the user 
    // password check
    // access and refresh token
    // send cookies

    const {email, username, password} = req.body

    if(!username || !email) {
        throw new ApiError(400, "username or email is required")

    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exists")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await
    generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
    httpOnly: true,
    secure: true
    }

    return res.
    status(200).
    cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
    new Apiresponse(
        200,
        {
            user: loggedInUser, accessToken,
        refreshToken
        },
        "User logged in successfully"
        )
    )


})

const logoutUser = asyncHandler(async(req, res) => {
    await user.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },{
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used")
    
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken". newRefreshTokenefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken: newRefreshToken
                }, "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asynHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassworduser.save({validationBeforesave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))


})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")

    const updateAccountDetails = asyncHandler(async(req, res) => {
        const {fullName, email} = req.body 

        if (!fullName || !email) {
            throw new ApiError(400, "All fields are required")
        }

        User.findByIdAndUpdate(
            req.user?.id,
            {
                $set: {
                    fullName,
                    email: email,
                }
            },
            {new: true}
            
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200, "Accout details updated"))

    })

})

const updateUserAvatar = asyncHandler(async(req, res) => {
    
    const avatarLocalpath = req.file?.path 

    if(!avatarLocalpath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary
    (avatarLocalpath)

    if(!avatar.url) {
        throw new ApiError(400, "Error wwhile uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
        .status
        .json(
            new ApiResponse(200, user, "avatar image updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    
    const coverImageLocalPathLocalpath = req.file?.path 

    if(!coverImageLocalPathLocalpath) {
        throw new ApiError(400, "cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary
    (coverImageLocalPathLocalpath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error wwhile uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

        return res
        .status
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}