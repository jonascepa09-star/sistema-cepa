const express = require('express');
const router = express.Router();
const estagiosController = require('../controllers/estagiosController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// Leitura permitida para Secretaria, Coordenação e Professores
router.get('/', roleMiddleware('SECRETARIA', 'COORDENACAO', 'PROFESSOR', 'ALUNO'), estagiosController.listar);
router.get('/alertas', roleMiddleware('SECRETARIA', 'COORDENACAO'), estagiosController.listarAlertas);

// Criação e edição de escalas pela Coordenação e Secretaria
router.post('/', roleMiddleware('SECRETARIA', 'COORDENACAO'), estagiosController.criar);
router.put('/:id/validar', roleMiddleware('COORDENACAO', 'SECRETARIA'), estagiosController.validarFicha);

// Lançamento de presença permitido para Professores/Preceptores e Coordenação
router.post('/presenca', roleMiddleware('PROFESSOR', 'COORDENACAO', 'SECRETARIA'), estagiosController.lancarPresenca);

module.exports = router;
