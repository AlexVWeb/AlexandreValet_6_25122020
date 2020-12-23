const mongoose = require('mongoose')

const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        require: true,
        unique: true,
        validate: [
            {validator: emailIsValid, msg: 'Adresse email invalide'},
        ]
    },
    _password: {
        type: String,
        require: true
    }
})

function emailIsValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)