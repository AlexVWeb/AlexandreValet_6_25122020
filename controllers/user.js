const bcrypt = require('bcrypt')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const passwordValidator = require('password-validator')

exports.signup = (req, res, next) => {
    const user_email = req.body.email
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
        bcrypt.hash(user_password, 10)
            .then(hash => {
                const user = new User({
                    email: user_email,
                    _password: hash
                });
                user.save()
                    .then(() => res.status(201).json({message: 'Utilisateur créé !'}))
                    .catch(error => res.status(400).json({error}));
            })
            .catch(error => res.status(500).json({error}));
    } else {
        const errors = schemaPassword.validate(user_password, {list: true})
        console.log(errors)
    }
}

exports.login = (req, res, next) => {
    const user_email = req.body.email
    const user_password = req.body.password

    User.findOne({email: user_email})
        .then(user => {
            if (!user) {
                return res.status(401).json({error: 'Utilisateur non trouvé !'})
            }
            bcrypt.compare(user_password, user._password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({error: 'Mot de passe incorrect !'})
                    }

                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            {userId: user._id},
                            process.env.JWT_TOKEN,
                            {expiresIn: '24h'}
                        )
                    })
                })
                .catch(error => res.status(500).json({error}))
        })
        .catch(error => res.status(500).json({error}))
}