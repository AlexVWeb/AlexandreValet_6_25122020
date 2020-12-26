const bcrypt = require('bcrypt')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const passwordValidator = require('password-validator')
const CryptoJS = require("crypto-js");

exports.signup = async (req, res, next) => {
    let user_email = req.body.email
    if (!emailIsValid(user_email)) {
        return res.status(400).json({message: "l'adresse email n'est pas valide"})
    }

    const user = await findUserByEmail(user_email)
    if (!user) {
        const user_password = req.body.password
        const schemaPassword = new passwordValidator()
        schemaPassword
            .is().min(5)
            .has().uppercase()
            .has().lowercase()
            .has().digits(2)
            .has().letters(2)
            .has().not().spaces()
        if (schemaPassword.validate(user_password)) {
            try {
                const hash = await bcrypt.hash(user_password, 10)
                const user = new User({
                    email: CryptoJS.AES.encrypt(user_email, process.env.MASK_TOKEN).toString(),
                    _password: hash
                });

                try {
                    await user.save()
                    return res.status(201).json({message: 'Utilisateur créé !'})
                } catch (error) {
                    return res.status(400).json({error})
                }
            } catch (error) {
                return res.status(500).json({error})
            }

        } else {
            const errors = schemaPassword.validate(user_password, {list: true})
            return res.status(400).json({errors})
        }
    } else {
        return res.status(401).json({error: "Un compte existe déja"})
    }

}

exports.login = async (req, res, next) => {
    let user_email = req.body.email
    const user_password = req.body.password

    const user = await findUserByEmail(user_email)
    if (user) {
        try {
            const valid = await bcrypt.compare(user_password, user._password)
            if (!valid) {
                return res.status(401).json({error: 'Mot de passe incorrect !'})
            }

            return res.status(200).json({
                userId: user._id,
                token: jwt.sign(
                    {userId: user._id},
                    process.env.JWT_TOKEN,
                    {expiresIn: '24h'}
                )
            })
        } catch (error) {
            return res.status(500).json({error})
        }
    } else {
        return res.status(401).json({error: 'Utilisateur non trouvé !'})
    }
}

function emailIsValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function findUserByEmail(email) {
    const users = await User.find()
    return users.find((user) => {
        let email_user = CryptoJS.AES.decrypt(user.email, process.env.MASK_TOKEN);
        let emailDecrypt = email_user.toString(CryptoJS.enc.Utf8);
        return email === emailDecrypt
    })
}