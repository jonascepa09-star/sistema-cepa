const express = require('express');
const router = express.Router();
const professorController = require('../controllers/professorController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/turmas', roleMiddleware('PROFESSOR', 'COORDENACAO', 'SECRETARIA'), professorController.listarTurmas);
router.get('/chamada', roleMiddleware('PROFESSOR', 'COORDENACAO', 'SECRETARIA'), professorController.obterChamada);
router.post('/chamada', roleMiddleware('PROFESSOR', 'COORDENACAO', 'SECRETARIA'), professorController.salvarChamada);

module.exports = router;
