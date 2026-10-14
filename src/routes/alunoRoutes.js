const express = require('express');
const router = express.Router();
const alunoController = require('../controllers/alunoController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/meu-painel', roleMiddleware('ALUNO', 'SECRETARIA'), alunoController.meuPainel);

module.exports = router;
