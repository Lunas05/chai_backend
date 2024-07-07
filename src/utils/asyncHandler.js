const asyncHandler = (requesthandler) => {
    return (req, res, next) => {
        Promise.resolve(requesthandler(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler}

// const asynchandler = (fn) => {}
// const asynchandler = (func) => () => {}
// const asynchandler = (func) => async () => {}

// const asyncHandler = (fn) => async () => {
//     try {
//         await fn(req, res, next)

//     }catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }