const Sauce = require("../models/Sauce")
const fs = require("fs")

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({error}))
}

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(400).json({error}))
}

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce)
    delete sauceObject._id
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: JSON.stringify([]),
        usersDisliked: JSON.stringify([]),
    })
    sauce.save()
        .then(() => res.status(201).json({message: 'Sauce enregistré !'}))
        .catch(error => res.status(400).json({error}))
}

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : {...req.body}
    Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            if (req.file) {
                const filename = sauce.imageUrl.split('/images/')[1]
                fs.unlink(`images/${filename}`, () => {
                    Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
                        .then(() => res.status(200).json({message: 'Sauce modifié !'}))
                        .catch(error => res.status(400).json({error}));
                })
            } else {
                Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
                    .then(() => res.status(200).json({message: 'Sauce modifié !'}))
                    .catch(error => res.status(400).json({error}))
            }
        })

        .catch(error => res.status(400).json({error}))
}

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1]
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({_id: req.params.id})
                    .then(() => res.status(200).json({message: 'Sauce supprimé !'}))
                    .catch(error => res.status(400).json({error}));
            })
        })
        .catch(error => req.status(500).json({error}))
}

exports.likeSauce = (req, res, next) => {
    Sauce.findOne({_id: req.params.id})
        .then(sauce => {
            const currentVoteUser = req.body.like
            const currentUserID = req.body.userId
            let numberLikes = sauce.likes
            let numberDisLikes = sauce.dislikes
            let usersLiked = JSON.parse(sauce.usersLiked)
            let usersDisliked = JSON.parse(sauce.usersDisliked)
            const findUserLiked = usersLiked.find(({userId}) => userId === currentUserID)
            const findUserDisliked = usersDisliked.find(({userId}) => userId === currentUserID)

            // Si la personne like
            if (currentVoteUser === 1) {
                if (findUserLiked === undefined) {
                    usersLiked.push({userId: currentUserID, like: currentVoteUser})
                    numberLikes += 1
                    let filterDisLikes = usersDisliked;
                    if (findUserDisliked !== undefined) {
                        numberDisLikes -= 1
                        filterDisLikes = usersDisliked.filter(({userId}) => userId !== findUserDisliked.userId)
                    }
                    const sauceObject = {
                        sauce,
                        likes: numberLikes,
                        dislikes: numberDisLikes,
                        usersLiked: JSON.stringify(usersLiked),
                        usersDisliked: JSON.stringify(filterDisLikes)
                    }
                    Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
                        .then(() => res.status(200).json({message: 'Sauce modifié !'}))
                        .catch(error => res.status(400).json({error}));
                } else {
                    throw "Vous avez déja votez"
                }
            }

            // Si la personne dislike
            if (currentVoteUser === -1) {
                if (findUserDisliked === undefined) {
                    usersDisliked.push({userId: currentUserID, like: currentVoteUser})
                    numberDisLikes += 1
                    let filterLikes = usersLiked;
                    if (findUserLiked !== undefined) {
                        numberLikes -= 1
                        filterLikes = usersLiked.filter(({userId}) => userId !== findUserLiked.userId)
                    }
                    const sauceObject = {
                        sauce,
                        likes: numberLikes,
                        dislikes: numberDisLikes,
                        usersLiked: JSON.stringify(filterLikes),
                        usersDisliked: JSON.stringify(usersDisliked)
                    }
                    Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
                        .then(() => res.status(200).json({message: 'Sauce modifié !'}))
                        .catch(error => res.status(400).json({error}));
                } else {
                    throw "Vous avez déja votez"
                }
            }

            // Si la personne retire son vote
            if (currentVoteUser === 0) {
                if (findUserLiked !== undefined) {
                    numberLikes -= 1
                    usersLiked = usersLiked.filter(({userId}) => userId !== findUserLiked.userId)
                }

                if (findUserDisliked !== undefined) {
                    numberDisLikes -= 1
                    usersDisliked = usersDisliked.filter(({userId}) => userId !== findUserDisliked.userId)
                }

                const sauceObject = {
                    sauce,
                    likes: numberLikes,
                    dislikes: numberDisLikes,
                    usersLiked: JSON.stringify(usersLiked),
                    usersDisliked: JSON.stringify(usersDisliked)
                }
                Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
                    .then(() => res.status(200).json({message: 'Sauce modifié !'}))
                    .catch(error => res.status(400).json({error}));
            }
        })
        .catch(error => res.status(404).json({error}))
}