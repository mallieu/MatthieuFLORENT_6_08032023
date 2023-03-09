const express = require('express');
const userCtrl = require('../controllers/User');

const router = express.Router();

router.post('/signup',  userCtrl.signup);
router.post('/login', userCtrl.login);


// router.get('/', userCtrl.getAllUser);
// router.post('/', userCtrl.createUser);
// router.get('/:id', userCtrl.getOneUser);
// router.put('/:id', userCtrl.modifyUser);
// router.delete('/:id', userCtrl.deleteUser);

module.exports = router;
