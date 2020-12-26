const mongoose = require('mongoose')

const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        require: true,
        unique: true,
    },
    _password: {
        type: String,
        require: true
    }
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)