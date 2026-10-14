const express = require('express');
const router = express.Router();
const secretariaController = require('../controllers/secretariaController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/dashboard', roleMiddleware('SECRETARIA', 'COORDENACAO'), secretariaController.dashboardStats);
router.get('/alunos', roleMiddleware('SECRETARIA', 'COORDENACAO'), secretariaController.listarAlunos);
router.post('/alunos', roleMiddleware('SECRETARIA'), secretariaController.cadastrarAluno);
router.get('/rematricula/validar/:id_aluno', roleMiddleware('SECRETARIA'), secretariaController.validarRematricula);
router.get('/certificados/validar/:id_aluno', roleMiddleware('SECRETARIA', 'COORDENACAO', 'ALUNO'), secretariaController.validarCertificado);

module.exports = router;
